# 🛠️ ISMIDEV PRO | QA Productivity Suite

Aplikasi web utilitas *all-in-one* berbasis 100% *client-side* yang dirancang untuk memangkas aktivitas manual dan repetitif bagi **Quality Assurance (QA) Engineer**, **Automation Tester**, dan **Developer**.

---

## 🚀 Fitur Utama & Kemampuan Terbaru

### 1. Smart JSON & Contract Validator
- **Auto-Repair & Beautifier**: Memperbaiki petik tunggal (`'`), koma berlebih (*trailing commas*), serta *unquoted keys*. Mendukung format 4-spasi dan **Minify 1-baris**.
- **JSONPath Query Filter (FR-1.1)**: Filter node JSON secara instan dengan sintaks JSONPath (contoh: `$.data.items[*].id`, `$.users[0].name`, `..author`, slice, dan filter). Dilengkapi penghitung kecocokan (*match badge*).
- **JSON Schema Contract Validator (FR-1.2)**: Menguji payload JSON terhadap skema kontrak API (Draft 7 / 2020-12). Menyediakan tabel diagnostik error terperinci (Path, Rule, Keterangan). Dilengkapi template bawaan (*User Profile*, *API Response*, *E-Commerce Product*).
- **Auto Escape / Unescape (FR-1.3)**: 1-klik untuk membersihkan JSON *escaped* dari format log terminal/Kafka (`\"id\": 1`) menjadi JSON murni yang rapi, dan sebaliknya mengubah JSON menjadi *escaped string* siap pakai untuk payload cURL.
- **Payload Size & Lines Indicator**: Menampilkan ukuran payload (Bytes / KB / MB) dan total baris secara real-time.

### 2. QA Data & Boundary Generator
- **Indonesian Identity Mock (FR-2.1)**:
  - **NIK Generator**: 16 digit terstruktur dengan kode provinsi resmi, kode wilayah, tanggal lahir valid (aturan wanita +40 pada tanggal), dan nomor urut.
  - **NPWP Generator**: Format 15 digit terstandarisasi DJP (`01.234.567.8-901.000`) dan 16 digit.
  - **Nomor HP Operator Seluler**: Menghasilkan nomor telepon lokal dengan prefix operator nyata (Telkomsel, Indosat Ooredoo, XL Axiata, Tri, Smartfren).
  - **KTP Identity Profile**: 1-klik membuat profil identitas lengkap Indonesia (Nama, NIK, NPWP, Alamat, Kota, No HP, Agama, Status Perkawinan).
- **Boundary & Security Presets (FR-2.2)**:
  - **Boundary Length**: Presets string 255 karakter (`VARCHAR`), 1.000 karakter (`TEXT`), 5.000 karakter (*Long Payload*), serta generator string kustom $N$ karakter tanpa spasi.
  - **Unicode & Extreme Text**: Teks Zalgo/Glitch, karakter *Zero-Width Space* (`\u200B`, `\u200C`, `\u200D`, `\uFEFF`), script multi-byte (CJK, Arab, Cyrillic, Thai), rangkaian emoji kompleks/ZWJ, dan *RTL override*.
  - **Security Test Payloads**: Payload dasar uji kerentanan XSS (`<script>`, `<img onerror>`), SQL Injection (`' OR '1'='1`, `UNION SELECT`), dan *Path Traversal*.

### 3. Utility Lainnya
- **SQL Formatter**: Merapikan query SQL berantakan dengan penyorotan kata kunci (*syntax highlighting*).
- **Text Diff Checker**: Membandingkan dua teks secara berdampingan.
- **Base64 & URL Codec**: Encode dan decode instan.
- **JWT Debugger**: Decode Header dan Payload token JWT secara aman di browser.
- **Hash Generator**: MD5, SHA1, SHA256, SHA512, dan Bcrypt Hash.
- **Lorem Ipsum**: Generator teks dummy paragraf, kalimat, atau kata.

---

## ⚡ Keyboard Shortcuts
- `Ctrl + Enter` / `Cmd + Enter` (pada editor JSON): Format & Perbaiki Otomatis (*Fix & Beautify*).
- `Ctrl + Enter` / `Cmd + Enter` (pada Text Diff): Jalankan komparasi teks (*Compare*).

---

## 🔒 Privasi & Keamanan (100% Client-Side)
Semua pemrosesan data (manipulasi JSON, validasi skema, hashing, parsing JWT) dieksekusi murni di browser pengguna tanpa pengiriman data ke server backend. Zero Data Leak!

---

Built for Quality Assurance & Software Engineering by **Ismi Azis**.

