import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../api/dashboardService";
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
import "../styles/UserDashboard.css";

const STATUS_OVERVIEW_DATA = [
  { name: "Active", count: 28, fill: "#22c55e" },
  { name: "Pending", count: 12, fill: "#f59e0b" },
  { name: "Inactive", count: 5, fill: "#ef4444" },
  { name: "Suspended", count: 2, fill: "#6b7280" },
];

const ACCESS_SECURITY_DATA = [
  { name: "Secured Access", value: 78, color: "#3b82f6" },
  { name: "Open Access", value: 22, color: "#94a3b8" },
];

export default function UserDashboard() {
  const { user, logout } = useContext(AuthContext);
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayRole = user?.roles?.[0]?.replace("ROLE_", "").toLowerCase() ?? "user";
  const status = message ? "active" : error ? "inactive" : "active";
  const accessType = message ? "secured" : "restricted";

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
        <h1 className="dashboard-title">User Dashboard</h1>
        <button type="button" className="dashboard-logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="dashboard-cards">
        <div className="info-card">
          <span className="info-label">Role</span>
          <span className="info-value">{displayRole}</span>
        </div>
        <div className="info-card">
          <span className="info-label">Status</span>
          <span className={`info-value status-${status}`}>{status}</span>
        </div>
        <div className="info-card">
          <span className="info-label">Access Type</span>
          <span className="info-value">{accessType}</span>
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          <p>{error}</p>
        </div>
      )}

      <div className="dashboard-charts">
        <div className="chart-card status-overview-card">
          <h2 className="chart-title">Status Overview</h2>
          <p className="chart-subtitle">Total User Status</p>
          <div className="chart-container bar-chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={STATUS_OVERVIEW_DATA}
                margin={{ top: 16, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#475569", fontSize: 12 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  tick={{ fill: "#475569", fontSize: 12 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  domain={[0, 35]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "none",
                    borderRadius: 8,
                    color: "#f1f5f9",
                  }}
                  formatter={(value) => [value, "Count"]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {STATUS_OVERVIEW_DATA.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <a href="#view-all" className="view-all-link">VIEW ALL DATA</a>
        </div>

        <div className="chart-card access-security-card">
          <h2 className="chart-title">Access Security</h2>
          <div className="access-legend">
            <span className="legend-item">
              <span className="legend-dot secured" /> Secured Access
            </span>
            <span className="legend-item">
              <span className="legend-dot open" /> Open Access
            </span>
          </div>
          <div className="chart-container donut-chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={ACCESS_SECURITY_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {ACCESS_SECURITY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, ""]}
                  contentStyle={{
                    background: "#1e293b",
                    border: "none",
                    borderRadius: 8,
                    color: "#f1f5f9",
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
