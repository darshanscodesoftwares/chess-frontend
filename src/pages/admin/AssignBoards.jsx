// src/pages/admin/AssignBoards.jsx
import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import useTournamentStore from "../../store/useTournamentStore";

export default function AssignBoards() {
  // Zustand store — global shared tournament data
  const dbKey = useTournamentStore((s) => s.dbKey);
  const sidKey = useTournamentStore((s) => s.sidKey);
  const round = useTournamentStore((s) => s.round);
  const pairings = useTournamentStore((s) => s.pairings);

  const [arbiters, setArbiters] = useState([]);
  const [form, setForm] = useState({
    arbiterId: "",
    boardFrom: "",
    boardTo: "",
  });
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load arbiters once
  useEffect(() => {
    const loadArbiters = async () => {
      try {
        const res = await axiosClient.get("/arbiters");
        if (res.data.success) {
          setArbiters(res.data.arbiters || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadArbiters();
  }, []);

  // Form handlers
  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!dbKey || !sidKey || !round || pairings.length === 0) {
      alert("Tournament data missing. Please fetch pairings first.");
      return;
    }
    if (!form.arbiterId || !form.boardFrom || !form.boardTo) {
      alert("Please fill all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await axiosClient.post("/assignments", {
        dbKey,
        sidKey,
        round,
        arbiterId: form.arbiterId,
        boardFrom: Number(form.boardFrom),
        boardTo: Number(form.boardTo),
        pairings, // comes from Zustand, not from refetch
      });

      if (!res.data.success) {
        alert(res.data.error || "Error creating assignment");
        return;
      }

      // Append generated link to list
      setLinks((prev) => [
        ...prev,
        {
          boards: `${form.boardFrom}-${form.boardTo}`,
          url: res.data.shareUrl,
        },
      ]);

      setForm({ arbiterId: "", boardFrom: "", boardTo: "" });
    } catch (err) {
      console.error(err);
      alert("Error creating assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Assign Boards to Arbiters</h1>

      {!dbKey && (
        <p className="warning">
          No tournament info found. Go to <strong>View Pairings</strong> and fetch keys first.
        </p>
      )}

      {dbKey && (
        <div className="card small-info">
          <p><strong>DB Key:</strong> {dbKey}</p>
          <p><strong>SID Key:</strong> {sidKey}</p>
          <p><strong>Round:</strong> {round || "Unknown"}</p>
        </div>
      )}

      <div className="card">
        <h2>Create Assignment</h2>

        <form onSubmit={handleCreate} className="form-grid">
          <select name="arbiterId" value={form.arbiterId} onChange={handleChange}>
            <option value="">Select arbiter</option>
            {arbiters.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>

          <input
            name="boardFrom"
            type="number"
            placeholder="Board from"
            value={form.boardFrom}
            onChange={handleChange}
          />

          <input
            name="boardTo"
            type="number"
            placeholder="Board to"
            value={form.boardTo}
            onChange={handleChange}
          />

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Generate Arbiter Link"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Generated Arbiter Links</h2>

        {links.length === 0 && <p className="muted">No links generated yet.</p>}

        <ul className="link-list">
          {links.map((l, idx) => (
            <li key={idx}>
              Boards {l.boards}:{" "}
              <a href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
            </li>
          ))}
        </ul>

        <p className="muted">
          Links use the pattern <code>/arbiter/:token</code> in your React router.
        </p>
      </div>
    </div>
  );
}
