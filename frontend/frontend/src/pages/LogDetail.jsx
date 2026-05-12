import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function LogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadShift();
  }, [id]);

  const loadShift = async () => {
    try {
      const data = await api.getShiftDetail(id);
      setShift(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const formatTime = (iso) => (iso ? new Date(iso).toLocaleTimeString("id-ID") : "-");

  const formatDuration = (start, end) => {
    if (!start) return "-";
    const e = end ? new Date(end) : new Date();
    const diffMs = e - new Date(start);
    if (diffMs < 0) return "0h 0m";
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-content">
          <div className="loading"><span className="spinner" /> Loading shift details...</div>
        </div>
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="dashboard">
        <div className="dashboard-content">
          <div className="alert alert-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error || "Shift not found"}
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
          <h2>Shift Detail</h2>
          <p>Shift record for {shift.username || shift.user_id}</p>
        </div>

        <div className="profile-stats" style={{ marginTop: 0 }}>
          <div className="stat-card">
            <div className="stat-value">
              <span className={`badge badge-${shift.status}`} style={{ fontSize: "var(--font-size-md)" }}>{shift.status}</span>
            </div>
            <div className="stat-label">Status</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatDuration(shift.start_time, shift.end_time)}</div>
            <div className="stat-label">Duration</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <h3 style={{ marginBottom: "var(--space-4)" }}>Shift Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(shift.start_time)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Start Time</span>
              <span className="detail-value">{formatTime(shift.start_time)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">End Time</span>
              <span className="detail-value">{shift.end_time ? formatTime(shift.end_time) : "Ongoing"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Duration</span>
              <span className="detail-value">{formatDuration(shift.start_time, shift.end_time)}</span>
            </div>
            {shift.start_latitude != null && (
              <div className="detail-item">
                <span className="detail-label">Start Location</span>
                <span className="detail-value">{shift.start_latitude.toFixed(6)}, {shift.start_longitude.toFixed(6)}</span>
              </div>
            )}
            {shift.end_latitude != null && (
              <div className="detail-item">
                <span className="detail-label">End Location</span>
                <span className="detail-value">{shift.end_latitude.toFixed(6)}, {shift.end_longitude.toFixed(6)}</span>
              </div>
            )}
          </div>
        </div>

        {shift.description ? (
          <div className="card" style={{ marginBottom: "var(--space-6)" }}>
            <h3 style={{ marginBottom: "var(--space-3)" }}>Work Description</h3>
            <div className="description-box">{shift.description}</div>
          </div>
        ) : (
          <div className="card empty-state" style={{ marginBottom: "var(--space-6)" }}>
            <p>No description provided for this shift.</p>
          </div>
        )}
      </div>
    </div>
  );
}