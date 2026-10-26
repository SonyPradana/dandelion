# Flash Data

Panel data kilat: menyimpan data sementara di halaman kerja agar bisa dipakai ulang oleh fitur lain, tanpa mengetik ulang.

![Tangkap layar panel Flash Data di halaman kerja](/doc/v1/assets/flash-data-panel.webp)

## Cara Pakai

1. Aktifkan **Tampilkan Panel Flash Data** di [Config → Mode Zen](/doc/v1/config-zen-mode) (`flashData.enabled`).
2. Buka halaman kerja (formulir skrining atau form pendaftaran) — panel Flash Data muncul di halaman.
3. Isi kolom data yang diperlukan, atau pakai template awal (`defaultPinneds`) yang sudah disiapkan di konfigurasi — tersedia template terpisah untuk Mode Zen dan Register Form.

   Nama kolom mengikuti kolom yang ada di formulir Anda — berikut contoh isi panel (semua nilai bersifat contoh):

   ```json
   {
     "merokok": "Ya",
     "abx123": "Tidak",
     "sesi": "Pagi"
   }
   ```

4. Saat pengisian berjalan, **Skrining Form** dan **Registration Form** memakai data dari panel ini secara otomatis.

## Yang Perlu Diketahui

- Data **kedaluwarsa otomatis** setelah `flashData.maxAge` (default 10 menit) — lewat batas itu, data dibuang.
- Saat fitur dimatikan, panel tidak muncul dan data tidak disimpan.
- Data bersifat sementara di perangkat Anda; tanpa data di panel, fitur lain tetap berjalan — hanya kolom yang mengandalkan data ini yang tidak terisi otomatis.
- Saat pendaftaran berhasil, Register Form menyalin data ke flash data skrining dengan penanda `"skrining mandiri"` (default `true`). Penanda ini hanya dipakai untuk konfirmasi perpindahan ke form skrining. Untuk mematikan hitung mundur, isi `"skrining mandiri": "false"` sebagai string di panel.
- Isi template hanya dengan data yang Anda ketahui benar, dan jangan bagikan berkas konfigurasi yang sudah terisi.

> Pengaturan: [Config → Mode Zen](/doc/v1/config-zen-mode) (tampilan panel & umur data) dan [Config → Register Form](/doc/v1/config-register-form) (template Register Form)
