# PRD — PersonalOS
**Product Requirements Document**
Version 1.0 | April 2026

---

## 1. Overview

### 1.1 Ringkasan Produk
**PersonalOS** adalah aplikasi web manajemen diri pribadi yang dirancang untuk membantu pengguna mengelola keuangan (hutang), kesibukan harian, rencana masa depan, dan daftar tugas dalam satu platform yang bersih, intuitif, dan responsif.

### 1.2 Tujuan Produk
- Menjadi "pusat kendali" kehidupan sehari-hari pengguna
- Mengurangi kekacauan mental dengan visualisasi yang jelas
- Berjalan 100% di sisi klien (frontend-only) dengan data tersimpan secara lokal menggunakan `localStorage`
- Dapat di-deploy langsung ke **Vercel** tanpa backend

### 1.3 Target Pengguna
- Individu yang ingin mengatur keuangan pribadi, jadwal, dan tujuan hidup dalam satu aplikasi
- Pengguna yang membutuhkan alat yang sederhana namun powerful tanpa perlu login atau server

---

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | **React** (Vite) |
| Styling | **Tailwind CSS v3** |
| State Management | **Zustand** |
| Persistensi Data | **localStorage** (via Zustand persist middleware) |
| Routing | **React Router v6** |
| Icons | **Lucide React** |
| Charts | **Recharts** |
| Animasi | **Framer Motion** |
| Date Utilities | **date-fns** |
| Deploy | **Vercel** (static site) |

> **Catatan**: Tidak ada backend, tidak ada database eksternal, tidak ada autentikasi. Semua data disimpan di browser pengguna via `localStorage`.

---

## 3. Desain & UI/UX

### 3.1 Design Philosophy
- **Aesthetic Direction**: *Refined Utilitarian* — bersih, tegas, profesional seperti tools yang digunakan engineer/PM di perusahaan tech
- **Inspirasi**: Linear, Notion, Raycast — minimal namun kaya informasi
- **Prinsip**: Information density tinggi tanpa terasa sesak; setiap pixel memiliki tujuan

### 3.2 Color System

#### Light Mode
```css
--bg-primary: #FAFAFA;
--bg-secondary: #F4F4F5;
--bg-card: #FFFFFF;
--border: #E4E4E7;
--text-primary: #09090B;
--text-secondary: #71717A;
--text-muted: #A1A1AA;
--accent: #2563EB;         /* Blue — aksi utama */
--accent-hover: #1D4ED8;
--danger: #DC2626;         /* Merah — hutang keluar */
--success: #16A34A;        /* Hijau — hutang masuk / selesai */
--warning: #D97706;        /* Amber — prioritas / deadline dekat */
```

#### Dark Mode
```css
--bg-primary: #09090B;
--bg-secondary: #18181B;
--bg-card: #1C1C1F;
--border: #27272A;
--text-primary: #FAFAFA;
--text-secondary: #A1A1AA;
--text-muted: #52525B;
--accent: #3B82F6;
--accent-hover: #60A5FA;
--danger: #EF4444;
--success: #22C55E;
--warning: #F59E0B;
```

### 3.3 Typography
- **Display / Heading**: `DM Sans` (Google Fonts) — modern, geometric, tegas
- **Body / UI**: `DM Sans` — konsistensi visual
- **Monospace** (angka, kode): `JetBrains Mono` — untuk angka keuangan agar mudah dibaca

### 3.4 Dark Mode / Light Mode
- Toggle tersedia di **Navbar** (atas kanan), dengan ikon matahari/bulan
- Preferensi disimpan di `localStorage`
- Default mengikuti `prefers-color-scheme` sistem operasi pengguna
- Transisi antar mode menggunakan CSS transition 200ms

### 3.5 Responsivitas
- **Mobile-first** design
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Pada mobile: bottom navigation bar (tab bar) menggantikan sidebar
- Pada desktop: sidebar kiri fixed dengan konten utama di kanan

### 3.6 Layout Global
```
┌─────────────────────────────────────────────┐
│  NAVBAR (Logo | Judul Halaman | Dark Toggle) │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ SIDEBAR  │        MAIN CONTENT              │
│ (Desktop)│        (Scrollable)              │
│          │                                  │
└──────────┴──────────────────────────────────┘

[Mobile: Bottom Tab Bar]
┌──────────────────────────────────────────────┐
│              MAIN CONTENT                    │
├──────┬──────┬──────┬──────┬──────────────────┤
│ Home │ Debt │ Busy │Goals │       Todo       │
└──────┴──────┴──────┴──────┴──────────────────┘
```

