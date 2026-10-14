# Registration Form

Fitur untuk mempercepat pengisian formulir pendaftaran peserta — dari data dasar sampai konfirmasi kehadiran dalam satu alur berurutan.

![Tangkap layar form pendaftaran dengan tombol Mulai dan status alur Dandelion](/doc/v1/assets/register-form-flow.webp)

## Cara Pakai

1. Siapkan konfigurasi di [Config → Register Form](/doc/v1/config-register-form): pola alamat form, percobaan ulang (retry), hitung mundur, dan template data.
2. Buka form pendaftaran — tombol **Mulai** muncul di halaman.
3. Setelah diklik, hitung mundur berjalan (bisa dibatalkan), lalu alur berjalan bertahap dengan status di panel:
   - **`Mulai 1/4`** — data peserta (memakai panel [Flash Data](/doc/v1/flash-data) bila aktif, plus pemeriksaan data)
   - **`Mulai 2/4`** dan **`Mulai 3/4`** — pengisian section formulir
   - **`Mulai 4/4`** — konfirmasi kehadiran, diakhiri status selesai beserta kode tiket
4. Periksa tiap tahap; isian yang tampil tetap bisa diperiksa dan diperbaiki.

## Yang Perlu Diketahui

- **Lanjut dari langkah terakhir**: bila alur terhenti (mis. percobaan ulang habis atau halaman dimuat ulang), tombol Mulai menawarkan melanjutkan dari langkah terakhir, bukan dari awal.
- Percobaan ulang mengikuti `retryMax` dan `retryDelay` — habis percobaan, langkah dihentikan dengan aman dan bisa dilanjutkan.
- Mengikuti aturan usia: untuk peserta yang memerlukan, data wali ikut diisi dalam alurnya.
- Berlaku **25 poin** per section yang selesai — daftar bobot di [Penerapan](/doc/v1/penerapan).
- Dandelion hanya mengisi data — petugas tetap memeriksa kebenarannya sebelum konfirmasi akhir.

> Pengaturan lengkap: [Config → Register Form](/doc/v1/config-register-form)
