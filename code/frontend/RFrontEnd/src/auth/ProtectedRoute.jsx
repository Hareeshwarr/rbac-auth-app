import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading, faceVerified } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role && !user?.roles?.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Admin and Moderator require face verification before accessing dashboard
  if (role === "ROLE_ADMIN" && !faceVerified) {
    return <Navigate to="/face-verify" replace />;
  }

  if (role === "ROLE_MODERATOR" && !faceVerified) {
    return <Navigate to="/face-verify" replace />;
  }

  return children;
}
