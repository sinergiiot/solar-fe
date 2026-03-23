import { useState } from "react";
import { FiKey, FiPlus, FiTrash2, FiFileText } from "react-icons/fi";
import TierBadge from "./TierBadge";

// AccountSection renders account info and notification preference form.
export default function AccountSection({ 
  currentUser, 
  notificationPreference, 
  setNotificationPreference, 
  handleSaveNotificationPreference, 
  isSavingNotificationPreference, 
  isLoadingNotificationPreference,
  apiKeys = [],
  isLoadingAPIKeys = false,
  isSavingAPIKey = false,
  onCreateAPIKey,
  onDeleteAPIKey
}) {
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKeyName) return;
    const key = await onCreateAPIKey(newKeyName);
    if (key) {
      setGeneratedKey(key);
      setNewKeyName("");
    }
  };
  return (
    <section className='panel panel-wide summary-panel'>
      <div className='panel-heading'>
        <span className='panel-kicker'>Session</span>
        <h2>Account Information</h2>
      </div>
      <div className='account-info'>
        <div className='info-group'>
          <span className='info-label'>Nama</span>
          <strong className='info-value'>{currentUser?.name || "-"}</strong>
        </div>
        <div className='info-group'>
          <span className='info-label'>Email</span>
          <strong className='info-value'>{currentUser?.email || "-"}</strong>
        </div>
        <div className='info-group'>
          <span className='info-label'>Status</span>
          <strong className='info-value' style={{ color: "var(--success)" }}>
            Authenticated
          </strong>
        </div>
      </div>

      <div className='account-notification-block'>
        <div className='panel-heading'>
          <span className='panel-kicker'>Notification</span>
          <h2>Notifikasi Otomatis 06:00</h2>
        </div>

        {isLoadingNotificationPreference ? (
          <div className='empty-state'>Memuat pengaturan notifikasi...</div>
        ) : (
          <form className='stack account-notification-form' onSubmit={handleSaveNotificationPreference}>
            <label>
              <span>Plan tier</span>
              <select
                value={notificationPreference.plan_tier === "paid" ? "pro" : notificationPreference.plan_tier}
                onChange={(event) => {
                  const nextPlan = event.target.value;
                  setNotificationPreference((current) => ({
                    ...current,
                    plan_tier: nextPlan,
                    ...(nextPlan === "free"
                      ? {
                          whatsapp_enabled: false,
                          whatsapp_opted_in: false,
                          ...(current.primary_channel === "whatsapp" ? { primary_channel: "email" } : {}),
                        }
                      : {}),
                  }));
                }}>
                <option value='free'>Free (Basic)</option>
                <option value='pro'>Pro (Personal & Advanced)</option>
                <option value='enterprise'>Enterprise (Business & API)</option>
              </select>
              <div style={{ marginTop: '4px' }}>
                <TierBadge tier={notificationPreference.plan_tier} />
              </div>
            </label>

            <label>
              <span>Primary channel</span>
              <select value={notificationPreference.primary_channel} onChange={(event) => setNotificationPreference((current) => ({ ...current, primary_channel: event.target.value }))}>
                <option value='email'>Email</option>
                <option value='telegram'>Telegram</option>
                {notificationPreference.plan_tier !== "free" && <option value='whatsapp'>WhatsApp</option>}
              </select>
            </label>

            <label>
              <span>Timezone</span>
              <input value={notificationPreference.timezone} onChange={(event) => setNotificationPreference((current) => ({ ...current, timezone: event.target.value }))} placeholder='Asia/Jakarta' />
            </label>

            <label>
              <span>Jam kirim (HH:MM:SS)</span>
              <input value={notificationPreference.preferred_send_time} onChange={(event) => setNotificationPreference((current) => ({ ...current, preferred_send_time: event.target.value }))} placeholder='06:00:00' />
            </label>

            <div className='notification-toggle-grid'>
              <label className='notification-toggle'>
                <input type='checkbox' checked={notificationPreference.email_enabled} onChange={(event) => setNotificationPreference((current) => ({ ...current, email_enabled: event.target.checked }))} />
                <span>Email enabled</span>
              </label>

              <label className='notification-toggle'>
                <input type='checkbox' checked={notificationPreference.telegram_enabled} onChange={(event) => setNotificationPreference((current) => ({ ...current, telegram_enabled: event.target.checked }))} />
                <span>Telegram enabled</span>
              </label>

              <label className='notification-toggle'>
                 <input
                  type='checkbox'
                  checked={notificationPreference.whatsapp_enabled}
                  disabled={notificationPreference.plan_tier === "free"}
                  onChange={(event) => setNotificationPreference((current) => ({ ...current, whatsapp_enabled: event.target.checked }))}
                />
                <span>WhatsApp enabled (Pro/Enterprise)</span>
              </label>
            </div>

            <label>
              <span>Telegram chat ID (opsional)</span>
              <input value={notificationPreference.telegram_chat_id} onChange={(event) => setNotificationPreference((current) => ({ ...current, telegram_chat_id: event.target.value }))} placeholder='123456789' />
            </label>

            <label>
              <span>WhatsApp phone E.164 (opsional)</span>
              <input value={notificationPreference.whatsapp_phone_e164} onChange={(event) => setNotificationPreference((current) => ({ ...current, whatsapp_phone_e164: event.target.value }))} placeholder='62812xxxxxxx' />
            </label>

            <label className='notification-toggle'>
              <input
                type='checkbox'
                checked={notificationPreference.whatsapp_opted_in}
                disabled={notificationPreference.plan_tier === "free"}
                onChange={(event) => setNotificationPreference((current) => ({ ...current, whatsapp_opted_in: event.target.checked }))}
              />
              <span>WhatsApp opt-in confirmed (Pro/Enterprise)</span>
            </label>

            <button className='primary-button' type='submit' disabled={isSavingNotificationPreference}>
              {isSavingNotificationPreference ? "Menyimpan..." : "Simpan Pengaturan Notifikasi"}
            </button>
          </form>
        )}
      </div>

      {notificationPreference.plan_tier === "enterprise" && (
        <div className='account-notification-block' style={{ marginTop: '40px' }}>
          <div className='panel-heading'>
            <span className='panel-kicker'>Developer</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h2>API Key Management</h2>
              <a 
                href="/docs/api-guide.md" 
                target="_blank" 
                rel="noopener noreferrer"
                className="docs-link"
              >
                <FiFileText /> Dokumentasi API
              </a>
            </div>
          </div>

          <form className='stack' onSubmit={handleCreate} style={{ marginBottom: '24px' }}>
            <label>
              <span>Nama Key Baru</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  value={newKeyName} 
                  onChange={(e) => setNewKeyName(e.target.value)} 
                  placeholder='e.g. My Production App' 
                  disabled={isSavingAPIKey}
                />
                <button 
                  className='primary-button' 
                  type='submit' 
                  disabled={isSavingAPIKey}
                  style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiPlus /> Buat Key
                </button>
              </div>
            </label>
          </form>

          {generatedKey && (
            <div className='banner banner-success' style={{ marginBottom: '24px', position: 'relative' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Key Berhasil Dibuat!</div>
              <p>Simpan key ini sekarang, karena Anda tidak akan bisa melihatnya lagi:</p>
              <div style={{ 
                background: 'rgba(255,255,255,0.2)', 
                padding: '12px', 
                borderRadius: '8px', 
                fontFamily: 'monospace', 
                wordBreak: 'break-all',
                marginTop: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {generatedKey}
                <button 
                  className='banner-close' 
                  style={{ position: 'static' }} 
                  onClick={() => setGeneratedKey("")}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {isLoadingAPIKeys ? (
            <div className='empty-state'>Memuat API Keys...</div>
          ) : apiKeys.length > 0 ? (
            <div className='history-table'>
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Preview</th>
                    <th>Terakhir Digunakan</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((k) => (
                    <tr key={k.id}>
                      <td>{k.name}</td>
                      <td><code>{k.api_key_preview}</code></td>
                      <td>{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Belum pernah'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className='banner-close' 
                          style={{ position: 'static', color: 'var(--error)' }} 
                          onClick={() => onDeleteAPIKey(k.id)}
                          title='Hapus Key'
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='empty-state'>Anda belum memiliki API Key.</div>
          )}
        </div>
      )}
    </section>
  );
}
