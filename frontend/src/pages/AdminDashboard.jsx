import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function AdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isOnMainPage = location.pathname === "/admin";

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        {isOnMainPage ? <AdminHome user={user} navigate={navigate} /> : <Outlet />}
      </div>
    </div>
  );
}

function AdminHome({ user, navigate }) {
  const [stats, setStats] = useState({ users: 0, shifts: 0, activeShifts: 0, geofences: 0 });
  const [recentShifts, setRecentShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [users, shifts, geofences] = await Promise.all([
        api.getUsers(),
        api.getShifts(),
        api.getGeofences(),
      ]);
      const active = shifts.filter((s) => s.status === "active");
      setStats({
        users: users.length,
        shifts: shifts.length,
        activeShifts: active.length,
        geofences: geofences.length,
      });
      setRecentShifts(shifts.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("id-ID", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  if (loading) {
    return <div className="loading"><span className="spinner" /> Loading...</div>;
  }

  return (
    <>
      <div className="page-header">
        <h2>Admin Dashboard</h2>
        <p>Manage users, shifts, and geofence locations</p>
      </div>

      {/* Stats */}
      <div className="profile-stats" style={{ marginBottom: "var(--space-8)", marginTop: 0 }}>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("users")}>
          <div className="stat-value">{stats.users}</div>
          <div className="stat-label">Users</div>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("logs")}>
          <div className="stat-value">{stats.shifts}</div>
          <div className="stat-label">Total Shifts</div>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("logs")}>
          <div className="stat-value" style={{ color: "var(--color-success)" }}>{stats.activeShifts}</div>
          <div className="stat-label">Active Now</div>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("geofence")}>
          <div className="stat-value">{stats.geofences}</div>
          <div className="stat-label">Geofences</div>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <div className="card" style={{ cursor: "pointer", padding: "var(--space-5)" }} onClick={() => navigate("users")}>
          <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, marginBottom: "var(--space-1)" }}>Manage Users</div>
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>Create, edit, and manage intern and admin accounts</div>
        </div>
        <div className="card" style={{ cursor: "pointer", padding: "var(--space-5)" }} onClick={() => navigate("logs")}>
          <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, marginBottom: "var(--space-1)" }}>Shift Logs</div>
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>View all shift records, filter by user or status</div>
        </div>
        <div className="card" style={{ cursor: "pointer", padding: "var(--space-5)" }} onClick={() => navigate("geofence")}>
          <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, marginBottom: "var(--space-1)" }}>Geofence Locations</div>
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>Set allowed areas for shift check-in</div>
        </div>
      </div>

      {/* Recent Shifts */}
      <div className="card-header" style={{ background: "transparent", padding: "0 0 var(--space-4) 0", border: "none" }}>
        <h3>Recent Shifts</h3>
        <Link to="logs" style={{ fontSize: "var(--font-size-sm)", color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>View all</Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentShifts.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No shifts recorded yet</td>
                </tr>
              ) : (
                recentShifts.map((s) => (
                  <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => navigate(`logs/${s.id}`)}>
                    <td><strong>{s.username || s.user_id}</strong></td>
                    <td>{formatDate(s.start_time)}</td>
                    <td>{formatDuration(s.start_time, s.end_time)}</td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function formatDuration(start, end) {
  if (!start) return "-";
  const e = end ? new Date(end) : new Date();
  const diffMs = e - new Date(start);
  if (diffMs < 0) return "0h 0m";
  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  return `${hrs}h ${mins}m`;
}