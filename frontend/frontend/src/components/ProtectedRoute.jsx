import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
