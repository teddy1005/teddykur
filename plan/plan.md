# Deploy POP Network Monitoring ke Server Sendiri via aaPanel

Menyiapkan aplikasi agar bisa dijalankan di server (VPS/on-prem) Anda sendiri melalui aaPanel, lengkap dengan panduan langkah demi langkah.
Menjalankan di server sendiri membuat engine bisa menjangkau MikroTik langsung, sehingga monitoring LIVE (API/SNMP) berjalan penuh — bukan lagi data simulasi.

## Untuk Siapa
Admin/operator NOC yang ingin menghosting sistem ini di infrastruktur sendiri, dengan domain + HTTPS, MongoDB lokal, dan akses langsung ke jaringan backbone/MikroTik.

## Yang Akan Disiapkan (deliverable)
- **Mode produksi ramah self-host**: semua konfigurasi via environment (tanpa URL/secret bawaan platform). Cookie login otomatis aman untuk domain HTTPS, CORS mengikuti domain Anda, WebSocket real-time jalan di belakang Nginx.
- **Perintah menjalankan backend produksi** untuk dijalankan lewat "Python Project Manager" aaPanel (beberapa worker, restart otomatis).
- **Build statis frontend** yang menunjuk ke domain Anda, disajikan sebagai situs Nginx.
- **Template konfigurasi Nginx**: menyajikan frontend + reverse proxy `/api` dan `/api/ws` (WebSocket) ke backend, siap dipasang SSL Let's Encrypt aaPanel.
- **Berkas contoh environment** (`.env`) untuk backend & frontend, berisi daftar nilai yang harus Anda isi (domain, secret, admin, MongoDB).
- **Panduan DEPLOY_AAPANEL (bahasa Indonesia)** langkah demi langkah: install MongoDB dari App Store, clone dari GitHub, set environment, build frontend, buat situs + reverse proxy + SSL, buka akses ke MikroTik, verifikasi login & monitoring.

## Alur Pemakaian di aaPanel (ringkas)
1. Di aaPanel: install **MongoDB** dari App Store, lalu **Nginx**, **Python Project Manager**, dan **Node/PM2** (untuk build frontend).
2. **Clone repo GitHub** Anda ke server.
3. Isi environment backend (domain, `JWT_SECRET`, `MONGO_URL` lokal, email & password admin) dan environment frontend (domain untuk `REACT_APP_BACKEND_URL`), lalu **build frontend**.
4. Jalankan **backend** lewat Python Project Manager (otomatis membuat virtualenv & menjalankan di port lokal).
5. Buat **situs** di aaPanel untuk domain Anda, arahkan root ke hasil build frontend, tempel **konfigurasi reverse proxy** `/api` & `/api/ws`, lalu terbitkan **SSL Let's Encrypt**.
6. Pastikan **firewall server mengizinkan** akses ke port MikroTik (8728 API / 161 SNMP) di jaringan Anda.
7. Buka domain → login dengan akun admin → hapus POP demo → tambah POP real → **Test Connection** → monitoring LIVE berjalan.

## Nuansa Pengalaman
Panduan dibuat singkat, berurutan, dan dapat dicentang satu per satu, dengan contoh nilai konfigurasi dan blok Nginx siap-salin. Tujuannya: dari server kosong sampai dashboard tampil dalam sekali duduk, tanpa menebak.

## Fase Implementasi
**Fase 1 — MVP (dikerjakan sekarang):** aplikasi siap self-host (konfigurasi via environment, cookie/CORS/WebSocket cocok untuk domain HTTPS), perintah start backend produksi, build frontend ke domain, template Nginx + SSL, berkas `.env` contoh, dan panduan DEPLOY_AAPANEL lengkap berbahasa Indonesia.
**Fase 2 — Pengerasan operasional (nanti):** auto-restart saat server reboot, rotasi log, jadwal backup MongoDB, dan alur update (git pull + rebuild) yang rapi.
**Fase 3 — Skala & otomasi (nanti):** opsi Docker Compose, MongoDB di server terpisah, CI/CD dari GitHub, serta panduan routing/VPN untuk menjangkau banyak lokasi POP.

## Asumsi
- **Satu server** menampung MongoDB + backend + frontend. MongoDB hanya mendengarkan di localhost; backend di port lokal (mis. 8001) dan hanya diakses lewat Nginx.
- **Akses lewat domain + HTTPS.** Anda sudah/mengarahkan DNS (A record) domain ke IP server. Tanpa HTTPS, login berbasis cookie tidak akan aman/berfungsi — jadi HTTPS wajib.
- **Frontend di-build dengan domain Anda** tertanam di `REACT_APP_BACKEND_URL`. Jika domain berubah, frontend perlu di-build ulang.
- **Secret diisi sekali di awal.** `JWT_SECRET` (dan kunci enkripsi kredensial) harus di-set sebelum menyimpan password MikroTik; mengubahnya setelah ada data akan membuat password tersimpan tidak bisa didekripsi (harus diinput ulang).
- **Akun admin** dibuat dari environment (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) yang Anda tentukan sendiri; kredensial demo lama tidak dipakai di produksi.
- **Database produksi kosong** akan terisi POP demo saat pertama kali jalan; Anda hapus demo lalu isi POP real.
- **Koneksi MikroTik** memakai metode **API plain port 8728** (mendukung RouterOS v6 & v7); service API di router diaktifkan dan port diizinkan dari server.
- **Instalasi di server dilakukan oleh Anda** mengikuti panduan (saya tidak punya akses ke server/aaPanel Anda); yang dikerjakan sekarang adalah menyiapkan kode produksi + berkas konfigurasi + panduan di dalam repo.
- Platform cloud Emergent yang sekarang tetap jalan sebagaimana adanya; penyesuaian self-host dibuat aman agar tidak merusak mode preview.
