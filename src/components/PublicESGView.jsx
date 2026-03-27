import { useState, useEffect } from "react";
import { FiSun, FiZap, FiCheckCircle, FiPackage, FiGlobe, FiMapPin, FiAward } from "react-icons/fi";
import { getPublicESGSummary, API_BASE_URL } from "../api";

export default function PublicESGView() {
  const token = window.location.pathname.split("/").pop();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadPublicData();
  }, [token, year]);

  async function loadPublicData() {
    setLoading(true);
    try {
      const res = await getPublicESGSummary(token, year);
      setData(res);
    } catch (err) {
      setError(err.message || "Laporan ESG tidak ditemukan atau sudah dinonaktifkan.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div className='stack' style={{ alignItems: 'center' }}>
        <FiGlobe size={48} className='spin' style={{ color: 'var(--green)' }} />
        <p style={{ marginTop: '16px', fontWeight: 600, color: 'var(--muted)' }}>Memuat Laporan ESG Publik...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div className='panel' style={{ maxWidth: '400px', textAlign: 'center' }}>
        <FiGlobe size={48} style={{ color: 'var(--muted)', margin: '0 auto 16px' }} />
        <h2 style={{ color: 'var(--text)' }}>Laporan Tidak Tersedia</h2>
        <p style={{ color: 'var(--muted)' }}>{error}</p>
        <button className='primary-button' onClick={() => window.location.href = '/'} style={{ marginTop: '16px' }}>Kembali ke Beranda</button>
      </div>
    </div>
  );

  const { summary, company_name, company_logo } = data;

  return (
    <div className='public-esg-view' style={{ minHeight: '100vh', background: '#f0f4f8', padding: '40px 20px' }}>
      <div className='container' style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Public Header with Branding */}
        <div className='panel' style={{ marginBottom: '24px', padding: '32px', borderTop: '6px solid var(--green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              {company_logo ? (
                <img src={`${API_BASE_URL}${company_logo}`} alt={company_name} style={{ height: '64px', borderRadius: '12px', objectFit: 'contain' }} />
              ) : (
                <div style={{ padding: '16px', background: 'var(--green-soft)', borderRadius: '12px', color: 'var(--green)' }}>
                   <FiGlobe size={32} />
                </div>
              )}
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text)' }}>{company_name || "Enterprise ESG Report"}</h1>
                <p style={{ margin: 0, color: 'var(--muted)', fontWeight: 500 }}>Sertifikasi Transisi Energi & Carbon Offset — {year}</p>
              </div>
            </div>
            <div className='badge' style={{ background: 'var(--green-soft)', color: 'var(--green-dark)', padding: '12px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiAward size={24} />
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>VERIFIED IMPACT</span>
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className='summary-grid' style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className='summary-card' style={{ background: 'var(--green-dark)', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <span className='metric-label' style={{ color: 'rgba(255,255,255,0.7)' }}>Total Clean Energy</span>
            <strong className='metric-value'>{summary.total_actual_mwh.toFixed(3)} <span>MWh</span></strong>
            <FiZap style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.1, fontSize: '5rem' }} />
          </div>
          <div className='summary-card'>
            <span className='metric-label'>Carbon Dioxide Offset</span>
            <strong className='metric-value' style={{ color: 'var(--green-dark)' }}>{summary.total_co2_saved_ton.toFixed(2)} <span>tons</span></strong>
            <FiAward style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.1, fontSize: '2rem' }} />
          </div>
          <div className='summary-card'>
            <span className='metric-label'>Mature Tree Absorption</span>
            <strong className='metric-value'>{summary.total_trees_eq} <span>Trees</span></strong>
            <FiSun style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.1, fontSize: '2rem' }} />
          </div>
          <div className='summary-card'>
            <span className='metric-label'>REC Certificates</span>
            <strong className='metric-value' style={{ color: 'var(--accent)' }}>{summary.total_rec_count} <span>Units</span></strong>
            <FiPackage style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.1, fontSize: '2rem' }} />
          </div>
        </div>

        {/* site list */}
        <div className='panel' style={{ marginBottom: '24px' }}>
          <h3>Sustainability Impact Locations ({summary.site_breakdown.length})</h3>
          <div className='history-table' style={{ marginTop: '16px' }}>
            <table>
              <thead>
                <tr>
                  <th>Fasilitas / Lokasi</th>
                  <th>Produksi (MWh)</th>
                  <th>Carbon Offset (Tons)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.site_breakdown.map(site => (
                  <tr key={site.profile_id}>
                    <td>
                       <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <strong>{site.profile_name}</strong>
                         <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}><FiMapPin size={10} /> {site.location}</span>
                       </div>
                    </td>
                    <td>{site.actual_mwh.toFixed(3)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--green)' }}>{site.co2_saved_ton.toFixed(2)}</td>
                    <td>
                       <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--green-soft)', color: 'var(--green-dark)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                         <FiCheckCircle size={12} /> Verified
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Methodology footer */}
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>This report is generated and verified by <strong>Solar Forecast Monitoring Platform</strong>.</p>
          <p style={{ fontSize: '0.85rem' }}>Methodology compliant with International IREC Standards and local grid emission factors.</p>
          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '20px 0' }} />
          <p style={{ fontSize: '0.8rem' }}>© {new Date().getFullYear()} PT Sinergi IoT Nusantara. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
