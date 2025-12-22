// src/pages/admin/ManageArbiters.jsx
import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import Table from "../../components/Table";

export default function ManageArbiters() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [arbiters, setArbiters] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadArbiters = async () => {
    try {
      const res = await axiosClient.get("/arbiters");
      if (res.data.success) {
        setArbiters(res.data.arbiters || []);
      }
    } catch (err) {
      console.error(err);
      alert("Error loading arbiters");
    }
  };

  useEffect(() => {
    loadArbiters();
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await axiosClient.post("/arbiters", form);
      if (!res.data.success) {
        alert(res.data.error || "Error creating arbiter");
        return;
      }
      setForm({ name: "", email: "", phone: "" });
      await loadArbiters();
    } catch (err) {
      console.error(err);
      alert("Error creating arbiter");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone" },
  ];

  return (
    <div className="page">
      <h1>Manage Arbiters</h1>

      <div className="card">
        <h2>Add Arbiter</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <input
            name="name"
            placeholder="Name *"
            value={form.name}
            onChange={handleChange}
          />
          <input
            name="email"
            placeholder="Email (optional)"
            value={form.email}
            onChange={handleChange}
          />
          <input
            name="phone"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={handleChange}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Add Arbiter"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Existing Arbiters</h2>
        <Table columns={columns} data={arbiters} />
      </div>
    </div>
  );
}
