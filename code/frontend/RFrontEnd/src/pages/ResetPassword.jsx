import { Navigate } from "react-router-dom";

// Redirect to the unified forgot-password flow
export default function ResetPassword() {
  return <Navigate to="/forgot-password" replace />;
}
