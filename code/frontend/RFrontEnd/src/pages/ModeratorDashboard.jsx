import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  getModeratorData,
  getModUsers,
  getModStats,
  deleteStudent,
} from "../api/dashboardService";
import { AuthContext } from "../auth/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import "../styles/ModeratorDashboard.css";

const AUTH_COLORS = { local: "#d97706", google: "#ea4335", phone: "#34a853" };

export default function ModeratorDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await getModeratorData(); // verify access
      const [usersRes, statsRes] = await Promise.all([getModUsers(), getModStats()]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Mod load error:", err);
      setError("Access denied. Moderator privileges required.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleDeleteStudent = async (userId) => {
    try {
      await deleteStudent(userId);
      setActionMsg("User removed successfully!");
      setDeleteConfirm(null);
      loadData();
      setTimeout(() => setActionMsg(""), 3000);
    } catch {
      setActionMsg("Failed to remove user.");
      setTimeout(() => setActionMsg(""), 3000);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (roles) => {
    if (!roles?.length) return "student";
    const r = roles[0];
    if (r.includes("ADMIN")) return "admin";
    if (r.includes("MODERATOR")) return "moderator";
    return "student";
  };

  const getRoleLabel = (roles) => {
    const badge = getRoleBadge(roles);
    return badge.charAt(0).toUpperCase() + badge.slice(1);
  };

  if (loading) {
    return (
      <div className="dashboard-loading mod-dashboard-loading">
        <div className="dashboard-spinner" />
        <p>Loading moderation console...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mod-dashboard">
        <div className="dashboard-error"><p>{error}</p></div>
      </div>
    );
  }

  const roleDistData = stats ? [
    { name: "Users", value: Number(stats.studentCount) || 0, color: "#fde68a" },
    { name: "Moderators", value: Number(stats.modCount) || 0, color: "#f59e0b" },
    { name: "Admins", value: Number(stats.adminCount) || 0, color: "#b45309" },
  ] : [];

  const authProviderData = stats ? [
    { name: "Email/Pass", value: Number(stats.localUsers) || 0, fill: "#f59e0b" },
    { name: "Google", value: Number(stats.googleUsers) || 0, fill: "#ea4335" },
    { name: "Phone", value: Number(stats.phoneUsers) || 0, fill: "#34a853" },
  ] : [];

  return (
    <div className="mod-dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Moderator Dashboard <span className="dashboard-subtitle">Content Review</span>
          </h1>
          <span className="security-badge medium">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            Security Level: MEDIUM
          </span>
        </div>
        <div className="header-actions">
          <span className="welcome-text">Welcome, {user?.username}</span>
          <button type="button" className="dashboard-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="dashboard-cards four-cols">
        <div className="info-card stat-card">
          <span className="info-label">Total Users</span>
          <span className="info-value big">{stats?.totalUsers || 0}</span>
        </div>
        <div className="info-card stat-card">
          <span className="info-label">Users</span>
          <span className="info-value big">{stats?.studentCount || 0}</span>
        </div>
        <div className="info-card stat-card">
          <span className="info-label">Moderators</span>
          <span className="info-value big">{stats?.modCount || 0}</span>
        </div>
        <div className="info-card stat-card">
          <span className="info-label">Admins</span>
          <span className="info-value big">{stats?.adminCount || 0}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}>Overview</button>
        <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}>Manage Users</button>
      </div>

      {actionMsg && (
        <div className={actionMsg.includes("Failed") ? "dashboard-error" : ""}
          style={!actionMsg.includes("Failed") ? {
            background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857",
            padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem"
          } : {}}>
          <p style={{ margin: 0 }}>{actionMsg}</p>
        </div>
      )}

      {activeTab === "overview" && (
        <div className="dashboard-charts">
          <div className="chart-card">
            <h2 className="chart-title">Role Distribution</h2>
            <div className="access-legend">
              {roleDistData.map((d) => (
                <span key={d.name} className="legend-item">
                  <span className="legend-dot" style={{ background: d.color }} /> {d.name} ({d.value})
                </span>
              ))}
            </div>
            <div className="chart-container donut-chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={roleDistData} cx="50%" cy="50%" innerRadius={70} outerRadius={100}
                    paddingAngle={2} dataKey="value" nameKey="name" labelLine={false}>
                    {roleDistData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "Users"]}
                    contentStyle={{ background: "#451a03", border: "none", borderRadius: 8, color: "#fffbeb" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h2 className="chart-title">Auth Provider Breakdown</h2>
            <p className="chart-subtitle">How users authenticate</p>
            <div className="chart-container bar-chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={authProviderData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" />
                  <XAxis dataKey="name" tick={{ fill: "#78350f", fontSize: 12 }} axisLine={{ stroke: "#fde68a" }} />
                  <YAxis tick={{ fill: "#78350f", fontSize: 12 }} axisLine={{ stroke: "#fde68a" }} />
                  <Tooltip contentStyle={{ background: "#451a03", border: "none", borderRadius: 8, color: "#fffbeb" }}
                    formatter={(v) => [v, "Users"]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {authProviderData.map((entry, i) => (
                      <Cell key={`bar-${i}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="chart-card">
          <div className="table-header">
            <h2 className="chart-title">Users ({filteredUsers.length})</h2>
            <div className="table-controls">
              <input type="text" placeholder="Search users..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="search-input" />
            </div>
          </div>
          <p className="read-only-note">You can remove user accounts. Moderator and Admin accounts are managed by Admins only.</p>
          <div className="table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Auth</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="id-cell">#{u.id}</td>
                    <td className="username-cell">{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.phoneNumber || "—"}</td>
                    <td>
                      <span className="auth-badge" style={{ color: AUTH_COLORS[u.authProvider] || "#d97706" }}>
                        {u.authProvider || "local"}
                      </span>
                    </td>
                    <td>
                      <span className="role-badge student">User</span>
                    </td>
                    <td>
                      {deleteConfirm === u.id ? (
                        <span style={{ display: "inline-flex", gap: "4px" }}>
                          <button className="mod-action-btn confirm" onClick={() => handleDeleteStudent(u.id)}>Yes</button>
                          <button className="mod-action-btn cancel" onClick={() => setDeleteConfirm(null)}>No</button>
                        </span>
                      ) : (
                        <button className="mod-action-btn delete" onClick={() => setDeleteConfirm(u.id)} title="Remove User">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan="7" className="empty-row">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
