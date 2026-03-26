import { useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiCloud, FiCloudRain, FiCpu, FiEdit3, FiInfo, FiSun, FiTrendingDown, FiTrendingUp, FiFileText, FiAward, FiThermometer, FiZap, FiArrowRight, FiClock, FiShield, FiGlobe } from "react-icons/fi";
import { formatDateID, formatIDR, getHourlyDistribution } from "../utils";
import TierBadge from "./TierBadge";

// getEmissionFactor returns the CO2 emission factor (kg CO2/kWh) based on ESDM 2023 data for Indonesia.
export function getEmissionFactor(lat, lng) {
  if (lat >= -9.0 && lat <= -5.0 && lng >= 105.0 && lng <= 116.0) return 0.87; // JAMALI
  if (lat >= -6.0 && lat <= 6.0 && lng >= 95.0 && lng <= 106.0) return 0.81; // SUMATERA
  if (lat >= -4.0 && lat <= 5.0 && lng >= 108.0 && lng <= 119.0) return 0.84; // KALIMANTAN
  if (lat >= -6.0 && lat <= 2.0 && lng >= 118.0 && lng <= 127.0) return 0.72; // SULAWESI
  if (lat >= -11.0 && lat <= 0.0 && lng >= 116.0 && lng <= 141.0) return 0.68; // MALUKU/PAPUA
  return 0.78; // National Avg
}

