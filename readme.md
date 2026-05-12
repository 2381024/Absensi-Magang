# Absensi Magang (PERN Stack)

Selamat datang di repositori proyek **Absensi Magang**! Proyek ini menggunakan arsitektur **PERN stack** (PostgreSQL, Express, React, Node.js) dengan sistem autentikasi JWT dan manajemen pengguna berbasis peran (admin & user).

---

## 📁 Struktur Proyek

```
Absensi-Magang/
├── backend/
│   ├── db/
│   │   ├── init.sql          # Skema database (tabel users)
│   │   └── seed.js           # Script seeding akun admin awal
│   ├── middleware/
│   │   └── auth.js           # Middleware JWT (authenticate + requireAdmin)
│   ├── routes/
│   │   ├── auth.js           # POST /api/auth/login
│   │   └── users.js          # CRUD /api/users (admin-only)
│   ├── db.js                 # Koneksi pool PostgreSQL
│   ├── index.js              # Entry point server Express (port 5000)
│   ├── .env                  # Environment variables (DATABASE_URL, JWT_SECRET, PORT)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js            # API wrapper (auto-attach Bearer token)
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx   # Guard: redirect ke /login jika belum login
│   │   │   └── AdminRoute.jsx       # Guard: redirect non-admin ke /dashboard
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global state: user, token, login, logout
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx        # Halaman login
│   │   │   ├── UserDashboard.jsx    # Dashboard untuk role "user"
│   │   │   └── AdminDashboard.jsx   # Dashboard admin (CRUD pengguna)
│   │   ├── App.jsx                  # Definisi rute (react-router-dom)
│   │   ├── App.css                  # Styling global (login, dashboard, modal, tabel)
│   │   ├── main.jsx                 # Entry point React + BrowserRouter
│   │   └── index.css                # Reset style dasar
│   ├── vite.config.js
│   └── package.json
└── readme.md
```

---

## 🛠 Teknologi yang Digunakan

| Layer    | Teknologi                                  |
|----------|--------------------------------------------|
| Database | PostgreSQL 15+                             |
| Backend  | Node.js, Express, pg (node-postgres)       |
| Frontend | React 19, Vite, React Router DOM v7        |
| Auth     | JWT (jsonwebtoken), bcryptjs               |

---

## 🚀 Persiapan Awal (Syarat)

Pastikan sudah terinstal di komputer Anda:

- **Node.js** v18+ — [Download](https://nodejs.org/)
- **PostgreSQL** v15+ — [Download](https://www.postgresql.org/download/)
- **Git** — [Download](https://git-scm.com/)

---

## ⚙️ Setup & Instalasi

### 1. Clone Repositori

```bash
git clone https://github.com/2381024/Absensi-Magang.git
cd Absensi-Magang
```

### 2. Setup Database

Buka terminal dan masuk ke PostgreSQL:

```bash
psql -U postgres
```

Lalu buat database baru:

```sql
CREATE DATABASE absensi_magang;
\q
```

Jalankan file `init.sql` untuk membuat tabel `users`:

```bash
psql -U postgres -d absensi_magang -f backend/db/init.sql
```

Jalankan script seeding untuk membuat akun admin default:

```bash
cd backend
node db/seed.js
```

> **Output yang diharapkan:** `✅ Admin user seeded (username: admin, password: admin123)`

### 3. Setup Backend

Buat file `.env` di dalam folder `backend` (jika belum ada):

```bash
cd backend
```

**Isi file `backend/.env`:**

```env
DATABASE_URL=postgresql://postgres:password_anda@localhost:5432/absensi_magang
PORT=5000
JWT_SECRET=absensi_magang_jwt_secret_key_2024
```

> **Catatan:** Ganti `password_anda` dengan password PostgreSQL Anda.

Instal dependensi dan jalankan server:

```bash
npm install
node index.js
```

Server backend akan berjalan di **http://localhost:5000**.

### 4. Setup Frontend

Buka terminal baru (biarkan backend tetap berjalan):

```bash
cd frontend
npm install
npm run dev
```

Frontend akan berjalan di **http://localhost:5173**.

---

## 👤 Akun Default

Setelah menjalankan `seed.js`, tersedia akun admin bawaan:

|          |             |
|----------|-------------|
| URL      | http://localhost:5173/login |
| Username | `admin`     |
| Password | `admin123`  |
| Role     | Admin       |

> **Penting:** Ganti password admin setelah login pertama untuk keamanan.

---

## 🧭 Rute Aplikasi

### Frontend (React)

| Rute          | Akses           | Deskripsi                                  |
|---------------|-----------------|--------------------------------------------|
| `/login`      | Publik          | Halaman login                              |
| `/dashboard`  | User & Admin    | Dashboard pengguna biasa                   |
| `/admin`      | Admin-only      | Dashboard admin — manajemen pengguna (CRUD)|

### Backend API (Express)

| Method | Endpoint              | Auth        | Deskripsi                     |
|--------|-----------------------|-------------|-------------------------------|
| POST   | `/api/auth/login`     | Tidak       | Login → return JWT + user     |
| GET    | `/api/users`          | Admin       | Ambil semua pengguna          |
| POST   | `/api/users`          | Admin       | Tambah pengguna baru          |
| PUT    | `/api/users/:id`      | Admin       | Edit pengguna                 |
| DELETE | `/api/users/:id`      | Admin       | Hapus pengguna                |

---

## 🌳 Alur Kerja Git & Aturan (Cara Mencegah Konflik)

Untuk menjaga kestabilan kode dan menghindari *merge conflict*, kita menggunakan **Feature Branch Workflow** yang ketat. **Jangan pernah melakukan commit secara langsung ke branch `main`.**

### Rutinitas Harian

**1. Selalu mulai dengan kode terbaru**

Sebelum mulai menulis kode, pastikan branch `main` di komputer lokal sudah mendapatkan pembaruan terbaru dari tim.

```bash
git checkout main
git pull origin main
```

**2. Buat branch baru untuk tugas Anda**

Beri nama branch sesuai dengan apa yang sedang Anda kerjakan. Gunakan awalan seperti `feat/` (fitur baru), `fix/` (perbaikan bug), atau `docs/` (dokumentasi).

```bash
git checkout -b feat/nama-fitur-anda
```

**3. Kerjakan tugas dan lakukan commit**

Simpan progres secara lokal. Gunakan pesan commit yang jelas.

```bash
git add .
git commit -m "feat: menambahkan halaman absensi harian"
```

**4. Langkah "Anti-Konflik" (SANGAT PENTING)**

Sebelum melakukan *push*, tarik perubahan terbaru dari `main` ke branch Anda:

```bash
git pull origin main
```

> Jika terjadi konflik, Git akan memberitahukannya. Selesaikan konflik langsung di editor sebelum melanjutkan.

**5. Push branch ke GitHub**

```bash
git push -u origin feat/nama-fitur-anda
```

**6. Buka Pull Request (PR)**

Masuk ke halaman GitHub proyek dan buat Pull Request untuk menggabungkan branch Anda ke `main`. **Setidaknya satu anggota tim harus meninjau (*review*) dan menyetujui (*approve*) PR Anda sebelum kode boleh di-merge.**

---

Jika ada pertanyaan atau kendala, silakan tanyakan di grup diskusi tim. Selamat ngoding! 🚀