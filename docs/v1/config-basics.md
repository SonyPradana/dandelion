# Popup

Pengaturan Dandelion tersimpan sebagai JSON lokal di browser Anda — tidak dikirim ke mana pun, dan bisa diekspor atau diimpor sebagai berkas biasa (lihat [Lainnya](/doc/v1/config-others)).

Popup ekstensi adalah pintu masuk cepat dan berisi tiga tab:

## Persetujuan

Menampilkan syarat dan ketentuan penggunaan — salinan yang sama dengan halaman [Persetujuan Penggunaan](/doc/v1/agreement). Centang **Saya telah membaca dan menyetujui syarat dan ketentuan** untuk mengaktifkan tab **Konfigurasi** dan **Produktivitas**; sebelum itu keduanya dinonaktifkan.

## Konfigurasi

Pengaturan cepat dengan grup berikut:

- **[Profil](/doc/v1/config-profile)** — profil aktif dan daftar profil.
- **[Form Skrining](/doc/v1/config-form-skrining)** — pola URL, opsi pengisian, dan nilai tersemat.
- **[Form Tidak Periksa](/doc/v1/config-not-checked)** — pola URL pemeriksaan dan daftar master "tidak periksa".
- **[Skrining](/doc/v1/config-skrining)** — pola URL dan jawaban radio.
- **[Register Form](/doc/v1/config-register-form)** — pola URL, max retry, jeda retry, dan countdown.

Tombol **Simpan** menyimpan perubahan, sedangkan **Ekspor**/**Impor** memindahkan konfigurasi sebagai berkas JSON. Tautan **⚙️ Konfigurasi Lengkap** membuka halaman pengaturan penuh pada tab Profil.

## Produktivitas

Ringkasan kerja hari ini per kategori (radio, teks, dropdown, tidak periksa, Zen, dan register), total keseluruhan, serta progres target. Tautan **⚙️ Konfigurasi Lanjutan** membuka tab Produktivitas di halaman pengaturan penuh — rinciannya di [Produktivitas](/doc/v1/config-productivity).

Setiap pengaturan mengikuti **profil aktif** — profil adalah unit konfigurasi utuh, sehingga Anda bisa punya beberapa set pengaturan terpisah.

## Konfigurasi Lanjutan

| Halaman                                       | Isi pengaturan                                           |
| --------------------------------------------- | -------------------------------------------------------- |
| [Profil](/doc/v1/config-profile)              | Daftar profil dan profil aktif                           |
| [Form Skrining](/doc/v1/config-form-skrining) | Pola URL, opsi pengisian, kata kunci, dan nilai tersemat |
| [Skrining](/doc/v1/config-skrining)           | Pola URL, jawaban radio, dan pengecualian                |
| [Register Form](/doc/v1/config-register-form) | Pola URL, retry, countdown, dan template flash data      |
| [Tidak Periksa](/doc/v1/config-not-checked)   | Pola URL pemeriksaan dan daftar baris lewati             |
| [Mode Zen](/doc/v1/config-zen-mode)           | Asisten Zen/Zero, waktu tunggu, dan panel flash data     |
| [Produktivitas](/doc/v1/config-productivity)  | Statistik kerja dan target                               |
| [Lainnya](/doc/v1/config-others)              | Notifikasi, posisi panel, ekspor/impor                   |
| [Batas Pemakaian](/doc/v1/config-quota)       | Kuota harian dan status token                            |
