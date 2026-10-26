# Registration Form

Fitur untuk mempercepat pengisian formulir pendaftaran peserta — dari data identitas sampai data peserta, lalu berhenti di konfirmasi pendaftaran.

![Tangkap layar form pendaftaran dengan tombol Mulai dan status alur Dandelion](/doc/v1/assets/register-form-flow.webp)

## Cara Pakai

1. Siapkan konfigurasi di [Config → Register Form](/doc/v1/config-register-form): pola alamat form, percobaan ulang (retry), dan template data.
2. Buka form pendaftaran — tombol **Mulai** muncul di halaman.
3. Isi panel [Flash Data](/doc/v1/flash-data), lalu klik **Mulai**. Alur berjalan bertahap dengan status di panel:
   - **`Mulai 1/3`** — data identitas peserta, termasuk pemeriksaan data.
   - **`Mulai 2/3`** — data peserta lainnya, lalu tombol **Daftarkan** ditekan.
   - **`Mulai 3/3`** — menunggu modal **Berhasil Daftar**, membaca **No. Tiket**, lalu menampilkan ringkasan.
4. Di ringkasan tersedia dua pilihan:
   - **Isi Skrining** — membersihkan state Register Form dan membuka panel awal skrining. Otomasi tidak langsung dimulai.
   - **Tutup** — membersihkan state Register Form dan menutup modal pendaftaran.
5. Isian tetap bisa diperiksa dan diperbaiki sebelum lanjut ke skrining.

## Yang Perlu Diketahui

- **Lanjut dari langkah terakhir**: bila halaman dimuat ulang saat berada di langkah 2 atau modal **Berhasil Daftar** masih terbuka, tombol Mulai melanjutkan dari posisi tersebut.
- Percobaan ulang mengikuti `retryMax` dan `retryDelay` — habis percobaan, langkah dihentikan dengan aman dan bisa dicoba lagi.
- Mengikuti aturan usia: untuk peserta yang memerlukan, data wali ikut diisi dalam alurnya.
- Berlaku **25 poin** per fase yang selesai — daftar bobot di [Penerapan](/doc/v1/penerapan).
- Dandelion hanya mengisi data — petugas tetap memeriksa kebenarannya sebelum konfirmasi akhir.

## Lanjut ke Skrining

Saat modal **Berhasil Daftar** muncul, data flash Register Form disalin ke flash data skrining dengan penanda `"skrining mandiri"` (default `true` bila tidak diisi).

- Tidak diisi atau bernilai `true` — `countdownDuration` dipakai sebagai konfirmasi sebelum pindah ke form skrining. Jika tidak dibatalkan, hitung mundur berlanjut otomatis. Membatalkan hitung mundur mengakhiri alur dan menutup modal.
- Bernilai `"false"` (string) — tidak ada hitung mundur; tombol **Isi Skrining** langsung menjadi konfirmasi. Di panel Flash Data, tulis sebagai string karena panel hanya menerima nilai string/angka.
- Setelah pindah, Dandelion hanya memasang panel awal sesuai halaman tujuan (panel Zen/Zero di halaman daftar, atau panel isi formulir di halaman skrining). Tidak ada pengisian otomatis yang dimulai.

> Pesan status pada modal situs berasal dari aplikasi situs, bukan penanda `"skrining mandiri"` milik Dandelion.

Semua jalan keluar — **Tutup** di panel Dandelion, tombol **Tutup** situs, X, atau modal yang ditutup manual — membersihkan flash data Register Form, state langkah, panel, dan status berjalan. Tombol Mulai langsung bisa dipakai lagi.

> Pengaturan lengkap: [Config → Register Form](/doc/v1/config-register-form)
