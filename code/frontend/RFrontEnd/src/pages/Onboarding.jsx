import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { completeProfile } from "../api/authService";
import { AuthContext } from "../auth/AuthContext";
import "../styles/login.css";

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useContext(AuthContext);

  // Data passed from login page
  const { token, authProvider, email: existingEmail, phoneNumber } = location.state || {};

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(existingEmail || "");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If no token, redirect to login
  if (!token) {
    return (
      <div className="login-wrapper">
        <div className="login-card" style={{ paddingTop: "40px" }}>
          <h2 className="login-title">SESSION EXPIRED</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "20px" }}>
            Please sign in again.
          </p>
          <button className="login-btn" onClick={() => navigate("/login")}>
            GO TO LOGIN
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (username.trim().length < 3 || username.length > 20) {
      setError("Username must be between 3 and 20 characters.");
      return;
    }

    if (authProvider === "phone" && (!email || !email.includes("@"))) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await completeProfile(token, username, role, email || undefined);
      loginUser(res.data);

      const roles = res.data.roles;
      if (roles.includes("ROLE_ADMIN")) navigate("/admin");
      else if (roles.includes("ROLE_MODERATOR")) navigate("/mod");
      else navigate("/user");
    } catch (err) {
      const res = err.response;
      if (res?.data?.message) {
        setError(res.data.message);
      } else {
        setError("Failed to complete profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ paddingTop: "40px" }}>
        <h2 className="login-title">COMPLETE PROFILE</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "20px" }}>
          {authProvider === "google"
            ? "Welcome! Set your username and role to get started."
            : "Welcome! Fill in your details to get started."}
        </p>

        {error && <p className="login-error">{error}</p>}

        {/* Show auth provider badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(108, 99, 255, 0.15)",
          border: "1px solid rgba(108, 99, 255, 0.3)",
          padding: "6px 14px", borderRadius: "20px", marginBottom: "20px",
          fontSize: "12px", color: "rgba(255,255,255,0.7)"
        }}>
          {authProvider === "google" ? (
            <>
              <svg width="14" height="14" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Signed in with Google
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              Signed in with Phone
            </>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
            />
            <label>USERNAME</label>
          </div>

          {/* Show email field for Google (pre-filled, read-only) */}
          {authProvider === "google" && existingEmail && (
            <div className="input-box">
              <input
                type="email"
                value={existingEmail}
                readOnly
                style={{ opacity: 0.6 }}
              />
              <label style={{ top: "-6px", fontSize: "10px", color: "#7aa2ff" }}>EMAIL</label>
            </div>
          )}

          {/* Show email field for Phone users (required) */}
          {authProvider === "phone" && (
            <div className="input-box">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label>EMAIL</label>
            </div>
          )}

          {/* Show phone for phone users (read-only) */}
          {authProvider === "phone" && phoneNumber && (
            <div className="input-box">
              <input
                type="tel"
                value={phoneNumber}
                readOnly
                style={{ opacity: 0.6 }}
              />
              <label style={{ top: "-6px", fontSize: "10px", color: "#7aa2ff" }}>PHONE</label>
            </div>
          )}

          <div className="select-box" style={{
            marginBottom: "20px", textAlign: "left"
          }}>
            <label style={{
              color: "rgba(255,255,255,0.55)", fontSize: "12px", display: "block", marginBottom: "6px"
            }}>ROLE</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: "100%", padding: "10px", background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px",
                color: "#fff", fontSize: "14px", outline: "none"
              }}
            >
              <option value="user" style={{ background: "#1c1f3b" }}>USER</option>
              <option value="mod" style={{ background: "#1c1f3b" }}>MODERATOR</option>
              {/* Admin not available via social login - must register with email/password */}
            </select>
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "SAVING..." : "COMPLETE SETUP"}
          </button>
        </form>

        <div className="login-links" style={{ justifyContent: "center" }}>
          <span onClick={() => navigate("/login")}>BACK TO LOGIN</span>
        </div>
      </div>
    </div>
  );
}
