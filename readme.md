# 🛠️ JSON Fixer & Beautifier

Aplikasi web sederhana dan ringan untuk merapikan (**Beautify**) serta memperbaiki (**Repair**) struktur JSON yang rusak secara otomatis. Alat ini dirancang khusus untuk mempercepat alur kerja _developer_ dan _QA Engineer_.

---

## 🚀 Fitur Utama

### 1. Auto-Repair (Perbaikan Otomatis)

Aplikasi ini tidak hanya merapikan, tapi juga mencoba memperbaiki kesalahan sintaksis umum, seperti:

-   **Fix Quotes**: Mengubah petik tunggal (`'`) menjadi petik ganda (`"`).
-   **Trailing Commas**: Menghapus koma berlebih di akhir objek atau array yang sering menyebabkan _error_.
-   **Missing Key Quotes**: Menambahkan tanda kutip pada kunci (_key_) yang lupa diberi petik.

### 2. Instant Beautifier

Mengubah JSON yang rapat (_minified_) menjadi format yang terorganisir dengan indentasi 4 spasi, sehingga struktur data lebih mudah dibaca dan dianalisis.

### 3. Undo & Redo System

Dilengkapi dengan fitur riwayat perubahan. Jika proses perbaikan otomatis memberikan hasil yang tidak diinginkan, Anda bisa kembali ke versi sebelumnya dengan tombol **Undo**.

### 4. Optimized Workspace

-   **Large Text Area**: Menggunakan tinggi dinamis (`65vh`) yang luas, cocok untuk memeriksa _payload_ API berukuran besar.
-   **Modern Monospaced Font**: Menggunakan font khusus kode agar simbol-simbol JSON terlihat jelas.

---

## 🛠️ Cara Penggunaan

1. **Tempel (Paste)**: Masukkan kode JSON yang berantakan atau rusak ke dalam kolom teks utama.
2. **Format**: Klik tombol **"Format & Perbaiki Otomatis"**.
3. **Review**: Jika ada kesalahan sintaksis, aplikasi akan menampilkan pesan error di bagian bawah.
4. **Copy**: Klik **"Salin JSON"** untuk mengambil hasil yang sudah rapi ke _clipboard_ Anda.

---

## 💻 Detail Teknis

Aplikasi ini dibangun menggunakan teknologi web murni tanpa memerlukan _backend_ (server):

-   **HTML5 & CSS3**: Untuk struktur dan tampilan yang responsif.
-   **Vanilla JavaScript**: Untuk logika pemrosesan JSON dan manajemen riwayat (Undo/Redo).
-   **Regex Engine**: Digunakan untuk memindai dan memperbaiki pola teks JSON yang salah sebelum diproses oleh `JSON.parse`.

---

> **Catatan QA:** Alat ini sangat berguna saat melakukan _debugging_ log dari terminal atau database yang sering kali tidak menyertakan format JSON standar.
