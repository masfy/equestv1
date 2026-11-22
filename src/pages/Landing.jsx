import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, ShieldCheck, Sparkles, LayoutDashboard, Zap,
  Target, BookOpen, MonitorPlay, ChevronRight, ArrowRight,
  ClipboardList, CheckCircle, UploadCloud, BarChart3, Clock,
  LockKeyhole, FileCheck2, Table, Image as ImageIcon,
  Check, GraduationCap, UserCheck, Smartphone, Laptop,
  Menu, X, Home, CheckSquare, Download, Compass,
  Layers, FileText, Shield, Sparkle, Award, PlayCircle, School
} from 'lucide-react';
import PwaInstallPrompt from '../components/PwaInstallPrompt';

const LOGO = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhkZZ6nl3Pq7mFou917u9D1yJnyd4AmsDSQI4VyCjaktVQOk6Yj0teuLBiiyBeiyyKhhbBRC5SJW9Ml6QZZ5vlH-ZlR1lrrKO6auMpiFZrs_DC-VINjninMxAh57pj7yVza53Z2qgyUKiGw8RWviLJ8_Cvl_DamdXJG_OVk_CYc8iwVa4BReULUElQxinWK/s16000/logo%20e-quest.png";

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

// --- DATA FEATURES LENGKAP E-QUEST (STANDAR TKA) ---
const features = [
  {
    icon: <Brain size={24} className="text-indigo-600" />,
    badge: "AI Powered",
    title: "AI-Powered Generator",
    desc: "Sistem cerdas otomatis mengekstrak soal dari berkas Word atau PDF, menyusun pilihan jawaban, serta mengklasifikasikan level kognitif LOTS, MOTS, dan HOTS secara otomatis.",
    accent: "from-indigo-500/10 to-indigo-500/0"
  },
  {
    icon: <BookOpen size={24} className="text-amber-600" />,
    badge: "TKA Ready",
    title: "Bank Soal Berbasis Stimulus",
    desc: "Tautkan wacana teks literasi naratif, tabel data hasil pengamatan eksperimen, maupun infografis visual ke banyak butir soal sekaligus sesuai format TKA modern.",
    accent: "from-amber-500/10 to-amber-500/0"
  },
  {
    icon: <LockKeyhole size={24} className="text-emerald-600" />,
    badge: "Sistem Keamanan",
    title: "Sistem Keamanan Token Dinamis",
    desc: "Akses ujian dijaga ketat dengan token real-time yang hanya dapat dikendalikan oleh Pengawas Ruang. Dilengkapi proteksi anti-contek deteksi alih jendela.",
    accent: "from-emerald-500/10 to-emerald-500/0"
  },
  {
    icon: <BarChart3 size={24} className="text-fuchsia-600" />,
    badge: "Real-Time",
    title: "Koreksi & Analisis Instan",
    desc: "Nilai ujian, analisis butir soal, dan pemetaan kemampuan kognitif siswa keluar detik itu juga saat ujian selesai tanpa perlu koreksi manual berulang.",
    accent: "from-fuchsia-500/10 to-fuchsia-500/0"
  },
  {
    icon: <Target size={24} className="text-rose-600" />,
    badge: "Blueprint",
    title: "Blueprint Kognitif Berimbang",
    desc: "Atur cetak biru distribusi proporsi soal LOTS, MOTS, dan HOTS. Sistem merakit bank soal secara acak namun tetap proporsional dan adil bagi setiap peserta.",
    accent: "from-rose-500/10 to-rose-500/0"
  },
  {
    icon: <MonitorPlay size={24} className="text-cyan-600" />,
    badge: "Live Proctoring",
    title: "Live Proctoring & Administrasi",
    desc: "Pantau layar proctoring langsung untuk melihat siapa yang sedang login, mengerjakan, selesai, serta cetak berita acara, daftar hadir, dan kisi-kisi resmi.",
    accent: "from-cyan-500/10 to-cyan-500/0"
  },
];

