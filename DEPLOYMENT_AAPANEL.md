# Panduan Deploy Micro NET di aaPanel

Dokumen ini menjelaskan cara deploy website Micro NET (React + FastAPI + MongoDB) ke server VPS yang menggunakan **aaPanel** dengan domain custom (contoh: `micronet.web.id` atau `www.micronet.web.id`).

---

## 1. Arsitektur Singkat

```
[Browser]
   │
   ▼
[Nginx :80/:443]  ◄── domain Anda (micronet.web.id)
   │
   ├── /             → React static build (/www/wwwroot/micronet/frontend/build)
   └── /api/*        → reverse-proxy ke FastAPI (127.0.0.1:8001)
                            │
                            └── MongoDB (127.0.0.1:27017)
```

Frontend di-serve sebagai file statis, backend FastAPI berjalan sebagai service Python via Supervisor / PM2, dan semua request `/api/*` di-proxy ke backend.

---

## 2. Spesifikasi Minimum Server

| Komponen | Minimum | Rekomendasi |
|----------|---------|-------------|
| RAM      | 1 GB    | 2 GB        |
| CPU      | 1 vCPU  | 2 vCPU      |
| Disk     | 20 GB   | 40 GB SSD   |
| OS       | Ubuntu 20.04 / 22.04 / Debian 11 / CentOS 7+ | Ubuntu 22.04 |
| aaPanel  | Versi terbaru (7.x) |

Pastikan port **80**, **443**, **22** terbuka di firewall.

---

## 3. Install aaPanel (jika belum)

```bash
# Ubuntu / Debian
wget -O install.sh http://www.aapanel.com/script/install-ubuntu_6.0_en.sh && sudo bash install.sh aapanel
```

Setelah selesai, catat URL panel + username + password.

---

## 4. Install Dependencies di aaPanel

Login ke aaPanel → **App Store** → install:

1. **Nginx** (latest stable, contoh: 1.24)
2. **PM2 Manager** (untuk menjalankan service Node/Python)
3. **Python Project Manager** (atau install manual via terminal)

### Install MongoDB

aaPanel App Store mungkin tidak menyediakan MongoDB. Install manual via SSH:

```bash
# Ubuntu 22.04 — install MongoDB 7.0
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod

# Verifikasi
systemctl status mongod
mongosh --eval "db.runCommand({ ping: 1 })"
```

> ⚠️ MongoDB default bind ke `127.0.0.1` saja — biarkan begitu (jangan expose ke public).

### Install Python 3.11 & Node.js 20

```bash
# Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Yarn (WAJIB pakai yarn, jangan npm)
sudo npm install -g yarn

# Verifikasi
python3.11 --version    # Python 3.11.x
node --version          # v20.x
yarn --version          # 1.22.x
mongod --version        # v7.0.x
```

---

## 5. Upload / Clone Project

### Opsi A: Git Clone (rekomendasi)

```bash
sudo mkdir -p /www/wwwroot/micronet
cd /www/wwwroot/micronet
git clone <URL_REPO_ANDA> .
```

### Opsi B: Upload Manual via aaPanel File Manager

1. Buka **aaPanel → Files**
2. Buat folder `/www/wwwroot/micronet`
3. Upload ZIP project, lalu extract di folder tersebut

Struktur folder akhir:
```
/www/wwwroot/micronet/
├── backend/
├── frontend/
├── DEPLOYMENT_AAPANEL.md
└── ...
```

---

## 6. Setup Backend (FastAPI)

```bash
cd /www/wwwroot/micronet/backend

# Buat virtual env
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies + production server (gunicorn)
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# Cek versi
pip list | grep -E "fastapi|uvicorn|gunicorn|motor|httpx"
```

### Buat file `.env` produksi

Buat / edit file `/www/wwwroot/micronet/backend/.env`:

```env
MONGO_URL="mongodb://127.0.0.1:27017"
DB_NAME="micronet_prod"
CORS_ORIGINS="https://micronet.web.id,https://www.micronet.web.id"
MICRONET_API_BASE="https://micronet.web.id"
```

