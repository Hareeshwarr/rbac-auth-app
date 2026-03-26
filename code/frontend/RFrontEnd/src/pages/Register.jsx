import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import registerAnimation from "../assets/3D Hologram.json";
import { register } from "../api/authService";
import FaceVerification from "../components/FaceVerification";
import "../styles/Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    phoneNumber: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [faceVerified, setFaceVerified] = useState(false);

  const isAdmin = form.role === "admin";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Strong password check for Admin
  const isStrongPassword = (pw) => {
    return pw.length >= 8 &&
      /[A-Z]/.test(pw) &&
      /[a-z]/.test(pw) &&
      /[0-9]/.test(pw) &&
      /[^A-Za-z0-9]/.test(pw);
  };

  const getPasswordStrength = () => {
    const pw = form.password;
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return { label: "Weak", color: "#ef4444" };
    if (score <= 3) return { label: "Medium", color: "#f59e0b" };
    if (score <= 4) return { label: "Strong", color: "#22c55e" };
    return { label: "Very Strong", color: "#10b981" };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.username.trim().length < 3 || form.username.length > 20) {
      setError("Username must be between 3 and 20 characters.");
      return;
    }

    // Admin requires strong password
    if (isAdmin) {
      if (!isStrongPassword(form.password)) {
        setError("Admin accounts require a strong password: 8+ characters with uppercase, lowercase, number, and special character.");
        return;
      }
      if (!faceVerified) {
        setError("Admin accounts require face verification. Please complete the face scan below.");
        return;
      }
    } else {
      if (form.password.length < 6 || form.password.length > 40) {
        setError("Password must be between 6 and 40 characters.");
        return;
      }
    }

    try {
      await register(
        form.username,
        form.email,
        form.password,
        [form.role],
        form.phoneNumber ? "+91" + form.phoneNumber : undefined
      );
      setSuccess("Registration successful! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const res = err.response;
      if (res?.data?.message) {
        setError(res.data.message);
      } else if (res?.status === 0 || err.code === "ERR_NETWORK" || !res) {
        setError("Cannot connect to server. Please try again later.");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h2 className="register-title">CREATE ACCOUNT</h2>

        {error && <p className="register-error">{error}</p>}
        {success && <p className="register-success">{success}</p>}

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
            <label>USERNAME</label>
          </div>

          <div className="input-box">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <label>EMAIL</label>
          </div>

          <div className="input-box">
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <label>PASSWORD {isAdmin && "(STRONG REQUIRED)"}</label>
          </div>

          {/* Password strength indicator for Admin */}
          {isAdmin && form.password && passwordStrength && (
            <div style={{ marginTop: "-18px", marginBottom: "16px" }}>
              <div style={{
                display: "flex", gap: "4px", marginBottom: "4px"
              }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{
                    flex: 1, height: "3px", borderRadius: "2px",
                    background: i <= (passwordStrength.label === "Weak" ? 1 :
                      passwordStrength.label === "Medium" ? 2 :
                      passwordStrength.label === "Strong" ? 4 : 5)
                      ? passwordStrength.color : "rgba(255,255,255,0.1)"
                  }} />
                ))}
              </div>
              <p style={{
                fontSize: "10px", color: passwordStrength.color, margin: 0, textAlign: "right"
              }}>
                {passwordStrength.label}
              </p>
            </div>
          )}

          {/* Admin password requirements */}
          {isAdmin && (
            <div style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px", padding: "10px", marginBottom: "16px",
              fontSize: "11px", color: "rgba(255,255,255,0.6)"
            }}>
              <p style={{ margin: "0 0 6px 0", color: "#f87171", fontWeight: "bold", fontSize: "11px" }}>
                Admin Security Requirements:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {[
                  { check: form.password.length >= 8, text: "8+ characters" },
                  { check: /[A-Z]/.test(form.password), text: "Uppercase letter" },
                  { check: /[a-z]/.test(form.password), text: "Lowercase letter" },
                  { check: /[0-9]/.test(form.password), text: "Number" },
                  { check: /[^A-Za-z0-9]/.test(form.password), text: "Special character (!@#$...)" },
                ].map(({ check, text }) => (
                  <span key={text} style={{ color: check ? "#22c55e" : "rgba(255,255,255,0.4)" }}>
                    {check ? "\u2713" : "\u2717"} {text}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="input-box">
            <input
              type="tel"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              maxLength={10}
              style={{ paddingLeft: "45px" }}
            />
            <label style={{ top: "-6px", fontSize: "10px", color: "#7aa2ff" }}>PHONE (OPTIONAL)</label>
            <span style={{
              position: "absolute", left: "0", bottom: "12px",
              color: "rgba(255,255,255,0.6)", fontSize: "15px", pointerEvents: "none"
            }}>+91</span>
          </div>

          <div className="select-box">
            <label>ROLE</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="user">STUDENT</option>
              <option value="admin">ADMIN</option>
              <option value="mod">MODERATOR</option>
            </select>
          </div>

          {/* Face verification required for Admin registration */}
          {isAdmin && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{
                color: "#f87171", fontSize: "12px", fontWeight: "bold",
                marginBottom: "8px", letterSpacing: "1px"
              }}>
                FACE SCAN REQUIRED FOR ADMIN
              </p>
              {!faceVerified ? (
                <FaceVerification onVerified={() => setFaceVerified(true)} />
              ) : (
                <p style={{
                  color: "#22c55e", fontSize: "13px",
                  background: "rgba(34, 197, 94, 0.1)",
                  padding: "8px", borderRadius: "6px"
                }}>
                  Face verified successfully
                </p>
              )}
            </div>
          )}

          <button className="register-btn" type="submit">
            CREATE ACCOUNT
          </button>
        </form>

        <div className="register-links">
          <span onClick={() => navigate("/login")}>BACK TO LOGIN</span>
        </div>
      </div>

      <div className="register-lottie">
        <Lottie animationData={registerAnimation} loop />
      </div>
    </div>
  );
}
