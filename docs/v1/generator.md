# Token Kuota

Token kuota (berkas JWT) menentukan batas pemakaian Dandelion di perangkat: berapa poin yang bisa dipakai, fitur apa saja yang aktif, dan sampai kapan token berlaku. Tanpa token, ekstensi berjalan pada Free Tier — penjelasan dan cara memasang token ada di halaman [Penerapan](/doc/v1/penerapan).

## Dengan generator

Token diterbitkan lewat [Token Generator](/token-generator.html). Penerbitan token memerlukan **private key**, sehingga:

> **Catatan**: public key (di sisi server dan ekstensi) dan private key (di generator) **harus sepasang**. Hanya pemegang private key yang bisa menerbitkan token yang valid — hubungi operator/developer untuk membuatkan token, dan jangan pernah memakai private key dari sumber yang tidak kamu percaya.

Langkah:

1. Buka [Token Generator](/token-generator.html).
2. Tempel **private key** (format PEM) pada kolom Private Key — gunakan tombol **Paste** atau **Import** bila berkasnya sudah ada di perangkat.
3. Isi **Token ID** sesuai ketentuan penerbit — ID ini dipakai untuk mengaitkan token dengan perangkat pemasang.
4. Atur **Expiry** (masa berlaku), **Total Limit**, **Daily Limit**, **Version Allowed**, dan **Features** sesuai paket yang diberikan.
5. Klik **Generate Token**.
6. Salin JWT pada kolom keluaran, atau gunakan tombol **Send** untuk membuat link berbagi bila token akan dipasang lewat link (lihat halaman [Penerapan](/doc/v1/penerapan)).

![Form Token Generator dengan kolom private key dan pengaturan token](/doc/v1/assets/token-generator-form.webp)

## Build sendiri (untuk developer)

Dandelion adalah proyek **open source** (lisensi MIT) — dengan salinan sumber kodenya, Anda bisa menjalankan generator sendiri dengan pasangan kunci buatan sendiri:

1. Siapkan salinan sumber kode Dandelion di perangkat Anda (arsip rilis atau salinan yang Anda pegang).
2. Buat pasangan kunci: `node scripts/generate-license-keys.js` — menghasilkan `keys/license-priv.pem` dan `keys/license-pub.pem`.
3. Ganti isi `PUBLIC_KEY` pada `src/quota/public-key.js` dengan isi `keys/license-pub.pem`. Berkas ini dipakai bersama oleh ekstensi dan server, jadi verifikasi token langsung memakai kunci baru.
4. Build ekstensi: `pnpm build`
5. Terbitkan token sendiri: `node scripts/gen-quota-token.mjs -k keys/license-priv.pem -e 7d -p 30000 --version-allowed "1.*" --token-id <id>`

> Simpan private key di tempat yang aman. Mengganti public key membuat semua token lama langsung tidak valid.
