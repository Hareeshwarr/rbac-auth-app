import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/authService";
import "../styles/Login.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setSuccess(res.data.message);
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
        <h2 className="login-title">FORGOT PASSWORD</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "20px" }}>
          Enter your email and we'll send you a reset link.
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>EMAIL</label>
          </div>

          <button
            className="login-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "SENDING..." : "SEND RESET LINK"}
          </button>
        </form>

        <div className="login-links">
          <span onClick={() => navigate("/login")}>BACK TO LOGIN</span>
        </div>
      </div>
    </div>
  );
}
