# Skrining

Pengaturan untuk fitur pengisian radio pada halaman skrining. Halaman ditentukan oleh pola URL; jawaban dan pengecualian ditentukan per ID pertanyaan.

## URL Halaman Skrining

<!-- config-section:skrining-url -->

- **`skrining.url`** — pola alamat halaman skrining. Efek: pengisian radio hanya berjalan di halaman yang alamatnya mengandung pola ini (dicocokkan sebagai bagian alamat). Default `''` (kosong). Contoh: `https://contoh.example.go.id/skrining`.

## ID Dikecualikan

<!-- config-section:skrining-excludes -->

- **`skrining.excludes`** — daftar ID pertanyaan yang dilewati, dipisah `;`. Efek: pertanyaan dalam daftar tidak disentuh otomatis — pilih manual bila jawabannya per kasus. Default `''` (kosong). Contoh: `pertanyaan1;pertanyaan2`.

## Jawaban Radio

<!-- config-section:skrining-answers -->

- **`skrining.answers`** — jawaban per pertanyaan (objek JSON: ID pertanyaan → jawaban). Efek: radio terisi sesuai pasangan ini; ID yang tidak ada di `excludes` dan tidak punya jawaban mengikuti perilaku bawaan (semua opsi yang belum tercentang diklik). Default `{}` (kosong). Contoh: `{"pertanyaan1": "jawaban"}`.
