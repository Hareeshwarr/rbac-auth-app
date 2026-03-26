import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import loginAnimation from "../assets/Face scanning.json";
import { login, firebaseLogin } from "../api/authService";
import { AuthContext } from "../auth/AuthContext";
import FaceVerification from "../components/FaceVerification";
import { auth, googleProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "../firebase/firebaseConfig";
import "../styles/Login.css";

export default function Login() {
  const { loginUser, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  // Phone login state
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneSent, setPhoneSent] = useState(false);
  const recaptchaRef = useRef(null);

  useEffect(() => {
    if (user?.roles?.includes("ROLE_ADMIN")) navigate("/admin", { replace: true });
    else if (user?.roles?.includes("ROLE_MODERATOR")) navigate("/mod", { replace: true });
    else if (user) navigate("/user", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!verified) {
      setError("Please verify your face first");
      return;
    }

    try {
      const res = await login(username, password);
      loginUser(res.data);

      if (res.data.roles.includes("ROLE_ADMIN")) navigate("/admin");
      else if (res.data.roles.includes("ROLE_MODERATOR")) navigate("/mod");
      else navigate("/user");

    } catch (err) {
      const res = err.response;
      if (res?.data?.message) {
        setError(res.data.message);
      } else if (res?.status === 0 || err.code === "ERR_NETWORK" || !res) {
        setError("Cannot connect to server. Please try again later.");
      } else {
        setError("Invalid username or password");
      }
    }
  };

  // Google Sign-In
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await firebaseLogin(
        idToken,
        "google",
        result.user.email,
        result.user.displayName,
        result.user.phoneNumber,
        result.user.uid
      );

      if (res.data.newUser) {
        // New user — go to onboarding
        navigate("/onboarding", {
          state: {
            token: res.data.accessToken,
            authProvider: "google",
            email: result.user.email,
            phoneNumber: result.user.phoneNumber,
          }
        });
      } else {
        loginUser(res.data);
        const roles = res.data.roles;
        if (roles.includes("ROLE_ADMIN")) navigate("/admin");
        else if (roles.includes("ROLE_MODERATOR")) navigate("/mod");
        else navigate("/user");
      }
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in cancelled.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Phone OTP - Send
  const handleSendPhoneOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Format phone number
      let formattedPhone = "+91" + phoneNumber.replace(/\D/g, "").slice(0, 10);

      // Setup reCAPTCHA
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
        });
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setPhoneSent(true);
    } catch (err) {
      console.error("Phone OTP error:", err);
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number. Include country code (e.g., +91...)");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Failed to send OTP: " + (err.message || "Unknown error"));
      }
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Phone OTP - Verify
  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(phoneOtp);
      const idToken = await result.user.getIdToken();

      const res = await firebaseLogin(
        idToken,
        "phone",
        result.user.email,
        result.user.displayName,
        result.user.phoneNumber,
        result.user.uid
      );

      if (res.data.newUser) {
        navigate("/onboarding", {
          state: {
            token: res.data.accessToken,
            authProvider: "phone",
            email: result.user.email,
            phoneNumber: result.user.phoneNumber,
          }
        });
      } else {
        loginUser(res.data);
        const roles = res.data.roles;
        if (roles.includes("ROLE_ADMIN")) navigate("/admin");
        else if (roles.includes("ROLE_MODERATOR")) navigate("/mod");
        else navigate("/user");
      }
    } catch (err) {
      if (err.code === "auth/invalid-verification-code") {
        setError("Invalid OTP. Please try again.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Phone verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">

        {/* LOTTIE */}
        <div className="login-lottie">
          <Lottie animationData={loginAnimation} loop />
        </div>

        <h2 className="login-title">LOGIN</h2>

        {error && <p className="login-error">{error}</p>}

        {/* Phone Login Mode */}
        {showPhoneLogin ? (
          <div>
            {!phoneSent ? (
              <form onSubmit={handleSendPhoneOtp}>
                <div className="input-box">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                    maxLength={10}
                    style={{ paddingLeft: "45px" }}
                  />
                  <label style={{ top: "-6px", fontSize: "10px", color: "#7aa2ff" }}>PHONE NUMBER</label>
                  <span style={{
                    position: "absolute", left: "0", bottom: "12px",
                    color: "rgba(255,255,255,0.6)", fontSize: "15px", pointerEvents: "none"
                  }}>+91</span>
                </div>
                <button className="login-btn" type="submit" disabled={loading}>
                  {loading ? "SENDING OTP..." : "SEND OTP"}
                </button>
              </form>
            ) : (
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
                  {loading ? "VERIFYING..." : "VERIFY & LOGIN"}
                </button>
              </form>
            )}

            <div className="login-links">
              <span onClick={() => { setShowPhoneLogin(false); setPhoneSent(false); setError(""); }}>
                BACK TO EMAIL LOGIN
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Face Verification */}
            {!verified && (
              <FaceVerification onVerified={() => setVerified(true)} />
            )}

            {verified && <p style={{ color: "lightgreen" }}>Face verified</p>}

            <form onSubmit={handleSubmit}>
              <div className="input-box">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={!verified}
                />
                <label>USERNAME</label>
              </div>

              <div className="input-box">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!verified}
                />
                <label>PASSWORD</label>
              </div>

              <button
                className="login-btn"
                type="submit"
                disabled={!verified}
              >
                SUBMIT
              </button>
            </form>

            {/* Divider */}
            <div style={{
              display: "flex", alignItems: "center", margin: "16px 0", gap: "10px"
            }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.15)" }} />
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>OR</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.15)" }} />
            </div>

            {/* Google Sign-In Button */}
            <button
              className="login-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "8px"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {loading ? "SIGNING IN..." : "SIGN IN WITH GOOGLE"}
            </button>

            {/* Phone Login Button */}
            <button
              className="login-btn"
              onClick={() => { setShowPhoneLogin(true); setError(""); }}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              SIGN IN WITH PHONE
            </button>

            <div className="login-links">
              <span onClick={() => navigate("/register")}>CREATE ACCOUNT</span>
              <span onClick={() => navigate("/forgot-password")}>FORGOT PASSWORD</span>
            </div>
          </>
        )}

        {/* Invisible reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
