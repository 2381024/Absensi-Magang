import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isAdmin = user?.role === "admin";

  return (
    <nav className="navbar">
      <NavLink to={isAdmin ? "/admin" : "/dashboard"} className="navbar-brand">
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <span className="brand-name">Absensi Magang</span>
      </NavLink>

      <ul className="navbar-nav">
        <li>
          <NavLink to={isAdmin ? "/admin" : "/dashboard"} end>
            Dashboard
          </NavLink>
        </li>
        {isAdmin && (
          <>
            <li>
              <NavLink to="/admin/users">Users</NavLink>
            </li>
            <li>
              <NavLink to="/admin/logs">Logs</NavLink>
            </li>
            <li>
              <NavLink to="/admin/geofence">Geofence</NavLink>
            </li>
          </>
        )}
        <li>
          <NavLink to="/profile">Profile</NavLink>
        </li>
      </ul>

      <div className="navbar-right">
        <div className="navbar-user">
          <div className="avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.username}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-sm btn-secondary">
          Logout
        </button>
      </div>
    </nav>
  );
}