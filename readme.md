# Absensi Magang (PERN Stack)

Selamat datang di repositori proyek kita! Proyek ini menggunakan arsitektur PERN stack (PostgreSQL, Express, React, Node.js). Silakan ikuti panduan di bawah ini untuk memulai pengembangan di komputer lokal Anda dan aturan tim untuk menggunakan Git.

## 🚀 Memulai Proyek (Persiapan Awal)

**Syarat Utama:** Pastikan Anda telah menginstal Node.js dan PostgreSQL di komputer Anda.

**1. Kloning Repositori:**
Buka terminal dan jalankan perintah berikut untuk mengunduh kode ke komputer Anda:

```bash
git clone https://github.com/2381024/Absensi-Magang.git

```

**2. Setup Backend:**
Masuk ke folder backend dan instal semua dependensinya:

```bash
cd nama-proyek/backend
npm install

```

* Buat file baru bernama `.env` di dalam folder `backend`. Anda bisa melihat formatnya dari file `.env.example`.
* Isi file `.env` tersebut dengan kredensial database PostgreSQL lokal Anda (seperti username dan password database).
* Jalankan server backend:

```bash
npm run dev

```

*(Server backend sekarang akan berjalan di port 5000)*

**3. Setup Frontend:**
Buka tab terminal baru (biarkan terminal backend tetap berjalan), lalu masuk ke folder frontend:

```bash
cd absensi-magang/frontend
npm install

```

* Jalankan aplikasi React:

```bash
npm run dev

```

*(Frontend sekarang akan berjalan menggunakan Vite di port 5173)*

---

## 🌳 Alur Kerja Git & Aturan (Cara Mencegah Konflik)

Untuk menjaga kestabilan kode kita dan menghindari *merge conflict* yang memusingkan, kita menggunakan **Feature Branch Workflow** yang ketat. **Jangan pernah melakukan commit secara langsung ke branch `main`.**

### Rutinitas Harian

**1. Selalu mulai dengan kode terbaru**
Sebelum Anda mulai menulis kode, pastikan branch `main` di komputer lokal Anda sudah mendapatkan pembaruan terbaru dari tim.

```bash
git checkout main
git pull origin main

```

**2. Buat branch baru untuk tugas Anda**
Beri nama branch sesuai dengan apa yang sedang Anda kerjakan. Gunakan awalan seperti `feat/` (untuk fitur baru), `fix/` (untuk perbaikan bug), atau `docs/` (untuk dokumentasi).

```bash
git checkout -b feat/nama-fitur-anda

```

**3. Kerjakan tugas Anda dan lakukan commit**
Simpan progres Anda secara lokal. Gunakan pesan commit yang jelas agar anggota tim lain tahu apa yang Anda kerjakan.

```bash
git add .
git commit -m "feat: menambahkan tombol login ke navbar"

```

**4. Langkah "Anti-Konflik" (SANGAT PENTING)**
Sebelum melakukan *push* kode Anda ke GitHub, periksa apakah ada anggota tim lain yang sudah memperbarui `main` saat Anda sedang bekerja. Tarik (*pull*) perubahan baru tersebut ke branch Anda terlebih dahulu.

```bash
git pull origin main

```

*(Catatan: Jika terjadi konflik, Git akan memberitahukannya di langkah ini. Selesaikan konflik tersebut langsung di teks editor komputer Anda sebelum melanjutkan!)*

**5. Push branch Anda ke GitHub**
Setelah aman, kirim branch Anda ke server.

```bash
git push -u origin feat/nama-fitur-anda

```

**6. Buka Pull Request (PR)**
Masuk ke halaman GitHub proyek ini dan buat Pull Request untuk menggabungkan branch Anda ke `main`. **Setidaknya satu anggota tim lain harus meninjau (*review*) dan menyetujui (*approve*) PR Anda sebelum kode tersebut boleh di-merge.**