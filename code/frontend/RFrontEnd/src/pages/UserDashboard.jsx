import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../api/dashboardService";
import { AuthContext } from "../auth/AuthContext";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import "../styles/UserDashboard.css";

export default function UserDashboard() {
  const { user, logout, faceVerified } = useContext(AuthContext);
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserData()
      .then((res) => setMessage(res.data?.message ?? res.data ?? "Welcome"))
      .catch(() => setError("Access denied"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const displayRole = user?.roles?.[0]?.replace("ROLE_", "").toLowerCase() ?? "user";
  const displayRoleLabel = displayRole === "user" ? "User" : displayRole.charAt(0).toUpperCase() + displayRole.slice(1);

  const securityData = [
    { name: "Secured", value: 78, color: "#3b82f6" },
    { name: "Open", value: 22, color: "#e2e8f0" },
  ];

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">User Dashboard</h1>
          <span className="security-badge low">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            Security Level: LOW
          </span>
        </div>
        <div className="header-actions">
          <span className="welcome-text">Welcome, {user?.username}</span>
          <button type="button" className="dashboard-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error && (
        <div className="dashboard-error"><p>{error}</p></div>
      )}

      {/* Profile + Info Cards */}
      <div className="dashboard-cards four-cols">
        <div className="info-card profile-card">
          <div className="profile-avatar">
            {(user?.username || "U").charAt(0).toUpperCase()}
          </div>
          <span className="info-value">{user?.username}</span>
          <span className="info-label">{displayRoleLabel}</span>
        </div>
        <div className="info-card stat-card">
          <span className="info-label">Role</span>
          <span className="info-value">{displayRoleLabel}</span>
          <span className="stat-detail">Standard access</span>
        </div>
        <div className="info-card stat-card">
          <span className="info-label">Account Status</span>
          <span className="info-value status-active">Active</span>
          <span className="stat-detail">Verified</span>
        </div>
        <div className="info-card stat-card">
          <span className="info-label">Auth Method</span>
          <span className="info-value">
            {storedUser.authProvider === "google" ? "Google" :
             storedUser.authProvider === "phone" ? "Phone" : "Email/Password"}
          </span>
        </div>
      </div>

      <div className="dashboard-charts">
        {/* Account Security */}
        <div className="chart-card">
          <h2 className="chart-title">Account Security</h2>
          <div className="security-checklist">
            <div className="security-item done">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Account Authenticated</span>
            </div>
            <div className="security-item done">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>JWT Token Active</span>
            </div>
            <div className={`security-item ${faceVerified ? "done" : "pending"}`}>
              {faceVerified ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
              <span>Face Verification {faceVerified ? "Complete" : "Not Required"}</span>
            </div>
            <div className="security-item done">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Session Encrypted</span>
            </div>
          </div>
        </div>

        {/* Access Level */}
        <div className="chart-card">
          <h2 className="chart-title">Access Overview</h2>
          <div className="access-legend">
            <span className="legend-item"><span className="legend-dot secured" /> Secured Areas</span>
            <span className="legend-item"><span className="legend-dot open" /> Restricted Areas</span>
          </div>
          <div className="chart-container donut-chart-container">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={securityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  paddingAngle={2} dataKey="value" nameKey="name" labelLine={false}>
                  {securityData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, ""]}
                  contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#f1f5f9" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="access-summary">
            <p>You have access to <strong>user-level</strong> resources. Moderator and Admin sections require elevated privileges.</p>
          </div>
        </div>
      </div>

      {/* Quick Info Section */}
      <div className="chart-card" style={{ marginTop: "1.5rem" }}>
        <h2 className="chart-title">RBAC System Info</h2>
        <div className="rbac-info-grid">
          <div className="rbac-info-item">
            <div className="rbac-role-icon student">S</div>
            <div>
              <strong>User (LOW)</strong>
              <p>Direct dashboard access. No face verification required.</p>
            </div>
          </div>
          <div className="rbac-info-item">
            <div className="rbac-role-icon moderator">M</div>
            <div>
              <strong>Moderator (MEDIUM)</strong>
              <p>Face verification required. Can view all users (read-only).</p>
            </div>
          </div>
          <div className="rbac-info-item">
            <div className="rbac-role-icon admin-icon">A</div>
            <div>
              <strong>Admin (HIGH)</strong>
              <p>Email/password + face verification. Full user management powers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