const steps = [
  {
    icon: <LayoutDashboard size={22} />,
    step: "01",
    title: "Setup Database Sekolah",
    desc: "Atur data sekolah, rombel kelas, mata pelajaran, serta hak akses akun Guru Kelas dan Guru Mapel dalam satu panel terpadu."
  },
  {
    icon: <UploadCloud size={22} />,
    step: "02",
    title: "Input Soal & Stimulus",
    desc: "Input manual atau biarkan AI mengekstrak soal dari dokumen Word/PDF lengkap dengan wacana teks dan tabel data percobaan."
  },
  {
    icon: <Zap size={22} />,
    step: "03",
    title: "Luncurkan Ujian TKA",
    desc: "Buat token ujian, tentukan alokasi waktu pengerjaan, dan pantau jalannya asesmen secara real-time dari ruang pengawas."
  },
  {
    icon: <FileCheck2 size={22} />,
    step: "04",
    title: "Koreksi & Cetak Laporan",
    desc: "Unduh nilai ke berkas Excel, verifikasi jawaban uraian siswa, lalu cetak laporan administrasi baku sekolah secara lengkap."
  },
];

const questionFormats = [
  { id: 1, name: "Pilihan Ganda", desc: "1 pilihan jawaban tepat dengan opsi A-D atau A-E", tag: "Standar" },
  { id: 2, name: "Pilihan Ganda Kompleks", desc: "Multi-jawaban benar untuk menguji ketelitian penalaran", tag: "TKA Inti" },
  { id: 3, name: "Benar / Salah", desc: "Validasi kebenaran pernyataan berdasarkan stimulus", tag: "Analitis" },
  { id: 4, name: "Menjodohkan", desc: "Memasangkan premis kiri dengan pasangan jawaban kanan", tag: "Interaktif" },
  { id: 5, name: "Isian Singkat", desc: "Koreksi otomatis cerdas case-insensitive tanpa bias", tag: "Otomatis" },
  { id: 6, name: "Uraian / Esai", desc: "Penilaian komprehensif didukung rubrik skor mandiri guru", tag: "Kognitif" }
];

// DATA LOGO BERJALAN (INFINITE MARQUEE)
const ecosystemLogos = [
  { name: "Kemendikbudristek", role: "Kurikulum Merdeka", icon: <GraduationCap size={18} className="text-indigo-600" /> },
  { name: "SD Negeri 2 Palapi", role: "Sekolah Penggerak", icon: <School size={18} className="text-blue-600" /> },
  { name: "Asesmen TKA", role: "Standar Literasi & Numerasi", icon: <Target size={18} className="text-amber-600" /> },
  { name: "Google Gemini AI", role: "Cognitive Generator", icon: <Brain size={18} className="text-purple-600" /> },
  { name: "Google Cloud", role: "Real-Time Firestore", icon: <UploadCloud size={18} className="text-cyan-600" /> },
  { name: "PWA Mobile", role: "Aplikasi Terpasang", icon: <Smartphone size={18} className="text-emerald-600" /> },
  { name: "Anti-Contek System", role: "Secure Exam Browser", icon: <ShieldCheck size={18} className="text-rose-600" /> },
  { name: "Analisis HOTS", role: "Blueprint Kognitif", icon: <BarChart3 size={18} className="text-fuchsia-600" /> },
];

const heroRotatingWords = [
  "Cerdas, Cepat & Elegan",
  "Berstandar Asesmen TKA",
  "Ekstraksi Soal AI Otomatis",
  "Mudah bagi Semua Guru",
  "Seru & Nyaman untuk Siswa"
];