> Ganti `micronet.web.id` dengan domain Anda.
> `MICRONET_API_BASE` adalah base URL untuk API cek tagihan upstream Anda.
> JANGAN commit file `.env` ke git.

### Tes manual backend berjalan

```bash
cd /www/wwwroot/micronet/backend
source venv/bin/activate
gunicorn server:app -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8001 --workers 2
```

Buka terminal lain dan test:

```bash
curl http://127.0.0.1:8001/api/
# Expected: {"message":"Hello World"}

curl http://127.0.0.1:8001/api/speedtest/getIP
# Expected: IP string
```

Jika OK, tekan `Ctrl+C` lalu lanjut ke step berikutnya untuk daemonize.

---

## 7. Jalankan Backend dengan PM2 (Persistent)

PM2 lebih mudah dipakai dari aaPanel dibanding systemd.

### Buat file ecosystem PM2

Buat file `/www/wwwroot/micronet/backend/ecosystem.config.js`:

```js
module.exports = {
  apps: [
    {
      name: "micronet-backend",
      cwd: "/www/wwwroot/micronet/backend",
      script: "venv/bin/gunicorn",
      args: "server:app -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8001 --workers 2 --timeout 120",
      env: {
        PYTHONUNBUFFERED: "1"
      },
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: "500M",
      error_file: "/www/wwwlogs/micronet-backend-err.log",
      out_file: "/www/wwwlogs/micronet-backend-out.log"
    }
  ]
};
```

### Start service

```bash
cd /www/wwwroot/micronet/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # ikuti instruksi yang muncul agar PM2 auto-start saat reboot
```

Cek status:

```bash
pm2 status
pm2 logs micronet-backend --lines 50
```

---

## 8. Build Frontend (React)

```bash
cd /www/wwwroot/micronet/frontend

# Buat file .env produksi
cat > .env <<EOF
REACT_APP_BACKEND_URL=https://micronet.web.id
WDS_SOCKET_PORT=443
EOF

# Install + build
yarn install
yarn build

# Hasilnya ada di folder: /www/wwwroot/micronet/frontend/build
ls -la build/
```

> `REACT_APP_BACKEND_URL` harus berisi origin (skema + domain) tanpa trailing slash dan tanpa `/api`. Kode frontend akan otomatis menambahkan `/api`.

### Atur permission

```bash
sudo chown -R www:www /www/wwwroot/micronet/frontend/build
sudo chmod -R 755 /www/wwwroot/micronet/frontend/build
```

---

## 9. Setup Domain & Nginx di aaPanel

### 9.1 Tambah Site di aaPanel

1. aaPanel → **Website → Add Site**
2. Isi:
   - **Domain**: `micronet.web.id` (tambahkan juga `www.micronet.web.id` jika perlu)
   - **Root directory**: `/www/wwwroot/micronet/frontend/build`
   - **PHP version**: pilih **Static / Pure Static** (kita tidak pakai PHP)
   - **Database**: skip (MongoDB di-handle backend)
   - **FTP**: skip
3. Klik **Submit**

### 9.2 Edit Nginx Config

Buka **Website → micronet.web.id → Config**, ganti / tambahkan blok berikut (sesuaikan dengan nama domain Anda):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name micronet.web.id www.micronet.web.id;

    # Akan otomatis di-redirect ke HTTPS setelah pasang SSL (step 9.3)

    root /www/wwwroot/micronet/frontend/build;
    index index.html;

    # Logs (sesuaikan dengan struktur aaPanel)
    access_log /www/wwwlogs/micronet.web.id.log;
    error_log  /www/wwwlogs/micronet.web.id.error.log;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/javascript application/javascript application/json application/xml+rss image/svg+xml;

    # Cache aset statis React (file dengan hash di nama)
    location ~* \.(?:js|css|woff2?|ttf|otf|eot|ico|png|jpe?g|gif|webp|svg|map)$ {
        expires 30d;
        access_log off;
        add_header Cache-Control "public, max-age=2592000, immutable";
        try_files $uri =404;
    }

    # Worker LibreSpeed (jangan di-cache lama)
    location = /speedtest_worker.js {
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
        try_files $uri =404;
    }

    # ===== Backend API =====
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Streaming untuk speedtest garbage / upload
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;

        # Batas upload (speedtest upload bisa besar)
        client_max_body_size 200m;
    }

    # ===== React SPA routing (fallback ke index.html) =====
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Klik **Save** lalu **Reload Nginx** (aaPanel akan reload otomatis biasanya).

