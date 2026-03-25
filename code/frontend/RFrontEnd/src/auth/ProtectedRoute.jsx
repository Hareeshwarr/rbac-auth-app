import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useContext(AuthContext);

  // ✅ 1. App load avvadaniki wait cheyyali
  if (loading) {
    return <div>Loading...</div>;   // spinner pettachu
  }

  const token = localStorage.getItem("token");

  // ✅ 2. Token lekapothe → LOGIN
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ✅ 3. Role mismatch ayithe maatrame → UNAUTHORIZED
  if (role && !user?.roles?.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ 4. Everything OK
  return children;
}
