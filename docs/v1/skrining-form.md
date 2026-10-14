# Skrining Form

Fitur untuk mengisi formulir skrining: pilihan radio, dropdown, isian teks, dan pertanyaan sematan — dikenali lewat kata kunci yang Anda tentukan sendiri.

![Tangkap layar formulir skrining dengan tombol auto-fill dan tombol kirim Dandelion](/doc/v1/assets/skrining-form-auto-fill.webp)

## Cara Pakai

1. Siapkan konfigurasi di [Config → Form Skrining](/doc/v1/config-form-skrining): pola alamat, kata kunci jawaban, dan jawaban tetap per pertanyaan.
2. Buka formulir skrining — tombol **🙈** muncul di halaman.
3. Klik tombol itu: hitung mundur **Zen Mode Asist** berjalan sebentar (bisa dibatalkan kapan saja), lalu pengisian dimulai.
4. Tunggu sampai selesai. Bila `scrollToButton` aktif (default), halaman bergulir ke bawah supaya tinggal diperiksa.
5. Setelah formulir terisi, tombol **✉️ kirim** muncul — klik bila isian sudah benar.

## Yang Perlu Diketahui

- Jawaban dicari dari teks pertanyaan: kata kunci radio (`radioButtonKeywords`) dan dropdown (`dropdownKeywords`), plus jawaban tetap per pertanyaan (`pinneds`) yang diisi walau tidak ada kata kunci yang cocok.
- Dengan **hormati isian** aktif, kolom yang sudah Anda isi tidak ditimpa.
- Dengan **isi ulang (ensureFill)** aktif, pengisian dijalankan kedua kalinya untuk menangkap pertanyaan yang terlewat.
- Berlaku **1 poin** per isian radio/teks/dropdown yang terisi — daftar bobot di [Penerapan](/doc/v1/penerapan).
- Kendali tetap di petugas: semua isian bisa diperiksa dan diubah, dan hitung mundur bisa dibatalkan.

> Pengaturan lengkap: [Config → Form Skrining](/doc/v1/config-form-skrining)