// DashboardSection renders heartbeat, summary, and latest 7-day snapshot tables.
export default function DashboardSection({ 
  heartbeatSummary, 
  summary, 
  recReadiness,
  dashboardForecastHistory, 
  dashboardActualHistory, 
  todayForecast, 
  activeProfile,
  profiles = [],
  actualHistory = [],
  notificationPreference,
  onNavigate,
  onDownloadREC,
  onDownloadRECReport
}) {
  const [isOnboardingCollapsed, setIsOnboardingCollapsed] = useState(false);

  // Onboarding logic
  const onboardingSteps = [
    {
      id: "profile",
      label: "Lengkapi Solar Profile",
      desc: "Isi kapasitas panel (kWp) dan lokasi koordinat agar sistem bisa menghitung radiasi matahari.",
      isDone: profiles.length > 0,
      link: "profile"
    },
    {
      id: "forecast",
      label: "Generate Forecast Pertama",
      desc: "Klik ambil forecast untuk pertama kalinya agar model mulai memproses data cuaca hari ini.",
      isDone: dashboardForecastHistory.length > 0,
      link: "forecast"
    },
    {
      id: "actual",
      label: "Input Data Actual",
      desc: "Masukkan angka kWh yang dihasilkan panel Anda (bisa manual atau via IoT) untuk melatih akurasi AI.",
      isDone: actualHistory.length > 0,
      link: "forecast" // Actual input is also in forecast section
    },
    {
      id: "notification",
      label: "Aktifkan Notifikasi",
      desc: "Terima laporan forecast harian setiap pagi melalui Email atau Telegram.",
      isDone: notificationPreference && (notificationPreference.email_enabled || notificationPreference.telegram_enabled),
      link: "account"
    }
  ];

  const doneCount = onboardingSteps.filter(s => s.isDone).length;
  const isAllDone = doneCount === onboardingSteps.length;
  const progressPercent = (doneCount / onboardingSteps.length) * 100;

  const forecastByDate = new Map();
  dashboardForecastHistory.slice(0, 7).forEach((item) => {
    forecastByDate.set(item.date, Number(item.predicted_kwh || 0));
  });

  const actualByDate = new Map();
  dashboardActualHistory.slice(0, 7).forEach((item) => {
    actualByDate.set(item.date, Number(item.actual_kwh || 0));
  });

  const chartDates = Array.from(new Set([...forecastByDate.keys(), ...actualByDate.keys()])).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const trendRows = chartDates.map((date) => ({
    date,
    forecast: forecastByDate.get(date) ?? null,
    actual: actualByDate.get(date) ?? null,
  }));

  const trendMax = Math.max(1, ...trendRows.map((row) => row.forecast || 0), ...trendRows.map((row) => row.actual || 0));

  const sourceStats = dashboardActualHistory.slice(0, 7).reduce(
    (acc, item) => {
      if (String(item.source).toLowerCase() === "iot") {
        acc.iot += 1;
      } else {
        acc.manual += 1;
      }
      return acc;
    },
    { manual: 0, iot: 0 },
  );
  const sourceTotal = sourceStats.manual + sourceStats.iot;
  const iotPercent = sourceTotal > 0 ? (sourceStats.iot / sourceTotal) * 100 : 0;
  const accuracyValue = summary ? Number(summary.accuracy_percent) : null;
  const accuracyClass = accuracyValue === null ? "" : accuracyValue >= 90 ? "metric-value-good" : accuracyValue >= 75 ? "metric-value-warn" : "metric-value-bad";
  const latestTrend = [...trendRows].reverse().find((row) => row.forecast !== null || row.actual !== null) || null;
  const latestGapKwh = latestTrend && latestTrend.forecast !== null && latestTrend.actual !== null ? latestTrend.forecast - latestTrend.actual : null;
  const latestGapPct = latestTrend && latestTrend.actual && latestGapKwh !== null ? (latestGapKwh / latestTrend.actual) * 100 : null;
  const latestGapTone = latestGapPct === null ? "neutral" : Math.abs(latestGapPct) <= 10 ? "good" : Math.abs(latestGapPct) <= 20 ? "warn" : "bad";

  const latitude = Number(activeProfile?.lat);
  const longitude = Number(activeProfile?.lng);
  const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);

  const energyEstimate = Number(todayForecast?.predicted_kwh || 0);
  const weatherFactor = Number(todayForecast?.transmittance || todayForecast?.weather_factor || 0);
  const costEstimate = energyEstimate * 1444;

  const conditionLabel = useMemo(() => {
    if (weatherFactor >= 1.05) return "Cerah";
    if (weatherFactor >= 0.95) return "Cerah Berawan";
    if (weatherFactor >= 0.75) return "Berawan";
    if (weatherFactor >= 0.60) return "Mendung";
    return "Mendung Tebal";
  }, [weatherFactor]);

  const conditionImpact = useMemo(() => {
    if (weatherFactor >= 0.95) return "produksi optimal";
    if (weatherFactor >= 0.70) return "potensi fluktuasi produksi";
    return "produksi berpotensi turun akibat cuaca";
  }, [weatherFactor]);

  const todayHourlyDistribution = useMemo(() => {
    if (!todayForecast) return [];
    return getHourlyDistribution(todayForecast.date, latitude, weatherFactor).map((slot) => ({
      ...slot,
      value: energyEstimate * slot.share
    }));
  }, [todayForecast, latitude, weatherFactor, energyEstimate]);


  const renderMetricHelp = (id, text) => (
    <span className='metric-help-wrap'>
      <button type='button' className='metric-help-button' aria-label={text} aria-describedby={id}>
        <FiInfo />
      </button>
      <span id={id} role='tooltip' className='metric-help-tooltip'>
        {text}
      </span>
    </span>
  );

  const soilingProfiles = profiles.filter(p => p.soiling_alert_active);

  return (
    <>
      {soilingProfiles.length > 0 && (
        <section className='panel panel-wide' style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)', borderColor: '#feb2b2', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '12px' }}>
            <div style={{ background: '#f44336', color: 'white', padding: '12px', borderRadius: '12px', display: 'flex' }}>
              <FiAlertCircle size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#9b2c2c', fontSize: '1.1rem' }}>Deteksi Penurunan Efisiensi (Soiling)</h3>
              <p style={{ margin: '4px 0 0', color: '#c53030', fontSize: '0.9rem' }}>
                AI kami mendeteksi penurunan produksi yang tidak wajar pada site: <strong>{soilingProfiles.map(p => p.site_name).join(", ")}</strong>. 
                Panel Anda mungkin kotor (debu/kotoran) atau tertutup bayangan. Disarankan melakukan pengecekan atau pembersihan fisik.
              </p>
            </div>
          </div>
        </section>
      )}
      {!isAllDone && (
        <section className={`panel panel-wide onboarding-panel ${isOnboardingCollapsed ? 'collapsed' : ''}`}>
          <div className='panel-heading onboarding-header' onClick={() => setIsOnboardingCollapsed(!isOnboardingCollapsed)}>
            <div>
              <span className='panel-kicker'>Mulai dari Sini</span>
              <h2>Onboarding Guide ({doneCount}/{onboardingSteps.length})</h2>
            </div>
            <div className='onboarding-toggle'>
              <div className='onboarding-progress-bar'>
                <div className='onboarding-progress-fill' style={{ width: `${progressPercent}%` }} />
              </div>
              <button className='icon-button'>{isOnboardingCollapsed ? "+" : "−"}</button>
            </div>
          </div>
          
          {!isOnboardingCollapsed && (
            <div className='onboarding-content'>
              <p className='dashboard-explainer'>Gunakan panduan ini untuk memaksimalkan fitur AI Solar Forecast. Semakin lengkap data Anda, semakin akurat prediksinya.</p>
              <div className='onboarding-steps-grid'>
                {onboardingSteps.map((step) => (
                  <div key={step.id} className={`onboarding-step-card ${step.isDone ? 'step-done' : ''}`} onClick={() => onNavigate(step.link)}>
                    <div className='step-status'>
                      {step.isDone ? <FiCheckCircle style={{ color: '#176f46' }} /> : <div className='step-circle' />}
                    </div>
                    <div className='step-body'>
                      <strong>{step.label}</strong>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}


      <section className='panel panel-wide summary-panel today-condition-panel'>
        <div className='panel-heading panel-heading-with-status'>
          <div>
            <span className='panel-kicker'>Today's Condition</span>
            <h2>Kondisi Hari Ini</h2>
          </div>
          {heartbeatSummary && (
            <div className={`system-status-pill status-${heartbeatSummary.connected_devices > 0 ? 'online' : 'offline'}`} title={`Last seen: ${heartbeatSummary.latest_seen_at ? new Date(heartbeatSummary.latest_seen_at).toLocaleString() : 'Never'}`}>
               <span className='status-dot'></span>
               <span className='status-text'>
                 {heartbeatSummary.total_devices > 1 
                   ? `${heartbeatSummary.connected_devices}/${heartbeatSummary.total_devices} IoT Online`
                   : (heartbeatSummary.connected_devices > 0 ? 'IoT Online' : 'IoT Offline')
                 }
               </span>
            </div>
          )}
        </div>
        {todayForecast && hasLocation ? (
          <>
            <div className='today-condition-layout'>
              <article className='today-condition-story'>
                <span className='today-condition-badge'>Forecast update 06:00</span>
                <p className='dashboard-explainer'>
                  Hari ini berdasarkan ramalan cuaca koordinat{" "}
                  <strong>
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </strong>
                  , diprediksi <strong>{conditionLabel}</strong>, <strong>{conditionImpact}</strong>, dan estimasi produksi energi harian Anda sekitar <strong>{energyEstimate.toFixed(2)} kWh</strong> dengan potensi penghematan{" "}
                  <strong>{formatIDR(costEstimate)}</strong>.
                </p>
              </article>

              <div className='sun-grid'>
                <div className='sun-card'>
                   <div className="sun-card-title">
                     <FiClock className="sun-card-accent" /> Tanggal Forecast
                   </div>
                   <span className='sun-card-value'>{todayForecast.date}</span>
                   <p className='sun-card-sub'>Sinkronisasi terbaru</p>
                </div>
                <div className='sun-card'>
                   <div className="sun-card-title">
                     <FiZap className="sun-card-accent" /> Estimasi Produksi
                   </div>
                   <span className='sun-card-value text-gradient'>{energyEstimate.toFixed(2)} kWh</span>
                   <p className='sun-card-sub'>Total prediksi energi harian</p>
                </div>
                <div className='sun-card'>
                   <div className="sun-card-title">
                     <FiSun className="sun-card-accent" /> Weather Impact
                   </div>
                   <span className='sun-card-value'>{weatherFactor.toFixed(2)}×</span>
                   <p className='sun-card-sub'>Efisiensi cuaca terhadap panel</p>
                </div>
                <div className='sun-card'>
                   <div className="sun-card-title">
                     <FiTrendingUp className="sun-card-accent" /> Estimasi Hemat
                   </div>
                   <span className='sun-card-value'>{formatIDR(costEstimate)}</span>
                   <p className='sun-card-sub'>Potensi hemat biaya listrik</p>
                </div>
                <div className='sun-card' style={{ borderLeftWidth: '6px', borderLeftColor: 'var(--accent)' }}>
                   <div className="sun-card-title">
                     <FiShield className="sun-card-accent" /> Status Risiko
                   </div>
                   <span className='sun-card-value' style={{ fontSize: '1.5rem' }}>{todayForecast.weather_risk_status || "Stabil"}</span>
                   <p className='sun-card-sub'>Analisis cloud & fluktuasi</p>
                </div>
                <div className='sun-card' style={{ borderColor: 'var(--green)', borderLeftWidth: '6px' }}>
                   <div className="sun-card-title">
                     <FiGlobe style={{ color: 'var(--green)' }} /> Impact Karbon
                   </div>
                   <span className='sun-card-value' style={{ color: 'var(--green-dark)' }}>
                     {(energyEstimate * getEmissionFactor(latitude, longitude)).toFixed(2)} kg
                   </span>
                   <p className='sun-card-sub'>Estimasi CO₂ avoided hari ini</p>
                </div>
              </div>
            </div>

            <h3 className='today-hourly-title'>Estimasi Produksi per Periode Waktu (Dinamis)</h3>
            <div className='forecast-hourly-grid'>
              {todayHourlyDistribution.map((slot) => (
                <div key={slot.label} className='forecast-hourly-item'>
                  <span>{slot.label}</span>
                  <strong>{slot.value.toFixed(2)} kWh</strong>
                  <small>{(slot.share * 100).toFixed(0)}% porsi</small>
                  <div className='forecast-hourly-bar-track'>
                    <div className='forecast-hourly-bar-fill' style={{ width: `${slot.share * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className='dashboard-explainer' style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.8 }}>
              Model membagi energi berdasarkan musim, lintang profile, dan weather factor.
            </p>
          </>
        ) : (
          <div className='empty-state-card'>
            <FiCloud className='empty-icon' />
            <p>Belum ada data forecast untuk hari ini.</p>
            <button className='primary-button' onClick={() => onNavigate("forecast")}>
              Klik untuk Ambil Forecast Baru
            </button>
          </div>
        )}
      </section>

      {/* REC Readiness Widget */}
      <section className='panel panel-wide summary-panel' style={{ position: 'relative' }}>
        <div className='panel-heading'>
          <span className='panel-kicker'>Sustainability</span>
          <h2>MWh Accumulator & REC Readiness</h2>
        </div>
        
        {recReadiness ? (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Total Produksi Tersimpan: <strong>{recReadiness.total_mwh.toFixed(3)} MWh</strong></span>
              <span><strong>{recReadiness.progress_to_next_pct.toFixed(1)}%</strong> menuju REC berikutnya</span>
            </div>
            <div className='forecast-hourly-bar-track' style={{ height: '12px', background: 'var(--line)', borderRadius: '6px', overflow: 'hidden' }}>
              <div 
                className='forecast-hourly-bar-fill' 
                style={{ width: `${Math.min(100, recReadiness.progress_to_next_pct)}%`, background: 'var(--success)', height: '100%' }} 
              />
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className='summary-card' style={{ flex: '1', minWidth: '150px' }}>
                <span className='metric-label'>Total Kumulatif Energi</span>
                <strong className='metric-value'>{recReadiness.total_kwh.toFixed(1)} kWh</strong>
              </div>
              <div className='summary-card' style={{ flex: '1', minWidth: '150px' }}>
                <span className='metric-label'>Sertifikat (REC) Tercapai</span>
                <strong className='metric-value'>{recReadiness.total_rec} REC</strong>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className='summary-card' style={{ flex: '1', minWidth: '150px', background: 'var(--green-soft)', border: '1px solid var(--green)' }}>
                <span className='metric-label' style={{ color: 'var(--green-dark)' }}>Setara Pohon Ditanam</span>
                <strong className='metric-value' style={{ color: 'var(--green-dark)' }}>
                  {Math.floor(recReadiness.total_kwh * getEmissionFactor(latitude, longitude) / 20)} Pohon
                </strong>
                <span className='metric-sublabel'>estimasi serapan CO2/tahun</span>
              </div>
              <div className='summary-card' style={{ flex: '1', minWidth: '150px', background: 'var(--green-soft)', border: '1px solid var(--green)' }}>
                <span className='metric-label' style={{ color: 'var(--green-dark)' }}>Perjalanan Mobil Dihindari</span>
                <strong className='metric-value' style={{ color: 'var(--green-dark)' }}>
                  {Math.floor(recReadiness.total_kwh * getEmissionFactor(latitude, longitude) / 0.2)}.1 km
                </strong>
                <span className='metric-sublabel'>asumsi 200g CO2/km</span>
              </div>
            </div>

            {/* Lock state for Free Tier if 1 REC reached */}
            {notificationPreference?.plan_tier === "free" && recReadiness.total_rec > 0 && (
              <div className='banner banner-error' style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiAlertCircle />
                  <strong>Selamat! Anda telah menghasilkan 1 REC pertama.</strong>
                </div>
                <p style={{ marginTop: '4px', fontSize: '0.9rem' }}>
                  Akun Free tidak dapat mengunduh Laporan Klaim Sertifikat (REC). Upgrade ke Pro/Enterprise untuk membuka klaim dan laporan resmi!
                </p>
                <div style={{ marginTop: '8px' }}>
                  <TierBadge tier="pro" /> <TierBadge tier="enterprise" />
                </div>
              </div>
            )}
            {notificationPreference?.plan_tier !== "free" && recReadiness.total_rec > 0 && (
               <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--success)' }}>
                    Sertifikat (REC) dapat dicetak melalui Laporan Tahunan di menu <strong style={{cursor: 'pointer', textDecoration: 'underline'}} onClick={() => onNavigate("report")}>Laporan Hijau / ESG</strong>.
                  </p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    className='primary-button' 
                    style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={onDownloadREC}
                  >
                    <FiAward /> Download Sertifikat
                  </button>
                  <button 
                    className='secondary-button' 
                    style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={onDownloadRECReport}
                  >
                    <FiFileText /> Download Readiness Report
                  </button>
                </div>
               </div>
            )}
          </div>
        ) : (
          <div className='empty-state' style={{ padding: '20px', textAlign: 'center' }}>
            Memuat data accumulator...
          </div>
        )}
      </section>

      <section className='panel panel-wide summary-panel'>
        <div className='panel-heading'>
          <span className='panel-kicker'>Overview</span>
          <h2>Ringkasan Performa (90 hari)</h2>
        </div>
        <p className='dashboard-explainer'>Angka di bawah adalah ringkasan 90 hari terakhir. Fokus utama: akurasi mendekati 100% dan gap antara forecast vs actual makin kecil.</p>
        <div className='summary-grid'>
          <div className='summary-card'>
            <span className='metric-label metric-label-row'>
              Total Forecast
              {/* {renderMetricHelp("help-total-forecast", "Akumulasi total energi yang diprediksi sistem dalam 90 hari terakhir.")} */}
            </span>
            <strong className='metric-value'>{summary ? summary.total_forecasted_kwh.toFixed(1) : "--"} kWh</strong>
            <span className='metric-sublabel'>{summary ? summary.forecast_count : 0} hari</span>
          </div>
          <div className='summary-card'>
            <span className='metric-label metric-label-row'>
              Total Actual
              {/* {renderMetricHelp("help-total-actual", "Akumulasi total energi actual yang tercatat (manual/IoT) dalam 90 hari terakhir.")} */}
            </span>
            <strong className='metric-value'>{summary ? summary.total_actual_kwh.toFixed(1) : "--"} kWh</strong>
            <span className='metric-sublabel'>{summary ? summary.actual_count : 0} hari</span>
          </div>
          <div className='summary-card'>
            <span className='metric-label metric-label-row'>
              Avg Forecast
              {/* {renderMetricHelp("help-avg-forecast", "Rata-rata energi forecast per hari. Dipakai untuk melihat baseline prediksi harian.")} */}
            </span>
            <strong className='metric-value'>{summary ? summary.average_forecast_kwh.toFixed(2) : "--"} kWh</strong>
            <span className='metric-sublabel'>per hari</span>
          </div>
          <div className='summary-card'>
            <span className='metric-label metric-label-row'>
              Avg Actual
              {/* {renderMetricHelp("help-avg-actual", "Rata-rata energi actual per hari dari data lapangan.")} */}
            </span>
            <strong className='metric-value'>{summary ? summary.average_actual_kwh.toFixed(2) : "--"} kWh</strong>
            <span className='metric-sublabel'>per hari</span>
          </div>
          <div className='summary-card'>
            <span className='metric-label metric-label-row'>
              Efficiency
              {/* {renderMetricHelp("help-efficiency", "Faktor performa model/sistem saat menghitung forecast. Semakin stabil, prediksi biasanya makin konsisten.")} */}
            </span>
            <strong className='metric-value'>{summary ? (summary.current_efficiency * 100).toFixed(1) : "--"}%</strong>
            <span className='metric-sublabel'>adaptif</span>
          </div>
          <div className='summary-card'>
            <span className='metric-label metric-label-row'>
              Akurasi
              {/* {renderMetricHelp("help-accuracy", "Persentase kedekatan forecast terhadap actual. Semakin mendekati 100%, semakin baik kualitas prediksi.")} */}
            </span>
            <strong className={`metric-value ${accuracyClass}`}>{summary ? summary.accuracy_percent.toFixed(1) : "--"}%</strong>
            <span className='metric-sublabel'>prediksi vs real</span>
          </div>
        </div>
        <p className='metric-tap-hint'>Tip mobile: tap ikon i pada setiap metrik untuk melihat penjelasan singkat.</p>
      </section>

      <section className='panel panel-wide summary-panel'>
        <div className='panel-heading'>
          <span className='panel-kicker'>Highlights</span>
          <h2>Highlight Cepat</h2>
        </div>
        <div className='dashboard-highlights-grid'>
          <article className='dashboard-highlight-card'>
            <div className='dashboard-highlight-top'>
              <span>Akurasi Model</span>
              {accuracyValue !== null && (accuracyValue >= 85 ? <FiTrendingUp /> : <FiTrendingDown />)}
            </div>
            <strong className={`dashboard-highlight-value ${accuracyClass}`}>{accuracyValue !== null ? `${accuracyValue.toFixed(1)}%` : "--"}</strong>
            <p>Target ideal di atas 85% agar forecast mendekati data lapangan.</p>
          </article>

          <article className={`dashboard-highlight-card dashboard-highlight-${latestGapTone}`}>
            <div className='dashboard-highlight-top'>
              <span>Gap Forecast Terakhir</span>
              {latestGapKwh !== null && (latestGapKwh >= 0 ? <FiTrendingUp /> : <FiTrendingDown />)}
            </div>
            <strong className='dashboard-highlight-value'>{latestGapKwh !== null ? `${latestGapKwh >= 0 ? "+" : ""}${latestGapKwh.toFixed(2)} kWh` : "--"}</strong>
            <p>{latestGapPct !== null ? `${latestGapPct >= 0 ? "+" : ""}${latestGapPct.toFixed(1)}% vs actual terbaru` : "Belum ada pasangan data forecast/actual terbaru."}</p>
          </article>

          <article className='dashboard-highlight-card'>
            <div className='dashboard-highlight-top'>
              <span>Kualitas Sumber Data</span>
              <FiCpu />
            </div>
            <strong className='dashboard-highlight-value'>{sourceTotal > 0 ? `${iotPercent.toFixed(0)}% IoT` : "--"}</strong>
            <p>{sourceTotal > 0 ? `${sourceStats.iot} dari ${sourceTotal} hari memakai input IoT.` : "Belum ada data actual untuk menilai kualitas sumber."}</p>
          </article>

          <article className='dashboard-highlight-card'>
            <div className='dashboard-highlight-top'>
              <span>Akumulasi Energi (REC)</span>
              <FiCheckCircle />
            </div>
            <strong className='dashboard-highlight-value'>{summary?.total_mwh !== undefined ? `${summary.total_mwh.toFixed(3)} MWh` : "--"}</strong>
            <p>1 REC = 1 MWh. Kumpulkan MWh untuk kesiapan REC.</p>
          </article>
        </div>
      </section>

      <section className='panel panel-wide summary-panel'>
        <div className='panel-heading'>
          <span className='panel-kicker'>Insight</span>
          <h2>Chart Ringkas Dashboard</h2>
        </div>
        <p className='dashboard-explainer'>Grafik membantu membaca tren: jika batang Forecast sering jauh di atas/bawah Actual, model perlu kalibrasi atau data actual tambahan.</p>
        <div className='dashboard-chart-grid'>
          <article className='dashboard-chart-card'>
            <h3>Tren Forecast vs Actual (7 hari)</h3>
            {trendRows.length > 0 ? (
              <div className='dashboard-line-chart'>
                {trendRows.map((row) => (
                  <div key={row.date} className='dashboard-line-row'>
                    <span className='dashboard-line-label'>{formatDateID(row.date)}</span>
                    <div className='dashboard-line-track'>
                      {row.forecast !== null && <div className='dashboard-line-bar dashboard-line-forecast' style={{ width: `${(row.forecast / trendMax) * 100}%` }} />}
                      {row.actual !== null && <div className='dashboard-line-bar dashboard-line-actual' style={{ width: `${(row.actual / trendMax) * 100}%` }} />}
                    </div>
                    <span className='dashboard-line-value'>{`${row.forecast !== null ? row.forecast.toFixed(1) : "--"} / ${row.actual !== null ? row.actual.toFixed(1) : "--"}`}</span>
                  </div>
                ))}
                <div className='dashboard-line-legend'>
                  <span>
                    <i className='dashboard-dot dashboard-dot-forecast' /> Forecast
                  </span>
                  <span>
                    <i className='dashboard-dot dashboard-dot-actual' /> Actual
                  </span>
                </div>
              </div>
            ) : (
              <div className='empty-state'>Belum ada data untuk chart tren.</div>
            )}
          </article>

          <article className='dashboard-chart-card'>
            <h3>Komposisi Sumber Data Actual</h3>
            {sourceTotal > 0 ? (
              <div className='dashboard-source-wrap'>
                <div className='dashboard-source-ring' style={{ background: `conic-gradient(#176f46 0% ${iotPercent}%, #d6830f ${iotPercent}% 100%)` }}>
                  <div className='dashboard-source-center'>{sourceTotal}</div>
                </div>
                <div className='dashboard-source-list'>
                  <p>
                    <i className='dashboard-dot dashboard-dot-actual' /> IoT: {sourceStats.iot} hari
                  </p>
                  <p>
                    <i className='dashboard-dot dashboard-dot-forecast' /> Manual: {sourceStats.manual} hari
                  </p>
                </div>
              </div>
            ) : (
              <div className='empty-state'>Belum ada data actual untuk chart komposisi.</div>
            )}
          </article>
        </div>
      </section>

      <section className='panel panel-wide summary-panel history-panel'>
        <div className='panel-heading'>
          <span className='panel-kicker'>Data</span>
          <h2>Forecast & Actual Terbaru (7 hari)</h2>
        </div>
        <p className='dashboard-explainer'>Tabel ini adalah data mentah 7 hari terakhir. Gunakan untuk cek harian apakah prediksi sudah mendekati angka actual dari lapangan.</p>
        <div className='history-grid'>
          <div className='history-column'>
            <h3 className='history-title'>Forecast</h3>
            <div className='history-table'>
              {dashboardForecastHistory.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Prediksi (kWh)</th>
                      <th>Weather</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardForecastHistory.slice(0, 7).map((f, idx) => (
                      <tr key={idx}>
                        <td>{f.date}</td>
                        <td>{Number(f.predicted_kwh).toFixed(2)}</td>
                        <td>{Number(f.transmittance || f.weather_factor || 0).toFixed(2)}</td>
                        <td>{f.weather_risk_status || "Stabil"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className='empty-state'>Belum ada data forecast</div>
              )}
            </div>
          </div>
          <div className='history-column'>
            <h3 className='history-title'>Actual</h3>
            <div className='history-table'>
              {dashboardActualHistory.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Actual (kWh)</th>
                      <th>Sumber</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardActualHistory.slice(0, 7).map((a, idx) => (
                      <tr key={idx}>
                        <td>{a.date}</td>
                        <td>{Number(a.actual_kwh).toFixed(2)}</td>
                        <td className='source-badge'>
                          <span className='source-icon'>{a.source === "manual" ? <FiEdit3 /> : <FiCpu />}</span>
                          {a.source}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className='empty-state'>Belum ada data actual</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
