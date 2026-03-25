import { FiLock, FiDownload, FiCheckCircle, FiFileText } from "react-icons/fi";
import { useState, useEffect } from "react";
import { getEnergyReport, getStoredToken, API_BASE_URL, downloadHistoryCSV } from "../api";
import { getTodayLocalDate, getDateDaysAgo } from "../utils";

export default function ReportSection({ planTier, profiles }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProfileID, setSelectedProfileID] = useState("");
  const [startDate, setStartDate] = useState(getDateDaysAgo(30));
  const [endDate, setEndDate] = useState(getTodayLocalDate());
  const [isAnnual, setIsAnnual] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [officialLetter, setOfficialLetter] = useState(false);
  const [userType, setUserType] = useState("corporate");
  const [signatory, setSignatory] = useState("");
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");

  const isLocked = planTier === "free";

  async function handleLoadReport() {
    if (isLocked) return;
    setLoading(true);
    setError("");
    try {
      const p = {
        profile_id: selectedProfileID,
      };
      if (isAnnual) {
        p.is_annual = "true";
        p.year = year;
        p.official_letter = officialLetter ? "true" : "false";
        p.user_type = userType;
        p.signatory = signatory;
        p.title = userType === "household" ? "Pemilik Rumah" : title;
        p.organization = organization;
      } else {
        p.start_date = startDate;
        p.end_date = endDate;
      }
      const data = await getEnergyReport(p);
      setReport(data);
    } catch (err) {
      setError(err.message || "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    try {
      const token = getStoredToken();
      const params = new URLSearchParams({
        profile_id: selectedProfileID,
      });
      if (isAnnual) {
        params.append("is_annual", "true");
        params.append("year", year);
        params.append("official_letter", officialLetter ? "true" : "false");
        params.append("user_type", userType);
        params.append("signatory", signatory);
        params.append("title", userType === "household" ? "Pemilik Rumah" : title);
        params.append("organization", organization);
      } else {
        params.append("start_date", startDate);
        params.append("end_date", endDate);
      }
      
      const response = await fetch(`${API_BASE_URL}/report/energy/pdf?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Gagal mengunduh PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Energi_${endDate.replace(/-/g, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Gagal mengunduh PDF");
    }
  }

  async function handleDownloadCSV() {
    try {
      const p = {
        profile_id: selectedProfileID,
        start_date: startDate,
        end_date: endDate,
        tier: planTier
      };
      await downloadHistoryCSV(p);
    } catch (err) {
      setError(err.message || "Gagal mengunduh CSV");
    }
  }

  if (isLocked) {
    return (
      <div className='lock-screen'>
        <div className='lock-card'>
          <FiLock className='lock-icon' />
          <h2>Laporan Hijau & ESG</h2>
          <p>Dapatkan laporan akumulasi penghematan biaya dan CO2 yang siap dilampirkan untuk klaim insentif atau laporan ESG.</p>
          <div className='lock-benefits'>
            <div className='benefit-item'><FiCheckCircle /> Laporan Bulanan PDF</div>
            <div className='benefit-item'><FiCheckCircle /> Akumulasi MWh (REC-ready)</div>
            <div className='benefit-item'><FiCheckCircle /> Tracker Emisi CO2 Avoided</div>
          </div>
          <button className='primary-button' onClick={() => window.alert('Upgrade ke Pro untuk fitur ini!')}>
            Upgrade ke Pro Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='report-section stack'>
      <div className='panel report-controls'>
        <div className='report-filters'>
          <label>
            <span>Pilih Lokasi</span>
            <select value={selectedProfileID} onChange={(e) => setSelectedProfileID(e.target.value)}>
              <option value=''>Semua Lokasi</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.site_name}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', height: '42px', marginBottom: '4px' }}>
            <label className="checkbox-label" style={{ margin: 0 }}>
              <input type='checkbox' checked={isAnnual} onChange={(e) => setIsAnnual(e.target.checked)} />
              <span>Mode Laporan Tahunan</span>
            </label>
          </div>
          
          {!isAnnual ? (
            <>
              <label>
                <span>Mulai</span>
                <input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>
              <label>
                <span>Hingga</span>
                <input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </label>
            </>
          ) : (
            <label>
              <span>Tahun</span>
              <input type='number' value={year} onChange={(e) => setYear(e.target.value)} style={{ minWidth: '150px' }} />
            </label>
          )}

          <button className='primary-button' onClick={handleLoadReport} disabled={loading} style={{ alignSelf: 'flex-end', marginBottom: '4px' }}>
            {loading ? "Memproses..." : "Tampilkan Laporan"}
          </button>
        </div>

        {isAnnual && (
          <div className='report-filters' style={{ marginTop: '20px', padding: '16px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', height: '42px', width: '100%' }}>
              <label className="checkbox-label" style={{ margin: 0, width: '100%', background: 'transparent', border: 'none' }}>
                <input type='checkbox' checked={officialLetter} onChange={(e) => setOfficialLetter(e.target.checked)} />
                <span style={{ fontWeight: 600, color: 'var(--accent-deep)' }}>Sertakan Surat Resmi (PBB Letter) / ESG Appendix</span>
              </label>
            </div>

            {officialLetter && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type='radio' style={{ width: 'auto' }} checked={userType === 'corporate'} onChange={() => setUserType('corporate')} />
                    <span>Perusahaan / Instansi</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type='radio' style={{ width: 'auto' }} checked={userType === 'household'} onChange={() => setUserType('household')} />
                    <span>Rumah Tangga</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%' }}>
                  <label style={{ flex: '1 1 200px' }}>
                    <span>{userType === 'household' ? 'Nama Pemilik' : 'Penanda Tangan'}</span>
                    <input type='text' placeholder={userType === 'household' ? 'Misal: Bapak Budi Santoso' : 'Nama Lengkap'} value={signatory} onChange={(e) => setSignatory(e.target.value)} />
                  </label>
                  
                  {userType === 'corporate' && (
                    <label style={{ flex: '1 1 200px' }}>
                      <span>Jabatan</span>
                      <input type='text' placeholder='Direktur / Kadis' value={title} onChange={(e) => setTitle(e.target.value)} />
                    </label>
                  )}
                  
                  <label style={{ flex: '1 1 200px' }}>
                    <span>{userType === 'household' ? 'Alamat Rumah' : 'Instansi'}</span>
                    <input type='text' placeholder={userType === 'household' ? 'Jl. Anggrek No 1' : 'Nama Perusahaan / Dinas'} value={organization} onChange={(e) => setOrganization(e.target.value)} />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <div className='banner banner-error'>{error}</div>}

      {report && (
        <div className='report-grid'>
          <div className='panel report-card'>
            <span className='card-label'>Total Produksi</span>
            <strong className='card-value'>{report.total_actual_kwh.toFixed(1)} <span>kWh</span></strong>
          </div>
          <div className='panel report-card'>
            <span className='card-label'>Total Penghematan</span>
            <strong className='card-value'>Rp {report.total_savings_idr.toLocaleString('id-ID')}</strong>
          </div>
          <div className='panel report-card'>
            <span className='card-label'>CO2 Avoided</span>
            <strong className='card-value'>{report.total_co2_avoided_kg.toFixed(1)} <span>kg</span></strong>
          </div>
          <div className='panel report-card'>
            <span className='card-label'>Data Coverage</span>
            <strong className='card-value'>{report.data_coverage_pct.toFixed(0)}%</strong>
          </div>

          <div className='panel panel-wide report-summary-panel'>
            <h3>Rangkuman Efisiensi</h3>
            <p>Berdasarkan produksi aktual {report.total_actual_kwh.toFixed(1)} kWh, Anda telah berkontribusi mengurangi emisi karbon sebanyak {report.total_co2_avoided_kg.toFixed(2)} kg CO2.</p>
            <div className='report-actions'>
               <button className='secondary-button' onClick={handleDownloadPDF}>
                 <FiDownload /> PDF Report
               </button>
               <button className='secondary-button' onClick={handleDownloadCSV} style={{ gap: '8px' }}>
                 <FiFileText /> Export CSV
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
