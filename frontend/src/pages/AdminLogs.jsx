import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

export default function AdminLogs() {
  const [allShifts, setAllShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUserId, setFilterUserId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const uid = searchParams.get("userId");
    if (uid) setFilterUserId(uid);
    loadData();
  }, [searchParams]);

  const loadData = async () => {
    try {
      const [shiftsData, usersData] = await Promise.all([
        api.getAllShifts(),
        api.getUsers(),
      ]);
      setAllShifts(shiftsData);
      setUsers(usersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("id-ID", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
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

  const getUserName = (userId) => {
    const u = users.find((x) => x.id === userId);
    return u ? u.username : userId;
  };

  const filtered = allShifts.filter((s) => {
    if (filterUserId && s.user_id !== filterUserId) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return <div className="loading"><span className="spinner" /> Loading shifts...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Shift Logs</h2>
        <p>View and manage all shift records</p>
      </div>

      <div className="toolbar">
        <div className="filter-bar">
          <select value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)}>
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.username}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", fontWeight: 500 }}>
            {filtered.length} shift{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Date</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>
                    No shifts match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/admin/logs/${s.id}`)}>
                    <td><strong>{getUserName(s.user_id)}</strong></td>
                    <td>{formatDate(s.start_time)}</td>
                    <td>{formatTime(s.start_time)}</td>
                    <td>{s.end_time ? formatTime(s.end_time) : "-"}</td>
                    <td>{formatDuration(s.start_time, s.end_time)}</td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}