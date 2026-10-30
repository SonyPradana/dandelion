# Registration Form

Fitur untuk mempercepat pengisian formulir pendaftaran peserta — dari data identitas sampai data peserta, lalu berhenti di konfirmasi pendaftaran.

![Tangkap layar form pendaftaran dengan tombol Mulai dan status alur Dandelion](/doc/v1/assets/register-form-flow.webp)

## Cara Pakai

1. Siapkan konfigurasi di [Config → Register Form](/doc/v1/config-register-form): pola alamat form, percobaan ulang (retry), dan template data.
2. Buka form pendaftaran — tombol **Mulai** muncul di halaman.
3. Isi panel [Flash Data](/doc/v1/flash-data), lalu klik **Mulai**. Alur berjalan bertahap dengan status di panel:
   - **`Mulai 1/3`** — data identitas peserta, termasuk pemeriksaan data.
   - **`Mulai 2/3`** — data peserta lainnya, lalu tombol **Daftarkan** ditekan.
   - **`Mulai 3/3`** — menunggu modal **Berhasil Daftar**, lalu menampilkan ringkasan.
4. Setelah pendaftaran berhasil:
   - bila `"skrining mandiri"` bernilai `true`, Dandelion langsung menampilkan hitung mundur dan membantu perpindahan ke skrining;
   - bila `false` atau kosong, ringkasan menampilkan pilihan **Isi Skrining** dan **Tutup**. **Isi Skrining** menjalankan handoff yang sama tanpa hitung mundur.
5. Isian tetap bisa diperiksa dan diperbaiki sebelum lanjut ke skrining.

## Yang Perlu Diketahui

- **Lanjut dari langkah terakhir**: bila halaman dimuat ulang saat berada di langkah 2 atau modal **Berhasil Daftar** masih terbuka, tombol Mulai melanjutkan dari posisi tersebut.
- Percobaan ulang mengikuti `retryMax` dan `retryDelay` — habis percobaan, langkah dihentikan dengan aman dan bisa dicoba lagi.
- Mengikuti aturan usia: untuk peserta yang memerlukan, data wali ikut diisi dalam alurnya.
- Berlaku **25 poin** per fase yang selesai — daftar bobot di [Penerapan](/doc/v1/penerapan).
- Dandelion hanya mengisi data — petugas tetap memeriksa kebenarannya sebelum konfirmasi akhir.

## Lanjut ke Skrining

Saat modal **Berhasil Daftar** muncul, Register Form membaca penanda `"skrining mandiri"`. Nilai default dan kosong dianggap `false`.

- **`true`** — Dandelion menyalin data flash ke skrining, menampilkan hitung mundur, lalu membantu perpindahan: klik tombol lanjut situs, klik **Mulai Pemeriksaan**, dan konfirmasi tanggal pemeriksaan. Jika `"tanggal pemeriksaan"` tidak bisa dipilih di kalender situs, Dandelion tetap menekan **Simpan** dengan tanggal default dan memberi tahu pengguna. Jika hitung mundur dibatalkan, alur berhenti dan data handoff tidak dipakai.
- **`false` atau kosong** — panel ringkasan muncul tanpa hitung mundur. Tombol **Isi Skrining** milik Dandelion dan **Bantu Isi Skrining Mandiri** milik situs sama-sama menjalankan handoff: menyalin data flash, membuka halaman skrining, lalu membantu **Mulai Pemeriksaan** dan konfirmasi tanggal.
- Setelah pindah, Dandelion memasang panel awal sesuai halaman tujuan (panel Zen/Zero di halaman daftar, atau panel isi formulir di halaman skrining). Tidak ada pengisian otomatis yang dimulai.
- Data handoff di halaman daftar tetap disimpan sampai pengguna pindah ke formulir. Jika Zen/Zero dimulai dan panel Flash Data aktif, data handoff diubah menjadi data sesi agar dipakai lintas formulir; jika langsung ke formulir, data dibersihkan setelah panel isi formulir dipasang.

> Pesan status pada modal situs berasal dari aplikasi situs, bukan penanda `"skrining mandiri"` milik Dandelion.

Semua jalan keluar — **Tutup** di panel Dandelion, tombol **Tutup** situs, X, atau modal yang ditutup manual — membersihkan flash data Register Form, state langkah, panel, dan status berjalan. Tombol Mulai langsung bisa dipakai lagi.

> Pengaturan lengkap: [Config → Register Form](/doc/v1/config-register-form)
