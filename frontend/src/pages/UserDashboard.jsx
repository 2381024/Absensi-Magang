import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Absensi Magang</h1>
        <div className="user-info">
          <span>Welcome, <strong>{user?.username}</strong> ({user?.role})</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>
      <main className="dashboard-main">
        <p>User dashboard — attendance features coming soon.</p>
      </main>
    </div>
  );
}