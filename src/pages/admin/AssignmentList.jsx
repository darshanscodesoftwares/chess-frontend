// src/pages/admin/AssignmentList.jsx
import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

export default function AssignmentList() {
  const [dbKey, setDbKey] = useState("");
  const [round, setRound] = useState("");
  const [assignments, setAssignments] = useState([]);
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

  const loadAssignments = async () => {
    if (!dbKey || !round) {
      alert("Enter DB Key and Round");
      return;
    }

    try {
      const res = await axiosClient.get("/assignments", {
        params: { dbKey, round },
      });

      if (res.data.success) {
        setAssignments(res.data.assignments);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error(err);
      alert("Error loading assignments");
    }
  };

  return (
    <div className="page">
      <h1>Assignment List</h1>

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
          <button className="btn-primary" onClick={loadAssignments}>
            Load
          </button>
        </div>
      </div>

      <div className="card">
        {assignments.length === 0 ? (
          <p>No assignments found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Arbiter</th>
                <th>Boards</th>
                <th>Token</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.token}>
                  <td>{a.arbiter?.name || "Unknown"}</td>
                  <td>
                    {a.boardFrom} - {a.boardTo}
                  </td>
                  <td>{a.token}</td>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
