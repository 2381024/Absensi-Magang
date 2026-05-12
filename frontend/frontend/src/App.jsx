import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import LoginPage from "./pages/LoginPage";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminLogs from "./pages/AdminLogs";
import AdminGeofence from "./pages/AdminGeofence";
import LogDetail from "./pages/LogDetail";
import InternProfile from "./pages/InternProfile";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Intern Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shifts/:id"
          element={
            <ProtectedRoute>
              <LogDetail />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route path="users" element={<AdminUsers />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="logs/:id" element={<LogDetail />} />
          <Route path="geofence" element={<AdminGeofence />} />
        </Route>

        {/* Shared: view any intern's profile */}
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <InternProfile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}