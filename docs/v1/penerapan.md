# Penerapan

Token yang sudah dibuat dapat dipasang di tiga cara. Sebelum memasang token, ketahui dulu batasan Free Tier di bawah.

## Free Tier dan limitasinya

Tanpa token — atau saat token tidak valid, sudah kadaluarsa, atau tidak cocok dengan versi ekstensi — Dandelion berjalan pada **Free Tier**:

- Kuota **50 poin per hari** (dihitung lokal per perangkat, direset setiap hari)
- Semua fitur tetap dapat digunakan sampai kuota harian habis
- Bobot poin tiap aksi:

| Aksi                | Poin |
| ------------------- | ---- |
| Radio               | 1    |
| Teks                | 1    |
| Dropdown            | 1    |
| Tidak dicek         | 5    |
| Zen mode            | 5    |
| Isi form registrasi | 25   |

Dengan token, batas pemakaian mengikuti isi token: **Total Limit** (0 berarti tanpa batas total) dan **Daily Limit** menjadi jatah toleransi setelah Total Limit terlampaui. Daftar **Features** dan **Version Allowed** pada token menentukan fitur serta versi ekstensi yang boleh memakainya.

## Tempel dari generator

1. Setelah **Generate Token**, salin JWT dari kolom keluaran.
2. Buka panel pengaturan Dandelion → bagian **Aktifkan Token**.
3. Tempel JWT pada kolom yang tersedia, lalu klik **Aktifkan**.
4. Status berubah menjadi token aktif dan informasi kuota tampil pada panel.

![Panel Aktifkan Token pada pengaturan Dandelion](/doc/v1/assets/extension-token-panel.webp)

## Salin dari link share

1. Buka link share yang kamu terima.
2. Salin JWT yang tampil pada halaman share.
3. Tempel pada bagian **Aktifkan Token** seperti cara di atas.

## Terapkan langsung dari link share

1. Buka link share di perangkat tempat token akan dipasang.
2. Dandelion mendeteksi halaman share secara otomatis dan menampilkan tombol **Terapkan**.
3. Klik **Terapkan**, lalu konfirmasi — token langsung aktif.

![Halaman share dengan tombol Terapkan dari Dandelion](/doc/v1/assets/share-page-apply.webp)

> Secara umum: penerapan token hanya berlaku untuk perangkat yang cocok. Bila tombol **Terapkan** tidak muncul atau pemasangan gagal, hubungi penerbit token.

## Catatan

- Token yang sudah terpasang bisa dihapus lewat tombol **Hapus Token** — ekstensi kemudian kembali ke Free Tier.
- Kuota dihitung per perangkat, sehingga memasang token yang sama di beberapa perangkat tidak menggabungkan kuota.
