import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function AdminProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalShifts: 0, activeUsers: 0, totalCompanies: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [meData, usersData, shiftsData, companiesData] = await Promise.all([
        api.getMe(),
        api.getUsers(),
        api.getShifts(),
        api.getCompanies(),
      ]);
      setProfile(meData);
      setStats({
        totalUsers: usersData.length,
        totalShifts: shiftsData.length,
        activeUsers: usersData.filter(u => u.internship_status === "active").length,
        totalCompanies: companiesData.length,
      });
    } catch (err) {
      console.error("Failed to load admin profile:", err);
    }
  };

  if (!user) return <div className="loading"><span className="spinner" /> Loading...</div>;

  const displayUser = profile || user;

  return (
    <div>
      {/* Profile Header */}
      <div style={{
        background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
        borderRadius: "16px",
        padding: "var(--space-8) var(--space-6)",
        color: "#fff",
        marginBottom: "var(--space-6)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-4)",
      }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: "120px", height: "120px", borderRadius: "50%",
            background: "rgba(255,255,255,0.2)", border: "4px solid rgba(255,255,255,0.3)",
            overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {displayUser?.profile_photo ? (
              <img src={displayUser.profile_photo} alt={displayUser.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "48px", fontWeight: "700", color: "#fff" }}>
                {displayUser?.username?.charAt(0).toUpperCase() || "A"}
              </span>
            )}
          </div>
          <button onClick={() => setEditing(true)} style={{
            position: "absolute", bottom: 0, right: 0, width: "40px", height: "40px",
            borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
        </div>

        <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: "700", color: "#fff", margin: 0 }}>
          {displayUser?.username || "Admin"}
        </h1>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <span style={{ padding: "var(--space-1) var(--space-3)", background: "rgba(255,255,255,0.2)", borderRadius: "20px", fontSize: "var(--font-size-sm)", color: "#fff" }}>
            Administrator
          </span>
          <span style={{ padding: "var(--space-1) var(--space-3)", background: "rgba(255,255,255,0.2)", borderRadius: "20px", fontSize: "var(--font-size-sm)", color: "#fff" }}>
            Aktif
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "var(--space-4)", width: "100%", maxWidth: "500px" }}>
          <div>
            <div style={{ fontSize: "var(--font-size-xs)", opacity: 0.8 }}>Email</div>
            <div style={{ fontWeight: "600" }}>{displayUser?.email || "admin@absensi-magang.com"}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-xs)", opacity: 0.8 }}>Role</div>
            <div style={{ fontWeight: "600" }}>Administrator</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        {[
          { label: "Total Users", value: stats.totalUsers, color: "#3b82f6", shadow: "rgba(59,130,246,0.3)" },
          { label: "Total Shifts", value: stats.totalShifts, color: "#10b981", shadow: "rgba(16,185,129,0.3)" },
          { label: "Active Users", value: stats.activeUsers, color: "#f59e0b", shadow: "rgba(245,158,11,0.3)" },
          { label: "Total Companies", value: stats.totalCompanies, color: "#ef4444", shadow: "rgba(239,68,68,0.3)" },
        ].map(({ label, value, color, shadow }) => (
          <div key={label} style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, borderRadius: "16px", padding: "var(--space-5)", color: "#fff", boxShadow: `0 8px 24px ${shadow}` }}>
            <div style={{ fontSize: "var(--font-size-xs)", opacity: 0.9, marginBottom: "var(--space-2)" }}>{label}</div>
            <div style={{ fontSize: "var(--font-size-3xl)", fontWeight: "700" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Account Settings */}
      <div className="card">
        <div className="card-header"><h3>Pengaturan Akun</h3></div>
        <div style={{ padding: "var(--space-4)", display: "flex", gap: "var(--space-3)" }}>
          <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
          <button className="btn btn-secondary" onClick={() => setChangingPassword(true)}>Ganti Password</button>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", maxHeight: "90vh", overflow: "auto" }}>
            <div className="card-header">
              <h3>Edit Profile</h3>
              <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>&times;</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const data = {
                  username: e.target.username.value,
                  email: e.target.email.value,
                };
                if (profilePhoto) data.profile_photo = profilePhoto;
                const updated = await api.updateMe(data);
                setProfile(updated);
                setEditing(false);
                setProfilePhoto(null);
                alert("Profile berhasil diupdate!");
              } catch (err) {
                alert("Gagal: " + err.message);
              }
            }} style={{ padding: "var(--space-4)", display: "grid", gap: "var(--space-4)" }}>

              {/* Photo Upload */}
              <div style={{ textAlign: "center" }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", fontWeight: "700", color: "#64748b" }}>
                    {profilePhoto ? <img src={profilePhoto} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : displayUser?.profile_photo ? <img src={displayUser.profile_photo} alt="Current" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span>{displayUser?.username?.charAt(0).toUpperCase() || "A"}</span>}
                  </div>
                  <label style={{ position: "absolute", bottom: 0, right: 0, width: "32px", height: "32px", borderRadius: "50%", background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => setProfilePhoto(r.result); r.readAsDataURL(f); }}} />
                  </label>
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>Klik icon kamera untuk upload foto</div>
              </div>

              <div className="form-group"><label>Username</label><input name="username" defaultValue={displayUser?.username || ""} /></div>
              <div className="form-group"><label>Email</label><input name="email" type="email" defaultValue={displayUser?.email || ""} /></div>

              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setEditing(false); setProfilePhoto(null); }}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changingPassword && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
            <div className="card-header">
              <h3>Ganti Password</h3>
              <button onClick={() => setChangingPassword(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>&times;</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.changePassword(e.target.currentPassword.value, e.target.newPassword.value);
                setChangingPassword(false);
                alert("Password berhasil diubah!");
              } catch (err) {
                alert("Gagal: " + err.message);
              }
            }} style={{ padding: "var(--space-4)", display: "grid", gap: "var(--space-4)" }}>
              <div className="form-group"><label>Password Lama</label><input type="password" name="currentPassword" required /></div>
              <div className="form-group"><label>Password Baru</label><input type="password" name="newPassword" required minLength={6} /></div>
              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setChangingPassword(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
