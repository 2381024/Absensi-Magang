import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function InternProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [userData, shiftsData] = await Promise.all([
        api.getUser(id),
        api.getShifts({ userId: id }),
      ]);
      setProfile(userData);
      setShifts(shiftsData);
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("id-ID", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  const formatDuration = (start, end) => {
    if (!start) return "-";
    const e = end ? new Date(end) : new Date();
    const diffMs = e - new Date(start);
    if (diffMs < 0) return "0h 0m";
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  };

  const totalHours = shifts
    .filter((s) => s.end_time)
    .reduce((acc, s) => {
      const diffMs = new Date(s.end_time) - new Date(s.start_time);
      return acc + (diffMs > 0 ? diffMs : 0);
    }, 0);
  const totalHrs = Math.floor(totalHours / 3600000);
  const totalMins = Math.floor((totalHours % 3600000) / 60000);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-content">
          <div className="loading"><span className="spinner" /> Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="dashboard">
        <div className="dashboard-content">
          <div className="alert alert-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error || "User not found"}
          </div>
          <button className="btn btn-secondary" style={{ marginTop: "var(--space-4)" }} onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <button className="btn btn-secondary" style={{ width: "auto", marginBottom: "var(--space-4)", padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-sm)" }} onClick={() => navigate(-1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>

        <div className="page-header">
          <h2>{profile.name || profile.username}</h2>
          <p>@{profile.username} &bull; <span className={`badge badge-${profile.role}`}>{profile.role}</span></p>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-value">{shifts.length}</div>
            <div className="stat-label">Total Shifts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalHrs}h {totalMins}m</div>
            <div className="stat-label">Total Hours</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{shifts.filter((s) => s.status === "active").length > 0 ? (
              <span style={{ color: "var(--color-success)" }}>Active</span>
            ) : "Off"}</div>
            <div className="stat-label">Current Status</div>
          </div>
        </div>

        <div className="card-header" style={{ background: "transparent", padding: "0 0 var(--space-4) 0", border: "none", marginTop: "var(--space-6)" }}>
          <h3>Shift History</h3>
          <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", fontWeight: 500 }}>
            {shifts.length} shift{shifts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {shifts.length === 0 ? (
          <div className="card empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <p>No shifts recorded yet.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((s) => (
                    <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/shifts/${s.id}`)}>
                      <td><strong>{formatDate(s.start_time)}</strong></td>
                      <td>{formatDuration(s.start_time, s.end_time)}</td>
                      <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}