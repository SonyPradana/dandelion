# Tidak Periksa

Pengaturan untuk halaman daftar "Tidak Periksa" — tempat fitur Zen & Zero Mode bekerja.

## URL Pemeriksaan

<!-- config-section:not-checked-url -->

- **`notChecked.url`** — pola alamat halaman daftar pemeriksaan. Efek: panel kontrol beserta tombol Zen & Zero dipasang hanya di halaman yang alamatnya mengandung pola ini (dicocokkan sebagai bagian alamat). Default `''` (kosong). Contoh: `https://contoh.example.go.id/pemeriksaan`.

## Daftar Master "Tidak Periksa"

<!-- config-section:not-checked-list -->

- **`notChecked.notCheckedList`** — daftar ID baris yang masuk kategori "lewati", dipisah `;`. Efeknya **berbeda antar mode**: [Zero Mode](/doc/v1/zen-zero-mode) **menghitung** baris ini sebagai pekerjaan selesai, sedangkan Zen Mode **melewati** baris ini tanpa diproses. Default `''` (kosong). Contoh: `baris1;baris2`.
