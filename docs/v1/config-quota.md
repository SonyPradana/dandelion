# Batas Pemakaian

Tab status kuota Dandelion di perangkat ini: token yang terpasang, masa berlaku, dan pilihan untuk memasang atau menghapus token. Semua status dibaca **lokal** — verifikasi token dilakukan di perangkat tanpa menghubungi server mana pun.

## Status Pemakaian

<!-- config-section:quota-main -->

### Saat token aktif (Pro Tier)

Tampil badge **`PRO`** beserta grid informasi dari token:

| Field             | Arti                                                                            |
| ----------------- | ------------------------------------------------------------------------------- |
| `Total Limit`     | Total poin yang boleh dipakai seumur token; `0` berarti tanpa batas             |
| `Grace Daily`     | Batas poin per hari yang dipakai sebagai pengaman                               |
| `Berlaku Sampai`  | Tanggal kedaluwarsa token                                                       |
| `Sisa Hari Ini`   | Selalu tampil `∞` untuk Pro — sisa harian bukan batas bagi pengguna Pro         |
| `Fitur`           | Daftar fitur yang diizinkan token (mis. `skrining`, `skriningform`, `zen-mode`) |
| `Versi Diizinkan` | Versi ekstensi yang cocok dengan token (`*`, pola `x.*`, atau versi tepat)      |

- Fitur berjalan sesuai daftar `Fitur` token, dan hanya pada versi yang masuk `Versi Diizinkan` — di luar itu ekstensi jatuh ke Free Tier.
- Pemakaian menuju `Total Limit` terlihat di tab **Produktivitas** (bar `Total Limit (Pro Tier)` beserta periode token).

### Saat token kedaluwarsa

- Token dibaca ulang secara otomatis saat kedaluwarsa (dicek saat ekstensi dimuat); status **langsung jatuh ke Free Tier** — badge `FREE`, grid informasi hilang, dan tampilan tab menjadi **persis sama dengan tanpa token**. Tab ini tidak menampilkan label "kedaluwarsa".
- Sisa masa berlaku masih bisa dipantau lewat **popup ekstensi** → tab **Produktifitas**: `Berakhir dalam N hari`, atau `Kedaluwarsa` bila sudah lewat.
- Fitur **tidak berhenti total** — ekstensi kembali memakai aturan Free Tier (semua fitur aktif, 50 poin/hari).
- Status bisa tertunda hingga **8 jam** oleh cache lisensi lokal — token yang baru saja kedaluwarsa mungkin masih ditampilkan sebagai Pro sampai cache habis.

### Free Tier (tanpa token)

- Badge `FREE` + keterangan `Free Tier (50 poin/hari)`.
- Semua fitur tetap aktif; batasnya 50 poin per hari (lihat [Penerapan](/doc/v1/penerapan) untuk bobot poin tiap aksi).
- Sisa poin harian **tidak ditampilkan di tab ini** — angka harian yang bisa dicek ada di tab **Produktivitas** (kolom Hari Ini).

## Device ID

Setiap perangkat memiliki **Device ID** unik — 8 karakter yang dibuat otomatis saat pertama kali ekstensi dibuka dan disimpan di browser.

- Tampil di tab ini: label `Device ID` + tombol **Salin** (berubah jadi `Tersalin!` saat berhasil disalin), dengan petunjuk `Gunakan ID ini untuk mendapatkan token`.
- Token **terikat ke Device ID**: saat memasang token, ekstensi menolak token yang dibuat untuk device lain dengan pesan `Token tidak terikat dengan device ini`. Jadi siapkan Device ID ini sebelum meminta token (lihat [Generator](/doc/v1/generator)).
- ID hanya dibuat sekali dan **tidak bisa direset** lewat pengaturan. Nilai berubah hanya bila data ekstensi terhapus (mis. instal ulang ekstensi atau pembersihan data ekstensi) — setelah itu token lama tidak bisa dipasang lagi; minta token baru untuk ID yang baru.
- Device ID hanya tampil di halaman pengaturan lengkap ini — tidak ada di popup.

## Menambahkan, Memperbarui, dan Menghapus Token

### Lewat halaman pengaturan lengkap (tab Batas Pemakaian)

Bagian **Aktifkan Token** berisi kotak teks dan dua tombol:

1. **Memasang token**: tempel token (JWT) ke kotak teks — cukup **baris pertama** yang dipakai — lalu klik **Aktifkan**.
2. **Memperbarui token**: cara yang sama — tempel token baru (mis. setelah token lama habis masa berlakunya) lalu klik **Aktifkan** lagi. Token lama langsung **ditimpa**, tanpa konfirmasi tambahan.
3. **Menghapus token**: klik **Hapus Token** — pesan `Token dihapus, kembali ke Free Tier.` tampil dan status kembali `FREE`. Tombol ini tidak aktif bila sedang Free Tier.

Pesan yang mungkin muncul setelah klik Aktifkan:

| Pesan                                             | Penyebab                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| `Masukkan token terlebih dahulu.`                 | Kotak teks kosong                                                 |
| `Token berhasil diaktifkan!`                      | Token lolos verifikasi dan tersimpan                              |
| `Gagal: Token tidak valid atau sudah kadaluarsa.` | Token rusak, signature tidak cocok, atau sudah lewat masa berlaku |
| `Gagal: Token tidak terikat dengan device ini.`   | Token dibuat untuk Device ID perangkat lain                       |

### Lewat halaman share

Bila ada halaman yang membagikan token (tombol `🚀 Terapkan`), klik tombolnya — muncul konfirmasi:

```
Yakin ingin menerapkan token ini? Token aktif saat ini akan diganti.
```

Konfirmasi **OK** langsung menimpa token yang sedang terpasang.

### Yang perlu diingat

- Verifikasi token **offline** (tanda tangan digital dan masa berlaku dicek di perangkat) — pemasangan token tidak mengirim apa pun ke server.
- Token **tidak ikut ter-ekspor** bersama konfigurasi ([Ekspor & Impor](/doc/v1/config-others)) — setelah pindah perangkat, pasang ulang token dengan Device ID perangkat baru.
- Belum punya token? Siapkan Device ID di atas, lalu buat token di [Generator](/doc/v1/generator); cara pemasangan lain ada di [Penerapan](/doc/v1/penerapan).
