import { FiLock, FiDownload, FiCheckCircle } from "react-icons/fi";
import { useState, useEffect } from "react";
import { getEnergyReport, getStoredToken, API_BASE_URL } from "../api";
import { getTodayLocalDate, getDateDaysAgo } from "../utils";

export default function ReportSection({ planTier, profiles }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProfileID, setSelectedProfileID] = useState("");
  const [startDate, setStartDate] = useState(getDateDaysAgo(30));
  const [endDate, setEndDate] = useState(getTodayLocalDate());

  const isLocked = planTier === "free";

  async function handleLoadReport() {
    if (isLocked) return;
    setLoading(true);
    setError("");
    try {
      const data = await getEnergyReport({
        profile_id: selectedProfileID,
        start_date: startDate,
        end_date: endDate
      });
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
        start_date: startDate,
        end_date: endDate
      });
      
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
          <label>
            <span>Mulai</span>
            <input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            <span>Hingga</span>
            <input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <button className='primary-button' onClick={handleLoadReport} disabled={loading}>
            {loading ? "Memproses..." : "Tampilkan Laporan"}
          </button>
        </div>
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
                 <FiDownload /> Download PDF
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
