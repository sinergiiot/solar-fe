import { useState, useEffect } from "react";
import { FiUsers, FiShield, FiCheck, FiX, FiTrendingUp, FiZap, FiGlobe, FiPackage, FiSearch, FiArrowUpRight, FiClock } from "react-icons/fi";
import { adminGetUsers, adminUpdateUserTier, adminGetStats } from "../api";
import TierBadge from "./TierBadge";

export default function AdminSection() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingID, setUpdatingID] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [userData, statsData] = await Promise.all([
        adminGetUsers(),
        adminGetStats()
      ]);
      setUsers(userData || []);
      setStats(statsData);
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
      await adminUpdateUserTier(userID, newTier);
      await loadData();
    } catch (err) {
      alert("Gagal update tier: " + err.message);
    } finally {
      setUpdatingID("");
    }
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && users.length === 0) {
    return (
      <div className="admin-container">
        <div className='empty-state' style={{ background: 'white', borderRadius: '32px', padding: '100px' }}>
          <div className="spinner" style={{ marginBottom: '20px' }}></div>
          <p>Mempersiapkan dashboard administrasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
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
               <strong>{stats.total_pro}</strong> Pro  •  <strong>{stats.total_enterprise}</strong> Enterprise
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

      {/* Main Management Section */}
      <section className='admin-table-panel'>
        <div className='admin-table-header'>
          <div>
            <span className='panel-kicker'>Platform Overview</span>
            <h2>Membership & Control Panel</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Kelola status akun, tier langganan, dan pantau aktivitas pengguna secara real-time.
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
                      </div>
                    </td>
                    <td>
                      <TierBadge tier={u.plan_tier} />
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

      {/* Footer Info */}
      <div className="stack-row" style={{ justifyContent: 'center', opacity: 0.5, fontSize: '0.8rem', marginTop: '20px' }}>
        <FiShield /> Terminal Keamanan Admin Aktif • Sinergi IoT Cloud Management
      </div>
    </div>
  );
}
