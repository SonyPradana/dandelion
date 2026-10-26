# Register Form

Pengaturan untuk fitur Registration Form: alur pendaftaran otomatis dengan retry, countdown, dan template flash data.

## URL Register Form

<!-- config-section:register-form-url -->

- **`registerForm.url`** — pola alamat form pendaftaran. Efek: tombol dan alur Register Form hanya bekerja di halaman yang alamatnya mengandung pola ini (dicocokkan sebagai bagian alamat). Default `''` (kosong). Contoh: `https://contoh.example.go.id/pendaftaran`.

## Retry dan Countdown

<!-- config-section:register-form-retry -->

- **`registerForm.retryMax`** — jumlah percobaan ulang maksimum per langkah bila elemen yang ditunggu belum muncul. Efek: habis percobaan, langkah dihentikan (alur bisa dilanjutkan dari langkah terakhir). Default `3`, rentang 1–10. Contoh: `5`.
- **`registerForm.retryDelay`** — jeda antar percobaan ulang dalam milidetik. Efek: jeda lebih besar = lebih sabar menunggu halaman lambat, tapi alur jadi lebih lama. Default `2000`, rentang 500–10000 ms. Contoh: `3000`.
- **`registerForm.countdownDuration`** — hitung mundur dalam milidetik sebagai konfirmasi sebelum pindah ke form skrining setelah pendaftaran berhasil. Hanya dipakai bila penanda `"skrining mandiri"` bernilai `true` (default `false`). Default `5000`, rentang 1000–30000 ms. Contoh: `10000`.

## Template Flash Data

<!-- config-section:register-form-flash -->

- **`registerForm.defaultPinneds`** — template isi awal panel Flash Data saat panel Register Form dibuka (objek JSON: nama kolom → nilai). Default `{}` (kosong).

  ```json
  {
    "abx123": "Contoh",
    "merokok": "Ya",
    "sesi": "Pagi"
  }
  ```

> **Catatan data**: template ini berisi data yang Anda isi sendiri. Isi hanya data yang Anda ketahui benar, jangan simpan data orang lain, dan jangan bagikan berkas konfigurasi yang sudah terisi.
