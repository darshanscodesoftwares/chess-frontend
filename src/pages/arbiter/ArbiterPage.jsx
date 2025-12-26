// src/pages/arbiter/ArbiterPage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

// ✅ Swiss-Manager requires "1/2" for draws (NOT "½-½")
const RESULT_OPTIONS = [
    { value: "", label: "Select" },
    { value: "1-0", label: "1 - 0" },
    { value: "1/2", label: "½ - ½" },  // Display: ½-½, Store: 1/2
    { value: "0-1", label: "0 - 1" },
    { value: "1-0F", label: "1f - 0f" },
    { value: "0-1F", label: "0f - 1f" },
    { value: "0-0F", label: "0f - 0f" },
];

export default function ArbiterPage() {
    const { token } = useParams();
    const [assignment, setAssignment] = useState(null);
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedAt, setSubmittedAt] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const saveTimeoutRef = useRef(null);
    const clickTimeoutRef = useRef({}); // Store click timers per board+player

    useEffect(() => {
        const loadAssignment = async () => {
            setLoading(true);
            try {
                const res = await axiosClient.get(`/assignments/by-token/${token}`);
                if (!res.data.success) {
                    setStatus("Assignment not found.");
                    return;
                }
                const a = res.data.assignment;
                setAssignment(a);

                // 🔐 Check if already submitted
                setIsSubmitted(a.isSubmitted || false);
                setSubmittedAt(a.submittedAt || null);

                const existing = {};
                (a.results || []).forEach((r) => {
                    existing[r.board] = r.result;
                });
                setResults(existing);
            } catch (err) {
                console.error(err);
                setStatus("Error loading assignment.");
            } finally {
                setLoading(false);
            }
        };
        loadAssignment();
    }, [token]);

    const autoSave = async (updatedResults) => {
        if (!assignment || isSubmitted) return;

        setSaving(true);
        setStatus("");

        try {
            const payload = assignment.pairings.map((p) => ({
                board: p.board,
                result: updatedResults[p.board] || "",
            }));

            const res = await axiosClient.post(
                `/assignments/by-token/${token}/results`,
                { results: payload }
            );

            if (res.data.success) {
                setLastSaved(new Date());
                setStatus("Saved");
                setTimeout(() => setStatus(""), 2000);
            } else {
                setStatus("Error saving");
            }
        } catch (err) {
            console.error(err);
            // Handle 403 (already submitted)
            if (err.response?.status === 403) {
                setIsSubmitted(true);
                setStatus("Results already submitted - editing disabled");
            } else {
                setStatus("Error saving");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (board, value) => {
        // 🔐 Block changes if already submitted
        if (isSubmitted) return;

        const updatedResults = { ...results, [board]: value };
        setResults(updatedResults);

        // Clear any pending autosave
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Autosave immediately per board interaction
        saveTimeoutRef.current = setTimeout(() => {
            autoSave(updatedResults);
        }, 300);
    };

    // Handle single click on player name: set as WINNER
    const handlePlayerClick = (board, player) => {
        if (isSubmitted) return; // 🔐 Block if submitted

        const clickKey = `${board}-${player}`;

        if (clickTimeoutRef.current[clickKey]) {
            clearTimeout(clickTimeoutRef.current[clickKey]);
        }

        clickTimeoutRef.current[clickKey] = setTimeout(() => {
            const result = player === "white" ? "1-0" : "0-1";
            handleChange(board, result);
            delete clickTimeoutRef.current[clickKey];
        }, 600);
    };

    // Handle double click on player name: set as LOSER
    const handlePlayerDoubleClick = (board, player) => {
        if (isSubmitted) return; // 🔐 Block if submitted

        const clickKey = `${board}-${player}`;

        if (clickTimeoutRef.current[clickKey]) {
            clearTimeout(clickTimeoutRef.current[clickKey]);
            delete clickTimeoutRef.current[clickKey];
        }

        const result = player === "white" ? "0-1" : "1-0";
        handleChange(board, result);
    };

    // Helper function to get player cell CSS class based on result
    const getPlayerCellClass = (board, player) => {
        const result = results[board] || "";
        const baseClass = isSubmitted ? "player-name-cell-readonly" : "player-name-cell";

        if (!result || result === "1/2" || result.startsWith("0-0")) {
            return baseClass;
        }

        if (player === "white") {
            if (result === "1-0" || result === "1-0F") return `${baseClass} player-winner`;
            if (result === "0-1" || result === "0-1F") return `${baseClass} player-loser`;
        } else {
            if (result === "0-1" || result === "0-1F") return `${baseClass} player-winner`;
            if (result === "1-0" || result === "1-0F") return `${baseClass} player-loser`;
        }

        return baseClass;
    };

    // 🔐 NEW: Final submit handler - locks results permanently
    const handleFinalSubmit = async () => {
        if (!assignment || isSubmitted) return;

        const payload = assignment.pairings.map((p) => ({
            board: p.board,
            result: results[p.board] || "",
        }));

        const incomplete = payload.some((p) => !p.result);
        if (incomplete) {
            const ok = window.confirm(
                "Some boards have no result selected. Submit anyway?\n\n⚠️ WARNING: After submission, you will NOT be able to edit results!"
            );
            if (!ok) return;
        } else {
            const confirm = window.confirm(
                "Are you sure you want to submit these results?\n\n⚠️ WARNING: After submission, you will NOT be able to edit results!"
            );
            if (!confirm) return;
        }

        setSubmitting(true);
        setStatus("");

        try {
            // First save the current results
            await axiosClient.post(
                `/assignments/by-token/${token}/results`,
                { results: payload }
            );

            // Then lock the submission
            const submitRes = await axiosClient.post(
                `/assignments/by-token/${token}/submit`
            );

            if (submitRes.data.success) {
                setIsSubmitted(true);
                setSubmittedAt(submitRes.data.submittedAt);
                setStatus("✅ Results submitted successfully!");
            } else {
                setStatus(submitRes.data.error || "Error submitting results.");
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 403) {
                setIsSubmitted(true);
                setStatus("Results were already submitted.");
            } else {
                setStatus("Error submitting results.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="page-center">
                <p>Loading assignment...</p>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="page-center">
                <p>{status || "Assignment not found."}</p>
            </div>
        );
    }

    // Calculate progress analytics
    const totalBoards = assignment?.pairings.length || 0;
    const completedBoards = Object.values(results).filter((r) => r !== "").length;
    const remainingBoards = totalBoards - completedBoards;
    const completionPercentage = totalBoards > 0 ? Math.round((completedBoards / totalBoards) * 100) : 0;

    return (
        <div className="page">
            <h1>Arbiter Result Entry</h1>

            {/* 🔐 Submitted Banner */}
            {isSubmitted && (
                <div className="card" style={{
                    backgroundColor: "#dcfce7",
                    border: "2px solid #16a34a",
                    marginBottom: "16px"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "24px" }}>🔐</span>
                        <div>
                            <p style={{ margin: 0, fontWeight: "600", color: "#166534", fontSize: "16px" }}>
                                Results Submitted
                            </p>
                            <p style={{ margin: "4px 0 0 0", color: "#166534", fontSize: "14px" }}>
                                Submitted on {submittedAt ? new Date(submittedAt).toLocaleString() : "N/A"}
                            </p>
                            <p style={{ margin: "4px 0 0 0", color: "#166534", fontSize: "13px" }}>
                                Results are locked and cannot be edited.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="card small-info">
                <p>
                    <strong>Arbiter:</strong> {assignment.arbiter?.name}
                </p>
                <p>
                    <strong>Round:</strong> {assignment.round}
                </p>
                <p>
                    <strong>Boards:</strong> {assignment.boardFrom} - {assignment.boardTo}
                </p>
            </div>

            <div className="card">
                <h2 style={{ marginBottom: "12px", fontSize: "18px" }}>Progress</h2>
                <div style={{ display: "flex", gap: "24px", marginBottom: "12px" }}>
                    <div>
                        <p style={{ margin: "0", fontSize: "13px", color: "#6b7280" }}>
                            Total Boards
                        </p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: "600" }}>
                            {totalBoards}
                        </p>
                    </div>
                    <div>
                        <p style={{ margin: "0", fontSize: "13px", color: "#6b7280" }}>
                            Completed
                        </p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: "600", color: "#2250c8" }}>
                            {completedBoards}
                        </p>
                    </div>
                    <div>
                        <p style={{ margin: "0", fontSize: "13px", color: "#6b7280" }}>
                            Remaining
                        </p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: "600", color: remainingBoards > 0 ? "#f59e0b" : "#059669" }}>
                            {remainingBoards}
                        </p>
                    </div>
                    <div>
                        <p style={{ margin: "0", fontSize: "13px", color: "#6b7280" }}>
                            Complete
                        </p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: "600", color: completionPercentage === 100 ? "#059669" : "#6b7280" }}>
                            {completionPercentage}%
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "999px",
                    overflow: "hidden"
                }}>
                    <div style={{
                        width: `${completionPercentage}%`,
                        height: "100%",
                        backgroundColor: completionPercentage === 100 ? "#059669" : "#2250c8",
                        transition: "width 0.3s ease"
                    }}></div>
                </div>

                {completionPercentage === 100 && !isSubmitted && (
                    <p style={{ marginTop: "12px", fontSize: "14px", color: "#059669", fontWeight: "500" }}>
                        ✓ All results entered! Ready to submit.
                    </p>
                )}
            </div>

            {/* Pending Boards Table */}
            {assignment.pairings.filter((p) => !results[p.board] || results[p.board] === "").length > 0 && (
                <div className="card">
                    <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>Pending Boards</h2>
                    {!isSubmitted && saving && (
                        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                            Saving...
                        </p>
                    )}
                    {!isSubmitted && !saving && lastSaved && (
                        <p style={{ fontSize: "14px", color: "#059669", marginBottom: "8px" }}>
                            ✓ Auto-saved at {lastSaved.toLocaleTimeString()}
                        </p>
                    )}

                    <table className="table">
                        <thead>
                            <tr>
                                <th>Board</th>
                                <th>White</th>
                                <th>Black</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignment.pairings
                                .filter((p) => !results[p.board] || results[p.board] === "")
                                .map((p) => (
                                    <tr key={p.board}>
                                        <td>{p.board}</td>
                                        <td
                                            className={getPlayerCellClass(p.board, "white")}
                                            onClick={() => !isSubmitted && handlePlayerClick(p.board, "white")}
                                            onDoubleClick={() => !isSubmitted && handlePlayerDoubleClick(p.board, "white")}
                                            style={{ cursor: isSubmitted ? "default" : "pointer" }}
                                        >
                                            {p.playerA}
                                        </td>
                                        <td
                                            className={getPlayerCellClass(p.board, "black")}
                                            onClick={() => !isSubmitted && handlePlayerClick(p.board, "black")}
                                            onDoubleClick={() => !isSubmitted && handlePlayerDoubleClick(p.board, "black")}
                                            style={{ cursor: isSubmitted ? "default" : "pointer" }}
                                        >
                                            {p.playerB}
                                        </td>
                                        <td>
                                            <select
                                                value={results[p.board] || ""}
                                                onChange={(e) => handleChange(p.board, e.target.value)}
                                                disabled={isSubmitted}
                                                style={isSubmitted ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                                            >
                                                {RESULT_OPTIONS.map((opt) => (
                                                    <option key={opt.value || "empty"} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Completed Boards Table */}
            {assignment.pairings.filter((p) => results[p.board] && results[p.board] !== "").length > 0 && (
                <div className="card">
                    <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>Completed Boards</h2>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Board</th>
                                <th>White</th>
                                <th>Black</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignment.pairings
                                .filter((p) => results[p.board] && results[p.board] !== "")
                                .map((p) => (
                                    <tr key={p.board}>
                                        <td>{p.board}</td>
                                        <td
                                            className={getPlayerCellClass(p.board, "white")}
                                            onClick={() => !isSubmitted && handlePlayerClick(p.board, "white")}
                                            onDoubleClick={() => !isSubmitted && handlePlayerDoubleClick(p.board, "white")}
                                            style={{ cursor: isSubmitted ? "default" : "pointer" }}
                                        >
                                            {p.playerA}
                                        </td>
                                        <td
                                            className={getPlayerCellClass(p.board, "black")}
                                            onClick={() => !isSubmitted && handlePlayerClick(p.board, "black")}
                                            onDoubleClick={() => !isSubmitted && handlePlayerDoubleClick(p.board, "black")}
                                            style={{ cursor: isSubmitted ? "default" : "pointer" }}
                                        >
                                            {p.playerB}
                                        </td>
                                        <td>
                                            <select
                                                value={results[p.board] || ""}
                                                onChange={(e) => handleChange(p.board, e.target.value)}
                                                disabled={isSubmitted}
                                                style={isSubmitted ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                                            >
                                                {RESULT_OPTIONS.map((opt) => (
                                                    <option key={opt.value || "empty"} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Submit Button - Only show if NOT submitted */}
            {!isSubmitted && (
                <div className="card">
                    <button
                        className="btn-primary-arbiter"
                        onClick={handleFinalSubmit}
                        disabled={submitting}
                        style={submitting ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                    >
                        {submitting ? "Submitting..." : "🔐 Submit Results (Final)"}
                    </button>
                    <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "8px" }}>
                        ⚠️ After submission, results cannot be edited.
                    </p>
                    {status && <p className="status-text">{status}</p>}
                </div>
            )}

            {/* Status message for submitted state */}
            {isSubmitted && status && (
                <div className="card">
                    <p className="status-text">{status}</p>
                </div>
            )}
        </div>
    );
}
