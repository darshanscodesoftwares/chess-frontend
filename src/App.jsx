// src/App.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageArbiters from "./pages/admin/ManageArbiters";
import AssignBoards from "./pages/admin/AssignBoards";
import ViewPairings from "./pages/admin/ViewPairings";
import ArbiterPage from "./pages/arbiter/ArbiterPage";
import AssignmentList from "./pages/admin/AssignmentList";
import ViewResults from "./pages/admin/ViewResults";

import { useAdminAuth } from "./hooks/useAdminAuth";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAdminAuth();
  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

export default function App() {
  const location = useLocation();
  const isArbiterRoute = location.pathname.startsWith("/arbiter");

  return (
    <div className="app-root">
      {!isArbiterRoute && <Navbar />}

      <main className="app-main">
        <Routes>
          {/* Admin side */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/arbiters"
            element={
              <ProtectedRoute>
                <ManageArbiters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assign-boards"
            element={
              <ProtectedRoute>
                <AssignBoards />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/view-pairings"
            element={
              <ProtectedRoute>
                <ViewPairings />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/assignments" element={<AssignmentList />} />
          <Route path="/admin/results" element={<ViewResults />} />

          {/* Arbiter side */}
          <Route path="/arbiter/:token" element={<ArbiterPage />} />

          {/* Default */}
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}
