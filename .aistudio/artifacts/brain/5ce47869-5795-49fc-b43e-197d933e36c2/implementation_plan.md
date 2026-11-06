# Pelan Pelaksanaan: Sistem Backend Autentikasi Sebenar (`Login`, `Sign Up`, `Session` & `Logout`)

## 1. Seni Bina Backend & Pangkalan Data Akaun (`/lib/server-auth-db.ts` & `/app/api/auth/route.ts`)
Membina sistem autentikasi pelayan (*server-side*) yang lengkap dengan storan fail JSON kekal (`.projectlink-auth-db.json`) supaya semua akaun yang didaftarkan, hash kata laluan, dan sesi log masuk disimpan secara kekal di pelayan:

1. **Jadual Akaun & Hash Kata Laluan (`auth_accounts` + `auth_sessions`)**:
   - Setiap akaun menyimpan `user_id`, `email` (unik, huruf kecil), `matric_no`, `password_hash` (SHA-256 dengan *salt*), `display_name`, `faculty_short`, `faculty`, dan `created_at`.
   - Akaun pelajar UMS sedia ada dipra-benihkan (*seeded*) supaya boleh diuji terus:
     - **Fahrin**: `fahrin@student.ums.edu.my` | Kata laluan: `ums2026`
     - **Aisyah**: `aisyah@student.ums.edu.my` | Kata laluan: `ums2026`
     - **Daniel**: `daniel@student.ums.edu.my` | Kata laluan: `ums2026`

2. **Endpoint API `/api/auth` (Pengesahan Ketat)**:
   - **`POST /api/auth` (`action: "signup"`)**:
     - Menyemak sama ada e-mel telah wujud di dalam pangkalan data (memulangkan ralat `409 Conflict` jika e-mel sudah berdaftar).
     - Mengesahkan Nama Penuh, format E-mel, Kata Laluan (minimum 6 aksara), Fakulti (`FKI`, `FKJ`, `FPEP`, `FSSA`, dll.), serta No. Matrik / No. Telefon pilihan.
     - Mencipta rekod `Profile` lengkap berserta kemahiran asas, menyimpan hash kata laluan ke pelayan, dan menjana `session_token` baharu (disimpan di pelayan + HTTP cookie + storan klien).
   - **`POST /api/auth` (`action: "signin"`)**:
     - Mencari akaun berdasarkan e-mel atau nombor matrik. Jika tiada dalam rekod, memulangkan ralat `404` (*"Akaun e-mel ini belum didaftarkan. Sila Sign Up terlebih dahulu."*).
     - Menyemak ketepatan kata laluan dengan `password_hash`. Jika salah, memulangkan ralat `401` (*"Kata laluan yang dimasukkan tidak tepat."*).
     - Jika sah, mencipta sesi aktif dan mengembalikan data profil penuh pengguna.
   - **`POST /api/auth` (`action: "reset_password"`)**:
     - Membolehkan pengguna menukar kata laluan baharu melalui pengesahan e-mel pada aliran **Forgot Password?**.
   - **`POST /api/auth` (`action: "logout"`) & `GET /api/auth`**:
     - `GET /api/auth`: Mengesahkan `session_token` semasa apabila aplikasi dimuatkan.
     - `POST /api/auth` (`logout`): Memadamkan sesi aktif di pelayan dan membersihkan cookie sesi.

---

## 2. Integrasi Stor & Logik Sesi (`/lib/store.tsx`)
- Menambah fungsi `loginWithApi(email, password)`, `registerWithApi(payload)`, `resetPasswordWithApi(email, newPassword)`, dan `logoutWithApi()` di dalam `ProjectLinkProvider`.
- Apabila pengguna mendaftar atau log masuk, profil mereka disegerakkan secara automatik antara pelayan (`/api/auth` & `/api/rpc`) dan storan aplikasi supaya semua aktiviti, bookmark, dan padanan kemahiran (*Matches Potential*) diikat terus kepada akaun pengguna yang sedang log masuk.

---

## 3. Penambahbaikan Antara Muka (`Login`, `Sign Up`, `Profile`, `Sidebar` & `Settings`)
1. **Skrin Sign In & Sign Up (`Peringkat 3`)**:
   - Paparan kotak mesej ralat/kejayaan (*inline error alert*) terus di atas borang jika kata laluan salah atau e-mel sudah wujud.
   - Keadaan pemuatan (*loading spinner*) pada butang **Sign In** dan **Sign Up** semasa menghubungi `/api/auth`.
   - Borang **Reset Kata Laluan (`Forgot Password?`)** bersepadu untuk menetapkan kata laluan baharu.
2. **Panduan & Butang Log Keluar (`Log Out`) yang Jelas di 3 Lokasi Utama**:
   - **Halaman Profile**: Butang jelas **"Log Keluar"** pada bahagian atas kad profil dan kad maklumat akaun di bahagian bawah halaman Profile.
   - **Menu Sisi (`Side Drawer`)**: Kad status pengguna semasa berserta butang merah **"Log Keluar (Sign Out)"** di bahagian bawah menu sisi.
   - **Halaman Settings**: Seksyen khas **Sesi & Keselamatan Akaun** yang memaparkan e-mel log masuk semasa, status sesi pelayan, dan butang **"Log Keluar dari Akaun Ini"**.
