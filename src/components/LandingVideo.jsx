// Tidak ada di Local History — placeholder agar build jalan. Ganti dengan komponen videomu.
export default function LandingVideo() {
  return (
    <section className='landing-video-wrap' aria-label='Video pengantar' style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "24px 0" }}>
      <div style={{ maxWidth: 640, width: "100%", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 32px rgba(21,150,90,0.08)" }}>
        <video
          width='100%'
          height='360'
          controls
          poster='/og-image.png'
          style={{ background: "#000" }}
          title='Penjelasan Faktor Cuaca Delta (ΔWF) untuk Prediksi Energi PLTS'
          aria-label='Video penjelasan faktor cuaca delta untuk prediksi energi PLTS'>
          <source src='/Faktor_Cuaca_Delta_(ΔWF).mp4' type='video/mp4' />
          Video tidak didukung browser Anda.
        </video>
      </div>
      {/* <div style={{ marginTop: 18, textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '1.18rem' }}>Mulai prediksi energi PLTS harian Anda sekarang!</h3>
        <p style={{ margin: 0, color: '#15965a', fontWeight: 500 }}>Daftar gratis &amp; dapatkan notifikasi otomatis setiap hari.</p>
        <a href="/register" className="primary-button" style={{ marginTop: 12, display: 'inline-block', padding: '10px 28px', fontWeight: 600, fontSize: '1.05rem', borderRadius: 8, background: '#15965a', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 8px rgba(21,150,90,0.08)' }}>Daftar Gratis</a>
      </div> */}
    </section>
  );
}
