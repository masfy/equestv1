import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Brain, ShieldCheck, Sparkles, LayoutDashboard, Zap,
  Target, BookOpen, MonitorPlay, ChevronRight, ArrowRight,
  ClipboardList, CheckCircle, UploadCloud, BarChart3, Clock,
  LockKeyhole, FileCheck2, Table, Image as ImageIcon,
  Check, GraduationCap, UserCheck, Smartphone, Laptop,
  Menu, X, Home, CheckSquare, Download, Compass
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
    border: "border-indigo-100"
  },
  {
    icon: <BookOpen size={24} className="text-amber-600" />,
    badge: "TKA Ready",
    title: "Bank Soal Berbasis Stimulus",
    desc: "Tautkan wacana teks literasi naratif, tabel data hasil pengamatan eksperimen, maupun infografis visual ke banyak butir soal sekaligus sesuai format TKA modern.",
    border: "border-amber-100"
  },
  {
    icon: <LockKeyhole size={24} className="text-emerald-600" />,
    badge: "Sistem Keamanan",
    title: "Sistem Keamanan Token Dinamis",
    desc: "Akses ujian dijaga ketat dengan token real-time yang hanya dapat dikendalikan oleh Pengawas Ruang. Dilengkapi proteksi anti-contek deteksi alih jendela.",
    border: "border-emerald-100"
  },
  {
    icon: <BarChart3 size={24} className="text-fuchsia-600" />,
    badge: "Real-Time",
    title: "Koreksi & Analisis Instan",
    desc: "Nilai ujian, analisis butir soal, dan pemetaan kemampuan kognitif siswa keluar detik itu juga saat ujian selesai tanpa perlu koreksi manual berulang.",
    border: "border-fuchsia-100"
  },
  {
    icon: <Target size={24} className="text-rose-600" />,
    badge: "Blueprint",
    title: "Blueprint Kognitif Berimbang",
    desc: "Atur cetak biru distribusi proporsi soal LOTS, MOTS, dan HOTS. Sistem merakit bank soal secara acak namun tetap proporsional dan adil bagi setiap peserta.",
    border: "border-rose-100"
  },
  {
    icon: <MonitorPlay size={24} className="text-cyan-600" />,
    badge: "Live Proctoring",
    title: "Live Proctoring & Administrasi",
    desc: "Pantau layar proctoring langsung untuk melihat siapa yang sedang login, mengerjakan, selesai, serta cetak berita acara, daftar hadir, dan kisi-kisi resmi.",
    border: "border-cyan-100"
  },
];

const steps = [
  {
    icon: <LayoutDashboard size={20} />,
    step: "01",
    title: "Setup Database Sekolah",
    desc: "Atur data sekolah, rombel kelas, mata pelajaran, serta hak akses akun Guru Kelas dan Guru Mapel dalam satu panel terpadu."
  },
  {
    icon: <UploadCloud size={20} />,
    step: "02",
    title: "Input Soal & Stimulus",
    desc: "Input manual atau biarkan AI mengekstrak soal dari dokumen Word/PDF lengkap dengan wacana teks dan tabel data percobaan."
  },
  {
    icon: <Zap size={20} />,
    step: "03",
    title: "Luncurkan Ujian TKA",
    desc: "Buat token ujian, tentukan alokasi waktu pengerjaan, dan pantau jalannya asesmen secara real-time dari ruang pengawas."
  },
  {
    icon: <FileCheck2 size={20} />,
    step: "04",
    title: "Koreksi & Cetak Laporan",
    desc: "Unduh nilai ke berkas Excel, verifikasi jawaban uraian siswa, lalu cetak laporan administrasi baku sekolah secara lengkap."
  },
];