---

## 4. Fitur & Spesifikasi

---

### 4.1 🏠 Dashboard (Home)
**Route**: `/`

#### Deskripsi
Halaman ringkasan yang menampilkan snapshot semua modul dalam satu pandangan. Titik masuk pertama pengguna.

#### Komponen yang Ditampilkan
1. **Greeting Card**
   - Sapa pengguna berdasarkan waktu (Selamat Pagi/Siang/Sore/Malam)
   - Tampilkan tanggal hari ini

2. **Summary Cards** (Grid 2x2 di mobile, 4 kolom di desktop)
   - 💸 Total Hutang Saya (total yang harus saya bayar) — warna merah
   - 💰 Total Piutang (total yang harus orang bayar ke saya) — warna hijau
   - 📅 Kesibukan Hari Ini (jumlah kegiatan)
   - ✅ To-Do Pending (jumlah tugas belum selesai)

3. **Upcoming Deadlines** — list 3 item terdekat dari semua modul (hutang jatuh tempo, deadline tugas, deadline langkah)

4. **Quick Add** — floating action button (+) untuk menambah item cepat ke modul manapun

#### State yang Dibutuhkan
- Aggregasi dari semua store: `debtStore`, `scheduleStore`, `goalStore`, `todoStore`

---

### 4.2 💸 Manajemen Hutang (Debt Manager)
**Route**: `/debt`

#### Deskripsi
Modul untuk mencatat dan melacak:
- **Hutang Saya** (I owe): uang yang saya pinjam dari orang lain
- **Piutang** (They owe): uang yang orang lain pinjam dari saya

#### Sub-tab / View
Dua tab di bagian atas:
- `Hutang Saya` | `Piutang`

#### Data Model — Debt Item
```typescript
interface DebtItem {
  id: string;               // UUID
  type: 'owe' | 'lend';    // Hutang saya | Piutang
  personName: string;       // Nama orang
  amount: number;           // Jumlah (Rupiah)
  description: string;      // Keperluan / keterangan
  date: string;             // Tanggal transaksi (ISO 8601)
  dueDate?: string;         // Jatuh tempo (opsional)
  isPaid: boolean;          // Status lunas
  paidDate?: string;        // Tanggal pelunasan
  notes?: string;           // Catatan tambahan
  createdAt: string;
  updatedAt: string;
}
```

#### Fitur Detail
1. **List View**
   - Kartu per transaksi: nama orang, jumlah (format Rupiah), deskripsi, tanggal, status
   - Badge status: `Belum Lunas` (merah/amber) | `Lunas` (hijau)
   - Indikator jatuh tempo: jika <= 7 hari tampilkan warning kuning, jika sudah lewat tampilkan merah
   - Filter: Semua | Belum Lunas | Lunas
   - Sort: Terbaru | Terlama | Jumlah Terbesar | Jatuh Tempo Terdekat
   - Search: pencarian berdasarkan nama orang

2. **Summary Bar** (di atas list)
   - Total hutang saya yang belum lunas
   - Total piutang yang belum dilunasi
   - Net balance (piutang - hutang)

3. **Form Tambah / Edit** (Modal atau Slide-over panel)
   - Field: Nama Orang, Jumlah, Keterangan, Tanggal Transaksi, Jatuh Tempo (opsional), Catatan
   - Validasi: nama & jumlah wajib diisi, jumlah harus angka positif
   - Format input jumlah: auto-format ribuan (1.000.000)

4. **Aksi per Item**
   - Tandai Lunas (dengan konfirmasi tanggal pembayaran)
   - Edit
   - Hapus (dengan konfirmasi)

5. **Visualisasi** (Chart sederhana)
   - Bar chart: hutang vs piutang per bulan (3 bulan terakhir)

#### Format Angka
Semua angka ditampilkan dalam format Rupiah: `Rp 1.500.000`

---

### 4.3 📅 Mapping Kesibukan (Schedule / Activity Map)
**Route**: `/schedule`

#### Deskripsi
Modul untuk memetakan kesibukan, kegiatan rutin, dan jadwal penting pengguna. Bukan kalender penuh — lebih ke **activity tracker + weekly planner**.

