# Profil

Profil menyimpan satu set pengaturan utuh. Ekstensi menyediakan dua profil bawaan dan memakai **profil aktif** untuk semua fitur.

## Daftar profil

<!-- config-section:profile-main -->

- **`activeProfile`** — menentukan profil mana yang dipakai semua fitur saat ini; semua URL, kata kunci, dan jawaban dibaca dari profil ini. Default `profile1`; pilih lain lewat Profile Manager. Contoh: `profile2`.
- **`profiles.<id>.name`** — nama tampilan profil di daftar; hanya label, tidak memengaruhi perilaku fitur. Default `Profile 1`. Contoh: `Profil Utama`.

Semua konfigurasi lain (URL, kata kunci, jawaban) tersimpan **di dalam** profil, bukan global — jadi beda profil bisa beda pengaturan unit kerja.

## Mengelola Profil

Profil dikelola lewat **Profile Manager** — di halaman pengaturan lengkap (tab **Profil**) dan di popup ekstensi (tab **Profile**). Setiap aksi langsung tersimpan, tanpa tombol Simpan terpisah.

| Aksi          | Cara                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Pilih aktif   | klik kartu profil (penanda ●)                                                                                |
| Ganti nama    | tombol ✏️ → ketik nama baru → Enter atau klik di luar (maks 30 karakter)                                     |
| Duplikat      | tombol 📋 — menyalin **seluruh** pengaturan profil lain; hasil diberi akhiran `(copy)`                       |
| Hapus         | tombol 🗑️ → konfirmasi `Hapus profile "…"?`                                                                  |
| Tambah profil | baris **+** di bawah daftar (muncul bila jumlah profil kurang dari 5); nama diisi lalu Enter atau klik **+** |

### Aturan yang perlu diketahui

- Jumlah profil: **maksimum 5, minimum 1** — profil terakhir tidak bisa dihapus.
- Profil aktif **bisa** dihapus; setelah itu profil aktif pindah ke profil pertama yang tersisa. Bila ada perubahan belum disimpan, pindah profil memunculkan konfirmasi dulu.
- Profil baru dan hasil duplikat **tidak otomatis aktif** — klik kartunya dulu untuk memakainya.
- Nama profil **boleh sama** antar profil; hanya hasil duplikat yang otomatis diberi akhiran `(copy)`, `(copy 2)`, dan seterusnya bila bentrok.
- Profil baru berisi pengaturan **kosong** (semua pola URL dan jawaban pada nilai default) — isi dari nol, atau duplikat profil yang sudah jadi lalu sesuaikan.

### Yang perlu diingat

- Profil bawaan `Profile 1` dan `Profile 2` akan **muncul kembali (kosong)** bila dihapus, karena nilai default selalu disertakan saat konfigurasi dibaca ulang. Profil buatan Anda sendiri benar-benar hilang setelah dihapus.
- Berkas ekspor konfigurasi memuat **semua profil** sekaligus — untuk backup atau pindah perangkat, lihat [Lainnya → Ekspor dan Impor](/doc/v1/config-others).