### 9.3 Pasang SSL (HTTPS)

aaPanel → **Website → micronet.web.id → SSL**

- Pilih **Let's Encrypt**
- Centang domain `micronet.web.id` dan `www.micronet.web.id`
- Klik **Apply**
- Setelah issued, aktifkan **Force HTTPS**

aaPanel akan otomatis menambah blok `listen 443 ssl` dan redirect 80 → 443.

> Pastikan A record DNS domain sudah mengarah ke IP server Anda **sebelum** issue SSL.

---

## 10. Pointing Domain (DNS)

Di registrar / DNS provider Anda (Cloudflare, Niagahoster, dll), set:

| Type  | Name | Value           | TTL   |
|-------|------|-----------------|-------|
| A     | @    | <IP_VPS_ANDA>   | Auto  |
| A     | www  | <IP_VPS_ANDA>   | Auto  |

Jika pakai **Cloudflare**, set proxy ke **DNS only (grey cloud)** saat issue SSL, baru aktifkan **Proxied (orange)** setelah SSL berhasil.

Tunggu propagasi 5-30 menit, lalu cek:

```bash
dig +short micronet.web.id
nslookup micronet.web.id
```

---

## 11. Verifikasi Akhir

1. Buka `https://micronet.web.id` → landing page muncul ✅
2. Buka `https://micronet.web.id/cek-tagihan` → form cek tagihan muncul, coba no `1040200013` ✅
3. Buka `https://micronet.web.id/speedtest` → klik GO, harus jalan & hasilkan angka ✅
4. Cek `https://micronet.web.id/api/` → JSON `{"message":"Hello World"}` ✅

Jika ada yang gagal, lihat **Section 13 (Troubleshooting)**.

---

## 12. Update / Deploy Versi Baru

Setiap kali ada perubahan kode:

```bash
cd /www/wwwroot/micronet
git pull

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart micronet-backend

# Frontend
cd ../frontend
yarn install
yarn build

# Reload nginx (biasanya tidak perlu, tapi jaga-jaga)
sudo nginx -s reload
```

> Browser pengguna mungkin masih cache file lama selama 30 hari karena header `Cache-Control` di Nginx. File JS/CSS hasil build React punya hash di nama (mis. `main.abc123.js`), jadi otomatis di-bust saat ada perubahan.

---

## 13. Troubleshooting

### 13.1 Halaman utama 404 / Welcome to Nginx
- Pastikan **Root directory** di aaPanel diarahkan ke `/www/wwwroot/micronet/frontend/build`, bukan ke folder project root.
- Pastikan `yarn build` sudah dijalankan dan folder `build/` ada.

### 13.2 API selalu 502 Bad Gateway
- Backend belum berjalan. Cek: `pm2 status`
- Lihat log: `pm2 logs micronet-backend --lines 100`
- Tes manual: `curl http://127.0.0.1:8001/api/`

### 13.3 Cek tagihan error / CORS error
- Pastikan `CORS_ORIGINS` di `backend/.env` berisi origin domain Anda (`https://micronet.web.id`).
- Pastikan `MICRONET_API_BASE` mengarah ke server API tagihan yang benar.
- Restart backend: `pm2 restart micronet-backend`

### 13.4 Speedtest mentok di "Mengukur Download..."
- Cek `proxy_buffering off;` ada di blok `/api/` di Nginx.
- Cek `client_max_body_size 200m;` (untuk upload test).
- Tes manual: `curl https://micronet.web.id/api/speedtest/garbage?ckSize=10 -o /tmp/x.bin && ls -la /tmp/x.bin` — harus ~10 MB.

