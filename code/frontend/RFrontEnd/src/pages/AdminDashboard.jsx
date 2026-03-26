import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminData } from "../api/dashboardService";
import { AuthContext } from "../auth/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "../styles/AdminDashboard.css";

const SYSTEM_HEALTH_DATA = [
  { name: "CPU Load", value: 45, fill: "#8b5cf6" },
  { name: "Memory", value: 68, fill: "#c084fc" },
  { name: "Storage", value: 34, fill: "#a78bfa" },
  { name: "Network", value: 55, fill: "#7c3aed" },
];

const USER_ROLES_DATA = [
  { name: "Users", value: 342, color: "#e9d5ff" },
  { name: "Moderators", value: 15, color: "#c084fc" },
  { name: "Admins", value: 3, color: "#8b5cf6" },
];

export default function AdminDashboard() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminData()
      .then((res) => setMessage(res.data?.message ?? res.data ?? "Admin Access Granted"))
      .catch((err) => {
        console.error("Admin Access Error:", err);
        setError("Access denied. Admin privileges required.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const status = message ? "online" : error ? "offline" : "online";
  
  if (loading) {
    return (
      <div className="dashboard-loading admin-dashboard-loading">
        <div className="dashboard-spinner" />
        <p>Loading administrative console...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          Admin Dashboard <span className="dashboard-subtitle">Control Center</span>
        </h1>
        <button type="button" className="dashboard-logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="dashboard-cards">
        <div className="info-card">
          <span className="info-label">Current Role</span>
          <span className="info-value">Administrator</span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            padding: "3px 10px", borderRadius: "12px", marginTop: "8px",
            fontSize: "10px", fontWeight: "bold", letterSpacing: "1px",
            color: "#f87171"
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            Security Level: HIGH
          </span>
        </div>
        <div className="info-card">
          <span className="info-label">System Status</span>
          <span className={`info-value status-${status}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div className="info-card">
          <span className="info-label">Total Users</span>
          <span className="info-value">360</span>
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          <p>{error}</p>
        </div>
      )}
      
      {message && !error && (
         <div className="dashboard-success">
           <p>{message}</p>
         </div>
      )}

      <div className="dashboard-charts">
        <div className="chart-card system-health-card">
          <h2 className="chart-title">System Health</h2>
          <p className="chart-subtitle">Server resource utilization (%)</p>
          <div className="chart-container bar-chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={SYSTEM_HEALTH_DATA}
                margin={{ top: 16, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#ddd6fe" }}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#ddd6fe" }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#2e1065",
                    border: "none",
                    borderRadius: 8,
                    color: "#f5f3ff",
                  }}
                  formatter={(value) => [`${value}%`, "Usage"]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {SYSTEM_HEALTH_DATA.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <a href="#servers" className="view-all-link">MANAGE SERVERS</a>
        </div>

        <div className="chart-card role-distribution-card">
          <h2 className="chart-title">Role Distribution</h2>
          <div className="access-legend">
            <span className="legend-item">
              <span className="legend-dot user" /> Users (342)
            </span>
            <span className="legend-item">
              <span className="legend-dot mod" /> Mods (15)
            </span>
            <span className="legend-item">
              <span className="legend-dot admin" /> Admins (3)
            </span>
          </div>
          <div className="chart-container donut-chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={USER_ROLES_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  labelLine={false}
                >
                  {USER_ROLES_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [value, "Users"]}
                  contentStyle={{
                    background: "#2e1065",
                    border: "none",
                    borderRadius: 8,
                    color: "#f5f3ff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
