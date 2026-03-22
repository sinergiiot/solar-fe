// Tidak ada di Local History — placeholder agar build jalan.
export default function LandingFooter() {
  return (
    <footer className='landing-footer-block landing-footnote' style={{ textAlign: "center", padding: "24px 0", background: "rgba(245,255,248,0.82)", borderTop: "1px solid #e0e0e0", marginTop: 32 }}>
      <p style={{ margin: 0, fontWeight: 500 }}>
        Solar Forecast &copy; {new Date().getFullYear()} &mdash;{" "}
        <a href='https://sinergiiot.com' target='_blank' rel='noopener noreferrer'>
          Sinergi IoT Nusantara
        </a>
      </p>
      <p style={{ margin: "6px 0 0", color: "#6b6257", fontSize: "0.95em" }}>Prediksi energi PLTS harian, monitoring akurasi, dan notifikasi otomatis.</p>
    </footer>
  );
}
