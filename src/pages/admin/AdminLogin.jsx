// src/pages/admin/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const res = await axiosClient.post("/admin/login", { password });
      if (res.data.success) {
        login();
        setStatus("Login successful!");
        navigate("/admin/dashboard");
      } else {
        setStatus(res.data.error || "Login failed");
      }
    } catch (err) {
      setStatus(err.response?.data?.error || "Error logging in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="card card-narrow">
        <h2>Admin Login</h2>
        <form onSubmit={handleSubmit} className="form-vertical">
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {status && <p className="status-text">{status}</p>}
      </div>
    </div>
  );
}
