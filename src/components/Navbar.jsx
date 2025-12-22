import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="navbar-logo">Chess Results Admin</span>
      </div>

      {isLoggedIn && (
        <nav className="navbar-links">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/view-pairings"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Pairings
          </NavLink>

          <NavLink
            to="/admin/arbiters"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Arbiters
          </NavLink>

          <NavLink
            to="/admin/assign-boards"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Assign Boards
          </NavLink>

          {/* ➤ NEW PAGES */}
          <NavLink
            to="/admin/assignments"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Assignment List
          </NavLink>

          <NavLink
            to="/admin/results"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            View Results
          </NavLink>
        </nav>
      )}

      <div className="navbar-right">
        {isLoggedIn ? (
          <button className="btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <Link to="/admin/login" className="btn-primary">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
