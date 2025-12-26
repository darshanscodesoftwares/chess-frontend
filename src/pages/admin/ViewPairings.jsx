// // src/pages/admin/ViewPairings.jsx
// import { useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import Table from "../../components/Table";
// import useTournamentStore from "../../store/useTournamentStore";

// export default function ViewPairings() {
//   const [url, setUrl] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Zustand store setters
//   const setTournamentKeys = useTournamentStore((s) => s.setTournamentKeys);
//   const setPairingsStore = useTournamentStore((s) => s.setPairings);

//   // Zustand state (only for display)
//   const dbKey = useTournamentStore((s) => s.dbKey);
//   const sidKey = useTournamentStore((s) => s.sidKey);
//   const round = useTournamentStore((s) => s.round);
//   const pairings = useTournamentStore((s) => s.pairings);

//   const handleFetch = async () => {
//     if (!url.trim()) {
//       alert("Please paste the Customize List URL.");
//       return;
//     }

//     setLoading(true);

//     try {
//       // STEP 1 — Get Keys
//       const keysRes = await axiosClient.get("/tournament/keys", {
//         params: { url },
//       });

//       if (!keysRes.data.success) {
//         alert("Error fetching keys");
//         return;
//       }

//       const { dbKey: db, sidKey: sid } = keysRes.data;

//       // Save global
//       setTournamentKeys({ dbKey: db, sidKey: sid });

//       // STEP 2 — Fetch Pairings
//       const pairRes = await axiosClient.post("/tournament/pairings", {
//         dbKey: db,
//         sidKey: sid,
//       });

//       if (!pairRes.data.success) {
//         alert("Error fetching pairings");
//         return;
//       }

//       // Save global pairing list
//       setPairingsStore({
//         round: pairRes.data.round,
//         pairings: pairRes.data.pairings || [],
//       });

//     } catch (err) {
//       console.error(err);
//       alert("Error fetching data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const columns = [
//     { header: "Board", accessor: "board" },
//     { header: "White", accessor: "playerA" },
//     { header: "Black", accessor: "playerB" },
//   ];

//   return (
//     <div className="page">
//       <h1>View Pairings</h1>

//       <div className="card">
//         <label className="field-label">Customize List URL</label>
//         <div className="form-row">
//           <input
//             type="text"
//             placeholder="Paste Chess-Results Customize List URL"
//             value={url}
//             onChange={(e) => setUrl(e.target.value)}
//           />
//           <button className="btn-primary" onClick={handleFetch} disabled={loading}>
//             {loading ? "Loading..." : "Fetch Keys & Pairings"}
//           </button>
//         </div>

//         {dbKey && (
//           <div className="keys-display">
//             <p><strong>Database Key:</strong> {dbKey}</p>
//             <p><strong>SID Key:</strong> {sidKey}</p>
//             <p><strong>Round:</strong> {round || "Unknown"}</p>
//           </div>
//         )}
//       </div>

//       {pairings.length > 0 && (
//         <div className="card">
//           <h2>Round Pairings</h2>
//           <Table columns={columns} data={pairings} />
//         </div>
//       )}
//     </div>
//   );
// }

// src/pages/admin/ViewPairings.jsx
import { useState, useEffect, useRef } from "react";
import axiosClient from "../../api/axiosClient";
import Table from "../../components/Table";
import useTournamentStore from "../../store/useTournamentStore";

export default function ViewPairings() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const fetchInProgress = useRef(false); // Prevent double-clicks

  // Load saved tournaments on mount
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

  // Zustand setters
  const setTournamentKeys = useTournamentStore((s) => s.setTournamentKeys);
  const setPairingsStore = useTournamentStore((s) => s.setPairings);

  // Zustand values for display
  const dbKey = useTournamentStore((s) => s.dbKey);
  const sidKey = useTournamentStore((s) => s.sidKey);
  const round = useTournamentStore((s) => s.round);
  const pairings = useTournamentStore((s) => s.pairings);

  // Handle tournament selection from dropdown - auto-fill URL
  const handleTournamentSelect = (e) => {
    const selectedDbKey = e.target.value;
    if (!selectedDbKey) {
      setUrl("");
      return;
    }

    const selectedTournament = tournaments.find((t) => t.dbKey === selectedDbKey);
    if (selectedTournament && selectedTournament.baseLink) {
      setUrl(selectedTournament.baseLink);
    }
  };

  const handleFetch = async () => {
    // Prevent double-clicks using ref (instant check, no React state delay)
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, ignoring duplicate click");
      return;
    }

    if (!url.trim()) {
      alert("Please paste the Customize List URL.");
      return;
    }

    fetchInProgress.current = true;
    setLoading(true);

    try {
      /* ------------------ STEP 1: Get Keys ------------------ */
      const keysRes = await axiosClient.get("/tournament/keys", {
        params: { url },
      });

      if (!keysRes.data.success) {
        alert("Error fetching keys");
        return;
      }

      const { dbKey: db, sidKey: sid } = keysRes.data;

      // Save keys globally
      setTournamentKeys({ dbKey: db, sidKey: sid });

      /* ------------------ STEP 2: Get Pairings + ROUND ------------------ */
      const pairRes = await axiosClient.post("/tournament/pairings", {
        dbKey: db,
        sidKey: sid,
        round: keysRes.data.round,
      });

      if (!pairRes.data.success) {
        alert("Error fetching pairings");
        return;
      }

      const detectedRound = pairRes.data.round || "Unknown";

      // Save pairings + round into store
      setPairingsStore({
        round: detectedRound,
        pairings: pairRes.data.pairings || [],
      });
    } catch (err) {
      console.error(err);
      // Handle 429 (scraping in progress) gracefully
      if (err.response?.status === 429) {
        alert("Scraping is already in progress. Please wait and try again.");
      } else {
        alert("Error fetching data. Please try again.");
      }
    } finally {
      fetchInProgress.current = false;
      setLoading(false);
    }
  };

  const columns = [
    { header: "Board", accessor: "board" },
    { header: "White", accessor: "playerA" },
    { header: "Black", accessor: "playerB" },
  ];

  return (
    <div className="page">
      <h1>View Pairings</h1>

      <div className="card">
        {/* Tournament Dropdown - Auto-fill URL */}
        <label className="field-label">Saved Tournaments</label>
        <select
          onChange={handleTournamentSelect}
          disabled={loadingTournaments}
          style={{ marginBottom: "12px" }}
        >
          <option value="">Select a saved tournament...</option>
          {tournaments.map((t) => (
            <option key={t.dbKey} value={t.dbKey}>
              {t.tournamentName} ({t.dbKey})
            </option>
          ))}
        </select>

        <label className="field-label">Customize List URL</label>

        <div className="form-row">
          <input
            type="text"
            placeholder="Paste Chess-Results Customize List URL (or select from dropdown above)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <button className="btn-primary" onClick={handleFetch} disabled={loading}>
            {loading ? "Loading..." : "Fetch Keys & Pairings"}
          </button>
        </div>

        {dbKey && (
          <div className="keys-display">
            <p><strong>Database Key:</strong> {dbKey}</p>
            <p><strong>SID Key:</strong> {sidKey}</p>
            <p><strong>Round:</strong> {round || "Unknown"}</p>
          </div>
        )}
      </div>

      {pairings.length > 0 && (
        <div className="card">
          <h2>Round {round || "?"} Pairings</h2>
          <Table columns={columns} data={pairings} />
        </div>
      )}
    </div>
  );
}
