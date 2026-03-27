import { useState } from 'react';
import { FiCheck, FiX, FiZap, FiAward, FiBriefcase, FiArrowRight, FiStar } from 'react-icons/fi';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 'Rp 0',
    period: 'selamanya',
    tagline: 'Mulai tanpa biaya',
    desc: 'Untuk pemilik rumah tangga & pemantauan dasar.',
    icon: <FiZap size={16} />,
    gradient: 'linear-gradient(135deg, #6b6257, #a89a8c)',
    accentColor: '#6b6257',
    features: [
      { text: '1 Solar Profile (Site)', ok: true },
      { text: '1 IoT Device', ok: true },
      { text: '7 Hari Riwayat', ok: true },
      { text: 'Forecast Harian', ok: true },
      { text: 'Notifikasi Email', ok: true },
      { text: 'Laporan PDF', ok: false },
      { text: 'REC Readiness Report', ok: false },
      { text: 'ESG Dashboard', ok: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'Rp 99.000',
    period: '/bulan',
    tagline: 'Paling Populer',
    desc: 'Untuk bangunan komersial & UKM.',
    icon: <FiAward size={16} />,
    gradient: 'linear-gradient(135deg, #15965a, #0a5f39)',
    accentColor: '#15965a',
    popular: true,
    features: [
      { text: 'Hingga 5 Solar Profile', ok: true },
      { text: 'Hingga 10 IoT Device', ok: true },
      { text: '90 Hari Riwayat Data', ok: true },
      { text: 'Laporan PDF & Surat PBB', ok: true },
      { text: 'WA & Telegram Notif', ok: true },
      { text: 'REC Readiness Report', ok: true },
      { text: 'CSV Export History', ok: true },
      { text: 'ESG Dashboard', ok: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Rp 499.000',
    period: '/bulan',
    tagline: 'Solusi Korporat',
    desc: 'Industri, fleet & manajemen ESG skala penuh.',
    icon: <FiBriefcase size={16} />,
    gradient: 'linear-gradient(135deg, #1c1b1a, #45403d)',
    accentColor: '#d65d0e',
    features: [
      { text: 'Unlimited Solar Profile', ok: true },
      { text: 'Unlimited IoT Device', ok: true },
      { text: 'Riwayat Selamanya', ok: true },
      { text: 'ESG Dashboard Multi-site', ok: true },
      { text: 'White-label Logo', ok: true },
      { text: 'Public Share ESG Link', ok: true },
      { text: 'External API Access', ok: true },
      { text: 'Priority Support', ok: true },
    ],
  },
];

const FAQ = [
  {
    q: 'Kapan perlu paket Pro?',
    a: 'Saat butuh laporan PDF resmi untuk PBB/REC atau riwayat data >7 hari.',
  },
  {
    q: 'Apa itu White-label?',
    a: 'Logo perusahaan Anda tampil di Dashboard & semua laporan PDF.',
  },
  {
    q: 'Ada kontrak minimal?',
    a: 'Tidak. Berhenti kapan saja — paket aktif sampai masa penagihan habis.',
  },
];

export default function PricingSection({ onUpgrade, currentTier = 'free' }) {
  const [hoveredTier, setHoveredTier] = useState(null);

  const tierOrder = { free: 0, pro: 1, enterprise: 2 };
  const isDowngrade = (tierId) => tierOrder[tierId] < tierOrder[currentTier];

  return (
    <div style={{ width: '100%' }}>
      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span style={{
          display: 'inline-block',
          background: 'rgba(21,150,90,0.12)',
          color: '#15965a',
          fontWeight: 700,
          fontSize: '0.68rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '3px 10px',
          borderRadius: '99px',
          marginBottom: '8px',
        }}>
          Paket & Harga
        </span>
        <h2 style={{
          margin: '0 0 6px',
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: '1.6rem',
          color: 'var(--text)',
          lineHeight: 1.1,
        }}>
          Pilih Paket yang Tepat
        </h2>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>
          Dari monitoring dasar hingga laporan ESG korporat.
        </p>
      </div>

      {/* ── Grid 3 Kolom ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '14px',
        marginBottom: '20px',
        alignItems: 'start',
      }}>
        {TIERS.map((tier) => {
          const isActive = currentTier === tier.id;
          const isHov = hoveredTier === tier.id;

          return (
            <div
              key={tier.id}
              onMouseEnter={() => setHoveredTier(tier.id)}
              onMouseLeave={() => setHoveredTier(null)}
              style={{
                position: 'relative',
                background: tier.popular
                  ? 'linear-gradient(180deg, rgba(240,255,247,0.98), rgba(228,252,239,0.96))'
                  : 'rgba(255,251,245,0.95)',
                border: tier.popular
                  ? '2px solid rgba(21,150,90,0.4)'
                  : isActive
                  ? '2px solid rgba(214,93,14,0.45)'
                  : '1px solid rgba(61,48,35,0.12)',
                borderRadius: '18px',
                padding: '22px 18px 18px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                transform: isHov ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: tier.popular
                  ? isHov ? '0 16px 32px rgba(21,150,90,0.18)' : '0 6px 16px rgba(21,150,90,0.1)'
                  : isHov ? '0 8px 20px rgba(64,34,7,0.09)' : '0 2px 6px rgba(64,34,7,0.05)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Top Badge */}
              {tier.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-11px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #15965a, #0a5f39)',
                  color: 'white',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '3px 12px',
                  borderRadius: '99px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 3px 8px rgba(21,150,90,0.3)',
                }}>
                  <FiStar size={8}/> Paling Populer
                </div>
              )}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '-11px',
                  right: '14px',
                  background: 'linear-gradient(135deg, #d65d0e, #af4a0c)',
                  color: 'white',
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: '99px',
                  whiteSpace: 'nowrap',
                }}>
                  ✓ Aktif
                </div>
              )}

              {/* Header card: icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{
                  background: tier.gradient,
                  borderRadius: '10px',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                  boxShadow: `0 3px 8px ${tier.accentColor}35`,
                }}>
                  {tier.icon}
                </div>
                <div>
                  <div style={{ fontFamily: '"Space Grotesk",sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--text)', lineHeight: 1 }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: '0.67rem', color: tier.accentColor, fontWeight: 600, marginTop: '2px' }}>
                    {tier.tagline}
                  </div>
                </div>
              </div>

              {/* Harga */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginBottom: '3px', flexWrap: 'nowrap' }}>
                <span style={{ fontFamily: '"Space Grotesk",sans-serif', fontWeight: 800, fontSize: '1.45rem', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                  {tier.price}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {tier.period}
                </span>
              </div>

              <p style={{ margin: '0 0 14px', fontSize: '0.76rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                {tier.desc}
              </p>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(61,48,35,0.08)', marginBottom: '12px' }} />

              {/* Feature list */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', flex: 1 }}>
                {tier.features.map((f, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '7px',
                    fontSize: '0.76rem',
                    color: f.ok ? 'var(--text)' : 'var(--muted)',
                    opacity: f.ok ? 1 : 0.45,
                  }}>
                    {f.ok
                      ? <FiCheck size={11} style={{ color: '#15965a', flexShrink: 0 }} />
                      : <FiX size={11} style={{ color: '#aaa', flexShrink: 0 }} />
                    }
                    <span style={{ textDecoration: f.ok ? 'none' : 'line-through', lineHeight: 1.3 }}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                disabled={isActive || (isDowngrade(tier.id) && tier.id !== 'free')}
                onClick={() => onUpgrade(tier.id)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: (isActive || (isDowngrade(tier.id) && tier.id !== 'free')) ? 'default' : 'pointer',
                  border: isActive
                    ? '1px solid rgba(214,93,14,0.25)'
                    : tier.popular
                    ? 'none'
                    : tier.id === 'enterprise'
                    ? 'none'
                    : '1px solid rgba(61,48,35,0.14)',
                  background: isActive
                    ? 'rgba(214,93,14,0.07)'
                    : tier.popular
                    ? 'linear-gradient(135deg, #15965a, #0a5f39)'
                    : tier.id === 'enterprise'
                    ? 'linear-gradient(135deg, #1c1b1a, #45403d)'
                    : 'rgba(255,255,255,0.8)',
                  color: isActive
                    ? '#d65d0e'
                    : (tier.popular || tier.id === 'enterprise')
                    ? 'white'
                    : 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.18s ease',
                  opacity: (isDowngrade(tier.id) && !isActive && tier.id !== 'free') ? 0.3 : 1,
                  boxShadow: (tier.popular && !isActive) ? '0 4px 10px rgba(21,150,90,0.28)' : 'none',
                }}
              >
                {isActive ? '✓ Paket Aktif'
                  : tier.id === 'free' ? 'Downgrade ke Free'
                  : <><span>Upgrade ke {tier.name}</span> <FiArrowRight size={11} /></>
                }
              </button>
            </div>
          );
        })}
      </div>

      {/* ── FAQ ── */}
      <div style={{
        background: 'rgba(255,251,245,0.95)',
        border: '1px solid rgba(61,48,35,0.1)',
        borderRadius: '16px',
        padding: '20px 24px',
        backdropFilter: 'blur(10px)',
      }}>
        <h3 style={{ margin: '0 0 16px', fontFamily: '"Space Grotesk",sans-serif', fontSize: '0.95rem', color: 'var(--text)' }}>
          Pertanyaan Umum
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '10px',
              border: '1px solid rgba(61,48,35,0.07)',
            }}>
              <strong style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text)' }}>
                {item.q}
              </strong>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
