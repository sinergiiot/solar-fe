import { useState, useEffect } from "react";
import { FiUsers, FiShield, FiCheck, FiX, FiTrendingUp, FiZap, FiGlobe, FiPackage, FiSearch, FiArrowUpRight, FiClock, FiActivity, FiUserPlus, FiLogOut, FiCalendar, FiAlertTriangle, FiBarChart2, FiMail, FiTarget, FiBox, FiPieChart, FiAward, FiList, FiDownload, FiServer } from "react-icons/fi";
import { 
  adminGetUsers, 
  adminUpdateUserTier, 
  adminGetStats, 
  adminImpersonateUser, 
  adminGetSchedulerStatus, 
  adminGetExpiringSubscriptions,
  adminGetForecastQuality,
  adminGetColdStartSites,
  adminGetNotificationLogs,
  adminGetDataAnomalies,
  adminGetAggregateAnalytics,
  adminGetSiteRankings,
  adminGetTierDistribution,
  adminGetWeatherHealth,
  adminGetAuditLogs
} from "../api";
import TierBadge from "./TierBadge";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  BarChart, 
  Bar 
} from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminSection() {
  const [activeTab, setActiveTab] = useState("users"); // "users", "quality", "intelligence", "audit", "scheduler", "logs", "expiring"
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [schedulerRuns, setSchedulerRuns] = useState([]);
  const [expiringSubs, setExpiringSubs] = useState([]);
  const [forecastQuality, setForecastQuality] = useState([]);
  const [coldStartSites, setColdStartSites] = useState([]);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  
  // BI Data
  const [aggregateData, setAggregateData] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [tierDist, setTierDist] = useState([]);
  const [weatherHealth, setWeatherHealth] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingID, setUpdatingID] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setIsLoading(true);
    try {
      if (activeTab === "users") {
        const [userData, statsData] = await Promise.all([
          adminGetUsers(),
          adminGetStats()
        ]);
        setUsers(userData || []);
        setStats(statsData);
      } else if (activeTab === "scheduler") {
        const runs = await adminGetSchedulerStatus(50);
        setSchedulerRuns(runs || []);
      } else if (activeTab === "expiring") {
        const subs = await adminGetExpiringSubscriptions(7);
        setExpiringSubs(subs || []);
      } else if (activeTab === "quality") {
        const [quality, coldStart, anomalyList] = await Promise.all([
          adminGetForecastQuality(),
          adminGetColdStartSites(),
          adminGetDataAnomalies()
        ]);
        setForecastQuality(quality || []);
        setColdStartSites(coldStart || []);
        setAnomalies(anomalyList || []);
      } else if (activeTab === "logs") {
        const logs = await adminGetNotificationLogs(100);
        setNotificationLogs(logs || []);
      } else if (activeTab === "intelligence") {
        const [agg, rank, dist, health] = await Promise.all([
          adminGetAggregateAnalytics(30),
          adminGetSiteRankings(10),
          adminGetTierDistribution(),
          adminGetWeatherHealth()
        ]);
        setAggregateData(agg || []);
        setRankings(rank || []);
        setTierDist(dist || []);
        setWeatherHealth(health || []);
      } else if (activeTab === "audit") {
        const logs = await adminGetAuditLogs(100);
        setAuditLogs(logs || []);
      }
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateTier(userID, newTier) {
    if (!window.confirm(`Ganti tier penguna ke ${newTier.toUpperCase()}?`)) return;
    setUpdatingID(userID);
    try {
      await adminUpdateUserTier(userID, { plan_tier: newTier });
      await loadData();
    } catch (err) {
      alert("Gagal update tier: " + err.message);
    } finally {
      setUpdatingID("");
    }
  }

  async function handleImpersonate(userID) {
    if (!window.confirm("Beralih ke akun pengguna ini? Anda dapat kembali dengan logout.")) return;
    try {
      const res = await adminImpersonateUser(userID);
      if (res.impersonation_token) {
        localStorage.setItem("solar_forecast_token", res.impersonation_token);
        window.location.href = "/dashboard";
      }
    } catch (err) {
      alert("Gagal impersonate: " + err.message);
    }
  }

  function exportAuditToCSV() {
    if (auditLogs.length === 0) return;
    const headers = ["ID", "Time", "Admin", "Action", "Target", "Details", "IP"];
    const rows = auditLogs.map(l => [
      l.id,
      new Date(l.created_at).toLocaleString(),
      l.admin_email,
      l.action,
      l.target_id || "-",
      l.details,
      l.ip_address || "-"
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && (
    (activeTab === "users" && users.length === 0) ||
    (activeTab === "scheduler" && schedulerRuns.length === 0) ||
    (activeTab === "quality" && forecastQuality.length === 0) ||
    (activeTab === "logs" && notificationLogs.length === 0) ||
    (activeTab === "expiring" && expiringSubs.length === 0) ||
    (activeTab === "intelligence" && aggregateData.length === 0) ||
    (activeTab === "audit" && auditLogs.length === 0)
  )) {
    return (
      <div className="admin-container">
        <div className='empty-state' style={{ background: 'white', borderRadius: '32px', padding: '100px' }}>
          <div className="spinner" style={{ marginBottom: '20px' }}></div>
          <p>Mempersiapkan data administrasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Tab Navigation */}
      <div className="admin-tabs" style={{ marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'white', padding: '8px', borderRadius: '16px', alignSelf: 'flex-start', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {[
          { id: 'users', label: 'Users', icon: <FiUsers /> },
          { id: 'intelligence', label: 'Intelligence', icon: <FiPieChart /> },
          { id: 'quality', label: 'Quality', icon: <FiBarChart2 /> },
          { id: 'audit', label: 'Audit Log', icon: <FiList /> },
          { id: 'scheduler', label: 'Scheduler', icon: <FiActivity /> },
          { id: 'logs', label: 'Delivery', icon: <FiMail /> },
          { id: 'expiring', label: 'Alerts', icon: <FiCalendar /> },
        ].map(tab => (
          <button 
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: 'none', background: activeTab === tab.id ? 'var(--green)' : 'transparent', color: activeTab === tab.id ? 'white' : 'var(--text)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <>
          {/* Stats Cards Section */}
          {stats && (
            <div className="admin-summary">
              <div className="admin-card">
                <div className="admin-card-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                  <FiUsers />
                </div>
                <span className="admin-card-value text-gradient">{stats.total_users}</span>
                <span className="admin-card-label">Total Anggota Terdaftar</span>
                <div className="admin-card-sub">
                  <strong>{stats.pro_users}</strong> Pro  •  <strong>{stats.enterprise_users}</strong> Enterprise
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
                  <FiZap />
                </div>
                <span className="admin-card-value text-gradient">{(stats.total_kwh / 1000).toFixed(2)} MWh</span>
                <span className="admin-card-label">Total Produksi Agregat</span>
                <div className="admin-card-sub">
                  Setara {stats.total_kwh.toLocaleString()} kWh energi hijau
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                  <FiGlobe />
                </div>
                <span className="admin-card-value text-gradient">{stats.total_profiles}</span>
                <span className="admin-card-label">Total Site Terintegrasi</span>
                <div className="admin-card-sub">
                  Lokasi PLTS aktif terpantau di sistem
                </div>
              </div>
            </div>
          )}

          {/* User Management Section */}
          <section className='admin-table-panel'>
            <div className='admin-table-header'>
              <div>
                <span className='panel-kicker'>Platform Overview</span>
                <h2>Membership & Control Panel</h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Kelola status akun, tier langganan, dan pantaau aktivitas pengguna secara real-time.
                </p>
              </div>
              
              <div className="admin-search-box">
                <FiSearch style={{ color: 'var(--muted)' }} />
                <input 
                  type="text" 
                  placeholder="Cari nama atau email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {error && <div className='banner banner-error' style={{ marginBottom: '24px' }}>{error}</div>}

            <div className='history-table'>
              <table>
                <thead>
                  <tr>
                    <th>Detail Pengguna</th>
                    <th>Role Sistem</th>
                    <th>Membership Tier</th>
                    <th>Kelola Tier / Akses</th>
                    <th style={{ textAlign: 'right' }}>Terdaftar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
                        <FiSearch style={{ fontSize: '2rem', opacity: 0.2, marginBottom: '12px' }} />
                        <p>Tidak ada pengguna yang sesuai dengan kriteria pencarian.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="stack" style={{ gap: '2px' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{u.name}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{u.email}</span>
                          </div>
                        </td>
                        <td>
                          <div className="stack-row" style={{ gap: '6px', alignItems: 'center' }}>
                            <span className={`match-status ${u.role === 'admin' ? 'match-status-ready' : 'match-status-pending'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 800 }}>
                              {u.role}
                            </span>
                            {u.role === 'admin' && <FiShield style={{ color: 'var(--success)', fontSize: '14px' }} />}
                            <button 
                              className="secondary-button"
                              title="Masuk sebagai user"
                              style={{ padding: '4px', borderRadius: '6px', fontSize: '14px' }}
                              onClick={() => handleImpersonate(u.id)}
                            >
                              <FiArrowUpRight />
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="stack" style={{ gap: '2px' }}>
                            <TierBadge tier={u.plan_tier} />
                            {u.plan_expires_at && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 500 }}>
                                Exp: {new Date(u.plan_expires_at).toLocaleDateString('id-ID')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className='stack-row' style={{ gap: '8px' }}>
                            <button 
                              className='secondary-button' 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600 }}
                              disabled={updatingID === u.id || u.plan_tier === 'free'}
                              onClick={() => handleUpdateTier(u.id, 'free')}
                            >
                              Revoke
                            </button>
                            <button 
                              className='secondary-button' 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, borderColor: '#f59e0b', color: '#b45309', background: '#fffbeb' }}
                              disabled={updatingID === u.id || u.plan_tier === 'pro'}
                              onClick={() => handleUpdateTier(u.id, 'pro')}
                            >
                              Assign Pro
                            </button>
                            <button 
                              className='secondary-button' 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, borderColor: 'var(--green)', color: '#065f46', background: '#ecfdf5' }}
                              disabled={updatingID === u.id || u.plan_tier === 'enterprise'}
                              onClick={() => handleUpdateTier(u.id, 'enterprise')}
                            >
                              Assign Enterprise
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 500 }}>
                          <div className="stack" style={{ gap: '2px', alignItems: 'flex-end' }}>
                            <span>{new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}><FiClock style={{ verticalAlign: 'middle', marginRight: '2px' }} /> {new Date(u.created_at).getHours()}:{String(new Date(u.created_at).getMinutes()).padStart(2, '0')}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {activeTab === "intelligence" && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', marginBottom: '32px' }}>
             {/* Aggregated Trends */}
             <section className='admin-table-panel' style={{ background: 'white', padding: '24px' }}>
                <div className='admin-table-header'>
                  <div style={{ marginBottom: '20px' }}>
                    <span className='panel-kicker'>Growth & Accuracy</span>
                    <h2>Agreggated Global Trends</h2>
                  </div>
                </div>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer>
                    <AreaChart data={aggregateData}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip 
                        labelFormatter={(v) => new Date(v).toLocaleDateString('id-ID')}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Area type="monotone" dataKey="total_actual" stroke="#10b981" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} name="Actual kWh" />
                      <Area type="monotone" dataKey="total_predicted" stroke="#3b82f6" fill="transparent" strokeDasharray="5 5" strokeWidth={2} name="Forecast kWh" />
                      <Legend verticalAlign="top" height={36}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </section>

             <div className="stack" style={{ gap: '24px' }}>
                {/* Weather API Health */}
                <section className='admin-table-panel' style={{ background: 'white', padding: '24px' }}>
                  <div className='admin-table-header' style={{ marginBottom: '16px' }}>
                    <div>
                      <span className='panel-kicker'>Integration Health</span>
                      <h2 style={{ fontSize: '1.1rem' }}>Weather API</h2>
                    </div>
                    <FiServer style={{ color: 'var(--green)' }} />
                  </div>
                  {weatherHealth.map((h, i) => (
                    <div key={i} className="stack" style={{ gap: '12px' }}>
                       <div className="stack-row" style={{ justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--muted)' }}>Latency</span>
                          <span style={{ fontWeight: 700 }}>{h.avg_response_time.toFixed(0)} ms</span>
                       </div>
                       <div className="stack-row" style={{ justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--muted)' }}>Cache Hit</span>
                          <span style={{ fontWeight: 700 }}>{(h.cache_hit_rate * 100).toFixed(1)}%</span>
                       </div>
                       <div className="stack-row" style={{ justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--muted)' }}>Success</span>
                          <span style={{ fontWeight: 700, color: 'var(--success)' }}>{(h.success_rate * 100).toFixed(1)}%</span>
                       </div>
                    </div>
                  ))}
                </section>

                {/* Tier Distribution */}
                <section className='admin-table-panel' style={{ background: 'white', padding: '24px', flex: 1 }}>
                    <div className='admin-table-header'>
                      <h2 style={{ fontSize: '1.1rem' }}>Tier Share</h2>
                    </div>
                    <div style={{ width: '100%', height: '140px' }}>
                      <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={tierDist}
                              innerRadius={40}
                              outerRadius={55}
                              paddingAngle={5}
                              dataKey="count"
                              nameKey="tier"
                            >
                              {tierDist.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                      </ResponsiveContainer>
                    </div>
                </section>
             </div>
          </div>

          {/* Ranking Section */}
          <section className='admin-table-panel'>
            <div className='admin-table-header'>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiAward style={{ fontSize: '1.5rem', color: '#f59e0b' }} />
                <div>
                  <span className='panel-kicker'>Consistency Leaders</span>
                  <h2>Top 10 Performance Rankings (30 Days)</h2>
                </div>
              </div>
            </div>
            <div className='history-table'>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Site / Organization</th>
                    <th>Avg Production (Daily)</th>
                    <th>Avg MAPE (%)</th>
                    <th>Consistency</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((r, i) => (
                    <tr key={r.profile_id}>
                      <td style={{ fontWeight: 800, color: i < 3 ? '#f59e0b' : 'var(--muted)' }}>#{i + 1}</td>
                      <td>
                        <div className="stack">
                          <span style={{ fontWeight: 700 }}>{r.site_name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{r.user_email}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.avg_actual.toFixed(2)} kWh</td>
                      <td style={{ fontWeight: 700, color: r.avg_mape < 10 ? '#10b981' : 'var(--text)' }}>
                        {r.avg_mape.toFixed(2)}%
                      </td>
                      <td>
                        <div style={{ width: '100px', height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                           <div style={{ width: `${Math.max(0, 100 - r.avg_mape)}%`, height: '100%', background: r.avg_mape < 15 ? '#10b981' : '#f59e0b' }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {activeTab === "audit" && (
        <section className='admin-table-panel'>
           <div className='admin-table-header'>
            <div>
              <span className='panel-kicker'>Security & Accountability</span>
              <h2>Administrative Audit Logs</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Jejak riwayat aktivitas pengelolaan sistem oleh administrator.
              </p>
            </div>
            <button className="secondary-button" onClick={exportAuditToCSV}><FiDownload /> Export CSV</button>
          </div>
          <div className='history-table'>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Belum ada jejak audit yang terekam.</td></tr>
                  ) : (
                    auditLogs.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontSize: '0.8rem' }}>{new Date(l.created_at).toLocaleString('id-ID')}</td>
                        <td style={{ fontWeight: 600 }}>{l.admin_email}</td>
                        <td>
                          <span className="match-status match-status-pending" style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800 }}>
                            {l.action}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{l.details}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{l.ip_address || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </div>
        </section>
      )}

      {activeTab === "quality" && (
        <>
          {/* Anomaly Alerts at Top */}
          {anomalies.length > 0 && (
            <div className="anomaly-pane" style={{ marginBottom: '32px' }}>
              <div className="banner banner-error" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b' }}>
                  <FiAlertTriangle style={{ fontSize: '1.2rem' }} />
                  <strong style={{ fontSize: '1.1rem' }}>Anomali Data Terdeteksi ({anomalies.length})</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {anomalies.map((a, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.5)', padding: '12px', borderRadius: '12px', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 700 }}>{a.site_name}</div>
                      <div style={{ opacity: 0.7 }}>Actual: <strong>{a.actual.toFixed(2)}</strong> vs Pred: {a.predicted.toFixed(2)}</div>
                      <div style={{ color: '#991b1b', marginTop: '4px', fontWeight: 600 }}>Ratio: {(a.ratio).toFixed(1)}x over limit</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
             {/* Quality Table */}
             <section className='admin-table-panel'>
                <div className='admin-table-header'>
                  <div>
                    <span className='panel-kicker'>Accuracy Monitor</span>
                    <h2>Forecast Quality (MAPE)</h2>
                  </div>
                </div>
                <div className='history-table'>
                  <table>
                    <thead>
                      <tr>
                        <th>Site / User</th>
                        <th>MAPE (%)</th>
                        <th>Samples</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastQuality.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Data belum cukup untuk kalkulasi.</td></tr>
                      ) : (
                        forecastQuality.map((q, i) => (
                          <tr key={i}>
                            <td>
                              <div className="stack">
                                <span style={{ fontWeight: 600 }}>{q.site_name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{q.user_email}</span>
                              </div>
                            </td>
                            <td style={{ fontWeight: 700 }}>{q.mape.toFixed(2)}%</td>
                            <td>{q.sample_count}</td>
                            <td>
                               <span className={`match-status ${q.status === 'excellent' ? 'match-status-ready' : q.status === 'good' ? 'match-status-pending' : 'match-status-mismatch'}`}>
                                {q.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
             </section>

             {/* Cold Start Monitor */}
             <section className='admin-table-panel'>
                <div className='admin-table-header'>
                  <div>
                    <span className='panel-kicker'>Training Progress</span>
                    <h2>Cold Start Sites</h2>
                  </div>
                </div>
                <div className='history-table'>
                  <table>
                    <thead>
                      <tr>
                        <th>Site Name</th>
                        <th>Actual Data</th>
                        <th>Age</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coldStartSites.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Tidak ada site dalam fase cold start lama.</td></tr>
                      ) : (
                        coldStartSites.map((c, i) => (
                          <tr key={i}>
                            <td>
                              <div className="stack">
                                <span style={{ fontWeight: 600 }}>{c.site_name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{c.user_email}</span>
                              </div>
                            </td>
                            <td>{c.actual_days} hari</td>
                            <td>{Math.floor((new Date() - new Date(c.created_at)) / (1000 * 60 * 60 * 24))} hari</td>
                            <td>
                              <button className="secondary-button" style={{ padding: '6px 10px', fontSize: '0.7rem' }}>Enable Blended</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
             </section>
          </div>
        </>
      )}

      {activeTab === "scheduler" && (
        <section className='admin-table-panel'>
          <div className='admin-table-header'>
            <div>
              <span className='panel-kicker'>System Automation</span>
              <h2>Job Scheduler Status</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Pantau eksekusi background jobs, durasi, dan log kesalahan sistem.
              </p>
            </div>
            <button className="secondary-button" onClick={loadData}><FiActivity /> Refresh</button>
          </div>

          <div className='history-table'>
            <table>
              <thead>
                <tr>
                  <th>Nama Task</th>
                  <th>Status</th>
                  <th>Durasi</th>
                  <th>Waktu Selesai</th>
                  <th>Detail Error</th>
                </tr>
              </thead>
              <tbody>
                {schedulerRuns.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Belum ada log eksekusi tersedia.</td></tr>
                ) : (
                  schedulerRuns.map((run) => (
                    <tr key={run.id}>
                      <td style={{ fontWeight: 600 }}>{run.job_name}</td>
                      <td>
                        <span className={`match-status ${run.status === 'success' ? 'match-status-ready' : 'match-status-mismatch'}`}>
                          {run.status.toUpperCase()}
                        </span>
                      </td>
                      <td>{run.duration_ms}ms</td>
                      <td>{new Date(run.finished_at).toLocaleString('id-ID')}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.8rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {run.error_message || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "logs" && (
        <section className='admin-table-panel'>
           <div className='admin-table-header'>
            <div>
              <span className='panel-kicker'>Delivery Tracking</span>
              <h2>Notification Delivery Logs</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Status pengiriman notifikasi via Email, Telegram, dan WhatsApp.
              </p>
            </div>
          </div>
          <div className='history-table'>
              <table>
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>User</th>
                    <th>Channel</th>
                    <th>Status</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationLogs.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Log pengiriman masih kosong.</td></tr>
                  ) : (
                    notificationLogs.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontSize: '0.8rem' }}>{new Date(l.sent_at).toLocaleString('id-ID')}</td>
                        <td>{l.user_email}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize' }}>
                             {l.channel === 'email' && <FiMail />}
                             {l.channel === 'telegram' && <FiTarget />}
                             {l.channel === 'whatsapp' && <FiGlobe />}
                             {l.channel}
                          </div>
                        </td>
                        <td>
                          <span className={`match-status ${l.status === 'sent' ? 'match-status-ready' : 'match-status-mismatch'}`}>
                            {l.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#dc2626' }}>{l.error_message || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </div>
        </section>
      )}

      {activeTab === "expiring" && (
        <section className='admin-table-panel'>
          <div className='admin-table-header'>
            <div>
              <span className='panel-kicker'>Retention Watch</span>
              <h2>Akan Berakhir (7 Hari)</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Daftar langganan berbayar yang akan kedaluwarsa dalam satu minggu ke depan.
              </p>
            </div>
          </div>

          <div className='history-table'>
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Paket</th>
                  <th>Status</th>
                  <th>Berakhir Pada</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {expiringSubs.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Tidak ada langganan yang akan segera berakhir.</td></tr>
                ) : (
                  expiringSubs.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontSize: '0.85rem' }}>{sub.user_id}</td>
                      <td><TierBadge tier={sub.plan_tier} /></td>
                      <td>
                        <span className={`match-status ${sub.status === 'active' ? 'match-status-ready' : 'match-status-pending'}`}>
                          {sub.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#e11d48' }}>
                         {new Date(sub.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="secondary-button" onClick={() => setActiveTab('users')}>Lihat User</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Footer Info */}
      <div className="stack-row" style={{ justifyContent: 'center', opacity: 0.5, fontSize: '0.8rem', marginTop: '20px' }}>
        <FiShield /> Terminal Keamanan Admin Aktif • Sinergi IoT Cloud Management
      </div>
    </div>
  );
}
