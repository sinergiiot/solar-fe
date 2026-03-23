# Dokumentasi Integrasi Solar Forecast API

Selamat datang di Panduan Integrasi Solar Forecast! Dengan API kami, Anda dapat mengintegrasikan data prediksi produksi panel surya langsung ke dalam sistem manajemen energi (EMS), dashboard smart home, atau aplikasi khusus Anda.

---

## 1. Persiapan (Getting Started)

Untuk mulai menggunakan API, pastikan Anda memenuhi syarat berikut:
1. Akun Anda memiliki tier **Enterprise**.
2. Anda telah membuat **API Key** melalui Dashboard di menu **Account Info**.
3. Simpan API Key Anda di tempat yang aman. Format key adalah `sk_live_...`.

---

## 2. Autentikasi

Kami menggunakan autentikasi berbasis Header. Kirimkan API Key Anda pada setiap request menggunakan header `X-API-Key`.

**Header:**
```http
X-API-Key: sk_live_your_actual_api_key_here
Content-Type: application/json
```

---

## 3. Endpoint Referensi

### A. Mendapatkan Forecast Hari Ini
Mengambil prediksi produksi listrik (Watt) per jam untuk hari ini.

*   **URL:** `/forecast/today`
*   **Method:** `GET`
*   **Query Params (Opsional):**
    *   `profile_id`: UUID solar profile tertentu (jika Anda punya lebih dari satu).
*   **Contoh Request (cURL):**
    ```bash
    curl -H "X-API-Key: sk_live_xxx" http://api.solar-forecast.com/forecast/today
    ```
*   **Contoh Response:**
    ```json
    {
      "date": "2026-03-24",
      "total_expected_kwh": 12.5,
      "hourly_forecast": [
        {"hour": 6, "watt": 0},
        {"hour": 10, "watt": 1200},
        {"hour": 12, "watt": 2500}
      ]
    }
    ```

### B. Mengambil Riwayat (History)
Mengambil data prediksi masa lalu untuk analisis performa.

*   **URL:** `/forecast/history`
*   **Method:** `GET`
*   **Query Params:**
    *   `start_date`: `YYYY-MM-DD` (Wajib)
    *   `end_date`: `YYYY-MM-DD` (Wajib)
*   **Contoh Request:**
    ```bash
    curl -H "X-API-Key: sk_live_xxx" "http://api.solar-forecast.com/forecast/history?start_date=2026-03-01&end_date=2026-03-07"
    ```

---

## 4. Limit & Quota

Penyalahgunaan API dapat mengakibatkan pemutusan akses sementara. Pastikan aplikasi Anda:
*   Melakukan caching data (jangan memanggil API setiap detik). Data forecast hari ini biasanya cukup diperbarui 1-2 kali sehari.
*   Menggunakan timeout yang wajar (rekomendasi: 5 detik).

---

## 5. Bantuan

Jika Anda menemui kendala teknis atau membutuhkan limit yang lebih tinggi untuk integrasi skala besar, silakan hubungi tim engineer kami melalui email: `support@solar-forecast.com`.
