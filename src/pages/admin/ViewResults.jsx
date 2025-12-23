// src/pages/admin/ViewResults.jsx
import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import Table from "../../components/Table"; // reuse your table component

export default function ViewResults() {
    const [dbKey, setDbKey] = useState("");
    const [round, setRound] = useState("");
    const [merged, setMerged] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [loadingTournaments, setLoadingTournaments] = useState(false);

    // Load available tournaments on mount
    useEffect(() => {
        const loadTournaments = async () => {
            setLoadingTournaments(true);
            try {
                const res = await axiosClient.get("/tournaments");
                if (res.data.success) {
                    setTournaments(res.data.tournaments || []);
                }
            } catch (err) {
                console.error("Error loading tournaments:", err);
            } finally {
                setLoadingTournaments(false);
            }
        };
        loadTournaments();
    }, []);

    const loadResults = async () => {
        if (!dbKey || !round) {
            alert("Enter DB Key and Round");
            return;
        }
        try {
            const res = await axiosClient.get("/tournament/merged-results", {
                params: { dbKey, round },
            });

            if (res.data.success) {
                setMerged(res.data.pairings);
            } else {
                alert("No results found");
                setMerged([]);
            }
        } catch (err) {
            console.error(err);
            alert("Error loading merged results");
        }
    };

    const columns = [
        { header: "Board", accessor: "board" },
        { header: "White", accessor: "playerA" },
        { header: "Black", accessor: "playerB" },
        { header: "White SNo", accessor: "whiteSNo" },
        { header: "Black SNo", accessor: "blackSNo" },
        { header: "Result", accessor: "result" },
    ];

    const handleDownloadXml = async () => {
        if (!dbKey || !round) {
            alert("Missing DB Key or Round");
            return;
        }

        try {
            const res = await axiosClient.post(
                "/tournament/xml",
                { dbKey, round },
                { responseType: "blob" }
            );

            const blob = new Blob([res.data], { type: "application/xml" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = url;
            a.download = `Round_${round}_Results.xml`;
            a.click();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Error downloading XML");
        }
    };

    return (
    <div className="page">
        <h1>View Merged Results</h1>

        <div className="card">
            {/* Dropdown to select from saved tournaments */}
            <label className="field-label">Saved Tournaments</label>
            <select
                onChange={(e) => setDbKey(e.target.value)}
                disabled={loadingTournaments}
                style={{ marginBottom: "12px" }}
            >
                <option value="">Select a saved tournament...</option>
                {tournaments.map((t) => (
                    <option key={t.dbKey} value={t.dbKey}>
                        {t.tournamentName ? `${t.tournamentName} (${t.dbKey})` : `${t.dbKey} — ${new Date(t.createdAt).toLocaleDateString()}`}
                    </option>
                ))}
            </select>

            {/* Manual input fields */}
            <label className="field-label">DB Key & Round</label>
            <div className="form-row">
                <input
                    type="text"
                    placeholder="DB Key (or select from dropdown above)"
                    value={dbKey}
                    onChange={(e) => setDbKey(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Round"
                    value={round}
                    onChange={(e) => setRound(e.target.value)}
                />
                <button className="btn-primary" onClick={loadResults}>
                    Load Results
                </button>
            </div>
        </div>

        {merged.length > 0 && (
            <>
                <div className="card">
                    <h2>Merged Round Results</h2>
                    <Table columns={columns} data={merged} />
                </div>

                <button 
                    className="btn-primary"
                    style={{ marginTop: "16px" }}
                    onClick={handleDownloadXml}
                >
                    Download XML
                </button>
            </>
        )}
    </div>
);

}
