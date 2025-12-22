// src/pages/arbiter/ArbiterPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const RESULT_OPTIONS = [
    { value: "", label: "Select" },
    { value: "1-0", label: "1 - 0" },
    { value: "½-½", label: "Draw" },
    { value: "0-1", label: "0 - 1" },
    { value: "1-0F", label: "1f-0f" },
    { value: "0-1F", label: "0f-1f" },
    { value: "0-0F", label: "0f-0f" },
];

export default function ArbiterPage() {
    const { token } = useParams();
    const [assignment, setAssignment] = useState(null);
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");

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

    const handleChange = (board, value) => {
        setResults((prev) => ({ ...prev, [board]: value }));
    };

    const handleSubmit = async () => {
        if (!assignment) return;

        const payload = assignment.pairings.map((p) => ({
            board: p.board,
            result: results[p.board] || "",
        }));

        const incomplete = payload.some((p) => !p.result);
        if (incomplete) {
            const ok = window.confirm(
                "Some boards have no result selected. Submit anyway?"
            );
            if (!ok) return;
        }

        try {
            const res = await axiosClient.post(
                `/assignments/by-token/${token}/results`,
                { results: payload }
            );
            if (res.data.success) {
                setStatus("Results saved successfully!");
            } else {
                setStatus(res.data.error || "Error saving results.");
            }
        } catch (err) {
            console.error(err);
            setStatus("Error submitting results.");
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

    return (
        <div className="page">
            <h1>Arbiter Result Entry</h1>

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
                        {assignment.pairings.map((p) => (
                            <tr key={p.board}>
                                <td>{p.board}</td>
                                <td>{p.playerA}</td>
                                <td>{p.playerB}</td>
                                <td>
                                    <select
                                        value={results[p.board] || ""}
                                        onChange={(e) => handleChange(p.board, e.target.value)}
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

                <button className="btn-primary-arbiter" onClick={handleSubmit}>
                    Submit Results
                </button>
                {status && <p className="status-text">{status}</p>}
            </div>
        </div>
    );
}
