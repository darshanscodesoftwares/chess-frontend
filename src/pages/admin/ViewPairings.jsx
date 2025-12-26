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
  const [statusMessage, setStatusMessage] = useState("");
  const [retryCountdown, setRetryCountdown] = useState(0);
  const fetchInProgress = useRef(false);
  const countdownRef = useRef(null);

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

  // Clear any existing countdown
  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setRetryCountdown(0);
  };

  // Start countdown timer (in seconds)
  const startCountdown = (seconds) => {
    clearCountdown();
    setRetryCountdown(seconds);

    countdownRef.current = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          setStatusMessage("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => clearCountdown();
  }, []);

  const handleFetch = async () => {
    // Prevent double-clicks using ref (instant check, no React state delay)
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, ignoring duplicate click");
      return;
    }

    if (!url.trim()) {
      setStatusMessage("⚠️ Please paste the Customize List URL.");
      return;
    }

    fetchInProgress.current = true;
    setLoading(true);
    setStatusMessage("🔄 Fetching tournament data...");
    clearCountdown();

    try {
      /* ------------------ STEP 1: Get Keys ------------------ */
      setStatusMessage("🔄 Getting tournament keys...");
      const keysRes = await axiosClient.get("/tournament/keys", {
        params: { url },
      });

      if (!keysRes.data.success) {
        setStatusMessage("❌ Error fetching keys. Please check the URL.");
        return;
      }

      const { dbKey: db, sidKey: sid } = keysRes.data;

      // Save keys globally
      setTournamentKeys({ dbKey: db, sidKey: sid });

      /* ------------------ STEP 2: Get Pairings + ROUND ------------------ */
      setStatusMessage("🔄 Fetching pairings (this may take a moment)...");
      const pairRes = await axiosClient.post("/tournament/pairings", {
        dbKey: db,
        sidKey: sid,
        round: keysRes.data.round,
      });

      if (!pairRes.data.success) {
        setStatusMessage("❌ Error fetching pairings.");
        return;
      }

      const detectedRound = pairRes.data.round || "Unknown";

      // Save pairings + round into store
      setPairingsStore({
        round: detectedRound,
        pairings: pairRes.data.pairings || [],
      });

      setStatusMessage(`✅ Successfully loaded Round ${detectedRound} pairings!`);

      // Clear success message after 3 seconds
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err) {
      console.error(err);
      // Handle 429 (scraping in progress) gracefully with countdown
      if (err.response?.status === 429) {
        setStatusMessage("⏳ Server is busy scraping data. Please wait...");
        startCountdown(15); // 15 second countdown before allowing retry
      } else {
        setStatusMessage("❌ Error fetching data. Please try again.");
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

          <button
            className="btn-primary"
            onClick={handleFetch}
            disabled={loading || retryCountdown > 0}
          >
            {loading
              ? "Loading..."
              : retryCountdown > 0
              ? `Wait ${retryCountdown}s...`
              : "Fetch Keys & Pairings"}
          </button>
        </div>

        {/* Status Message Display */}
        {statusMessage && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              borderRadius: "6px",
              backgroundColor: statusMessage.includes("❌")
                ? "#fef2f2"
                : statusMessage.includes("✅")
                ? "#f0fdf4"
                : statusMessage.includes("⏳")
                ? "#fffbeb"
                : "#eff6ff",
              border: `1px solid ${
                statusMessage.includes("❌")
                  ? "#fecaca"
                  : statusMessage.includes("✅")
                  ? "#bbf7d0"
                  : statusMessage.includes("⏳")
                  ? "#fde68a"
                  : "#bfdbfe"
              }`,
              color: statusMessage.includes("❌")
                ? "#991b1b"
                : statusMessage.includes("✅")
                ? "#166534"
                : statusMessage.includes("⏳")
                ? "#92400e"
                : "#1e40af",
            }}
          >
            {statusMessage}
            {retryCountdown > 0 && (
              <span style={{ marginLeft: "8px", fontWeight: "bold" }}>
                Retry in {retryCountdown}s
              </span>
            )}
          </div>
        )}

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
