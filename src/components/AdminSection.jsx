import { useState, useEffect } from "react";
import { FiUsers, FiShield, FiCheck, FiX } from "react-icons/fi";
import { adminGetUsers, adminUpdateUserTier } from "../api";
import TierBadge from "./TierBadge";

export default function AdminSection() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingID, setUpdatingID] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const data = await adminGetUsers();
      setUsers(data || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateTier(userID, newTier) {
    setUpdatingID(userID);
    try {
      await adminUpdateUserTier(userID, newTier);
      await loadUsers();
    } catch (err) {
      alert("Gagal update tier: " + err.message);
    } finally {
      setUpdatingID("");
    }
  }

  if (isLoading && users.length === 0) {
    return (
      <section className='panel panel-wide'>
        <div className='empty-state'>Memuat data pengguna...</div>
      </section>
    );
  }

  return (
    <section className='panel panel-wide'>
      <div className='panel-heading'>
        <span className='panel-kicker'>Super Admin</span>
        <h2>Manajemen Pengguna & Tier</h2>
      </div>

      {error && <div className='banner banner-error' style={{ marginBottom: '20px' }}>{error}</div>}

      <div className='history-table'>
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Current Tier</th>
              <th>Aksi Upgrade</th>
              <th>Dibuat Pada</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`match-status ${u.role === 'admin' ? 'match-status-ready' : 'match-status-pending'}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <TierBadge tier={u.plan_tier} />
                </td>
                <td>
                  <div className='stack-row' style={{ gap: '8px' }}>
                    <button 
                      className='secondary-button' 
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      disabled={updatingID === u.id || u.plan_tier === 'free'}
                      onClick={() => handleUpdateTier(u.id, 'free')}
                    >
                      Free
                    </button>
                    <button 
                      className='secondary-button' 
                      style={{ padding: '4px 8px', fontSize: '11px', borderColor: 'orange', color: 'orange' }}
                      disabled={updatingID === u.id || u.plan_tier === 'pro'}
                      onClick={() => handleUpdateTier(u.id, 'pro')}
                    >
                      Pro
                    </button>
                    <button 
                      className='secondary-button' 
                      style={{ padding: '4px 8px', fontSize: '11px', borderColor: 'var(--brand)', color: 'var(--brand)' }}
                      disabled={updatingID === u.id || u.plan_tier === 'enterprise'}
                      onClick={() => handleUpdateTier(u.id, 'enterprise')}
                    >
                      Ent
                    </button>
                  </div>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
