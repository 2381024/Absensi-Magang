import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function InternProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwnProfile = !id;
  const userId = id || user?.id;

  const [profile, setProfile] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) {
      setError("User ID not found");
      setLoading(false);
      return;
    }
    try {
      const [userData, shiftsData] = await Promise.all([
        isOwnProfile ? api.getMe() : api.getUser(userId),
        api.getShifts({ userId }),
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
    iso
      ? new Date(iso).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-";
  const formatTime = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";
  const formatDuration = (start, end) => {
    if (!start) return "-";
    const diffMs = (end ? new Date(end) : new Date()) - new Date(start);
    if (diffMs < 0) return "0j 0m";
    return `${Math.floor(diffMs / 3600000)}j ${Math.floor((diffMs % 3600000) / 60000)}m`;
  };

  const totalMs = shifts
    .filter((s) => s.end_time && s.attendance_type === "hadir")
    .reduce((acc, s) => {
      const d = new Date(s.end_time) - new Date(s.start_time);
      return acc + (d > 0 ? d : 0);
    }, 0);
  const totalHours = Math.floor(totalMs / 3600000);
  const totalMins = Math.floor((totalMs % 3600000) / 60000);
  const totalDec = totalHours + totalMins / 60;
  const target = profile?.target_hours || 480;
  const progress = Math.min(100, (totalDec / target) * 100);

  const stats = {
    hadir: shifts.filter((s) => s.attendance_type === "hadir").length,
    izin: shifts.filter((s) => s.attendance_type === "izin").length,
    sakit: shifts.filter((s) => s.attendance_type === "sakit").length,
    alpha: shifts.filter((s) => s.attendance_type === "alpha").length,
  };

  const chartData = [
    { name: "Hadir", value: stats.hadir, fill: "#10b981" },
    { name: "Izin", value: stats.izin, fill: "#f59e0b" },
    { name: "Sakit", value: stats.sakit, fill: "#ef4444" },
    { name: "Alpha", value: stats.alpha, fill: "#6b7280" },
  ];

  if (loading)
    return (
      <div className="loading">
        <span className="spinner" /> Loading...
      </div>
    );
  if (error || !profile)
    return (
      <div>
        <div className="alert alert-error">{error || "User not found"}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Kembali
        </button>
      </div>
    );

  return (
    <div>
      {!isOwnProfile && (
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          style={{ marginBottom: "var(--space-4)" }}
        >
          ← Kembali
        </button>
      )}

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          borderRadius: "16px",
          padding: "var(--space-8)",
          color: "#fff",
          marginBottom: "var(--space-6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-4)",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              border: "4px solid rgba(255,255,255,0.3)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {profile?.profile_photo ? (
              <img
                src={profile.profile_photo}
                alt={profile.full_name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{ fontSize: "48px", fontWeight: "700", color: "#fff" }}
              >
                {profile?.full_name?.charAt(0).toUpperCase() ||
                  profile?.username?.charAt(0).toUpperCase() ||
                  "U"}
              </span>
            )}
          </div>
          {isOwnProfile && (
            <button
              onClick={() => setEditing(true)}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#fff",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          )}
        </div>

        <h1
          style={{
            fontSize: "var(--font-size-3xl)",
            fontWeight: "700",
            color: "#fff",
            margin: 0,
          }}
        >
          {profile?.full_name || profile?.username}
        </h1>
        <span
          style={{
            padding: "var(--space-1) var(--space-3)",
            background: "rgba(255,255,255,0.2)",
            borderRadius: "20px",
            fontSize: "var(--font-size-sm)",
            color: "#fff",
          }}
        >
          {profile?.internship_status === "active" ? "Aktif" : "Non-Aktif"}
        </span>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "var(--space-4)",
            width: "100%",
            maxWidth: "720px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "var(--space-4)",
          }}
        >
          {[
            { label: "NIM", value: profile?.nim },
            { label: "Program Studi", value: profile?.major },
            { label: "Tempat Magang", value: profile?.internship_location },
            { label: "Divisi", value: profile?.division },
            { label: "Pembimbing", value: profile?.field_mentor },
            {
              label: "Periode",
              value: profile?.start_date
                ? `${formatDate(profile.start_date)} – ${formatDate(profile.end_date)}`
                : "-",
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <div
                style={{
                  fontSize: "var(--font-size-xs)",
                  opacity: 0.8,
                  color: "#fff",
                }}
              >
                {label}
              </div>
              <div style={{ fontWeight: "600", color: "#fff" }}>
                {value || "-"}
              </div>
            </div>
          ))}
        </div>

        {isOwnProfile && (
          <button
            className="btn"
            onClick={() => setEditing(true)}
            style={{
              background: "#fff",
              color: "#3b82f6",
              fontWeight: "600",
              border: "none",
              borderRadius: "12px",
              padding: "var(--space-3) var(--space-6)",
              cursor: "pointer",
            }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-header">
          <h3>Progress Magang</h3>
        </div>
        <div style={{ padding: "var(--space-4)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "var(--space-2)",
            }}
          >
            <span>
              {totalHours}j {totalMins}m / {target}j
            </span>
            <span style={{ fontWeight: "700", color: "#3b82f6" }}>
              {progress.toFixed(1)}%
            </span>
          </div>
          <div
            style={{
              background: "#e2e8f0",
              borderRadius: "8px",
              height: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "linear-gradient(90deg, #3b82f6, #2563eb)",
                height: "100%",
                width: `${progress}%`,
                borderRadius: "8px",
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats + Chart */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-header">
          <h3>Statistik Kehadiran</h3>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-4)",
            padding: "var(--space-4)",
          }}
        >
          <div style={{ height: "180px", minHeight: "180px", minWidth: "0" }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={({ name, value }) =>
                    value > 0 ? `${name}: ${value}` : ""
                  }
                >
                  {chartData.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-3)",
              alignContent: "start",
            }}
          >
            {[
              { label: "Hadir", val: stats.hadir, color: "#10b981" },
              { label: "Izin", val: stats.izin, color: "#f59e0b" },
              { label: "Sakit", val: stats.sakit, color: "#ef4444" },
              { label: "Alpha", val: stats.alpha, color: "#6b7280" },
            ].map(({ label, val, color }) => (
              <div
                key={label}
                className="card"
                style={{
                  padding: "var(--space-3)",
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                }}
              >
                <div style={{ fontSize: "var(--font-size-xs)", color }}>
                  {label}
                </div>
                <div
                  style={{
                    fontSize: "var(--font-size-2xl)",
                    fontWeight: "700",
                    color,
                  }}
                >
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shift History */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-header">
          <h3>Riwayat Shift</h3>
        </div>
        {shifts.length === 0 ? (
          <div
            style={{
              padding: "var(--space-8)",
              textAlign: "center",
              color: "var(--color-text-muted)",
            }}
          >
            Belum ada data shift
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Mulai</th>
                  <th>Selesai</th>
                  <th>Durasi</th>
                  <th>Tipe</th>
                </tr>
              </thead>
              <tbody>
                {shifts.slice(0, 20).map((s) => (
                  <tr key={s.id}>
                    <td>{formatDate(s.start_time)}</td>
                    <td>{formatTime(s.start_time)}</td>
                    <td>
                      {s.end_time ? (
                        formatTime(s.end_time)
                      ) : (
                        <span style={{ color: "#10b981" }}>Aktif</span>
                      )}
                    </td>
                    <td>{formatDuration(s.start_time, s.end_time)}</td>
                    <td>
                      <span className={`badge badge-${s.attendance_type}`}>
                        {s.attendance_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pengaturan Akun (only own profile) */}
      {isOwnProfile && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <div className="card-header">
            <h3>Pengaturan Akun</h3>
          </div>
          <div
            style={{
              padding: "var(--space-4)",
              display: "flex",
              gap: "var(--space-3)",
            }}
          >
            <button
              className="btn btn-primary"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setChangingPassword(true)}
            >
              Ganti Password
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div className="card-header">
              <h3>Edit Profile</h3>
              <button
                onClick={() => setEditing(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const data = {
                    full_name: e.target.full_name.value,
                    nim: e.target.nim.value,
                    major: e.target.major.value,
                    internship_location: e.target.internship_location.value,
                    division: e.target.division.value,
                    field_mentor: e.target.field_mentor.value,
                    start_date: e.target.start_date.value || null,
                    end_date: e.target.end_date.value || null,
                    target_hours: parseInt(e.target.target_hours.value) || 480,
                  };
                  if (profilePhoto) data.profile_photo = profilePhoto;
                  const updated = isOwnProfile
                    ? await api.updateMe(data)
                    : await api.updateUser(userId, data);
                  setProfile(updated);
                  setEditing(false);
                  setProfilePhoto(null);
                  alert("Profile berhasil diupdate!");
                } catch (err) {
                  alert("Gagal: " + err.message);
                }
              }}
              style={{
                padding: "var(--space-4)",
                display: "grid",
                gap: "var(--space-4)",
              }}
            >
              {/* Photo Upload */}
              <div style={{ textAlign: "center" }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : profile?.profile_photo ? (
                      <img
                        src={profile.profile_photo}
                        alt="Current"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "40px",
                          fontWeight: "700",
                          color: "#64748b",
                        }}
                      >
                        {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <label
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) {
                          const r = new FileReader();
                          r.onloadend = () => setProfilePhoto(r.result);
                          r.readAsDataURL(f);
                        }
                      }}
                    />
                  </label>
                </div>
                <div
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-muted)",
                    marginTop: "var(--space-1)",
                  }}
                >
                  Klik icon kamera untuk upload foto
                </div>
              </div>

              <div className="form-group">
                <label>Nama Lengkap</label>
                <input
                  name="full_name"
                  defaultValue={profile.full_name || ""}
                />
              </div>
              <div className="form-group">
                <label>NIM</label>
                <input name="nim" defaultValue={profile.nim || ""} />
              </div>
              <div className="form-group">
                <label>Program Studi</label>
                <input name="major" defaultValue={profile.major || ""} />
              </div>
              <div className="form-group">
                <label>Tempat Magang</label>
                <input
                  name="internship_location"
                  defaultValue={profile.internship_location || ""}
                />
              </div>
              <div className="form-group">
                <label>Divisi</label>
                <input name="division" defaultValue={profile.division || ""} />
              </div>
              <div className="form-group">
                <label>Pembimbing Lapangan</label>
                <input
                  name="field_mentor"
                  defaultValue={profile.field_mentor || ""}
                />
              </div>
              <div className="form-group">
                <label>Tanggal Mulai</label>
                <input
                  type="date"
                  name="start_date"
                  defaultValue={profile.start_date?.split("T")[0] || ""}
                />
              </div>
              <div className="form-group">
                <label>Tanggal Selesai</label>
                <input
                  type="date"
                  name="end_date"
                  defaultValue={profile.end_date?.split("T")[0] || ""}
                />
              </div>
              <div className="form-group">
                <label>Target Jam</label>
                <input
                  type="number"
                  name="target_hours"
                  defaultValue={profile.target_hours || 480}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "var(--space-3)",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditing(false);
                    setProfilePhoto(null);
                  }}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changingPassword && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
            <div className="card-header">
              <h3>Ganti Password</h3>
              <button
                onClick={() => setChangingPassword(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.changePassword(
                    e.target.currentPassword.value,
                    e.target.newPassword.value,
                  );
                  setChangingPassword(false);
                  alert("Password berhasil diubah!");
                } catch (err) {
                  alert("Gagal: " + err.message);
                }
              }}
              style={{
                padding: "var(--space-4)",
                display: "grid",
                gap: "var(--space-4)",
              }}
            >
              <div className="form-group">
                <label>Password Lama</label>
                <input type="password" name="currentPassword" required />
              </div>
              <div className="form-group">
                <label>Password Baru</label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={6}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-3)",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setChangingPassword(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
