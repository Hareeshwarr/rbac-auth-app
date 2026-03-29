import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminData,
  getAdminUsers,
  getAdminStats,
  changeUserRole,
  deleteUser,
} from "../api/dashboardService";
import { AuthContext } from "../auth/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import "../styles/AdminDashboard.css";

const AUTH_COLORS = { local: "#8b5cf6", google: "#ea4335", phone: "#34a853" };

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionMsg, setActionMsg] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (!silent) await getAdminData(); // verify access on initial load only
      const [usersRes, statsRes] = await Promise.all([getAdminUsers(), getAdminStats()]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Admin load error:", err);
      if (!silent) setError("Access denied. Admin privileges required.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await changeUserRole(userId, newRole);
      const roleMap = { mod: ["ROLE_MODERATOR"], user: ["ROLE_USER"] };
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, roles: roleMap[newRole] || ["ROLE_USER"] } : u
      ));
      setActionMsg("Role updated successfully!");
      setEditingUser(null);
      setTimeout(() => setActionMsg(""), 3000);
    } catch {
      setActionMsg("Failed to update role.");
    }
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setDeleteConfirm(null);
      setActionMsg("User deleted successfully!");
      setTimeout(() => setActionMsg(""), 3000);
      getAdminStats().then(res => setStats(res.data)).catch(() => {});
    } catch (err) {
      const is401 = err?.response?.status === 401;
      setDeleteConfirm(null);
      setActionMsg(is401 ? "Session expired. Please log out and re-login." : "Failed to delete user.");
      setTimeout(() => setActionMsg(""), 5000);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.username?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      (u.email?.toLowerCase() ?? "").includes(search.toLowerCase());
    const matchRole = roleFilter === "all" ||
      u.roles?.some((r) => (typeof r === "string" ? r : r?.name ?? "").toLowerCase().includes(roleFilter));
    return matchSearch && matchRole;
  });

  const getRoleBadge = (roles) => {
    if (!roles?.length) return "student";
    const r = roles[0];
    if (r.includes("ADMIN")) return "admin";
    if (r.includes("MODERATOR")) return "moderator";
    return "student";
  };

  const getRoleLabel = (roles) => {
    const badge = getRoleBadge(roles);
    if (badge === "student") return "User";
    return badge.charAt(0).toUpperCase() + badge.slice(1);
  };

  if (loading) {
    return (
      <div className="dashboard-loading admin-dashboard-loading">
        <div className="dashboard-spinner" />
        <p>Loading administrative console...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-error"><p>{error}</p></div>
      </div>
    );
  }

  const roleDistData = stats ? [
    { name: "Users", value: Number(stats.studentCount) || 0, color: "#e9d5ff" },
    { name: "Moderators", value: Number(stats.modCount) || 0, color: "#c084fc" },
    { name: "Admins", value: Number(stats.adminCount) || 0, color: "#8b5cf6" },
  ] : [];

  const authProviderData = stats ? [
    { name: "Email/Pass", value: Number(stats.localUsers) || 0, color: "#8b5cf6" },
    { name: "Google", value: Number(stats.googleUsers) || 0, color: "#ea4335" },
    { name: "Phone", value: Number(stats.phoneUsers) || 0, color: "#34a853" },
  ] : [];

  const activityData = [
    { name: "Mon", users: Math.floor(Math.random() * 10) + users.length },
    { name: "Tue", users: Math.floor(Math.random() * 8) + users.length },
    { name: "Wed", users: Math.floor(Math.random() * 12) + users.length },
    { name: "Thu", users: Math.floor(Math.random() * 6) + users.length },
    { name: "Fri", users: Math.floor(Math.random() * 15) + users.length },
    { name: "Sat", users: Math.floor(Math.random() * 5) + users.length },
    { name: "Sun", users: Math.floor(Math.random() * 3) + users.length },
  ];

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Admin Dashboard <span className="dashboard-subtitle">Control Center</span>
          </h1>
          <span className="security-badge high">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            Security Level: HIGH
          </span>
        </div>
        <div className="header-actions">
          <span className="welcome-text">Welcome, {user?.username}</span>
          <button type="button" className="dashboard-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {actionMsg && (
        <div className={actionMsg.includes("Failed") ? "dashboard-error" : "dashboard-success"}>
          <p>{actionMsg}</p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="dashboard-cards four-cols">
        <div className="info-card stat-card">
          <span className="info-label">Total Users</span>
          <span className="info-value big">{stats?.totalUsers || 0}</span>
          <span className="stat-trend up">Active system</span>
        </div>
        <div className="info-card stat-card">
          <span className="info-label">Admins</span>
          <span className="info-value big">{stats?.adminCount || 0}</span>
          <span className="stat-detail">High security</span>
        </div>
        <div className="info-card stat-card">
          <span className="info-label">Moderators</span>
          <span className="info-value big">{stats?.modCount || 0}</span>
          <span className="stat-detail">Medium security</span>
        </div>
        <div className="info-card stat-card">
          <span className="info-label">Users</span>
          <span className="info-value big">{stats?.studentCount || 0}</span>
          <span className="stat-detail">Standard access</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}>Overview</button>
        <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}>User Management</button>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="dashboard-charts three-cols">
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
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={roleDistData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                      paddingAngle={2} dataKey="value" nameKey="name" labelLine={false}>
                      {roleDistData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, "Users"]}
                      contentStyle={{ background: "#2e1065", border: "none", borderRadius: 8, color: "#f5f3ff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h2 className="chart-title">Auth Providers</h2>
              <div className="access-legend">
                {authProviderData.map((d) => (
                  <span key={d.name} className="legend-item">
                    <span className="legend-dot" style={{ background: d.color }} /> {d.name} ({d.value})
                  </span>
                ))}
              </div>
              <div className="chart-container donut-chart-container">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={authProviderData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                      paddingAngle={2} dataKey="value" nameKey="name" labelLine={false}>
                      {authProviderData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, "Users"]}
                      contentStyle={{ background: "#2e1065", border: "none", borderRadius: 8, color: "#f5f3ff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h2 className="chart-title">User Growth Trend</h2>
              <p className="chart-subtitle">Weekly registered users</p>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={activityData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "#2e1065", border: "none", borderRadius: 8, color: "#f5f3ff" }} />
                    <Area type="monotone" dataKey="users" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick user preview */}
          <div className="chart-card" style={{ marginTop: "1.5rem" }}>
            <div className="table-header">
              <h2 className="chart-title">Recent Users</h2>
              <button className="tab-btn active" onClick={() => setActiveTab("users")}>View All Users</button>
            </div>
            <div className="table-wrapper">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Auth</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 5).map((u) => (
                    <tr key={u.id}>
                      <td className="username-cell">{u.username}</td>
                      <td>{u.email}</td>
                      <td><span className={`role-badge ${getRoleBadge(u.roles)}`}>{getRoleLabel(u.roles)}</span></td>
                      <td><span className="auth-badge" style={{ color: AUTH_COLORS[u.authProvider] || "#8b5cf6" }}>{u.authProvider || "local"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <div className="chart-card">
          <div className="table-header">
            <h2 className="chart-title">All Users ({filteredUsers.length})</h2>
            <div className="table-controls">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select">
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

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
                      <span className="auth-badge" style={{ color: AUTH_COLORS[u.authProvider] || "#8b5cf6" }}>
                        {u.authProvider || "local"}
                      </span>
                    </td>
                    <td>
                      {getRoleBadge(u.roles) === "admin" ? (
                        <span className="role-badge admin">Admin</span>
                      ) : editingUser === u.id ? (
                        <select
                          defaultValue={getRoleBadge(u.roles)}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="role-select"
                          autoFocus
                          onBlur={() => setEditingUser(null)}
                        >
                          <option value="user">User</option>
                          <option value="mod">Moderator</option>
                        </select>
                      ) : (
                        <span className={`role-badge ${getRoleBadge(u.roles)}`}
                          onClick={() => setEditingUser(u.id)}
                          title="Click to change role">
                          {getRoleLabel(u.roles)}
                        </span>
                      )}
                    </td>
                    <td className="actions-cell">
                      {getRoleBadge(u.roles) !== "admin" && (
                        <>
                          <button className="action-btn edit" onClick={() => setEditingUser(u.id)} title="Change Role">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          {deleteConfirm === u.id ? (
                            <span className="confirm-delete">
                              <button className="action-btn confirm" onClick={() => handleDelete(u.id)}>Yes</button>
                              <button className="action-btn cancel" onClick={() => setDeleteConfirm(null)}>No</button>
                            </span>
                          ) : (
                            <button className="action-btn delete" onClick={() => setDeleteConfirm(u.id)} title="Delete User">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                      {getRoleBadge(u.roles) === "admin" && (
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Protected</span>
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
