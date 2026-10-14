# Lainnya

Pengaturan umum: notifikasi, posisi panel, dan ekspor/impor konfigurasi.

## Notifikasi

<!-- config-section:lainnya-notifikasi -->

- **`silenceInfoNotification`** — mematikan notifikasi tingkat info (misalnya pemberitahuan "Selesai"). Efek: `true` = notifikasi info tidak muncul dan pekerjaan lebih tenang; peringatan penting tetap tampil. Default `false` (boolean). Contoh: `true`.

## Posisi Panel

<!-- config-section:lainnya-posisi-panel -->

- **`panelPosition`** — sudut layar tempat panel Dandelion mengambang. Efek: panel langsung dipindah ke posisi baru tanpa restart. Default `top-right`; pilihan: `top-left`, `top-right`, `bottom-left`, `bottom-right`. Contoh: `bottom-left`.

## Ekspor dan Impor Konfigurasi

<!-- config-section:lainnya-ekspor-impor -->

Konfigurasi berupa **berkas JSON biasa** — tidak terikat pada layanan mana pun, jadi bisa dipindahkan antar perangkat atau browser kapan saja. Fitur ini sering dipakai untuk **pindah device** dan **fresh install**.

Tersedia di dua tempat, caranya sama:

- Halaman pengaturan lengkap → tab **Lainnya** → bagian **Ekspor & Impor Konfigurasi** (`📥 Ekspor Konfigurasi` / `📤 Impor Konfigurasi`)
- **Popup ekstensi** → tab **Konfigurasi** → tautan `Ekspor` / `Impor`

### Ekspor (backup / pindah device)

1. Buka salah satu tempat di atas, lalu klik **Ekspor**.
2. Peramban mengunduh berkas bernama **`dandelion-config.json`** — berisi semua profil beserta seluruh pengaturannya, plus posisi panel dan pilihan notifikasi.
3. Simpan berkas itu di tempat aman (flashdisk, folder pribadi, dsb).

> **Yang TIDAK ikut ter-ekspor**: token kuota, statistik produktivitas, dan identitas perangkat. Jadi di perangkat baru, pasang ulang token lewat [Penerapan](/doc/v1/penerapan) setelah impor.

### Impor (fresh install / perangkat baru)

1. Pasang ekstensi di perangkat baru (lihat [Instalasi](/doc/v1/installation)). Saat pertama kali, pengaturan masih **default kosong** (Profil 1 & Profil 2).
2. Buka tempat Ekspor/Impor di atas, lalu klik **Impor**.
3. Pilih berkas `dandelion-config.json` hasil ekspor (pilih file hanya menerima `.json`).
4. Muncul konfirmasi:

   ```
   Impor 2 profil (aktif: Profil Utama)?
   Konfigurasi saat ini akan ditimpa. Lanjutkan?
   ```

5. Klik **OK** — semua pengaturan langsung terganti, tampilan menyegarkan diri tanpa perlu reload, dan tombol menampilkan **"Diimpor!"** sebentar sebagai tanda sukses.
6. Pasang ulang token (bila dipakai), lalu periksa kembali pengaturan per profil sebelum dipakai kerja.

### Yang perlu diingat

- Impor **menimpa seluruh** konfigurasi yang ada (bukan digabung). Batal = tidak ada perubahan.
- Field yang kurang pada berkas diisi **otomatis dengan nilai default** — berkas ekspor dari versi mana pun aman.
- Kalau gagal, muncul peringatan berisi penyebab pertama, contoh:
  - `JSON tidak valid: …` — berkas bukan JSON utuh (terpotong/korup)
  - `Key "…" tidak didukung.` — berkas bukan ekspor Dandelion
  - `"panelPosition" tidak valid. Gunakan salah satu: top-left, top-right, bottom-left, bottom-right.`
- Ada juga tombol **📝 Edit Konfigurasi (JSON)** pada section yang sama untuk memeriksa atau mengubah isi konfigurasi langsung.

### Keamanan berkas

- **Jangan bagikan** berkas konfigurasi yang sudah terisi ke pihak yang tidak berwenang — bisa berisi pengaturan internal Anda.
- Impor hanya dari berkas yang Anda buat sendiri atau yang benar-benar Anda percaya.
- Berkas ekspor **tidak berisi token** — aman disimpan sebagai backup pengaturan, tetapi tetap jaga privasinya.
