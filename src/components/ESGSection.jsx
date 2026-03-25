import { useState, useEffect, useMemo } from "react";
import { FiFileText, FiGlobe, FiSun, FiZap, FiCheckCircle, FiPackage, FiTrendingUp, FiShare2, FiLink, FiCopy, FiExternalLink, FiDownload } from "react-icons/fi";
import { getESGSummary, getESGShareStatus, enableESGShare, disableESGShare, downloadESGReportPDF } from "../api";
import { formatIDR } from "../utils";

export default function ESGSection({ planTier }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [shareStatus, setShareStatus] = useState({ enabled: false, token: "" });
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

  const isEnterprise = planTier === "enterprise";

  useEffect(() => {
    if (isEnterprise) {
      loadESGData();
      loadShareStatus();
    }
  }, [isEnterprise, year]);

  async function loadShareStatus() {
    try {
      const status = await getESGShareStatus();
      setShareStatus(status);
    } catch (err) {
      console.error("Failed to load share status", err);
    }
  }

  async function handleToggleShare() {
    setIsUpdatingShare(true);
    try {
      if (shareStatus.enabled) {
        const res = await disableESGShare();
        setShareStatus(res);
      } else {
        const res = await enableESGShare();
        setShareStatus(res);
      }
    } catch (err) {
      setError(err.message || "Gagal mengubah status berbagi");
    } finally {
      setIsUpdatingShare(false);
    }
  }

  function handleCopyLink() {
    const publicUrl = `${window.location.origin}/public/esg/${shareStatus.token}`;
    navigator.clipboard.writeText(publicUrl);
    setCopyFeedback("Link disalin!");
    setTimeout(() => setCopyFeedback(""), 2000);
  }

  async function handleDownloadPDF() {
    setIsDownloading(true);
    try {
      await downloadESGReportPDF({ year });
    } catch (err) {
      window.alert("Gagal men-download laporan ESG");
    } finally {
      setIsDownloading(false);
    }
  }

  async function loadESGData() {
    setLoading(true);
    try {
      const summary = await getESGSummary({ year });
      setData(summary);
    } catch (err) {
      setError(err.message || "Gagal memuat data ESG");
    } finally {
      setLoading(false);
    }
  }

  if (!isEnterprise) {
    return (
      <div className='lock-screen' style={{ minHeight: '400px' }}>
        <div className='lock-card'>
          <FiGlobe className='lock-icon' style={{ color: 'var(--green)' }} />
          <h2>ESG Strategy Dashboard</h2>
          <p>Dashboard khusus untuk memantau dampak lingkungan perusahaan di seluruh lokasi (Multi-site) secara agregat.</p>
          <div className='lock-benefits'>
             <div className='benefit-item'><FiZap /> Agregasi Produksi Seluruh Site</div>
             <div className='benefit-item'><FiGlobe /> Total Carbon Offset Portfolio</div>
             <div className='benefit-item'><FiTrendingUp /> Sustainability Reporting Readiness</div>
          </div>
          <button className='primary-button' style={{ background: 'var(--green)' }} onClick={() => window.alert('Hubungi tim Sales untuk upgrade ke Enterprise!')}>
            Upgrade ke Enterprise
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className='panel'>Memuat data ESG...</div>;
  if (error) return <div className='panel banner-error'>{error}</div>;

  return (
    <div className='esg-section stack'>
      <div className='panel esg-header' style={{ background: 'linear-gradient(135deg, var(--green-soft) 0%, #fff 100%)', border: '1px solid var(--green)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className='panel-kicker' style={{ color: 'var(--green-dark)' }}>Sustainability Portfolio</span>
            <h2 style={{ color: 'var(--green-dark)', margin: 0 }}>Environmental Impact Dashboard</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Share Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>Public Share</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: shareStatus.enabled ? 'var(--green)' : 'var(--muted)' }}>
                  {shareStatus.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <button 
                className={`secondary-button ${shareStatus.enabled ? 'active-green' : ''}`} 
                onClick={handleToggleShare} 
                disabled={isUpdatingShare}
                style={{ padding: '8px', minWidth: 'auto', borderRadius: '8px' }}
              >
                <FiShare2 size={16} />
              </button>
            </div>

            {shareStatus.enabled && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className='secondary-button' onClick={handleCopyLink} style={{ gap: '6px' }}>
                  {copyFeedback ? <FiCheckCircle /> : <FiCopy />}
                  {copyFeedback || 'Copy URL'}
                </button>
                <a 
                  href={`/public/esg/${shareStatus.token}`} 
                  target='_blank' 
                  rel='noreferrer'
                  className='secondary-button'
                  style={{ padding: '10px', minWidth: 'auto' }}
                >
                  <FiExternalLink />
                </a>
              </div>
            )}

            <button 
              className='secondary-button' 
              onClick={handleDownloadPDF} 
              disabled={isDownloading}
              style={{ gap: '6px' }}
            >
              {isDownloading ? <FiTrendingUp className='spin' /> : <FiDownload />}
              ESG Report
            </button>

            <div style={{ width: '1px', height: '30px', background: 'var(--line)', margin: '0 8px' }} />

            <input 
              type='number' 
              value={year} 
              onChange={(e) => setYear(e.target.value)} 
              style={{ width: '100px', height: '40px' }}
            />
            <button className='secondary-button' onClick={loadESGData}><FiTrendingUp /> Refresh</button>
          </div>
        </div>
      </div>

      <div className='summary-grid'>
        <div className='summary-card' style={{ background: 'var(--green-dark)', color: 'white' }}>
          <span className='metric-label' style={{ color: 'rgba(255,255,255,0.8)' }}>Total Clean Energy</span>
          <strong className='metric-value'>{data.total_actual_mwh.toFixed(3)} <span>MWh</span></strong>
          <span className='metric-sublabel'>cumulative across all sites</span>
          <FiZap style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.2, fontSize: '2rem' }} />
        </div>
        <div className='summary-card'>
          <span className='metric-label'>Carbon Dioxide Offset</span>
          <strong className='metric-value' style={{ color: 'var(--green-dark)' }}>{data.total_co2_saved_ton.toFixed(2)} <span>tons CO2</span></strong>
          <span className='metric-sublabel'>avoided emissions</span>
          <FiCheckCircle style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.1, fontSize: '2rem' }} />
        </div>
        <div className='summary-card'>
          <span className='metric-label'>Bio-Conversion Equivalent</span>
          <strong className='metric-value'>{data.total_trees_eq} <span>Trees</span></strong>
          <span className='metric-sublabel'>mature trees absorption/year</span>
          <FiSun style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.1, fontSize: '2rem' }} />
        </div>
        <div className='summary-card'>
          <span className='metric-label'>Energy Attribute (REC)</span>
          <strong className='metric-value' style={{ color: 'var(--accent)' }}>{data.total_rec_count} <span>Units</span></strong>
          <span className='metric-sublabel'>ready for green certification</span>
          <FiPackage style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.1, fontSize: '2rem' }} />
        </div>
      </div>

      <div className='panel'>
        <div className='panel-heading'>
          <h3>Yearly Sustainability Trend ({year})</h3>
        </div>
        <div className='dashboard-chart-grid'>
          <div className='dashboard-line-chart' style={{ gridColumn: 'span 2' }}>
            {data.yearly_trend.map((m) => (
              <div key={m.month} className='dashboard-line-row'>
                <span className='dashboard-line-label' style={{ width: '80px' }}>{m.month}</span>
                <div className='dashboard-line-track'>
                  <div 
                    className='dashboard-line-bar' 
                    style={{ 
                      width: `${Math.min(100, (m.actual_mwh / (data.total_actual_mwh / 6)) * 100)}%`,
                      background: 'var(--green)'
                    }} 
                  />
                </div>
                <span className='dashboard-line-value'>{m.actual_mwh.toFixed(2)} MWh</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='panel'>
        <div className='panel-heading'>
          <h3>Site Performance Breakdown</h3>
        </div>
        <div className='history-table'>
          <table>
            <thead>
              <tr>
                <th>Site Name</th>
                <th>Location</th>
                <th>Actual Energy (MWh)</th>
                <th>Carbon Saved (Tons)</th>
                <th>REC Progress</th>
              </tr>
            </thead>
            <tbody>
              {data.site_breakdown.map((site) => (
                <tr key={site.profile_id}>
                  <td><strong>{site.profile_name}</strong></td>
                  <td style={{ fontSize: '0.85rem', opacity: 0.7 }}>{site.location}</td>
                  <td>{site.actual_mwh.toFixed(3)}</td>
                  <td style={{ color: 'var(--green-dark)', fontWeight: 600 }}>{site.co2_saved_ton.toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className='forecast-hourly-bar-track' style={{ width: '60px', height: '6px' }}>
                        <div className='forecast-hourly-bar-fill' style={{ width: `${(site.actual_mwh % 1) * 100}%`, background: 'var(--accent)' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem' }}>{site.rec_reached} REC</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className='panel report-summary-panel' style={{ border: '2px dashed var(--green)' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ background: 'var(--green-soft)', padding: '20px', borderRadius: '50%', color: 'var(--green-dark)' }}>
            <FiZap size={32} />
          </div>
          <div>
            <h3>Clean Energy Transition Index</h3>
            <p>Anda telah mencapai <strong>{data.clean_energy_pct.toFixed(2)}%</strong> dari target kapasitas energi hijau untuk portofolio ini. Teruskan ekspansi untuk mencapai Net Zero Emission lebih cepat.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
