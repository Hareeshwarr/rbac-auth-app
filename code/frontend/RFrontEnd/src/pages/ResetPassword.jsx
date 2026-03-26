import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authService";
import "../styles/Login.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6 || newPassword.length > 40) {
      setError("Password must be between 6 and 40 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword(token, newPassword);
      setSuccess(res.data.message + " Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const res = err.response;
      if (res?.data?.message) {
        setError(res.data.message);
      } else if (res?.status === 0 || err.code === "ERR_NETWORK" || !res) {
        setError("Cannot connect to server. Please try again later.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ paddingTop: "40px" }}>
        <h2 className="login-title">RESET PASSWORD</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "20px" }}>
          Enter your new password below.
        </p>

        {error && <p className="login-error">{error}</p>}
        {success && (
          <p style={{
            background: "rgba(0, 255, 0, 0.1)",
            color: "#6bff6b",
            padding: "8px",
            borderRadius: "6px",
            fontSize: "13px",
            marginBottom: "14px"
          }}>{success}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <label>NEW PASSWORD</label>
          </div>

          <div className="input-box">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label>CONFIRM PASSWORD</label>
          </div>

          <button
            className="login-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "RESETTING..." : "RESET PASSWORD"}
          </button>
        </form>

        <div className="login-links">
          <span onClick={() => navigate("/login")}>BACK TO LOGIN</span>
        </div>
      </div>
    </div>
  );
}
