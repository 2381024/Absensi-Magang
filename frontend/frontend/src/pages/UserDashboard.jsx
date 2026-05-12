import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function UserDashboard() {
  const { user } = useAuth();

  const [activeShift, setActiveShift] = useState(null);
  const [description, setDescription] = useState("");
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locationStatus, setLocationStatus] = useState("checking");
  const [currentCoords, setCurrentCoords] = useState(null);
  const [timer, setTimer] = useState("00:00:00");
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);

  const formatDate = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("id-ID", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleTimeString("id-ID");
  };

  const formatDuration = (start, end) => {
    if (!start) return "-";
    const e = end ? new Date(end) : new Date();
    const diffMs = e - new Date(start);
    if (diffMs < 0) return "0h 0m";
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  };

  useEffect(() => {
    if (!activeShift || activeShift.status !== "active") {
      setTimer("00:00:00");
      return;
    }
    const update = () => {
      setTimer(formatDuration(activeShift.start_time, null));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeShift]);

  const getLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setLocationStatus("ok");
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => {
          setLocationStatus("error");
          reject(new Error("Location access denied. Please enable GPS."));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [active, history] = await Promise.all([
        api.getActiveShift(user.id),
        api.getShifts({ userId: user.id }),
      ]);
      setActiveShift(active);
      setShifts(history);
      if (active) {
        setDescription(active.description || "");
        setLocationStatus("ok");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { getLocation().catch(() => {}); }, [getLocation]);

  // Check geofence enforcement setting
  useEffect(() => {
    api.getGeofenceSetting().then((res) => setGeofenceEnabled(res.enabled)).catch(() => {});
  }, []);

  const handleStartShift = async () => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      let coords = currentCoords;
      if (!coords) coords = await getLocation();
      const shift = await api.startShift(user.id, coords);
      setActiveShift(shift);
      setSuccess("Shift started successfully!");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndShift = async () => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      if (description !== (activeShift?.description || "")) {
        await api.updateShift(activeShift.id, { description });
      }
      let coords = currentCoords;
      try { coords = await getLocation(); } catch {}
      await api.endShift(user.id, coords || {});
      setActiveShift(null);
      setDescription("");
      setSuccess("Shift ended. Great work today!");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!activeShift) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.updateShift(activeShift.id, { description });
      setSuccess("Notes saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isActive = activeShift?.status === "active";

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading"><span className="spinner" /> Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="page-header">
          <h2>Dashboard</h2>
          <p>Welcome back, {user?.username}. Ready for your shift?</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {success}
          </div>
        )}

        {/* Shift Panel */}
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <div className="card-header">
            <h3>Shift Control</h3>
          </div>

          {!geofenceEnabled && (
            <div style={{ padding: "var(--space-3) var(--space-4)", background: "#fef3c7", borderBottom: "1px solid #fcd34d", display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--font-size-sm)", color: "#92400e" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Geofence check is disabled — you can start shifts from anywhere.
            </div>
          )}

          <div className="shift-panel">
            <div className={`shift-status-badge ${isActive ? "active" : "inactive"}`}>
              {isActive && <span className="pulse-dot" />}
              {isActive ? "On Shift" : "Not on Shift"}
            </div>
            {isActive && <div className="shift-timer">{timer}</div>}
            {!isActive ? (
              <button className="btn btn-shift btn-shift-start" onClick={handleStartShift} disabled={actionLoading}>
                {actionLoading ? (
                  <><span className="spinner" /> Checking location...</>
                ) : (
                  <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 12 10 17 19 8" /></svg>
                  Begin Shift</>
                )}
              </button>
            ) : (
              <button className="btn btn-shift btn-shift-end" onClick={handleEndShift} disabled={actionLoading}>
                {actionLoading ? (
                  <><span className="spinner" /> Ending...</>
                ) : (
                  <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
                  End Shift</>
                )}
              </button>
            )}
            <div className="location-status">
              <span className={`dot ${locationStatus}`} />
              {locationStatus === "checking" && "Checking location..."}
              {locationStatus === "ok" && currentCoords && `Location: ${currentCoords.latitude.toFixed(5)}, ${currentCoords.longitude.toFixed(5)}`}
              {locationStatus === "error" && "Location unavailable"}
            </div>
          </div>

          {isActive && (
            <div className="description-editor">
              <label htmlFor="desc">What have you worked on today?</label>
              <textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your tasks and accomplishments for this shift..." rows={4} />
              <div style={{ marginTop: "var(--space-3)", display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary" style={{ width: "auto", padding: "var(--space-2) var(--space-5)" }} onClick={handleSaveDescription} disabled={actionLoading}>Save Notes</button>
              </div>
            </div>
          )}
        </div>

        {/* Shift History */}
        <div className="shift-history">
          <div className="card-header" style={{ background: "transparent", padding: "0 0 var(--space-4) 0", border: "none" }}>
            <h3>Shift History</h3>
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              {shifts.length} shift{shifts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {shifts.length === 0 ? (
            <div className="card empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <p>No shifts recorded yet. Start your first shift to begin tracking.</p>
            </div>
          ) : (
            <div className="shift-list">
              {shifts.slice(0, 10).map((shift) => (
                <Link to={`/shifts/${shift.id}`} key={shift.id} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="shift-row">
                    <div>
                      <div className="shift-date">{formatDate(shift.start_time)}</div>
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
                        {formatTime(shift.start_time)} {shift.end_time ? `- ${formatTime(shift.end_time)}` : ""}
                      </div>
                    </div>
                    <div className="shift-duration">{formatDuration(shift.start_time, shift.end_time)}</div>
                    <span className={`shift-status-row ${shift.status}`}>{shift.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}