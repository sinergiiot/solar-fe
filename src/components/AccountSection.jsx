import { useState } from "react";
import { FiKey, FiPlus, FiTrash2, FiFileText, FiImage } from "react-icons/fi";
import { API_BASE_URL } from "../api";
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
  onDeleteAPIKey,
  onToggleESGShare,
  onCancelSubscription,
  onNavigate,
  onBrandingUpdate,
}) {
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  
  const [companyName, setCompanyName] = useState(currentUser?.company_name || "");
  const [logoFile, setLogoFile] = useState(null);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [brandingFeedback, setBrandingFeedback] = useState("");
  const [isTogglingESG, setIsTogglingESG] = useState(false);

  const handleToggleESG = async () => {
    setIsTogglingESG(true);
    await onToggleESGShare(!currentUser?.esg_share_enabled);
    setIsTogglingESG(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKeyName) return;
    const key = await onCreateAPIKey(newKeyName);
    if (key) {
      setGeneratedKey(key);
      setNewKeyName("");
    }
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setIsSavingBranding(true);
    setBrandingFeedback("");
    try {
      if (onBrandingUpdate) {
        await onBrandingUpdate(companyName, logoFile);
      }
      setBrandingFeedback("Branding berhasil disimpan.");
      setLogoFile(null);
    } catch (err) {
      setBrandingFeedback("Gagal menyimpan: " + err.message);
    } finally {
      setIsSavingBranding(false);
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
            <div style={{ display: 'grid', gap: '8px' }}>
              <span style={{ fontSize: '0.94rem', color: 'var(--muted)' }}>Plan tier</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.82)', border: '1px solid rgba(85, 67, 49, 0.16)', padding: '10px 16px', borderRadius: '16px' }}>
                <TierBadge tier={notificationPreference.plan_tier} />
                <button 
                  type="button" 
                  className="secondary-button" 
                  style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: '0.85rem' }} 
                  onClick={() => onNavigate && onNavigate("pricing")}
                >
                  Ganti Paket
                </button>
                {notificationPreference.plan_tier !== "free" && (
                  <button 
                    type="button" 
                    className="secondary-button danger-light" 
                    style={{ padding: '6px 14px', fontSize: '0.85rem' }} 
                    onClick={() => onCancelSubscription && onCancelSubscription()}
                  >
                    Batalkan
                  </button>
                )}
              </div>
              {notificationPreference.plan_tier !== "free" && notificationPreference.plan_expires_at && (
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px', textAlign: 'right' }}>
                  Berlaku hingga: <strong>{new Date(notificationPreference.plan_expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </div>
              )}
            </div>

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
            <span className='panel-kicker'>Branding</span>
            <h2>White-label Perusahaan</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '4px' }}>Sesuaikan logo dan nama perusahaan untuk Kop Surat & PDF Laporan.</p>
          </div>

          <form className='stack account-notification-form' onSubmit={handleSaveBranding}>
            <label>
              <span>Nama Perusahaan / Organisasi</span>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder='PT Sinergi Energi' />
            </label>
            <label>
              <span>Logo Perusahaan (PNG/JPG, maks 2MB)</span>
              <input type='file' accept="image/png, image/jpeg" onChange={(e) => setLogoFile(e.target.files[0])} />
            </label>
            
            {currentUser?.company_logo_url && !logoFile && (
               <div style={{ marginTop: '8px' }}>
                 <span style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Logo saat ini:</span>
                 <img 
                   src={`${API_BASE_URL}${currentUser.company_logo_url}`} 
                   alt="Company Logo" 
                   style={{ maxHeight: '60px', borderRadius: '8px', border: '1px solid var(--line)' }} 
                 />
               </div>
            )}

            <button className='primary-button' type='submit' disabled={isSavingBranding} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
              <FiImage /> {isSavingBranding ? "Menyimpan..." : "Simpan Branding"}
            </button>
            {brandingFeedback && <div style={{ fontSize: '0.9rem', color: brandingFeedback.includes("Gagal") ? "var(--error)" : "var(--success)", marginTop: '8px' }}>{brandingFeedback}</div>}
          </form>
        </div>
      )}

      {notificationPreference.plan_tier === "enterprise" && (
        <div className='account-notification-block' style={{ marginTop: '40px' }}>
          <div className='panel-heading'>
            <span className='panel-kicker'>Reporting</span>
            <h2>ESG Public Share</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '4px' }}>Bagikan dashboard ESG Anda secara publik untuk transparansi stakeholder.</p>
          </div>
          
          <div className='stack account-notification-form' style={{ gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={currentUser?.esg_share_enabled} 
                  onChange={handleToggleESG}
                  disabled={isTogglingESG}
                />
                <span className="slider round"></span>
              </label>
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                {currentUser?.esg_share_enabled ? "Akses Publik AKTIF" : "Buka Akses Publik"}
              </span>
            </div>

            {currentUser?.esg_share_enabled && currentUser?.esg_share_token && (
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                padding: '16px', 
                borderRadius: '8px', 
                border: '1px dashed var(--line)',
                fontSize: '0.9rem'
              }}>
                <div style={{ color: 'var(--muted)', marginBottom: '8px' }}>URL Public Report:</div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  color: 'var(--primary)',
                  fontWeight: '600',
                  wordBreak: 'break-all',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap'
                }}>
                  <span>{`${window.location.origin}/public/esg/${currentUser.esg_share_token}`}</span>
                  <button 
                    className="secondary-button" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: 'auto' }}
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/public/esg/${currentUser.esg_share_token}`);
                      alert("Link tersalin!");
                    }}
                  >
                    Salin
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {notificationPreference.plan_tier === "enterprise" && (
        <div className='account-notification-block' style={{ marginTop: '40px' }}>
          <div className='panel-heading'>
            <span className='panel-kicker'>Developer</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h2>API Key Management</h2>
              <button 
                type="button" 
                className="docs-link"
                onClick={() => onNavigate("docs")}
              >
                <FiFileText /> Dokumentasi API
              </button>
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
            <div className='history-table' style={{ overflowX: 'auto', display: 'block' }}>
              <table style={{ minWidth: '600px', width: '100%' }}>
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
