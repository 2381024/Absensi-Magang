import { useState } from "react";
import "./Login.css";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Mock login validation
    if (!username || !password) {
      setError("Username dan password harus diisi");
      return;
    }

    if (password.length < 4) {
      setError("Password minimal 4 karakter");
      return;
    }

    // Mock successful login
    onLogin({ username });
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login Absensi Magang</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        <div className="demo-info">
          <p>Demo: Gunakan username & password apa saja (min 4 karakter)</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