#### Data Model — Activity
```typescript
interface Activity {
  id: string;
  title: string;
  description?: string;
  category: 'work' | 'personal' | 'health' | 'learning' | 'social' | 'other';
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number[];    // 0=Minggu ... 6=Sabtu (untuk weekly)
  dayOfMonth?: number;     // 1-31 (untuk monthly)
  date?: string;           // ISO date (untuk 'once')
  timeStart?: string;      // "HH:MM"
  timeEnd?: string;        // "HH:MM"
  priority: 'low' | 'medium' | 'high';
  color?: string;          // Custom color per kategori
  isActive: boolean;
  createdAt: string;
}
```

#### Fitur Detail
1. **Weekly View** (Default)
   - Tampilkan 7 hari (Senin - Minggu) dalam format card kolom
   - Setiap hari menampilkan daftar aktivitas yang terjadwal
   - Hari ini di-highlight dengan border/background berbeda
   - Mobile: scroll horizontal antar hari

2. **List View** (toggle dari Weekly View)
   - Semua aktivitas dalam list, dikelompokkan per kategori
   - Chip kategori berwarna (Work=biru, Health=hijau, Learning=ungu, dll)

3. **Category Color Mapping**
   - `work`: Biru `#2563EB`
   - `personal`: Amber `#D97706`
   - `health`: Hijau `#16A34A`
   - `learning`: Ungu `#7C3AED`
   - `social`: Pink `#DB2777`
   - `other`: Abu `#71717A`

4. **Form Tambah / Edit Aktivitas** (Modal)
   - Field: Judul, Deskripsi, Kategori, Pengulangan, Hari/Tanggal, Jam Mulai-Selesai, Prioritas
   - Untuk `weekly`: checkbox multi-hari
   - Validasi: judul wajib, jika `once` maka tanggal wajib

5. **Aksi per Item**
   - Edit, Hapus
   - Toggle aktif/nonaktif (untuk pause aktivitas rutin sementara)

6. **Busy Indicator** (di Dashboard)
   - Tampilkan jumlah aktivitas hari ini

---

### 4.4 🎯 Langkah Kedepan (Goals & Milestones)
**Route**: `/goals`

#### Deskripsi
Modul untuk mendefinisikan tujuan besar dan memecahnya menjadi langkah-langkah konkret yang bisa dieksekusi.

#### Data Model
```typescript
interface Goal {
  id: string;
  title: string;
  description?: string;
  category: 'career' | 'finance' | 'health' | 'education' | 'personal' | 'other';
  targetDate?: string;     // Deadline goal utama
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  steps: GoalStep[];
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

interface GoalStep {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  targetDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  order: number;           // Untuk drag-and-drop urutan
}
```

#### Fitur Detail
1. **Goal Cards View**
   - Setiap goal ditampilkan sebagai kartu
   - Progress bar: (steps selesai / total steps) × 100%
   - Badge status + kategori
   - Deadline indicator (countdown hari)
   - Filter: Semua | Sedang Berjalan | Selesai | Paused

2. **Goal Detail View** (expand/accordion atau halaman baru `/goals/:id`)
   - Informasi lengkap goal
   - Daftar langkah-langkah (steps) dalam urutan
   - Setiap step: checkbox selesai, judul, deadline, deskripsi
   - Tambah / edit / hapus step langsung di sini
   - Drag-and-drop untuk mengubah urutan steps (gunakan `@dnd-kit/core`)

3. **Form Tambah / Edit Goal** (Modal)
   - Field: Judul, Deskripsi, Kategori, Target Tanggal, Prioritas
   - Steps bisa langsung ditambahkan saat membuat goal

4. **Aksi per Goal**
   - Edit, Hapus (dengan konfirmasi)
   - Ubah status (Mulai / Pause / Selesaikan)

5. **Visualisasi**
   - Donut chart: distribusi status goal (tidak mulai / berjalan / selesai / paused)

---

### 4.5 ✅ To-Do List
**Route**: `/todo`

#### Deskripsi
Modul manajemen tugas harian yang ringan dan cepat. Fokus pada produktivitas hari-hari dengan fitur prioritas dan kategori.

#### Data Model
```typescript
interface TodoItem {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;       // Tag bebas (contoh: "kantor", "rumah")
  dueDate?: string;
  dueTime?: string;        // "HH:MM"
  isCompleted: boolean;
  completedAt?: string;
  isPinned: boolean;       // Pin tugas penting di atas
  goalId?: string;         // Opsional: terhubung ke Goal tertentu
  createdAt: string;
  updatedAt: string;
}
```

