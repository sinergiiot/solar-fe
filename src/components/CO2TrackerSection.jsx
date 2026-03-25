import { useState, useEffect, useCallback } from "react";
import {
  FiLock,
  FiDownload,
  FiCheckCircle,
  FiCloud,
  FiTrendingUp,
  FiDollarSign,
  FiInfo,
} from "react-icons/fi";
import { getCO2Summary, downloadMRVPDF } from "../api";
import { getTodayLocalDate, getDateDaysAgo } from "../utils";

const TREE_IMG = "🌳";
const CO2_COLOR = "#15965a";

function StatCard({ icon, label, value, subValue, color }) {
  return (
    <div
      className="panel"
      style={{
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        borderTop: `4px solid ${color || CO2_COLOR}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: color || CO2_COLOR }}>
        {icon}
        <span style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
          {label}
        </span>
      </div>
      <strong style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text)", lineHeight: 1.1 }}>
        {value}
      </strong>
      {subValue && (
        <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{subValue}</span>
      )}
    </div>
  );
}

function ProgressBar({ label, value, max, unit, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "0.88rem", color: "var(--muted)" }}>{label}</span>
        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)" }}>
          {value.toFixed(2)} {unit}
        </span>
      </div>
      <div style={{ background: "var(--line)", borderRadius: "99px", height: "8px", overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color || CO2_COLOR,
            borderRadius: "99px",
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function CO2TrackerSection({ planTier, profiles }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [selectedProfileID, setSelectedProfileID] = useState("");
  const [isAnnual, setIsAnnual] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState(getDateDaysAgo(30));
  const [endDate, setEndDate] = useState(getTodayLocalDate());

  const isLocked = planTier === "free";

  const buildParams = useCallback(() => {
    const p = { profile_id: selectedProfileID };
    if (isAnnual) {
      p.is_annual = "true";
      p.year = year;
    } else {
      p.start_date = startDate;
      p.end_date = endDate;
    }
    return p;
  }, [selectedProfileID, isAnnual, year, startDate, endDate]);

  async function handleLoad() {
    setLoading(true);
    setError("");
    try {
      const res = await getCO2Summary(buildParams());
      setData(res);
    } catch (err) {
      setError(err.message || "Gagal memuat data CO2");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    setDownloading(true);
    try {
      const blob = await downloadMRVPDF(buildParams());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MRV_CO2_Report_${endDate?.replace(/-/g, "") || year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Gagal mengunduh PDF");
    } finally {
      setDownloading(false);
    }
  }

  if (isLocked) {
    return (
      <div className="lock-screen">
        <div className="lock-card">
          <FiLock className="lock-icon" />
          <h2>CO2 Avoided Tracker</h2>
          <p>
            Pantau emisi CO2 yang berhasil Anda hindari, estimasi nilai carbon credit,
            dan unduh laporan MRV siap pakai untuk keperluan ESG / CSR.
          </p>
          <div className="lock-benefits">
            <div className="benefit-item">
              <FiCheckCircle /> CO2 Avoided Tracker per Lokasi
            </div>
            <div className="benefit-item">
              <FiCheckCircle /> Estimasi Nilai Carbon Credit (IDX &amp; Voluntary)
            </div>
            <div className="benefit-item">
              <FiCheckCircle /> PDF MRV Report 3 Halaman (Measurement, Reporting, Verification)
            </div>
          </div>
          <button
            className="primary-button"
            style={{ background: CO2_COLOR }}
            onClick={() => window.alert("Upgrade ke Pro untuk fitur CO2 Tracker!")}
          >
            Upgrade ke Pro Sekarang
          </button>
        </div>
      </div>
    );
  }

  const trees = data ? (data.total_co2_avoided_kg / 20).toFixed(0) : 0;
  const maxKwh = data?.daily_breakdown?.reduce((a, b) => Math.max(a, b.actual_kwh), 1) || 1;

  return (
    <div className="report-section stack">
      {/* Controls */}
      <div className="panel report-controls">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <FiCloud size={20} style={{ color: CO2_COLOR }} />
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>CO2 Avoided Tracker</h2>
          <span
            style={{
              background: "rgba(21,150,90,0.12)",
              color: CO2_COLOR,
              padding: "2px 10px",
              borderRadius: "99px",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            ESDM 2023
          </span>
        </div>
        <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: "0.9rem" }}>
          Pantau emisi CO2 yang berhasil dihindari berdasarkan produksi PLTS Anda,
          lengkap dengan estimasi nilai carbon credit.
        </p>

        <div className="report-filters">
          <label>
            <span>Lokasi</span>
            <select
              value={selectedProfileID}
              onChange={(e) => setSelectedProfileID(e.target.value)}
            >
              <option value="">Semua Lokasi</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.site_name}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "flex", alignItems: "center", height: "42px" }}>
            <label className="checkbox-label" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={isAnnual}
                onChange={(e) => setIsAnnual(e.target.checked)}
              />
              <span>Mode Tahunan</span>
            </label>
          </div>

          {isAnnual ? (
            <label>
              <span>Tahun</span>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={{ minWidth: "120px" }}
              />
            </label>
          ) : (
            <>
              <label>
                <span>Mulai</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label>
                <span>Hingga</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </>
          )}

          <button
            className="primary-button"
            onClick={handleLoad}
            disabled={loading}
            style={{ alignSelf: "flex-end", marginBottom: "4px", background: CO2_COLOR }}
          >
            {loading ? "Memproses..." : "Hitung CO2"}
          </button>
        </div>
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      {data && (
        <>
          {/* KPI Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <StatCard
              icon={<FiCloud size={18} />}
              label="CO2 Dihindari"
              value={`${data.total_co2_avoided_kg.toFixed(2)} kg`}
              subValue={`≡ ${data.total_co2_avoided_ton.toFixed(4)} ton CO2`}
              color={CO2_COLOR}
            />
            <StatCard
              icon={<span style={{ fontSize: "1.1rem" }}>{TREE_IMG}</span>}
              label="Setara Pohon"
              value={`${trees} pohon`}
              subValue="@ 20 kg CO2/pohon/tahun"
              color="#2d9e59"
            />
            <StatCard
              icon={<FiDollarSign size={18} />}
              label="Carbon Credit IDX"
              value={`Rp ${(data.carbon_credit_idr / 1000).toFixed(1)}rb`}
              subValue={`USD ${data.carbon_credit_usd.toFixed(2)} (Voluntary)`}
              color="#e07b00"
            />
            <StatCard
              icon={<FiTrendingUp size={18} />}
              label="Produksi Aktual"
              value={`${data.total_actual_kwh.toFixed(1)} kWh`}
              subValue={`${data.daily_breakdown?.length || 0} hari data`}
              color="#0077cc"
            />
          </div>

          {/* Methodology Info */}
          <div
            className="panel"
            style={{
              padding: "18px 24px",
              background: "rgba(21,150,90,0.06)",
              border: "1px solid rgba(21,150,90,0.2)",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
            }}
          >
            <FiInfo size={18} style={{ color: CO2_COLOR, flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--text)", fontSize: "0.9rem" }}>
                Metodologi: {data.methodology_standard}
              </p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>
                Faktor emisi <strong>{data.emission_factor_kg_per_kwh} kg CO2/kWh</strong> untuk
                grid <strong>{data.grid_region}</strong>. Estimasi carbon credit menggunakan harga
                pasar IDX Carbon Rp 30.000/ton dan voluntary market USD 5/ton.
              </p>
            </div>
          </div>

          {/* Daily Breakdown Chart-like bars */}
          {data.daily_breakdown && data.daily_breakdown.length > 0 && (
            <div className="panel" style={{ padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem" }}>
                Rincian Produksi &amp; CO2 Avoided (30 hari terakhir)
              </h3>
              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                {data.daily_breakdown.slice(-30).map((d) => (
                  <ProgressBar
                    key={d.date}
                    label={`${d.date}  →  ${d.co2_avoided_kg.toFixed(2)} kg CO2`}
                    value={d.actual_kwh}
                    max={maxKwh}
                    unit="kWh"
                    color={CO2_COLOR}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="panel" style={{ padding: "20px 24px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "1rem" }}>Unduh Laporan MRV</h3>
            <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: "0.88rem" }}>
              Laporan MRV (Measurement, Reporting &amp; Verification) berisi 3 bagian: ringkasan
              eksekutif, rincian pengukuran harian, dan pernyataan verifikasi. Siap dilampirkan
              untuk laporan ESG / CSR perusahaan.
            </p>
            <button
              className="primary-button"
              onClick={handleDownloadPDF}
              disabled={downloading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: CO2_COLOR,
              }}
            >
              <FiDownload />
              {downloading ? "Mengunduh..." : "Download MRV PDF"}
            </button>
          </div>
        </>
      )}

      {!data && !loading && (
        <div className="panel" style={{ padding: "40px 24px", textAlign: "center" }}>
          <FiCloud size={40} style={{ color: "var(--muted)", marginBottom: "12px" }} />
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Pilih filter periode dan klik <strong>Hitung CO2</strong> untuk melihat tracker emisi
            CO2 Anda.
          </p>
        </div>
      )}
    </div>
  );
}
