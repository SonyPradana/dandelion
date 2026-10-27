# Mode Zen

Pengaturan untuk asisten Zen/Zero Mode dan panel flash data yang muncul di halaman kerja.

## Aktifkan Asisten Zen Mode

<!-- config-section:zen-mode-enabled -->

- **`zenMode.enabled`** — menampilkan tombol Zen & Zero di halaman daftar. Efek: `true` = tombol muncul dan otomasi siap dipakai; `false` = tombol disembunyikan. Default `false` (boolean). Contoh: `true`.

## Waktu Tunggu

<!-- config-section:zen-mode-timeout -->

- **`zenMode.timeout`** — jeda tunggu dalam milidetik sebelum asisten mulai memproses baris; nilai yang sama juga dipakai countdown Zen Asist di formulir. Efek: lebih singkat = lebih cepat mulai, masih sempat dibatalkan. Dibatasi otomatis 500–30000 ms walau diisi di luar rentang. Default `5000`. Contoh: `8000`.

## Tampilkan Panel Flash Data

<!-- config-section:zen-mode-flash-toggle -->

- **`flashData.enabled`** — menampilkan panel Flash Data di halaman kerja. Efek: panel berisi data sementara tampil dan siap dipakai fitur lain; `false` = panel disembunyikan dan data tidak disimpan. Default `false` (boolean). Contoh: `true`.
- **`flashData.maxAge`** — umur data dalam panel, dalam milidetik. Efek: lewat batas ini data dianggap kedaluwarsa dan dibuang otomatis. Tanpa tombol di pengaturan — ubah lewat impor konfigurasi bila perlu. Default `600000` (10 menit). Contoh: `300000`.

## Template Flash Data

<!-- config-section:zen-mode-flash-template -->

- **`zenMode.defaultPinneds`** — isi awal panel Flash Data saat panel dibuka pada Mode Zen / Zero Mode (objek JSON: nama kolom → nilai). Efek: panel langsung terisi template ini, tinggal disesuaikan. Jika ada handoff Register Form, datanya digabung dan menang atas template. Default `{}` (kosong). Contoh: `{"key": ""}`.

> **Catatan data**: isi template hanya dengan data yang Anda ketahui benar, dan jangan bagikan berkas konfigurasi yang sudah terisi.
