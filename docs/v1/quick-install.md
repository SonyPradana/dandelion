# Instalasi Cepat

Jalur ini memasang Dandelion lewat **kebijakan browser** di Linux — tanpa drag-and-drop, dan pembaruan berjalan otomatis. Kebijakan mengunci ekstensi: pengguna tidak bisa menonaktifkan atau menghapusnya dari halaman ekstensi sampai kebijakannya dicabut.

> Membutuhkan `sudo`. Untuk pemasangan manual tanpa script, lihat halaman [Instalasi](/doc/v1/installation).

Browser Chromium yang didukung di Linux: **Chrome**, **Edge**, dan **Brave**. Firefox punya jalur tersendiri di bawah.

## Windows

Belum didukung untuk jalur otomatis. Chrome/Edge/Brave hanya memasang paksa ekstensi dari luar Web Store pada perangkat Windows yang dikelola organisasi (domain AD/Entra ID atau terdaftar Chrome Enterprise Core) — di luar itu browser memblokir pemasangannya. Gunakan [pemasangan manual](/doc/v1/installation).

## Linux

Script mendeteksi Linux otomatis dan menulis berkas kebijakan JSON di direktori policies browser (menggunakan `sudo`).

### Chrome

```bash
curl -fsSL https://dandelion.web.id/install/chrome.sh | sh
```

### Edge

```bash
curl -fsSL https://dandelion.web.id/install/edge.sh | sh
```

### Brave

```bash
curl -fsSL https://dandelion.web.id/install/brave.sh | sh
```

### Mencopot (Linux)

**Via script** (ganti `chrome` dengan `edge` atau `brave`):

```bash
curl -fsSL https://dandelion.web.id/uninstall/chrome.sh | sh
```

Script menghapus berkas kebijakan `dandelion.json` milik Dandelion. Buka ulang browser setelah selesai.

**Manual**: berkas kebijakan per browser:

| Browser | Lokasi berkas kebijakan                           |
| ------- | ------------------------------------------------- |
| Chrome  | `/etc/opt/chrome/policies/managed/dandelion.json` |
| Edge    | `/etc/opt/edge/policies/managed/dandelion.json`   |
| Brave   | `/etc/brave/policies/managed/dandelion.json`      |

```bash
sudo rm /etc/opt/chrome/policies/managed/dandelion.json
```

## Firefox

Firefox tidak memakai script kebijakan seperti Chromium. Cukup buka tautan berikut — Firefox menampilkan dialog pemasangan langsung:

**[Install Dandelion untuk Firefox](/install/firefox)**

- Berkas `.xpi` sudah ditandatangani (AMO, unlisted) dan diperbarui otomatis lewat `update.json`.
- Pemasangan manual dari berkas, termasuk Firefox Android, ada di halaman [Instalasi](/doc/v1/installation).