### 13.5 React routing 404 saat refresh `/cek-tagihan` atau `/speedtest`
- Pastikan blok `location / { try_files $uri $uri/ /index.html; }` ada di Nginx config.

### 13.6 MongoDB connection refused
- `sudo systemctl status mongod`
- `sudo journalctl -u mongod -n 50`
- Pastikan `MONGO_URL` di `.env` adalah `mongodb://127.0.0.1:27017` (bukan `localhost` di environment tertentu).

### 13.7 Permission denied saat akses file
```bash
sudo chown -R www:www /www/wwwroot/micronet
sudo chmod -R 755 /www/wwwroot/micronet
```

---

## 14. Backup & Keamanan

### Backup MongoDB harian (cron):

```bash
sudo tee /etc/cron.daily/backup-micronet-mongo > /dev/null <<'EOF'
#!/bin/bash
DEST="/www/backup/mongo"
DATE=$(date +%Y%m%d)
mkdir -p $DEST
mongodump --db micronet_prod --out $DEST/$DATE
find $DEST -maxdepth 1 -type d -mtime +14 -exec rm -rf {} \;
EOF
sudo chmod +x /etc/cron.daily/backup-micronet-mongo
```

### Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow <PORT_AAPANEL>/tcp   # default biasanya 7800/8888
sudo ufw enable
```

### Rekomendasi keamanan tambahan
- Ubah port SSH default
- Disable root login via SSH, pakai user biasa + sudo
- Pasang Fail2ban dari aaPanel App Store
- Update OS rutin: `sudo apt update && sudo apt upgrade -y`
- Jangan expose port `8001` (FastAPI) atau `27017` (MongoDB) ke publik

---

## 15. Variabel Lingkungan — Ringkasan

### `backend/.env`
| Variabel | Wajib | Contoh | Keterangan |
|----------|-------|--------|-----------|
| `MONGO_URL` | ✅ | `mongodb://127.0.0.1:27017` | Connection string MongoDB |
| `DB_NAME`   | ✅ | `micronet_prod` | Nama database |
| `CORS_ORIGINS` | ✅ | `https://micronet.web.id,https://www.micronet.web.id` | Origin yang diizinkan (pisah koma) |
| `MICRONET_API_BASE` | ✅ | `https://micronet.web.id` | Base URL API cek tagihan upstream |

### `frontend/.env`
| Variabel | Wajib | Contoh | Keterangan |
|----------|-------|--------|-----------|
| `REACT_APP_BACKEND_URL` | ✅ | `https://micronet.web.id` | Origin tempat backend di-host (tanpa `/api`) |
| `WDS_SOCKET_PORT` | ⛔ | `443` | Hanya dipakai saat dev, abaikan di produksi |

---

## 16. Checklist Final Deploy

- [ ] MongoDB jalan di `127.0.0.1:27017`
- [ ] Backend FastAPI jalan di `127.0.0.1:8001` via PM2
- [ ] Frontend `yarn build` sukses, folder `build/` ada
- [ ] Nginx config + reverse proxy `/api/` aktif
- [ ] SSL Let's Encrypt aktif, Force HTTPS ON
- [ ] DNS A record domain → IP server, propagated
- [ ] `https://<domain>` membuka landing page
- [ ] `https://<domain>/api/` mengembalikan JSON
- [ ] `https://<domain>/speedtest` jalan, angka muncul
- [ ] `https://<domain>/cek-tagihan` berhasil cek nomor valid
- [ ] PM2 `pm2 save` + `pm2 startup` sudah dijalankan (auto-restart setelah reboot)
- [ ] Backup MongoDB harian aktif
- [ ] Firewall UFW aktif, hanya port 80/443/22/aaPanel yang terbuka

Selamat — Micro NET sudah live di `https://<domain-anda>` 🎉

---

Jika butuh bantuan deploy / debug, kirim screenshot error + output dari:
```bash
pm2 logs micronet-backend --lines 100
tail -n 100 /www/wwwlogs/micronet.web.id.error.log
```
