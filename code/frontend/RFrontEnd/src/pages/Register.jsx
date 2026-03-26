import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import registerAnimation from "../assets/3D Hologram.json";
import { register } from "../api/authService";
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.username.trim().length < 3 || form.username.length > 20) {
      setError("Username must be between 3 and 20 characters.");
      return;
    }
    if (form.password.length < 6 || form.password.length > 40) {
      setError("Password must be between 6 and 40 characters.");
      return;
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
      } else if (res?.data && typeof res.data === "object") {
        const msg = res.data.message || res.data.error || JSON.stringify(res.data);
        setError(typeof msg === "string" ? msg : "Registration failed. Please try again.");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="register-wrapper">

      {/* REGISTER CARD */}
      <div className="register-card">
        <h2 className="register-title">REGISTER</h2>

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
            <label>PASSWORD</label>
          </div>

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
              <option value="user">USER</option>
              <option value="admin">ADMIN</option>
              <option value="mod">MODERATOR</option>
            </select>
          </div>

          <button className="register-btn" type="submit">
            CREATE ACCOUNT
          </button>
        </form>

        <div className="register-links">
          <span onClick={() => navigate("/login")}>BACK TO LOGIN</span>
        </div>
      </div>

      {/* LOTTIE BELOW CARD */}
      <div className="register-lottie">
        <Lottie animationData={registerAnimation} loop />
      </div>
    </div>
  );
}
