import React from 'react';
import { FiCopy, FiCheck, FiCode, FiShield, FiZap, FiDatabase, FiExternalLink, FiDownload } from 'react-icons/fi';

export default function DocsSection() {
  const [copied, setCopied] = React.useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ code, id }) => (
    <div className="docs-code-container">
      <pre className="docs-code">
        <code>{code}</code>
      </pre>
      <button 
        className="docs-copy-btn" 
        onClick={() => handleCopy(code, id)}
        title="Salin Kode"
      >
        {copied === id ? <FiCheck style={{ color: '#15965a' }} /> : <FiCopy />}
      </button>
    </div>
  );

  return (
    <section className="docs-layout animate-rise">
      <div className="docs-nav-sticky">
        <div className="docs-sidebar-inner">
          <h3 className="docs-nav-title">Menu Dokumentasi</h3>
          <ul className="docs-nav-list">
            <li><a href="#intro" className="docs-nav-link">Pendahuluan</a></li>
            <li><a href="#auth" className="docs-nav-link">Autentikasi</a></li>
            <li><a href="#endpoints" className="docs-nav-link">Endpoints API</a></li>
            <li><a href="#sdk" className="docs-nav-link">Contoh Integrasi</a></li>
            <li><a href="#limits" className="docs-nav-link">Limit & Quota</a></li>
          </ul>
        </div>
      </div>

      <div className="docs-content">
        <div id="intro" className="docs-card">
          <div className="docs-header-hero">
            <FiZap className="docs-hero-icon" />
            <div>
              <span className="panel-kicker">Developer Guide</span>
              <h2 className="docs-title">API Integration Guide</h2>
              <p className="docs-subtitle">Integrasikan data prediksi energi surya langsung ke dashboard EMS, Smart Home, atau aplikasi khusus milik Anda.</p>
            </div>
          </div>
        </div>

        <div id="auth" className="docs-card" style={{ marginTop: '24px' }}>
          <div className="docs-section-header">
            <FiShield className="docs-section-icon" />
            <h3>Autentikasi Berbasis Key</h3>
          </div>
          <p>Semua permintaan ke API Solar Forecast memerlukan header `X-API-Key` untuk validasi identitas dan tier akun Anda.</p>
          
          <div className="docs-alert-info">
            <strong>Keamanan Penting:</strong> Jangan pernah membagikan API Key Anda di sisi Client-side JavaScript yang bisa dilihat publik. Gunakan integrasi Server-to-Server.
          </div>

          <div className="docs-endpoint-specs">
            <div className="specs-row">
              <span className="specs-label">Header Key</span>
              <code className="specs-value">X-API-Key</code>
            </div>
            <div className="specs-row">
              <span className="specs-label">Format Value</span>
              <code className="specs-value">sk_live_....</code>
            </div>
          </div>
        </div>

        <div id="endpoints" className="docs-card" style={{ marginTop: '24px' }}>
          <div className="docs-section-header">
            <FiDatabase className="docs-section-icon" />
            <h3>Endpoint Referensi</h3>
          </div>

          <div className="endpoint-item">
            <div className="endpoint-meta">
              <span className="method-badge get">GET</span>
              <code className="path">/forecast/today</code>
            </div>
            <p className="endpoint-desc">Mengambil prediksi produksi listrik per jam untuk hari ini berdasarkan profil panel Anda.</p>
            
            <h4 className="docs-sub">Contoh cURL</h4>
            <CodeBlock 
              id="curl-today"
              code={`curl -X GET "http://api.solar-forecast.com/v1/forecast/today" \\
  -H "X-API-Key: sk_live_your_key_here" \\
  -H "Content-Type: application/json"`} 
            />

            <h4 className="docs-sub">Response Sukses (200 OK)</h4>
            <CodeBlock 
              id="res-today"
              code={`{
  "status": "success",
  "data": {
    "date": "2026-03-24",
    "total_kwh": 12.45,
    "hourly": [
      { "hour": 8, "watt": 450 },
      { "hour": 12, "watt": 2400 }
    ]
  }
}`} 
            />
          </div>

          <hr className="docs-divider" />

          <div className="endpoint-item">
            <div className="endpoint-meta">
              <span className="method-badge get">GET</span>
              <code className="path">/forecast/history</code>
            </div>
            <p className="endpoint-desc">Mengakses data historis prediksi untuk keperluan analisa performa jangka panjang.</p>
            
            <h4 className="docs-sub">Query Parameters</h4>
            <ul className="docs-params">
              <li><code>start_date</code>: (String, YYYY-MM-DD) Tanggal mulai data.</li>
              <li><code>end_date</code>: (String, YYYY-MM-DD) Tanggal akhir data.</li>
            </ul>
          </div>
        </div>

        <div id="sdk" className="docs-card" style={{ marginTop: '24px' }}>
          <div className="docs-section-header">
            <FiCode className="docs-section-icon" />
            <h3>Contoh Integrasi Node.js</h3>
          </div>
          <CodeBlock 
            id="nodejs"
            code={`const axios = require('axios');

async function getSolarForecast() {
  try {
    const response = await axios.get('https://api.solar-forecast.com/v1/forecast/today', {
      headers: { 'X-API-Key': 'sk_live_xxxx' }
    });
    console.log('Total Prediksi:', response.data.total_kwh, 'kWh');
  } catch (error) {
    console.error('Error integrasi:', error.message);
  }
}

getSolarForecast();`}
          />
        </div>

        <footer className="docs-footer">
          <p>© 2026 Sinergi IoT Nusantara. Butuh bantuan integrasi lanjut?</p>
          <a href="mailto:support@solar-forecast.com" className="primary-button">
            Hubungi Engineer API
          </a>
        </footer>
      </div>
    </section>
  );
}