const questionFormats = [
  { id: 1, name: "Pilihan Ganda", desc: "1 pilihan jawaban tepat dengan opsi A-D atau A-E", tag: "Standar" },
  { id: 2, name: "Pilihan Ganda Kompleks", desc: "Multi-jawaban benar untuk menguji ketelitian siswa", tag: "TKA Inti" },
  { id: 3, name: "Benar / Salah", desc: "Validasi kebenaran pernyataan berdasarkan stimulus", tag: "Analitis" },
  { id: 4, name: "Menjodohkan", desc: "Memasangkan premis kiri dengan pasangan jawaban kanan", tag: "Interaktif" },
  { id: 5, name: "Isian Singkat", desc: "Koreksi otomatis cerdas case-insensitive tanpa bias", tag: "Otomatis" },
  { id: 6, name: "Uraian / Esai", desc: "Penilaian komprehensif didukung rubrik skor guru", tag: "Kognitif" }
];

export default function Landing({ onEnterApp }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  const heroY = useTransform(scrollY, [0, 400], [0, 60]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-x-hidden selection:bg-indigo-200 selection:text-indigo-900 pb-20 sm:pb-0">

      {/* BACKGROUND DECOR */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[15%] -left-[10%] w-[55%] h-[55%] rounded-full bg-gradient-to-br from-indigo-200/50 via-purple-200/30 to-transparent blur-[90px]" />
        <div className="absolute top-[25%] -right-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-br from-fuchsia-200/40 via-pink-200/30 to-transparent blur-[90px]" />
        <div className="absolute -bottom-[15%] left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-cyan-200/40 via-blue-200/20 to-transparent blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* NAVBAR (BERSIH TANPA TOMBOL INSTAL DI HEADER) */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-xs py-2 sm:py-2.5' : 'bg-transparent py-3 sm:py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 flex justify-between items-center">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => scrollToSection('hero')}>
            <div className="bg-white p-1.5 rounded-xl shadow-xs border border-slate-200/80 flex items-center justify-center">
              <img src={LOGO} alt="e-Quest Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <div className="font-extrabold text-base sm:text-lg tracking-tight text-slate-800 leading-none">
                e-<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600">Quest</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">CBT & TKA System</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs lg:text-sm font-semibold text-slate-600">
            <button onClick={() => scrollToSection('hero')} className="hover:text-indigo-600 transition-colors cursor-pointer">Beranda</button>
            <button onClick={() => scrollToSection('features')} className="hover:text-indigo-600 transition-colors cursor-pointer">Fitur Utama</button>
            <button onClick={() => scrollToSection('stimulus')} className="hover:text-indigo-600 transition-colors cursor-pointer">Stimulus Soal</button>
            <button onClick={() => scrollToSection('formats')} className="hover:text-indigo-600 transition-colors cursor-pointer">Format TKA</button>
            <button onClick={() => scrollToSection('workflow')} className="hover:text-indigo-600 transition-colors cursor-pointer">Alur Ujian</button>
          </nav>

          {/* Action Navigation (Desktop) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onEnterApp('admin')}
              className="text-xs sm:text-sm font-bold text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-xl transition-colors hidden sm:flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck size={16} className="text-indigo-600" />
              <span>Masuk Edukator</span>
            </button>

            <button
              onClick={() => onEnterApp('student')}
              className="hidden sm:flex bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg hover:-translate-y-0.5 transition-all items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Portal Siswa</span>
              <ArrowRight size={15} />
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/80 border border-slate-200/80 text-slate-700 hover:text-indigo-600 active:scale-95 transition-all shadow-2xs md:hidden flex items-center justify-center cursor-pointer"
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
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
            />

            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-[58px] inset-x-3 z-50 bg-white/95 backdrop-blur-2xl rounded-3xl border border-slate-200 shadow-2xl p-4 sm:p-5 space-y-4 md:hidden max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img src={LOGO} alt="Logo" className="w-6 h-6 object-contain" />
                  <div>
                    <span className="font-extrabold text-sm text-slate-800 block">e-Quest CBT System</span>
                    <span className="text-[10px] text-slate-400 font-medium">SD Negeri 2 Palapi</span>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>

              {/* Quick Links */}
              <div className="space-y-1">
                <button
                  onClick={() => scrollToSection('hero')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <Home size={16} className="text-indigo-600" /> Beranda Utama
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <Sparkles size={16} className="text-fuchsia-600" /> Keunggulan Fitur
                </button>
                <button
                  onClick={() => scrollToSection('stimulus')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <BookOpen size={16} className="text-amber-600" /> Modul Stimulus Soal
                </button>
                <button
                  onClick={() => scrollToSection('formats')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <CheckSquare size={16} className="text-emerald-600" /> 6 Format Soal Standar
                </button>
                <button
                  onClick={() => scrollToSection('workflow')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <Clock size={16} className="text-cyan-600" /> 4 Langkah Pelaksanaan
                </button>
              </div>

              {/* Portals Access */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setMobileMenuOpen(false); onEnterApp('student'); }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2"><GraduationCap size={16} /> Buka Portal Siswa (Mulai Ujian)</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  onClick={() => { setMobileMenuOpen(false); onEnterApp('admin'); }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2"><UserCheck size={16} /> Masuk Edukator / Guru</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* HERO SECTION DENGAN COPYWRITING RESMI E-QUEST LENGKAP & INTEGRASI INSTAL APLIKASI */}
      <section id="hero" className="relative z-10 pt-24 pb-14 sm:pt-36 sm:pb-20 md:pt-40 md:pb-24 px-4 sm:px-6">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-4xl mx-auto text-center">

          {/* Badge The Future of Smart Examination */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-indigo-200/80 shadow-xs mb-6 sm:mb-8"
          >
            <Sparkles size={15} className="text-fuchsia-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-indigo-700 tracking-wide uppercase">
              The Future of Smart Assessment & TKA
            </span>
          </motion.div>

          {/* Heading Cerdas & Elegan */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.18] mb-5 sm:mb-6"
          >
            Ujian Digital yang <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-rose-500">
              Cerdas & Elegan
            </span>
          </motion.h1>

          {/* Copywriting Asli Lengkap Terkait e-Quest & SD Negeri 2 Palapi */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10 font-medium px-2"
          >
            <p className="mb-2">
              <strong className="text-indigo-600 font-bold tracking-wide">
                e-Quest (Electronic Question, Evaluation & Examination System)
              </strong>
            </p>
            <p>
              Platform CBT terpadu untuk <strong className="text-slate-800">SD Negeri 2 Palapi</strong> yang mengintegrasikan pembuatan soal otomatis berbasis AI, penyusunan stimulus literasi dan numerasi TKA, pelaksanaan ujian interaktif, hingga koreksi nilai dan administrasi otomatis dari hulu ke hilir.
            </p>
          </motion.div>

          {/* CTA Buttons Utama */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto mb-6"
          >
            <button
              onClick={() => onEnterApp('student')}
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
            >
              <GraduationCap size={19} className="text-indigo-400" />
              <span>Mulai Ujian (Portal Siswa)</span>
              <ChevronRight size={18} />
            </button>

            <button
              onClick={() => scrollToSection('features')}
              className="w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-2xl bg-white/80 hover:bg-white backdrop-blur-md text-slate-700 border border-slate-200 hover:border-indigo-300 font-bold text-sm sm:text-base shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Pelajari Fitur</span>
            </button>
          </motion.div>

          {/* KOTAK INSTAL APLIKASI DI BAGIAN HERO (SESUAI PERMINTAAN USER) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-blue-50/90 border border-indigo-200/90 rounded-2xl px-5 py-3 shadow-xs mx-auto mb-6"
          >
            <div className="flex items-center gap-2 text-left">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Smartphone size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-tight">Pasang Aplikasi di HP / Laptop</p>
                <p className="text-[10px] text-slate-500">Mengerjakan ujian lebih lancar & bebas gangguan</p>
              </div>
            </div>
            <PwaInstallPrompt variant="button" />
          </motion.div>

          {/* Slogan Resmi e-Quest yang Sangat Disukai */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-400 italic"
          >
            "Mudah untuk Guru, Seru untuk Siswa, Cerdas untuk Semua"
          </motion.p>

        </motion.div>
      </section>

      {/* METRICS / STATS SECTION */}
      <section className="relative z-10 px-4 sm:px-6 max-w-5xl mx-auto -mt-2 sm:-mt-4 mb-16 sm:mb-24">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl shadow-indigo-900/5 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          {[
            { label: "Format Soal", val: "6+", sub: "PG, Kompleks, B/S, Jodohkan, Isian, Esai" },
            { label: "Generasi Soal", val: "AI", sub: "Ekstrak Dokumen & Deteksi LOTS/HOTS" },
            { label: "Penyimpanan", val: "Cloud", sub: "Sinkronisasi Real-Time Firestore" },
            { label: "Koreksi Nilai", val: "Instan", sub: "Hasil Detik Itu Juga & Rekap Excel" }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col justify-between p-2">
              <div className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight mb-1">{stat.val}</div>
              <div className="text-xs sm:text-sm font-bold text-indigo-700 uppercase tracking-wider mb-0.5">{stat.label}</div>
              <div className="text-[10px] text-slate-400 font-medium leading-tight">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES / KEUNGGULAN EKOSISTEM */}
      <section id="features" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 bg-white/40 border-y border-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Keunggulan Ekosistem</h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">Semua Fitur dalam Satu Platform</h3>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto text-xs sm:text-sm md:text-base font-medium">
              Bukan sekadar aplikasi ujian biasa. e-Quest adalah asisten digital guru yang mengotomatisasi pekerjaan dari persiapan soal hingga pencetakan rapor.
            </p>
          </div>

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
                className="group bg-white/90 backdrop-blur-lg border border-slate-200/90 p-6 sm:p-7 rounded-3xl shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                      {f.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {f.badge}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-2">{f.title}</h4>
                  <p className="text-slate-600 leading-relaxed text-xs sm:text-sm font-medium">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HIGHLIGHT: FITUR STIMULUS SOAL & TKA READY */}
      <section id="stimulus" className="relative z-10 py-12 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto mb-12 sm:mb-16">
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-3.5">
              <BookOpen size={14} /> Terobosan Baru CBTku
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Mendukung Penuh Soal Berbasis Stimulus (TKA Ready)
            </h3>
            <p className="text-indigo-200 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed mb-8 font-normal">
              Tes Kemampuan Akademik (TKA) mengutamakan kemampuan bernalar tinggi. e-Quest CBTku menyediakan modul manajemen stimulus mandiri agar guru dapat menyajikan wacana mendalam yang terhubung ke satu atau banyak butir soal sekaligus.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                  <BookOpen size={18} />
                </div>
                <h4 className="font-bold text-sm text-white">Wacana Teks Literasi</h4>
                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  Cerita fiksi, wacana sains, artikel ilmiah, atau narasi kasus untuk menguji pemahaman membaca dan penalaran kritis.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                  <Table size={18} />
                </div>
                <h4 className="font-bold text-sm text-white">Tabel Data Eksperimen</h4>
                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  Tabel catatan penelitian, data statistik, atau tabel perbandingan bergaris rapi yang responsif di HP maupun laptop.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                  <ImageIcon size={18} />
                </div>
                <h4 className="font-bold text-sm text-white">Gambar & Infografis</h4>
                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  Bagan daur hidup, siklus alam, diagram alir, maupun peta tematik dengan resolusi tajam di berbagai perangkat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUESTION TYPES - VISUAL SECTION */}
      <section id="formats" className="relative z-10 py-20 px-4 sm:px-6 bg-slate-900 text-white overflow-hidden rounded-t-[2.5rem] md:rounded-t-[4rem]">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 mb-12">
            <div className="max-w-xl">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 block">Tipe Soal Lengkap</span>
              <h3 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Mendukung Kurikulum Modern & TKA</h3>
              <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed">
                Platform ini dilengkapi 6 format bentuk soal yang komprehensif, disesuaikan dengan standar Tes Kemampuan Akademik (TKA) dan Kurikulum Merdeka.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
              {questionFormats.map((qf, i) => (
                <div key={i} className="bg-white/10 border border-white/10 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-2.5 hover:bg-white/20 transition-colors">
                  <CheckCircle className="text-indigo-400 shrink-0" size={16} />
                  <span className="font-bold text-xs sm:text-sm">{qf.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW / STEPS */}
      <section id="workflow" className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-fuchsia-600 uppercase tracking-widest mb-2">Alur Kerja Cerdas</h2>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">Cukup 4 Langkah Praktis</h3>
          <p className="mt-2 text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
            Dari persiapan database hingga pencetakan rapor asesmen, semua pekerjaan guru tersusun rapi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-4 relative z-10">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg mb-4">
                {step.step}
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-800 mb-1.5">{step.title}</h4>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION LENGKAP COPYWRITING RESMI */}
      <section className="relative z-10 py-12 sm:py-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-rose-500 rounded-[2.5rem] p-8 sm:p-14 text-center text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Siap Melangkah ke Era CBT Pintar?
            </h2>
            <p className="text-xs sm:text-base md:text-lg text-indigo-100 font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
              Tinggalkan cara manual. Hemat waktu guru, berikan pengalaman modern berstandar TKA bagi siswa SD Negeri 2 Palapi.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onEnterApp('admin')}
                className="w-full sm:w-auto bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm sm:text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2.5 uppercase tracking-wide cursor-pointer active:scale-95"
              >
                <span>Masuk Panel Admin</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => onEnterApp('student')}
                className="w-full sm:w-auto bg-black/20 hover:bg-black/30 text-white border border-white/20 px-7 py-4 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Portal Siswa</span>
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-white border-t border-slate-200 py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <img src={LOGO} alt="e-Quest Logo" className="w-7 h-7 object-contain" />
            <div className="font-bold text-slate-800 text-sm">
              e-Quest <span className="text-slate-400 font-semibold text-xs ml-1">CBT System • SD Negeri 2 Palapi</span>
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            &copy; {new Date().getFullYear()} SD Negeri 2 Palapi. Dikembangkan oleh Mas Alfy.
          </p>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <button onClick={() => onEnterApp('admin')} className="hover:text-indigo-600 transition-colors cursor-pointer">Admin Panel</button>
            <button onClick={() => onEnterApp('student')} className="hover:text-indigo-600 transition-colors cursor-pointer">Portal Siswa</button>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION DOCK (KHUSUS SMARTPHONE) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 py-1.5 px-4 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          <button
            onClick={() => scrollToSection('hero')}
            className="flex flex-col items-center justify-center p-1 text-slate-500 hover:text-indigo-600 active:text-indigo-600 transition-colors cursor-pointer"
          >
            <Home size={17} />
            <span className="text-[9px] font-bold mt-0.5">Beranda</span>
          </button>

          <button
            onClick={() => scrollToSection('features')}
            className="flex flex-col items-center justify-center p-1 text-slate-500 hover:text-indigo-600 active:text-indigo-600 transition-colors cursor-pointer"
          >
            <Sparkles size={17} />
            <span className="text-[9px] font-bold mt-0.5">Fitur</span>
          </button>

          <button
            onClick={() => onEnterApp('admin')}
            className="flex flex-col items-center justify-center p-1 text-slate-500 hover:text-indigo-600 active:text-indigo-600 transition-colors cursor-pointer"
          >
            <UserCheck size={17} />
            <span className="text-[9px] font-bold mt-0.5">Guru</span>
          </button>

          <button
            onClick={() => onEnterApp('student')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold text-[11px] shadow-sm shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <GraduationCap size={15} />
            <span>Ujian</span>
          </button>
        </div>
      </div>

    </div>
  );
}
