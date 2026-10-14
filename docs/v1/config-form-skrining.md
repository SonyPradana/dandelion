# Form Skrining

Pengaturan untuk fitur auto-fill formulir skrining. Halaman yang mau diisi ditentukan oleh pola URL, lalu jawaban dipilih berdasarkan kata kunci.

> Pencocokan URL memakai **substring** — cukup isi bagian khas dari alamat, bukan harus alamat penuh.

## URL Form Skrining

<!-- config-section:form-skrining-url -->

- **`formSkrining.url`** — pola alamat halaman formulir yang mau diisi. Efek: auto-fill hanya aktif di halaman yang alamatnya mengandung pola ini; kosong = fitur tidak pernah aktif otomatis. Contoh: `https://contoh.example.go.id/form-skrining`.

## Opsi Pengisian

<!-- config-section:form-skrining-options -->

- **`formSkrining.scrollToButton`** — setelah pengisian selesai, halaman digulir otomatis ke tombol navigasi bawah supaya tinggal periksa lalu kirim. Default `true` (boolean); `false` = tetap di posisi semula.
- **`formSkrining.respectInput`** — pertanyaan yang sudah terisi (oleh Anda atau sisa isi sebelumnya) tidak ditimpa ulang. Default `false`: semua kolom yang cocok diisi kembali.
- **`formSkrining.ensureFill`** — setelah pass pertama, Dandelion mengulang sekali untuk menangkap pertanyaan yang terlewat (misalnya dropdown yang belum sempat termunculkan). Default `false`; aktifkan bila masih ada kolom kosong setelah auto-fill.

## Kata Kunci Tombol Radio

<!-- config-section:form-skrining-radio-keywords -->

- **`formSkrining.radioButtonKeywords`** — daftar teks jawaban radio yang dicari, dipisah `;`. Efek: tiap pertanyaan radio dijawab dengan opsi yang teksnya mengandung salah satu kata kunci — isi sesuai urutan prioritas. Default `''` (kosong). Contoh: `ya;tidak`.

## Kata Kunci Dropdown

<!-- config-section:form-skrining-dropdown-keywords -->

- **`formSkrining.dropdownKeywords`** — daftar teks pilihan dropdown yang dicari, dipisah `;`. Efek: dropdown dibuka lalu opsi yang teksnya cocok dipilih. Default `''` (kosong). Contoh: `pilih-satu`.

## Data Dikecualikan

<!-- config-section:form-skrining-excludes -->

- **`formSkrining.excludes`** — daftar pertanyaan yang dilewati, dipisah `;`. Efek: pertanyaan dalam daftar tidak pernah diisi otomatis — biarkan Anda mengisinya sendiri. Default `''` (kosong). Contoh: `pertanyaan1;pertanyaan2`.

## Nilai Tersemat

<!-- config-section:form-skrining-pinned-values -->

- **`formSkrining.pinneds`** — jawaban tetap per pertanyaan (objek JSON: pengenal pertanyaan → jawaban). Efek: kolom ini diisi otomatis walau tidak ada kata kunci yang cocok — berguna untuk jawaban yang selalu sama. Default `{}` (kosong). Contoh: `{"pertanyaan1": "jawaban"}`.
