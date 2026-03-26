import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, verifyOtp, resetPassword } from "../api/authService";
import "../styles/Login.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fallbackOtp, setFallbackOtp] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      const data = res.data;

      if (data.otp) {
        // Email failed, OTP returned directly (demo mode)
        setFallbackOtp(data.otp);
        setSuccess("OTP generated! (Email service unavailable - see OTP below)");
      } else {
        setSuccess("OTP sent to your email. Check your inbox and spam folder.");
      }
      setStep(2);
    } catch (err) {
      const res = err.response;
      if (res?.data?.message) {
        setError(res.data.message);
      } else if (!res || err.code === "ERR_NETWORK") {
        setError("Cannot connect to server. Please try again later.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await verifyOtp(email, otp);
      setSuccess("OTP verified! Set your new password.");
      setStep(3);
    } catch (err) {
      const res = err.response;
      if (res?.data?.message) {
        setError(res.data.message);
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email, otp, newPassword);
      setSuccess(res.data.message || "Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const res = err.response;
      if (res?.data?.message) {
        setError(res.data.message);
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    1: "FORGOT PASSWORD",
    2: "ENTER OTP",
    3: "NEW PASSWORD"
  };

  const stepDescriptions = {
    1: "Enter your registered email address.",
    2: "Enter the 6-digit OTP code.",
    3: "Create your new password."
  };

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ paddingTop: "40px" }}>
        <h2 className="login-title">{stepTitles[step]}</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "20px" }}>
          {stepDescriptions[step]}
        </p>

        {/* Step indicator */}
        <div style={{
          display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px"
        }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              width: "30px", height: "4px", borderRadius: "2px",
              background: s <= step ? "#6c63ff" : "rgba(255,255,255,0.2)"
            }} />
          ))}
        </div>

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

        {/* Fallback OTP display when email fails */}
        {fallbackOtp && step === 2 && (
          <div style={{
            background: "rgba(108, 99, 255, 0.15)",
            border: "1px solid rgba(108, 99, 255, 0.4)",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "14px",
            textAlign: "center"
          }}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", margin: "0 0 4px 0" }}>
              YOUR OTP CODE
            </p>
            <p style={{
              color: "#6c63ff", fontSize: "28px", fontWeight: "bold",
              letterSpacing: "8px", margin: 0
            }}>
              {fallbackOtp}
            </p>
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="input-box">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label>EMAIL</label>
            </div>
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "SENDING..." : "SEND OTP"}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="input-box">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                placeholder="000000"
                required
                style={{ letterSpacing: "8px", textAlign: "center", fontSize: "20px" }}
              />
              <label>OTP CODE</label>
            </div>
            <button className="login-btn" type="submit" disabled={loading || otp.length !== 6}>
              {loading ? "VERIFYING..." : "VERIFY OTP"}
            </button>
            <p
              style={{
                color: "rgba(255,255,255,0.4)", fontSize: "12px",
                marginTop: "10px", cursor: "pointer", textAlign: "center"
              }}
              onClick={() => { setStep(1); setError(""); setSuccess(""); setFallbackOtp(""); }}
            >
              Resend OTP
            </p>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="input-box">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
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
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "RESETTING..." : "RESET PASSWORD"}
            </button>
          </form>
        )}

        <div className="login-links">
          <span onClick={() => navigate("/login")}>BACK TO LOGIN</span>
        </div>
      </div>
    </div>
  );
}