#### Fitur Detail
1. **List View**
   - Tugas dikelompokkan: `Hari Ini` | `Besok` | `Minggu Ini` | `Nanti` | `Selesai`
   - Tugas yang di-pin selalu tampil di atas
   - Checkbox untuk menandai selesai (dengan animasi strikethrough)
   - Priority indicator: warna strip di sisi kiri kartu
     - `urgent`: Merah
     - `high`: Amber
     - `medium`: Biru
     - `low`: Abu

2. **Quick Add** (Input di atas list)
   - Ketik judul tugas + Enter untuk langsung menambah (default: prioritas medium, tanpa deadline)
   - Tombol (+) untuk form lengkap

3. **Form Lengkap** (Modal/Slide-over)
   - Field: Judul, Deskripsi, Prioritas, Kategori, Deadline (tanggal + jam), Pin, Hubungkan ke Goal

4. **Filter & Sort**
   - Filter: Semua | Hari Ini | Mendesak | Per Kategori
   - Sort: Prioritas | Deadline | Terbaru | Terlama

5. **Aksi per Item**
   - Tandai Selesai / Batalkan
   - Pin / Unpin
   - Edit, Hapus

6. **Bulk Actions**
   - Hapus semua yang sudah selesai
   - Tandai semua hari ini sebagai selesai

---

## 5. Manajemen State & Persistensi Data

### 5.1 Zustand Stores
```
src/
└── store/
    ├── useDebtStore.ts       // DebtItem[]
    ├── useScheduleStore.ts   // Activity[]
    ├── useGoalStore.ts       // Goal[] + GoalStep[]
    ├── useTodoStore.ts       // TodoItem[]
    └── useUIStore.ts         // darkMode, sidebarOpen, dll
```

### 5.2 Persistensi localStorage
Gunakan **Zustand persist middleware** untuk semua store data:
```typescript
import { persist } from 'zustand/middleware';

const useDebtStore = create(
  persist(
    (set, get) => ({ ... }),
    { name: 'personal-os-debt' }
  )
);
```

**Key localStorage:**
- `personal-os-debt`
- `personal-os-schedule`
- `personal-os-goals`
- `personal-os-todos`
- `personal-os-ui` (preferensi dark mode, dll)

### 5.3 Export / Import Data
- Tombol **Export** (di Settings atau Navbar): unduh semua data sebagai file `.json`
- Tombol **Import**: upload file `.json` untuk restore data
- Tujuan: backup manual data pengguna

---

## 6. Navigasi

### 6.1 Desktop (Sidebar)
```
PersonalOS [Logo]
─────────────────
🏠  Dashboard
💸  Hutang
📅  Kesibukan
🎯  Tujuan
✅  To-Do
─────────────────
⚙️  Pengaturan
```

### 6.2 Mobile (Bottom Tab Bar)
```
[ 🏠 ]  [ 💸 ]  [ 📅 ]  [ 🎯 ]  [ ✅ ]
 Home    Hutang  Sibuk  Tujuan  To-Do
```

### 6.3 Halaman Pengaturan (`/settings`)
- Toggle Dark / Light Mode
- Reset semua data (dengan konfirmasi double)
- Export data (JSON)
- Import data (JSON)
- Informasi aplikasi (versi)

---

## 7. Struktur Folder Proyek

```
personal-os/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ui/                  # Komponen atom (Button, Modal, Badge, Input, dll)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── BottomNav.tsx
│   │   ├── debt/
│   │   │   ├── DebtList.tsx
│   │   │   ├── DebtCard.tsx
│   │   │   ├── DebtForm.tsx
│   │   │   └── DebtSummary.tsx
│   │   ├── schedule/
│   │   │   ├── WeeklyView.tsx
│   │   │   ├── ActivityCard.tsx
│   │   │   └── ActivityForm.tsx
│   │   ├── goals/
│   │   │   ├── GoalCard.tsx
│   │   │   ├── GoalDetail.tsx
│   │   │   ├── GoalForm.tsx
│   │   │   └── StepList.tsx
│   │   └── todo/
│   │       ├── TodoList.tsx
│   │       ├── TodoItem.tsx
│   │       ├── QuickAdd.tsx
│   │       └── TodoForm.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Debt.tsx
│   │   ├── Schedule.tsx
│   │   ├── Goals.tsx
│   │   ├── Todo.tsx
│   │   └── Settings.tsx
│   ├── store/
│   │   ├── useDebtStore.ts
│   │   ├── useScheduleStore.ts
│   │   ├── useGoalStore.ts
│   │   ├── useTodoStore.ts
│   │   └── useUIStore.ts
│   ├── hooks/
│   │   ├── useLocalDate.ts      # Formatting tanggal lokal
│   │   └── useBreakpoint.ts     # Responsive helper
│   ├── utils/
│   │   ├── formatCurrency.ts    # Format Rupiah
│   │   ├── formatDate.ts        # Format tanggal Indonesia
│   │   ├── generateId.ts        # UUID generator
│   │   └── exportImport.ts      # Backup/restore data
│   ├── types/
│   │   └── index.ts             # Semua TypeScript interface
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                # Tailwind directives + CSS variables
├── index.html
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
├── vercel.json                  # SPA routing config
└── package.json
```

