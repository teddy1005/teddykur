# 🚀 Panduan Deploy POP Network Monitoring di Server Sendiri (aaPanel)

Panduan ini membawa Anda dari **server kosong + aaPanel** sampai **dashboard tampil & monitoring LIVE ke MikroTik** — dalam sekali duduk.

> Dengan self-host, backend bisa menjangkau MikroTik langsung (API/SNMP), jadi monitoring **LIVE**, bukan simulasi.

---

## 0) Prasyarat (cek dulu)

- [ ] Server (VPS/on-prem) sudah terpasang **aaPanel** dan bisa diakses panelnya.
- [ ] Punya **domain** (mis. `monitoring.domainanda.com`) dan **A record** DNS sudah diarahkan ke **IP server**.
- [ ] Port **80** & **443** terbuka di firewall server (untuk web + SSL Let's Encrypt).
- [ ] Server bisa menjangkau jaringan MikroTik Anda (routing/VPN), dan port **8728** (API) / **161** (SNMP) perangkat terbuka ke arah server.

> ⚠️ **HTTPS wajib.** Login memakai cookie aman — tanpa HTTPS, login tidak akan berfungsi.

---

## 1) Install komponen dari App Store aaPanel

Buka **App Store** di aaPanel, install:

- [ ] **Nginx** (web server + reverse proxy)
- [ ] **MongoDB** (database) — setelah terpasang, biarkan default (listen `127.0.0.1:27017`)
- [ ] **Python Project Manager** (menjalankan backend FastAPI)
- [ ] **PM2 Manager** / **Node.js** (untuk membangun frontend; butuh Node 18/20 + Yarn)

Setelah Node terpasang, aktifkan Yarn (via Terminal aaPanel):
```bash
npm install -g yarn
```

---

## 2) Ambil kode dari GitHub

Di **Terminal** aaPanel:
```bash
mkdir -p /www/wwwroot
cd /www/wwwroot
git clone https://github.com/USERNAME/REPO.git popmon
cd popmon
```
> Ganti URL dengan repo GitHub Anda. Hasilnya: `/www/wwwroot/popmon/backend` dan `/www/wwwroot/popmon/frontend`.

---

## 3) Konfigurasi ENVIRONMENT backend

```bash
cd /www/wwwroot/popmon/backend
cp .env.example .env
# buat secret:
openssl rand -hex 32
nano .env
```
Isi minimal:
```ini
MONGO_URL="mongodb://127.0.0.1:27017"
DB_NAME="popmon"
FRONTEND_URL="https://monitoring.domainanda.com"
JWT_SECRET="<<tempel hasil openssl rand -hex 32>>"
ADMIN_EMAIL="admin@domainanda.com"
ADMIN_PASSWORD="GantiPasswordKuat#2026"
COOKIE_SECURE="true"
COOKIE_SAMESITE="lax"
RUN_ENGINE="true"
```
Simpan (Ctrl+O, Enter, Ctrl+X).

> 🔐 **JWT_SECRET diisi SEKALI.** Jika diganti setelah ada data, password MikroTik tersimpan tidak bisa didekripsi dan harus diinput ulang.

---

## 4) Jalankan BACKEND via Python Project Manager

Buka **Python Project Manager → Add Project**:

- **Project Path**: `/www/wwwroot/popmon/backend`
- **Python version**: 3.11 (atau 3.10+)
- **Framework**: pilih **Manual / Python** (bukan Django)
- **Startup / Run command**:
  ```bash
  uvicorn server:app --host 127.0.0.1 --port 8001 --workers 1
  ```
- **Install dependency**: pastikan install `requirements.txt`. Jika tidak otomatis, di Terminal:
  ```bash
  cd /www/wwwroot/popmon/backend
  # aktifkan venv yang dibuat Project Manager, lalu:
  pip install -r requirements.txt
  ```
- Aktifkan **auto-start / keep alive** agar restart otomatis bila crash.

> ⚠️ **Gunakan `--workers 1`.** Monitoring engine & WebSocket berjalan di dalam proses. Jika butuh lebih dari 1 worker, set `RUN_ENGINE="false"` di SEMUA worker kecuali satu (jalankan 1 proses khusus engine dengan `RUN_ENGINE="true"`), agar polling tidak dobel.

Cek backend hidup (Terminal):
```bash
curl -i http://127.0.0.1:8001/api/dashboard    # harus balas 401 (butuh login) = OK
```

---

## 5) Build FRONTEND ke domain Anda

```bash
cd /www/wwwroot/popmon/frontend
cp .env.example .env
nano .env
```
Isi:
```ini
REACT_APP_BACKEND_URL="https://monitoring.domainanda.com"
```
Lalu build:
```bash
yarn install
yarn build
```
Hasil build ada di: `/www/wwwroot/popmon/frontend/build`

> Jika domain berubah di kemudian hari, ubah `.env` lalu `yarn build` ulang.

---

## 6) Buat Website + Reverse Proxy + SSL di aaPanel

### 6a. Buat situs
**Website → Add site**:
- Domain: `monitoring.domainanda.com`
- Hilangkan PHP/DB (tidak perlu).
- Setelah dibuat, set **Root/Run directory** situs ke:
  `/www/wwwroot/popmon/frontend/build`

### 6b. Tempel reverse proxy
Buka **Website → (domain) → Config** (file konfigurasi Nginx situs). Di dalam blok `server { ... }`, tempel 3 blok dari `deploy/nginx.conf.template`:
- `location /api/ws { ... }`  ← **letakkan sebelum** `location /api`
- `location /api { ... }`
- `location / { try_files $uri $uri/ /index.html; }`

Simpan → **Reload Nginx**.

### 6c. Terbitkan SSL
**Website → (domain) → SSL → Let's Encrypt** → centang domain → **Apply**. Aktifkan **Force HTTPS**.

---

## 7) Izinkan akses ke MikroTik

- Di router: aktifkan service API plain (RouterOS v6 & v7):
  ```
  /ip service enable api
  /ip service print
  ```
  Pastikan port **8728** boleh diakses dari IP server monitoring (atur `/ip service set api address=` bila perlu, dan firewall).
- Untuk SNMP (opsional): `/snmp set enabled=yes community=NAMA` (port **161**).
- Pastikan **firewall server** mengizinkan koneksi keluar ke IP/port MikroTik.

---

## 8) Verifikasi & isi data real

1. Buka `https://monitoring.domainanda.com` → **login** dengan `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
2. Indikator **LIVE** (kanan atas) menyala hijau = WebSocket OK.
3. Database baru akan terisi **POP demo** otomatis. Masuk **POP Management**, hapus POP demo.
4. **Add POP** → isi Nama, Code, **Latitude/Longitude**, **MikroTik IP**, **Access Method = RouterOS API (v6 & v7, no SSL)**, **Port 8728**, Username/Password → matikan **Simulation mode** → **Save & Test Connection**.
   - Jika sukses → tampil identity/versi/CPU. Jika gagal → pesan error spesifik (cek service API & firewall).
5. Buat **Links** antar-POP (pilih interface endpoint) → status link & topologi akan terhitung otomatis.
6. (Opsional) **Settings → Telegram Alerts**: isi Bot Token + Chat ID, **Send Test**, aktifkan.
7. (Opsional) **Settings → Map Provider**: pilih Google (default Satellite) atau OSM.

---

## 9) Update aplikasi (saat ada versi baru)

```bash
cd /www/wwwroot/popmon
git pull
# backend:
cd backend && pip install -r requirements.txt
# restart backend dari Python Project Manager (tombol Restart)
# frontend:
cd ../frontend && yarn install && yarn build
# reload Nginx dari panel bila perlu
```

---

## 🧰 Troubleshooting

- **Login gagal / langsung ter-logout**
  - Pastikan diakses via **HTTPS** dan `COOKIE_SECURE="true"`.
  - Frontend & API satu domain → `COOKIE_SAMESITE="lax"`. Jika beda domain → `"none"`.
  - `FRONTEND_URL` (backend) harus = `REACT_APP_BACKEND_URL` (frontend).
- **Indikator LIVE merah / data tidak realtime**
  - Pastikan blok `location /api/ws` ada & **sebelum** `location /api`, lalu Reload Nginx.
- **Test Connection selalu gagal**
  - Cek `/ip service` API aktif di MikroTik, port 8728 terbuka dari server, kredensial benar.
  - Coined "API error: timed out" → biasanya firewall/port. "invalid user name or password" → kredensial.
- **Backend tidak jalan**
  - Lihat log di Python Project Manager. Pastikan `pip install -r requirements.txt` sukses & MongoDB hidup (`systemctl status mongod` / panel).
- **Password MikroTik tiba-tiba invalid setelah ganti secret**
  - `JWT_SECRET` berubah → kredensial lama tak bisa didekripsi. Input ulang password POP, atau kembalikan `JWT_SECRET` semula.
- **CORS error di browser**
  - `FRONTEND_URL` di backend belum sesuai domain. Perbaiki `.env` lalu restart backend.

---

## Ringkasan Port & Path

| Komponen | Nilai |
|---|---|
| Backend lokal | `127.0.0.1:8001` (hanya via Nginx) |
| MongoDB | `127.0.0.1:27017` (lokal) |
| Root situs (frontend) | `/www/wwwroot/popmon/frontend/build` |
| Reverse proxy | `/api` dan `/api/ws` → backend |
| MikroTik | API `8728` / SNMP `161` |

Selesai. Dari server kosong → dashboard LIVE. 🎯
