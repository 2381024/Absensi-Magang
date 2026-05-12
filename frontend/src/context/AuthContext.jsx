import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const MOCK_TOKEN_KEY = "mock_token";
const REAL_TOKEN_KEY = "token";

function getStoredToken() {
  return localStorage.getItem(REAL_TOKEN_KEY) || localStorage.getItem(MOCK_TOKEN_KEY);
}

function decodeToken(token) {
  if (!token) return null;
  try {
    // Try mock token (base64 JSON, no dots)
    if (!token.includes(".")) {
      const payload = JSON.parse(atob(token));
      if (payload.exp < Date.now()) return null;
      return { id: payload.id, username: payload.username, role: payload.role };
    }
    // Real JWT
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return { id: payload.id, username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setUser(decoded);
      } else {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((newToken, newUser) => {
    if (!newToken) return;
    if (newToken.includes(".")) {
      localStorage.setItem(REAL_TOKEN_KEY, newToken);
      localStorage.removeItem(MOCK_TOKEN_KEY);
    } else {
      localStorage.setItem(MOCK_TOKEN_KEY, newToken);
      localStorage.removeItem(REAL_TOKEN_KEY);
    }
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(MOCK_TOKEN_KEY);
    localStorage.removeItem(REAL_TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}