import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, verifyOtp, resetPassword, phoneResetPassword } from "../api/authService";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "../firebase/firebaseConfig";
import "../styles/Login.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Mode: "email" or "phone"
  const [mode, setMode] = useState("email");

  // Email flow state
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fallbackOtp, setFallbackOtp] = useState("");

  // Phone flow state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneStep, setPhoneStep] = useState(1); // 1=phone, 2=otp, 3=new password
  const [phoneNewPassword, setPhoneNewPassword] = useState("");
  const [phoneConfirmPassword, setPhoneConfirmPassword] = useState("");
  const [firebaseIdToken, setFirebaseIdToken] = useState("");

  // ===== EMAIL FLOW =====
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      const data = res.data;

      if (data.otp) {
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

  // ===== PHONE FLOW =====
  const handleSendPhoneOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+91" + formattedPhone;
      }
      setPhoneNumber(formattedPhone);

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container-forgot", {
          size: "invisible",
          callback: () => {},
        });
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setPhoneStep(2);
      setSuccess("OTP sent to " + formattedPhone);
    } catch (err) {
      console.error("Phone OTP error:", err);
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number. Include country code (e.g., +91...)");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Failed to send OTP: " + (err.message || "Unknown error"));
      }
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(phoneOtp);
      const idToken = await result.user.getIdToken();
      setFirebaseIdToken(idToken);
      setPhoneStep(3);
      setSuccess("Phone verified! Set your new password.");
    } catch (err) {
      if (err.code === "auth/invalid-verification-code") {
        setError("Invalid OTP. Please try again.");
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (phoneNewPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (phoneNewPassword !== phoneConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await phoneResetPassword(phoneNumber, phoneNewPassword, firebaseIdToken);
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

  // ===== RENDER =====
  const emailStepTitles = { 1: "FORGOT PASSWORD", 2: "ENTER OTP", 3: "NEW PASSWORD" };
  const emailStepDescriptions = {
    1: "Enter your registered email address.",
    2: "Enter the 6-digit OTP code.",
    3: "Create your new password."
  };

  const phoneStepTitles = { 1: "PHONE RESET", 2: "VERIFY PHONE", 3: "NEW PASSWORD" };
  const phoneStepDescriptions = {
    1: "Enter your registered phone number.",
    2: "Enter the OTP sent to your phone.",
    3: "Create your new password."
  };

  const currentStep = mode === "email" ? step : phoneStep;
  const titles = mode === "email" ? emailStepTitles : phoneStepTitles;
  const descriptions = mode === "email" ? emailStepDescriptions : phoneStepDescriptions;

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ paddingTop: "40px" }}>
        <h2 className="login-title">{titles[currentStep]}</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "20px" }}>
          {descriptions[currentStep]}
        </p>

        {/* Step indicator */}
        <div style={{
          display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px"
        }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              width: "30px", height: "4px", borderRadius: "2px",
              background: s <= currentStep ? "#6c63ff" : "rgba(255,255,255,0.2)"
            }} />
          ))}
        </div>

        {/* Mode toggle */}
        {currentStep === 1 && (
          <div style={{
            display: "flex", justifyContent: "center", gap: "0", marginBottom: "20px",
            border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", overflow: "hidden"
          }}>
            <button
              onClick={() => { setMode("email"); setError(""); setSuccess(""); }}
              style={{
                flex: 1, padding: "8px 16px", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: "bold", letterSpacing: "1px",
                background: mode === "email" ? "#6c63ff" : "transparent",
                color: mode === "email" ? "#fff" : "rgba(255,255,255,0.5)"
              }}
            >
              EMAIL
            </button>
            <button
              onClick={() => { setMode("phone"); setError(""); setSuccess(""); }}
              style={{
                flex: 1, padding: "8px 16px", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: "bold", letterSpacing: "1px",
                background: mode === "phone" ? "#6c63ff" : "transparent",
                color: mode === "phone" ? "#fff" : "rgba(255,255,255,0.5)"
              }}
            >
              PHONE
            </button>
          </div>
        )}

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

        {/* ===== EMAIL MODE ===== */}
        {mode === "email" && (
          <>
            {/* Fallback OTP display */}
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
          </>
        )}

        {/* ===== PHONE MODE ===== */}
        {mode === "phone" && (
          <>
            {phoneStep === 1 && (
              <form onSubmit={handleSendPhoneOtp}>
                <div className="input-box">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="+91XXXXXXXXXX"
                  />
                  <label>PHONE NUMBER</label>
                </div>
                <button className="login-btn" type="submit" disabled={loading}>
                  {loading ? "SENDING..." : "SEND OTP"}
                </button>
              </form>
            )}

            {phoneStep === 2 && (
              <form onSubmit={handleVerifyPhoneOtp}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "10px" }}>
                  OTP sent to {phoneNumber}
                </p>
                <div className="input-box">
                  <input
                    type="text"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    placeholder="000000"
                    required
                    style={{ letterSpacing: "8px", textAlign: "center", fontSize: "20px" }}
                  />
                  <label>OTP CODE</label>
                </div>
                <button className="login-btn" type="submit" disabled={loading || phoneOtp.length !== 6}>
                  {loading ? "VERIFYING..." : "VERIFY OTP"}
                </button>
              </form>
            )}

            {phoneStep === 3 && (
              <form onSubmit={handlePhoneResetPassword}>
                <div className="input-box">
                  <input
                    type="password"
                    value={phoneNewPassword}
                    onChange={(e) => setPhoneNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <label>NEW PASSWORD</label>
                </div>
                <div className="input-box">
                  <input
                    type="password"
                    value={phoneConfirmPassword}
                    onChange={(e) => setPhoneConfirmPassword(e.target.value)}
                    required
                  />
                  <label>CONFIRM PASSWORD</label>
                </div>
                <button className="login-btn" type="submit" disabled={loading}>
                  {loading ? "RESETTING..." : "RESET PASSWORD"}
                </button>
              </form>
            )}
          </>
        )}

        <div className="login-links">
          <span onClick={() => navigate("/login")}>BACK TO LOGIN</span>
        </div>

        {/* Invisible reCAPTCHA container */}
        <div id="recaptcha-container-forgot"></div>
      </div>
    </div>
  );
}
