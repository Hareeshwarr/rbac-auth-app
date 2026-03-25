import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getModeratorData } from "../api/dashboardService";
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
import "../styles/ModeratorDashboard.css";

const REPORTS_DATA = [
  { name: "Mon", count: 12, fill: "#fcd34d" },
  { name: "Tue", count: 19, fill: "#fbbf24" },
  { name: "Wed", count: 15, fill: "#f59e0b" },
  { name: "Thu", count: 8, fill: "#d97706" },
  { name: "Fri", count: 24, fill: "#b45309" },
  { name: "Sat", count: 30, fill: "#92400e" },
  { name: "Sun", count: 18, fill: "#78350f" },
];

const ACTIONS_DATA = [
  { name: "Approved", value: 65, color: "#f59e0b" },
  { name: "Rejected", value: 35, color: "#fcd34d" },
];

export default function ModeratorDashboard() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModeratorData()
      .then((res) => setMessage(res.data?.message ?? res.data ?? "Moderator Access Granted"))
      .catch((err) => {
        console.error("Mod Access Error:", err);
        setError("Access denied. Moderator privileges required.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const status = message ? "active" : error ? "offline" : "pending";
  
  if (loading) {
    return (
      <div className="dashboard-loading mod-dashboard-loading">
        <div className="dashboard-spinner" />
        <p>Loading moderation queues...</p>
      </div>
    );
  }

  return (
    <div className="mod-dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          Moderator Dashboard <span className="dashboard-subtitle">Content Review</span>
        </h1>
        <button type="button" className="dashboard-logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="dashboard-cards">
        <div className="info-card">
          <span className="info-label">Assigned Role</span>
          <span className="info-value">Moderator</span>
        </div>
        <div className="info-card">
          <span className="info-label">Queue Status</span>
          <span className={`info-value status-${status}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div className="info-card">
          <span className="info-label">Pending Reviews</span>
          <span className="info-value">24 Active</span>
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
        <div className="chart-card reports-card">
          <h2 className="chart-title">User Reports</h2>
          <p className="chart-subtitle">Flagged content over the past 7 days</p>
          <div className="chart-container bar-chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={REPORTS_DATA}
                margin={{ top: 16, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#78350f", fontSize: 12 }}
                  axisLine={{ stroke: "#fde68a" }}
                />
                <YAxis
                  tick={{ fill: "#78350f", fontSize: 12 }}
                  axisLine={{ stroke: "#fde68a" }}
                  domain={[0, 40]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#451a03",
                    border: "none",
                    borderRadius: 8,
                    color: "#fffbeb",
                  }}
                  formatter={(value) => [value, "Flags"]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {REPORTS_DATA.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <a href="#reviews" className="view-all-link">OPEN REVIEW QUEUE</a>
        </div>

        <div className="chart-card resolution-card">
          <h2 className="chart-title">Resolution Rate</h2>
          <div className="access-legend">
            <span className="legend-item">
              <span className="legend-dot approved" /> Approved (65%)
            </span>
            <span className="legend-item">
              <span className="legend-dot rejected" /> Rejected (35%)
            </span>
          </div>
          <div className="chart-container donut-chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={ACTIONS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  labelLine={false}
                >
                  {ACTIONS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, "Total"]}
                  contentStyle={{
                    background: "#451a03",
                    border: "none",
                    borderRadius: 8,
                    color: "#fffbeb",
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
