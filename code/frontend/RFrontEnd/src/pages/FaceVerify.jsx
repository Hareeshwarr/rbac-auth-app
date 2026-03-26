import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import FaceVerification from "../components/FaceVerification";
import "../styles/login.css";

export default function FaceVerify() {
  const { user, faceVerified, verifyFace } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // If already verified, redirect to dashboard
    if (faceVerified) {
      redirectToDashboard();
    }
  }, [user, faceVerified]);

  const redirectToDashboard = () => {
    if (user?.roles?.includes("ROLE_ADMIN")) navigate("/admin", { replace: true });
    else if (user?.roles?.includes("ROLE_MODERATOR")) navigate("/mod", { replace: true });
    else navigate("/user", { replace: true });
  };

  const handleVerified = () => {
    verifyFace();
    redirectToDashboard();
  };

  const securityLevel = user?.roles?.includes("ROLE_ADMIN") ? "HIGH" : "MEDIUM";

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ paddingTop: "40px" }}>
        <h2 className="login-title">SECURITY CHECK</h2>

        {/* Security level badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: securityLevel === "HIGH"
            ? "rgba(239, 68, 68, 0.15)" : "rgba(251, 191, 36, 0.15)",
          border: `1px solid ${securityLevel === "HIGH"
            ? "rgba(239, 68, 68, 0.4)" : "rgba(251, 191, 36, 0.4)"}`,
          padding: "4px 12px", borderRadius: "20px", marginBottom: "16px",
          fontSize: "11px", fontWeight: "bold", letterSpacing: "1px",
          color: securityLevel === "HIGH" ? "#f87171" : "#fbbf24"
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          Security Level: {securityLevel}
        </div>

        <p style={{
          color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "20px"
        }}>
          {securityLevel === "HIGH"
            ? "Admin access requires face verification for security."
            : "Moderator access requires face verification."}
        </p>

        <FaceVerification onVerified={handleVerified} />

        <div className="login-links" style={{ justifyContent: "center", marginTop: "20px" }}>
          <span onClick={() => {
            navigate("/login");
          }}>BACK TO LOGIN</span>
        </div>
      </div>
    </div>
  );
}