export default function Landing({ onEnterApp }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animasi Teks Bergantian di Hero
  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % heroRotatingWords.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 70;
      const elPos = el.getBoundingClientRect().top + window.pageYOffset - navOffset;
      window.scrollTo({ top: elPos, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900 antialiased">

      {/* BACKGROUND DECOR - Apple Clean Style with subtle e-Quest glow accents */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-b from-indigo-200/35 via-purple-100/20 to-transparent blur-[120px]" />
        <div className="absolute top-[40%] -right-[15%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-fuchsia-200/25 via-pink-100/15 to-transparent blur-[120px]" />
        <div className="absolute bottom-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-200/25 via-indigo-100/20 to-transparent blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:28px_28px] opacity-60" />
      </div>

      {/* NAVBAR (Apple Minimalist Glassmorphism) */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] py-2 sm:py-2.5' : 'bg-transparent py-3 sm:py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 flex justify-between items-center">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => scrollToSection('hero')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
              <img src={LOGO} alt="e-Quest Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <div className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 leading-none">
                e-<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600">Quest</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">CBT & TKA System</span>
            </div>
          </div>

          {/* Desktop Navigation Links (Pill Style) */}
          <nav className="hidden md:flex items-center gap-1 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/70 shadow-xs text-xs font-semibold text-slate-600">
            <button onClick={() => scrollToSection('hero')} className="px-3.5 py-1.5 rounded-full hover:text-indigo-600 hover:bg-slate-100/80 transition-all cursor-pointer">Beranda</button>
            <button onClick={() => scrollToSection('features')} className="px-3.5 py-1.5 rounded-full hover:text-indigo-600 hover:bg-slate-100/80 transition-all cursor-pointer">Fitur</button>
            <button onClick={() => scrollToSection('stimulus')} className="px-3.5 py-1.5 rounded-full hover:text-indigo-600 hover:bg-slate-100/80 transition-all cursor-pointer">Stimulus TKA</button>
            <button onClick={() => scrollToSection('formats')} className="px-3.5 py-1.5 rounded-full hover:text-indigo-600 hover:bg-slate-100/80 transition-all cursor-pointer">Format Soal</button>
            <button onClick={() => scrollToSection('workflow')} className="px-3.5 py-1.5 rounded-full hover:text-indigo-600 hover:bg-slate-100/80 transition-all cursor-pointer">Alur Ujian</button>
          </nav>

          {/* Action Navigation (Desktop) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onEnterApp('admin')}
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3.5 py-2 rounded-xl hover:bg-white/80 transition-colors hidden sm:flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck size={16} className="text-indigo-600" />
              <span>Masuk Edukator</span>
            </button>

            <button
              onClick={() => onEnterApp('student')}
              className="hidden sm:flex bg-slate-900 hover:bg-slate-800 text-white px-4.5 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Portal Siswa</span>
              <ArrowRight size={14} />
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:text-indigo-600 active:scale-95 transition-all shadow-2xs md:hidden flex items-center justify-center cursor-pointer"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER / SLIDE-DOWN SHEET */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
            />

            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-[62px] inset-x-3 z-50 bg-white/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 shadow-2xl p-5 space-y-4 md:hidden max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <img src={LOGO} alt="Logo" className="w-7 h-7 object-contain" />
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 block">e-Quest CBT System</span>
                    <span className="text-[10px] text-slate-400 font-medium">SD Negeri 2 Palapi</span>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>

              {/* Quick Links */}
              <div className="space-y-1">
                <button
                  onClick={() => scrollToSection('hero')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <Home size={16} className="text-indigo-600" /> Beranda Utama
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <Sparkles size={16} className="text-fuchsia-600" /> Keunggulan Fitur
                </button>
                <button
                  onClick={() => scrollToSection('stimulus')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <BookOpen size={16} className="text-amber-600" /> Modul Stimulus Soal
                </button>
                <button
                  onClick={() => scrollToSection('formats')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <CheckSquare size={16} className="text-emerald-600" /> 6 Format Soal Standar
                </button>
                <button
                  onClick={() => scrollToSection('workflow')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <Clock size={16} className="text-cyan-600" /> 4 Langkah Pelaksanaan
                </button>
              </div>

              {/* Portals Access */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setMobileMenuOpen(false); onEnterApp('student'); }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-md flex items-center justify-between cursor-pointer active:scale-95"
                >
                  <span className="flex items-center gap-2"><GraduationCap size={16} className="text-indigo-400" /> Masuk Portal Siswa</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  onClick={() => { setMobileMenuOpen(false); onEnterApp('admin'); }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2"><UserCheck size={16} className="text-indigo-600" /> Masuk Edukator / Guru</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* HERO SECTION DENGAN TEKS BERANIMASI & UKURAN PROPORSIONAL */}
      <section id="hero" className="relative z-10 pt-28 pb-14 sm:pt-36 sm:pb-18 md:pt-42 md:pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">

          {/* Badge: The Future of Smart CBT */}
          <motion.div
            initial={{ opacity: 1, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-5 sm:mb-6"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-700 tracking-wide uppercase">
              The Future of Smart CBT & TKA
            </span>
            <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-full">v2.5</span>
          </motion.div>

          {/* Headline Beranimasi dengan Ukuran Proporsional */}
          <div className="min-h-[110px] sm:min-h-[140px] md:min-h-[160px] flex flex-col justify-center mb-4 sm:mb-5">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.16] sm:leading-[1.14]">
              Ujian Digital Masa Depan yang <br className="hidden sm:inline" />
              <span className="inline-block relative">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600"
                  >
                    {heroRotatingWords[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>
          </div>

          {/* Copywriting Resmi e-Quest SD Negeri 2 Palapi */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed mb-7 sm:mb-8 font-normal px-2"
          >
            <p className="font-extrabold text-slate-900 mb-1 text-sm sm:text-base">
              e-Quest (Electronic Question, Evaluation & Examination System)
            </p>
            <p className="text-slate-600 font-medium">
              Platform CBT terpadu untuk <strong className="text-slate-800 font-bold">SD Negeri 2 Palapi</strong> yang mengintegrasikan pembuatan soal otomatis berbasis AI, penyusunan stimulus literasi dan numerasi TKA, pelaksanaan ujian interaktif, hingga koreksi nilai dan administrasi otomatis dari hulu ke hilir.
            </p>
          </motion.div>

          {/* Tombol Aksi Proporsional */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-xs sm:max-w-none mx-auto mb-6"
          >
            <button
              onClick={() => onEnterApp('student')}
              className="w-full sm:w-auto px-7 py-3.5 sm:px-8 sm:py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/15 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <GraduationCap size={18} className="text-indigo-400" />
              <span>Mulai Ujian (Portal Siswa)</span>
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => onEnterApp('admin')}
              className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 hover:border-indigo-300 font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <UserCheck size={17} className="text-indigo-600" />
              <span>Masuk Edukator / Guru</span>
            </button>
          </motion.div>

          {/* Kotak PWA Install di Hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2.5 sm:px-4 sm:py-2.5 shadow-2xs mx-auto mb-4"
          >
            <div className="flex items-center gap-2 text-left">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Smartphone size={15} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Pasang Aplikasi di HP / Laptop</p>
                <p className="text-[9px] text-slate-500">Mengerjakan ujian lancar, fullscreen & bebas hambatan</p>
              </div>
            </div>
            <PwaInstallPrompt variant="button" />
          </motion.div>

          {/* Slogan Resmi e-Quest */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-slate-400 italic mb-10 sm:mb-14"
          >
            "Mudah untuk Guru, Seru untuk Siswa, Cerdas untuk Semua"
          </motion.p>

          {/* JAVAPIXA-STYLE INTERACTIVE APP PREVIEW CARD (MOCKUP WINDOW) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative mx-auto max-w-4xl"
          >
            {/* Ambient Backlight Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-fuchsia-500/20 rounded-3xl blur-2xl opacity-75" />

            {/* Browser / App Window Mockup */}
            <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-indigo-950/10 overflow-hidden text-left">
              
              {/* Window Header Bar */}
              <div className="bg-slate-50/90 border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-[11px] font-bold text-slate-500 font-mono hidden sm:inline">
                    e-quest.app/exam/live-preview
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Proctoring Aktif
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200 hidden sm:inline">
                    Waktu: 00:44:12
                  </span>
                </div>
              </div>

              {/* Realistic CBT Interface Preview */}
              <div className="p-5 sm:p-7 bg-[#fcfcfd]">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Ujian TKA Kelas 6A</span>
                    <h3 className="text-base sm:text-lg font-black text-slate-800">Literasi & Numerasi Sains Terpadu</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400">Soal No.</span>
                    <span className="ml-1 text-base sm:text-lg font-black text-slate-800">03 <span className="text-xs font-normal text-slate-400">/ 25</span></span>
                  </div>
                </div>

                {/* Stimulus Preview Box */}
                <div className="bg-gradient-to-r from-amber-50/80 to-indigo-50/60 p-4 rounded-2xl border border-amber-200/70 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={15} className="text-amber-700" />
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                      Stimulus Wacana & Data Eksperimen (TKA Ready)
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    "Hasil pengamatan pertumbuhan kecambah kacang hijau menunjukkan laju pertambahan tinggi maksimal terjadi pada kondisi gelap dengan rata-rata 10.4 cm pada hari ke-5..."
                  </p>
                </div>

                {/* Question & Options Preview */}
                <div className="space-y-3 mb-5">
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    Berdasarkan stimulus di atas, manakah kesimpulan yang paling tepat mengenai pengaruh intensitas cahaya terhadap hormon auksin?
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                    <div className="p-3 rounded-xl border border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">A</span>
                      <span>Hormon auksin bekerja optimal di kondisi gelap (etiolasi)</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium flex items-center gap-3 hover:border-slate-300">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs shrink-0">B</span>
                      <span>Cahaya terang memacu pembelahan sel lebih cepat</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium flex items-center gap-3 hover:border-slate-300">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs shrink-0">C</span>
                      <span>Intensitas cahaya redup merusak kloroplas batang</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium flex items-center gap-3 hover:border-slate-300">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs shrink-0">D</span>
                      <span>Tidak ada hubungan antara cahaya dan tinggi tanaman</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar Preview */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200">Level: HOTS</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">Bobot: 20 Poin</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEnterApp('student')} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer">
                      Coba Ujian Sekarang &rarr;
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Floating Metric Badges */}
            <div className="absolute -top-4 -right-2 sm:-top-5 sm:-right-5 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-3 shadow-xl flex items-center gap-2.5 hidden md:flex">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-800">Proteksi Anti-Contek</p>
                <p className="text-[9px] text-slate-400">Deteksi alih tab real-time</p>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-2 sm:-bottom-5 sm:-left-5 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-3 shadow-xl flex items-center gap-2.5 hidden md:flex">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Brain size={18} />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-800">AI Soal Generator</p>
                <p className="text-[9px] text-slate-400">Ekstrak Word & Deteksi HOTS</p>
              </div>
            </div>

          </motion.div>

        </div>
      </section>

      {/* INFINITE LOGO MARQUEE (LOGO BERJALAN GAYA JAVAPIXA) */}
      <section className="relative z-10 py-8 sm:py-12 overflow-hidden border-y border-slate-200/70 bg-white/60 backdrop-blur-sm mb-16 sm:mb-20">
        <div className="max-w-7xl mx-auto px-4 mb-4 text-center">
          <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.25em] text-slate-400">
            Terintegrasi dengan Standar & Ekosistem Pendidikan Digital
          </p>
        </div>

        {/* Mask Gradients for smooth fade at sides */}
        <div className="relative w-full overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#fafafa] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#fafafa] to-transparent z-10" />

          <div className="animate-marquee flex items-center gap-3 sm:gap-4 py-1">
            {[...ecosystemLogos, ...ecosystemLogos].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all whitespace-nowrap group cursor-default"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{item.name}</p>
                  <p className="text-[10px] font-medium text-slate-400 leading-tight">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METRICS & STATS SECTION (BENTO GRID DESIGN + COPYWRITING TERBARU) */}
      <section className="relative z-10 px-4 sm:px-6 max-w-6xl mx-auto mb-20 sm:mb-28">
        <div className="text-center mb-8">
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full">
            Kemampuan Inti Platform
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2.5">
            Dirancang untuk Standar Ujian Terbaik
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            {
              badge: "TKA Ready",
              val: "6+ Bentuk",
              title: "Format Soal Komprehensif",
              desc: "Pilihan Ganda, PG Kompleks, Benar/Salah, Menjodohkan, Isian Singkat, hingga Uraian dengan rubrik penskoran baku.",
              icon: <CheckSquare size={18} className="text-indigo-600" />,
              badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
            },
            {
              badge: "AI Powered",
              val: "AI Engine",
              title: "Ekstraksi & Blueprint AI",
              desc: "Ubah naskah Word & PDF jadi bank soal lengkap dengan deteksi otomatis tingkat kognitif LOTS, MOTS, dan HOTS.",
              icon: <Brain size={18} className="text-purple-600" />,
              badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
            },
            {
              badge: "Cloud Sync",
              val: "Real-Time",
              title: "Penyimpanan Sinkron",
              desc: "Jawaban siswa tersimpan per detik ke Google Cloud Firestore. Ujian anti-putus walau koneksi atau laptop terganggu.",
              icon: <UploadCloud size={18} className="text-blue-600" />,
              badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
            },
            {
              badge: "Otomatis",
              val: "0 Detik",
              title: "Koreksi & Rekap Excel",
              desc: "Hasil keluar detik ujian selesai, lengkap dengan analisis kognitif, daya beda, dan unduhan berkas Excel resmi.",
              icon: <BarChart3 size={18} className="text-emerald-600" />,
              badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
            }
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(79,70,229,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${stat.badgeColor}`}>
                    {stat.badge}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1.5">
                  {stat.val}
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1.5">{stat.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed font-normal">{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BENTO GRID: KEUNGGULAN EKOSISTEM (JAVAPIXA + APPLE CLEAN) */}
      <section id="features" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-3">
            <Sparkle size={13} />
            <span>Fitur Unggulan</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
            Semua Fitur dalam Satu Ekosistem
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-xs sm:text-sm md:text-base font-normal leading-relaxed">
            Bukan sekadar aplikasi ujian biasa. e-Quest adalah asisten digital guru yang mengotomatisasi pekerjaan dari persiapan soal hingga pencetakan rapor asesmen.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="group bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Subtle Ambient Hover Glow */}
              <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${f.accent} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center group-hover:scale-105 group-hover:bg-white transition-all shadow-xs">
                    {f.icon}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200/80">
                    {f.badge}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {f.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-xs sm:text-sm font-normal">
                  {f.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                <span>E-Quest Powered</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* HIGHLIGHT: FITUR STIMULUS SOAL & TKA READY */}
      <section id="stimulus" className="relative z-10 py-12 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-7 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-4">
              <BookOpen size={14} /> Terobosan CBTku Berstandar TKA
            </div>

            <h3 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
              Mendukung Penuh Soal Berbasis Stimulus
            </h3>
            <p className="text-indigo-200 text-xs sm:text-sm md:text-base max-w-3xl leading-relaxed mb-8 font-normal">
              Tes Kemampuan Akademik (TKA) mengutamakan kemampuan bernalar tinggi. e-Quest CBTku menyediakan modul manajemen stimulus mandiri agar guru dapat menyajikan wacana mendalam yang terhubung ke satu atau banyak butir soal sekaligus.
            </p>

            {/* 3 Stimulus Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col gap-2.5 hover:bg-white/15 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                  <BookOpen size={20} />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-white">Wacana Teks Literasi</h4>
                <p className="text-xs text-indigo-200/80 leading-relaxed font-normal">
                  Cerita fiksi, wacana sains, artikel ilmiah, atau narasi kasus untuk menguji pemahaman membaca dan penalaran kritis.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col gap-2.5 hover:bg-white/15 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                  <Table size={20} />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-white">Tabel Data Eksperimen</h4>
                <p className="text-xs text-indigo-200/80 leading-relaxed font-normal">
                  Tabel catatan penelitian, data statistik, atau tabel perbandingan bergaris rapi yang responsif di HP maupun laptop.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col gap-2.5 hover:bg-white/15 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                  <ImageIcon size={20} />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-white">Gambar & Infografis</h4>
                <p className="text-xs text-indigo-200/80 leading-relaxed font-normal">
                  Bagan daur hidup, siklus alam, diagram alir, maupun peta tematik dengan resolusi tajam di berbagai perangkat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUESTION FORMATS (STANDAR TKA) */}
      <section id="formats" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 block">Format Soal Variatif</span>
            <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
              Mendukung Kurikulum Modern & Standar TKA
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed">
              Platform ini dilengkapi 6 format bentuk soal yang komprehensif, disesuaikan dengan standar Tes Kemampuan Akademik (TKA) dan Kurikulum Merdeka.
            </p>
          </div>
          <button
            onClick={() => onEnterApp('admin')}
            className="px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs sm:text-sm hover:bg-indigo-100 transition-colors cursor-pointer shrink-0"
          >
            Buka Bank Soal &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {questionFormats.map((qf, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    0{qf.id}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                    {qf.tag}
                  </span>
                </div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-1.5">{qf.name}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{qf.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WORKFLOW / STEPS */}
      <section id="workflow" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-50 border border-fuchsia-200/80 text-[11px] font-bold text-fuchsia-700 uppercase tracking-wider mb-3">
            <Zap size={13} />
            <span>Alur Pelaksanaan</span>
          </div>
          <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
            Cukup 4 Langkah Praktis
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm md:text-base max-w-md mx-auto">
            Dari persiapan database hingga pencetakan rapor asesmen, semua pekerjaan guru tersusun rapi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg mb-4">
                {step.step}
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-2">{step.title}</h4>
              <p className="text-slate-500 text-xs font-normal leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER (APPLE CLEAN + HIGH-IMPACT GRADIENT) */}
      <section className="relative z-10 py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-[2.5rem] p-8 sm:p-14 text-center text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
          
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
              Siap Melangkah ke Era CBT Pintar?
            </h2>
            <p className="text-xs sm:text-base md:text-lg text-indigo-100 font-normal mb-8 max-w-2xl mx-auto leading-relaxed">
              Tinggalkan cara manual. Hemat waktu guru, berikan pengalaman modern berstandar TKA bagi siswa SD Negeri 2 Palapi.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={() => onEnterApp('admin')}
                className="w-full sm:w-auto bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
              >
                <span>Masuk Panel Edukator</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => onEnterApp('student')}
                className="w-full sm:w-auto bg-indigo-950/40 hover:bg-indigo-950/60 text-white border border-white/20 px-7 py-4 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Portal Siswa</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER (Apple Minimalist) */}
      <footer className="relative z-10 bg-white border-t border-slate-200/80 py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <img src={LOGO} alt="e-Quest Logo" className="w-7 h-7 object-contain" />
            <div className="font-bold text-slate-800 text-sm">
              e-Quest <span className="text-slate-400 font-medium text-xs ml-1">CBT System • SD Negeri 2 Palapi</span>
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500">
            &copy; {new Date().getFullYear()} SD Negeri 2 Palapi. Dikembangkan oleh Mas Alfy.
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <button onClick={() => onEnterApp('admin')} className="hover:text-indigo-600 transition-colors cursor-pointer">Admin Panel</button>
            <button onClick={() => onEnterApp('student')} className="hover:text-indigo-600 transition-colors cursor-pointer">Portal Siswa</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
