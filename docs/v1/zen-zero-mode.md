# Zen & Zero Mode

Fitur otomasi untuk memproses daftar pemeriksaan baris demi baris pada halaman daftar. Dua mode tersedia; perbedaannya hanya pada perlakuan terhadap baris "lewati".

![Tangkap layar panel kontrol Zen dan Zero Mode di halaman daftar](/doc/v1/assets/zen-zero-panel.webp)

## Cara Pakai

1. Aktifkan asisten di [Config → Mode Zen](/doc/v1/config-zen-mode) (`zenMode.enabled`) dan isi pola alamat halaman daftar di [Config → Pemeriksaan](/doc/v1/config-not-checked) (`notChecked.url`).
2. Buka halaman daftar — panel kontrol muncul dengan dua tombol: **⚡** (Zen Mode) dan **Zero** (Zero Mode).
3. Tandai baris yang mau dilewati lewat penanda baris Dandelion, atau siapkan daftarnya lebih dulu lewat `notChecked.notCheckedList`.
4. Klik mode yang diinginkan: proses berjalan **baris demi baris** dan menandai baris yang sudah diproses.
5. Antrean bisa **dihentikan dan dilanjutkan** kapan saja — posisi antrean tersimpan, termasuk setelah halaman dimuat ulang.
6. Di akhir daftar, Dandelion menawarkan **"Selesaikan Layanan?"** — konfirmasi bila ingin tombol penutup daftar ditekan otomatis.

## Yang Perlu Diketahui

| Mode     | Baris biasa | Baris lewati                                |
| -------- | ----------- | ------------------------------------------- |
| **Zen**  | diproses    | dilewati, tidak dihitung                    |
| **Zero** | diproses    | **dihitung sebagai pekerjaan yang selesai** |

- Pilih mode sesuai ketentuan kerja yang berlaku.
- Berlaku **5 poin** per baris yang diproses Zen Mode dan **5 poin** per baris "Tidak Periksa" yang diproses Zero Mode — daftar bobot di [Penerapan](/doc/v1/penerapan).
- Progres dan kendali (hentikan/lanjut) selalu di tangan petugas.

> Pengaturan: [Config → Mode Zen](/doc/v1/config-zen-mode) dan [Config → Pemeriksaan](/doc/v1/config-not-checked)