---

## 8. Konfigurasi Vercel

File `vercel.json` untuk menangani SPA routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 9. Animasi & Interaksi

| Interaksi | Animasi |
|---|---|
| Page transition | Fade + slide 200ms (Framer Motion) |
| Modal buka/tutup | Scale + fade 150ms |
| Card hover | Subtle lift (translateY -2px + shadow) |
| Checkbox todo | Strikethrough animation 300ms |
| Dark mode toggle | Color transition 200ms |
| Tambah item | Slide-in dari bawah |
| Hapus item | Slide-out + fade |
| Progress bar | Animated fill saat load |
| Loading state | Skeleton shimmer |

---

## 10. Aksesibilitas & UX Details

- Semua input form memiliki label yang jelas
- Keyboard navigable (Tab order yang benar)
- Tombol konfirmasi untuk aksi destruktif (hapus, reset)
- Empty state per modul: ilustrasi + teks motivasi + tombol aksi pertama
- Toast notification untuk feedback aksi (berhasil/gagal)
- Format angka Rupiah: `Rp 1.500.000` (titik sebagai pemisah ribuan)
- Format tanggal: `Senin, 21 Apr 2026` (locale id-ID)

---

## 11. Empty States

| Modul | Pesan |
|---|---|
| Dashboard | "Selamat datang! Mulai dengan mencatat hutang atau menambah tugas pertama kamu." |
| Hutang | "Tidak ada catatan hutang. Semoga keuangan selalu sehat! 💪" |
| Kesibukan | "Belum ada aktivitas. Tambah rutinitas pertama kamu." |
| Tujuan | "Impian tanpa rencana hanyalah angan. Tulis tujuan pertamamu!" |
| To-Do | "Inbox kosong. Nikmati atau mulai rencanakan harimu." |

---

## 12. Prioritas Implementasi (Fase)

### Fase 1 — MVP (Core)
- [ ] Setup proyek (Vite + React + Tailwind + Zustand)
- [ ] Layout global (Navbar, Sidebar, Bottom Nav)
- [ ] Dark/Light mode system
- [ ] Modul To-Do (paling sering digunakan)
- [ ] Modul Hutang

### Fase 2 — Extended
- [ ] Dashboard dengan summary cards
- [ ] Modul Kesibukan (Schedule)
- [ ] Modul Goals & Milestones

### Fase 3 — Polish
- [ ] Animasi & transisi halaman
- [ ] Export/Import data
- [ ] Halaman Settings
- [ ] Chart/visualisasi data
- [ ] Drag-and-drop untuk goal steps

---

## 13. Catatan untuk Developer (Claude Code)

1. **Gunakan TypeScript** untuk semua file `.ts` dan `.tsx`
2. **Komponen harus atomic** — pisahkan logika dari tampilan sebisa mungkin
3. **Jangan gunakan library CSS tambahan** selain Tailwind — manfaatkan CSS variables yang sudah didefinisikan
4. **Semua teks menggunakan bahasa Indonesia** sesuai target pengguna
5. **Format Rupiah** selalu tanpa desimal: `Rp 1.500.000` bukan `Rp 1,500,000.00`
6. **UUID** gunakan `crypto.randomUUID()` bawaan browser
7. **Date handling**: selalu simpan dalam ISO 8601 string, tampilkan dengan `date-fns` dan locale `id`
8. **Hindari `any` type** — definisikan semua interface di `src/types/index.ts`
9. **Toast notifications**: gunakan library `react-hot-toast` atau buat custom minimal toast
10. **Mobile first**: styling Tailwind dimulai dari ukuran kecil, baru tambahkan prefix `md:` dan `lg:` untuk desktop

---

*PRD ini dibuat untuk digunakan langsung bersama Claude Code. Setiap modul dapat diimplementasikan secara independen.*
