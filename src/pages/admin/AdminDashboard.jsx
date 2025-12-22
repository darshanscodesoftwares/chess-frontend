// src/pages/admin/AdminDashboard.jsx
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <p className="muted">
        Use the steps below to manage tournaments, arbiters, and board
        assignments.
      </p>

      <div className="grid-3">
        <Link to="/admin/view-pairings" className="card card-clickable">
          <h3>Step 1: View Pairings</h3>
          <p>Fetch DB/SID keys and see the round pairings.</p>
        </Link>

        <Link to="/admin/arbiters" className="card card-clickable">
          <h3>Step 2: Manage Arbiters</h3>
          <p>Add arbiters and manage their contact info.</p>
        </Link>

        <Link to="/admin/assign-boards" className="card card-clickable">
          <h3>Step 3: Assign Boards</h3>
          <p>Create board ranges and generate arbiter links.</p>
        </Link>
      </div>
    </div>
  );
}
