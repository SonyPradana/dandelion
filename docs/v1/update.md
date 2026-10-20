# Pembaruan

Perilaku pembaruan tergantung cara pemasangan. Firefox (termasuk `.xpi` yang dipasang manual) dan pemasangan lewat kebijakan browser di Linux diperbarui otomatis; pemasangan manual `.zip` Chromium tidak.

## Firefox

Firefox memeriksa pembaruan secara berkala melalui berkas manifest yang diterbitkan server (`/update.json`).

- Pembaruan terpasang otomatis di latar belakang — tidak ada tindakan yang diperlukan.
- Nomor versi terpasang bisa dilihat pada kartu Dandelion di `about:addons`.
- Versi terbaru selalu tercantum di [halaman utama](/).

## Chrome, Brave, dan Edge

Browser Chromium memperlakukan ekstensi yang dipasang dari berkas sebagai versi manual, sehingga tidak diperbarui otomatis.

1. Unduh paket `.zip` terbaru dari [halaman utama](/).
2. Buka halaman ekstensi browser (`chrome://extensions`, `brave://extensions`, atau `edge://extensions`).
3. **Tarik berkas `.zip` baru** dari folder unduhan dan **lepas di halaman ekstensi**.
4. Pastikan nomor versi pada kartu Dandelion sesuai dengan versi di [halaman utama](/).

Jika dipasang lewat [kebijakan browser](/doc/v1/quick-install) di Linux, pembaruan berjalan otomatis dari server — sama seperti Firefox.

## Mobile

### Firefox (Android)

Pembaruan mengikuti skema yang sama dengan Firefox desktop. Jika pembaruan otomatis tidak terjadi, unduh ulang berkas `.xpi` terbaru dari [halaman utama](/) dan pasang seperti pada langkah [Instalasi](/doc/v1/installation).
