# PERAN (ROLE)
Anda adalah seorang Senior Full-stack Engineer dan Ahli UI/UX yang berfokus pada "Vibe Coding". Tugas Anda adalah membangun aplikasi POS (Point of Sale) / Sistem Kasir Sederhana untuk Warung Makan UMKM yang modern, responsif, dan sangat fungsional.

# LINGKUNGAN & DEPLOYMENT (ENVIRONMENT)
- Aplikasi ini murni **Client-Side SPA (Single Page Application)**.
- **TIDAK ADA SERVER / BACKEND KHUSUS** (Tidak menggunakan Express, Node.js server, dll).
- Target deployment hanya menggunakan **GitHub** dan **Vercel**.
- Pastikan semua kode berjalan sempurna di sisi klien (browser).

# TUMPUKAN TEKNOLOGI (TECH STACK)
- Frontend: React (Vite) dengan TypeScript.
- Styling: Tailwind CSS.
- Ikon: Lucide React.
- Cetak & Ekspor: `window.print()` untuk cetak termal, `html2canvas` & `jspdf` untuk ekspor PDF.
- State Management: React Hooks (useState, useRef).
- Data Persistence: `localStorage` (untuk purwarupa sebelum ada database).

# FITUR INTI
1. **Dasbor Menu & Transaksi**: Daftar menu yang dikelompokkan berdasarkan kategori. Fitur tambah ke keranjang (cart) dengan kalkulasi subtotal otomatis.
2. **Manajemen Petty Cash & Pengeluaran**: Fitur untuk mengatur modal awal kasir (Petty Cash) dan mencatat pengeluaran operasional warung.
3. **Pembayaran**: Mendukung metode "Tunai" dan "QRIS". Jika Tunai, wajib ada input jumlah uang yang diterima pelanggan dan kalkulasi otomatis "Uang Kembalian".
4. **Riwayat**: Menampilkan riwayat transaksi dan riwayat pengeluaran.
5. **Cetak Struk (Thermal 57mm)**: Tombol "Cetak Bill" yang memicu `window.print()`.
6. **Laporan Closing (PDF)**: Tombol "Laporan Closing" yang mengekspor struk menjadi file PDF berukuran proporsional 57mm.

# SPESIFIKASI UI/UX & STYLING
- **Skema Warna**: 
  - Tombol Utama (Aksi positif/Simpan/Cetak): Biru (`bg-blue-600`, `hover:bg-blue-700`).
  - Teks Sukses/Pemasukan: Emerald (`text-emerald-600`).
  - Teks Peringatan/Pengeluaran: Rose (`text-rose-600`).
  - Latar Belakang & Elemen Netral: Slate (`bg-slate-100`, `text-slate-500`, dll).
- **Format Mata Uang**: Gunakan `Intl.NumberFormat('id-ID')`. Ganti 'IDR' menjadi 'Rp'. WAJIB gunakan *non-breaking space* (`\u00A0`) antara 'Rp' dan angka untuk mencegah teks terpotong ke baris baru (wrapping).

# SPESIFIKASI KHUSUS STRUK & CETAK (SANGAT PENTING)
Area struk (Cart/Summary) memiliki aturan ketat untuk mendukung Printer Termal 57mm dan ekspor PDF:
1. **Layout Struk (Gaya Indomaret)**:
   - Header: Nama Outlet (Tengah, Bold), Alamat Lengkap (Tengah).
   - Pembatas: Garis putus-putus (dashed line).
   - Info Transaksi: Tanggal dengan Jam:Menit:Detik (Kiri) dan Nama Kasir (Kanan).
   - Pembatas: Garis putus-putus.
   - Item: Nama item (gunakan `truncate`), jumlah x harga, dan total harga item.
   - Pembatas: Garis putus-putus.
   - Total: Gunakan teks "TOTAL BAYAR:".
   - Rincian Pembayaran: Tampilkan metode pembayaran. Jika Tunai, tampilkan teks "Tunai:" (jumlah uang diterima) dan "Uang Kembalian:" (jumlah kembalian).
   - Pembatas: Garis putus-putus.
   - Footer: Wajib mencantumkan kalimat apresiasi di tengah: "Terima Kasih Atas Pembelian Anda," dan "Kami tunggu kembali kedatangannya".
2. **CSS Print (`@media print`)**:
   - Sembunyikan semua elemen UI (tombol, menu, riwayat) menggunakan kelas `print:hidden`.
   - Set ukuran halaman ke 57mm: `@page { size: 57mm auto; margin: 0; } body { width: 57mm; margin: 0; padding: 0; }`.
   - Gunakan ukuran font kecil (`print:text-[10px]`), `shrink-0`, dan `overflow-hidden` untuk mencegah teks melebar dan merusak layout grid (mencegah *tiling*).
3. **Pencegahan Bug html2canvas (oklch error)**:
   - Di dalam elemen struk yang akan di-render ke PDF, JANGAN gunakan kelas warna bawaan Tailwind (seperti `print:text-black` atau `print:bg-white`). 
   - WAJIB gunakan kode Hex statis (contoh: `print:text-[#000000]`, `print:bg-[#ffffff]`, `border-[#000000]`, `text-[#64748b]`).
4. **Logika Ekspor PDF (Laporan Closing)**:
   - Saat `html2canvas` berjalan, paksa lebar kontainer struk menjadi sekitar `215px` dan padding `8px` agar proporsinya sesuai dengan kertas 57mm. Kembalikan ke ukuran semula setelah *capture* selesai.
   - Hitung tinggi PDF secara dinamis berdasarkan rasio aspek kanvas (`pdfHeight = (canvas.height * 57) / canvas.width`).
   - Atur orientasi `jsPDF` secara dinamis (`portrait` atau `landscape`) berdasarkan perbandingan `pdfHeight` dan `pdfWidth` agar halaman tidak terbalik atau terpotong.

# INSTRUKSI OUTPUT
Berikan kode lengkap (biasanya di `App.tsx`) yang modular, bersih, dan bisa langsung dijalankan. Pastikan semua spesifikasi di atas terpenuhi tanpa perlu saya ingatkan kembali.
