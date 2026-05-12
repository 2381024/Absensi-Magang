import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({ username: "", password: "", name: "", role: "user" });

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ username: "", password: "", name: "", role: "user" });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ username: user.username, password: "", name: user.name || "", role: user.role });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, { name: form.name, role: form.role });
        if (form.password) await api.updateUser(editingUser.id, { password: form.password });
      } else {
        await api.createUser(form);
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    try {
      await api.deleteUser(user.id);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewLogs = (userId) => {
    navigate(`/admin/logs?userId=${userId}`);
  };

  if (loading) {
    return <div className="loading"><span className="spinner" /> Loading users...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>User Management</h2>
        <p>Create and manage intern and admin accounts</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      <div className="toolbar">
        <div className="filter-bar">
          <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", fontWeight: 500 }}>
            {users.length} user{users.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button className="btn btn-primary" style={{ width: "auto" }} onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add User
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>
                    No users found. Create one to get started.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.name || "-"}</td>
                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon edit" title="Edit" onClick={() => openEdit(u)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button className="btn-icon delete" title="Delete" onClick={() => handleDelete(u)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingUser ? "Edit User" : "Create User"}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="uname">Username</label>
                <input id="uname" type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required disabled={!!editingUser} placeholder="e.g. intern3" />
              </div>
              <div className="form-group">
                <label htmlFor="pwd">Password{editingUser && " (leave blank to keep current)"}</label>
                <input id="pwd" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingUser} placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label htmlFor="name">Display Name</label>
                <input id="name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="user">User (Intern)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? <><span className="spinner" /> Saving...</> : editingUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}