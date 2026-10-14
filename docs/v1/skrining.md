# Skrining

Fitur untuk mengisi pilihan jawaban (radio) di halaman skrining sesuai jawaban yang sudah ditentukan, agar petugas tidak perlu mengklik satu per satu.

![Tangkap layar halaman skrining dengan tombol isi radio otomatis Dandelion](/doc/v1/assets/skrining-radio-fill.webp)

## Cara Pakai

1. Siapkan konfigurasi di [Config → Skrining](/doc/v1/config-skrining): pola alamat halaman dan jawaban per pertanyaan (`skrining.answers`).
2. Buka halaman skrining — pengisian berjalan **mengikuti saat Anda berpindah halaman** (tiap kali maju ke halaman berikutnya).
3. Untuk mengisi **satu kali saja** tanpa mengikuti alur, klik tombol **🙈** yang muncul di halaman; pengisian berlaku untuk halaman yang sedang terbuka lalu berhenti.
4. Periksa hasilnya — semua isian masih bisa diubah manual sebelum dikirim.

## Yang Perlu Diketahui

- Pertanyaan yang masuk daftar kecuali (`skrining.excludes`) **tidak disentuh** otomatis — isilah sendiri sesuai kasus.
- Pertanyaan tanpa jawaban di konfigurasi mengikuti perilaku bawaan: semua opsi yang belum tercentang diklik.
- Berlaku **1 poin** kuota per radio yang terisi — daftar bobot di [Penerapan](/doc/v1/penerapan).
- Pengiriman tetap tugas petugas; Dandelion hanya mengisi pilihannya.

> Pengaturan lengkap: [Config → Skrining](/doc/v1/config-skrining)
