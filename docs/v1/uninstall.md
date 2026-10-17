# Uninstalasi

Penghapusan ekstensi berbeda sedikit antar browser. Token kuota dan **Device ID** yang tersimpan secara lokal ikut terhapus; token yang telah diterbitkan tidak dicabut dan tetap berlaku sampai kedaluwarsa.

## Desktop

### Brave

1. Buka `brave://extensions`.
2. Temukan kartu **Dandelion**, klik **Remove**.
3. Konfirmasi penghapusan.
4. Hapus berkas `.zip` unduhan jika sudah tidak diperlukan.

### Chrome

1. Buka `chrome://extensions`.
2. Temukan kartu **Dandelion**, klik **Remove**.
3. Konfirmasi penghapusan.
4. Hapus berkas `.zip` unduhan jika sudah tidak diperlukan.

### Firefox

1. Buka `about:addons` → **Add-ons and themes**.
2. Klik tombol **…** pada kartu **Dandelion**, lalu pilih **Remove**.
3. Konfirmasi penghapusan.

### Edge

1. Buka `edge://extensions`.
2. Temukan kartu **Dandelion**, klik **Remove**.
3. Konfirmasi penghapusan.
4. Hapus berkas `.zip` unduhan jika sudah tidak diperlukan.

## Mobile

### Firefox (Android)

1. Buka menu Firefox → **Add-ons**.
2. Pilih **Dandelion** → **Remove**.
3. Konfirmasi penghapusan.

## Catatan

- Setelah instal ulang, ekstensi membuat **Device ID** acak baru. Jika ID baru berbeda, pemasangan token lama ditolak karena `license_id` tidak cocok — minta token baru untuk ID baru (lihat [Generator](/doc/v1/generator)).
- Jika hanya ingin menonaktifkan sementara, gunakan opsi _disable_ pada halaman ekstensi browser masing-masing.
