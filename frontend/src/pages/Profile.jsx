import { useAuth } from "../context/AuthContext";
import InternProfile from "./InternProfile";
import AdminProfile from "./AdminProfile";

export default function Profile() {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <AdminProfile />;
  }

  return <InternProfile />;
}
