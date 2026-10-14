# Produktivitas

Tab statistik kerja Anda di halaman pengaturan lengkap. Semua angka dihitung **lokal di perangkat ini** — tidak dikirim ke mana pun. Segarkan tampilan kapan saja lewat tombol **↻** di judul tab.

## Statistik

<!-- config-section:produktifitas-main -->

## Kolom "Hari Ini"

Enam baris kategori; masing-masing menampilkan poin hari ini, **selisih dibanding kemarin** `(±n)`, dan total sepanjang masa:

| Baris            | Kategori                                 |
| ---------------- | ---------------------------------------- |
| 📻 Radio         | jawaban radio (Skrining & Skrining Form) |
| 📝 Teks          | isian teks bebas                         |
| 📋 Dropdown      | pilihan dropdown                         |
| ❌ Tidak Periksa | baris lewati yang diproses Zero Mode     |
| 🧘 Zen           | baris yang diproses Zen Mode             |
| 📝 Register      | section pendaftaran yang selesai         |

Baris **Total** menggabungkan semuanya. Bila belum ada aktivitas hari ini, tampil keterangan `Belum ada data hari ini.`

## Kolom "Ringkasan"

- 🏆 **Grand Total** — total poin sepanjang waktu
- 📆 **Hari Aktif** — jumlah hari yang punya catatan
- ⚡ **Rata-rata/hari** — grand total dibagi hari aktif
- **Progress bar** — `Progress Minggu Ini (target 30.000 poin)`: poin dari Senin sampai hari ini dibanding target **30.000 poin per minggu**. Target ini tetap, tidak bisa diubah lewat pengaturan, dan tidak ada penanda "tercapai" — bar berhenti di penuh bila lewat target.
- **Pro Tier** (token terpasang): bar **Total Limit** menampilkan pemakaian sejak token dibuat (`x / limit poin`) beserta periode token yang berlaku.
- **Free Tier**: keterangan `50 poin/hari · tanpa total limit`. **Sisa poin harian tidak tampil di tab ini** — cek di tab **Batas Pemakaian** ([Config → Kuota](/doc/v1/config-quota)).

## Grafik Produktivitas

- Batang vertikal per hari; judul menyesuaikan rentang data: **Grafik Produktivitas 7H / 14H / 30H Terakhir** — 7 hari sebagai dasar, 14H bila riwayat sudah ≥14 hari, 30H bila ≥30 hari.
- Tinggi tiap batang relatif terhadap **hari tersibuk** dalam rentang, bukan terhadap target.
- Label bawah menampilkan tanggal (`MM-DD`). Grafik tidak menyediakan tooltip atau angka per bar — angka harian yang tepat ada di kolom "Hari Ini".
- Tanpa data sama sekali, batang tetap tampil setinggi minimum tanpa label tanggal.

## Yang perlu diingat

- **Tidak ada** tombol reset statistik atau ekspor di tab ini — angka menumpuk mengikuti aktivitas harian.
- Bobot poin tiap aksi tercantum di [Penerapan](/doc/v1/penerapan).
- Tab ini tanpa pengaturan tersendiri — angka mengikuti aktivitas fitur dari grup [Handler](/doc/v1/skrining).
- Statistik **lokal per perangkat** dan **tidak ikut ter-ekspor** bersama konfigurasi ([Ekspor & Impor](/doc/v1/config-others)).
