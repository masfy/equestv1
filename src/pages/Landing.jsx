import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Brain, ShieldCheck, Sparkles, LayoutDashboard, Zap,
  Target, BookOpen, MonitorPlay, ChevronRight, ArrowRight,
  ClipboardList, CheckCircle, UploadCloud, BarChart3, Clock,
  LockKeyhole, FileCheck2, Table, Image as ImageIcon,
  Check, GraduationCap, UserCheck, Smartphone, Laptop
} from 'lucide-react';
import PwaInstallPrompt from '../components/PwaInstallPrompt';

const LOGO = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhkZZ6nl3Pq7mFou917u9D1yJnyd4AmsDSQI4VyCjaktVQOk6Yj0teuLBiiyBeiyyKhhbBRC5SJW9Ml6QZZ5vlH-ZlR1lrrKO6auMpiFZrs_DC-VINjninMxAh57pj7yVza53Z2qgyUKiGw8RWviLJ8_Cvl_DamdXJG_OVk_CYc8iwVa4BReULUElQxinWK/s16000/logo%20e-quest.png";

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

// --- DATA FEATURES (SESUAI STANDAR TKA) ---
const features = [
  {
    icon: <Brain size={22} className="text-indigo-600" />,
    badge: "AI Powered",
    title: "AI Generator & Klasifikasi TKA",
    desc: "Ekstrak otomatis naskah soal dari dokumen Word/PDF dan klasifikasikan level kognitif LOTS (C1-C2), MOTS (C3), hingga HOTS (C4-C6) secara cerdas.",
    color: "from-indigo-500/10 via-blue-500/10 to-transparent",
    border: "border-indigo-100"
  },
  {
    icon: <BookOpen size={22} className="text-amber-600" />,
    badge: "TKA Ready",
    title: "Bank Soal Berbasis Stimulus",
    desc: "Tautkan wacana teks literasi, tabel data hasil pengamatan, atau infografis ke satu atau beberapa butir soal sekaligus sesuai kaidah TKA modern.",
    color: "from-amber-500/10 via-yellow-500/10 to-transparent",
    border: "border-amber-100"
  },
  {
    icon: <LockKeyhole size={22} className="text-emerald-600" />,
    badge: "Security",
    title: "Token Dinamis & Anti-Contek",
    desc: "Akses ujian dijaga ketat dengan token ruang yang dapat dirilis guru. Sistem mendeteksi otomatis saat siswa mencoba berpindah tab atau aplikasi.",
    color: "from-emerald-500/10 via-teal-500/10 to-transparent",
    border: "border-emerald-100"
  },
  {
    icon: <BarChart3 size={22} className="text-fuchsia-600" />,
    badge: "Real-Time",
    title: "Koreksi & Analisis Nilai Instan",
    desc: "Penilaian otomatis untuk pilihan ganda, menjodohkan, dan isian singkat. Nilai, analisis butir soal, dan pemetaan kompetensi siswa langsung tersaji.",
    color: "from-fuchsia-500/10 via-purple-500/10 to-transparent",
    border: "border-fuchsia-100"
  },
  {
    icon: <Target size={22} className="text-rose-600" />,
    badge: "Blueprint",
    title: "Blueprint Distribusi Kognitif",
    desc: "Rancang cetak biru persentase tingkat kesulitan LOTS, MOTS, dan HOTS. Sistem merakit paket soal secara proporsional dan acak terkendali.",
    color: "from-rose-500/10 via-pink-500/10 to-transparent",
    border: "border-rose-100"
  },
  {
    icon: <ClipboardList size={22} className="text-cyan-600" />,
    badge: "Administrasi",
    title: "Administrasi Ujian & Kisi-kisi",
    desc: "Cetak berita acara, daftar hadir, kartu login siswa, kisi-kisi penulisan soal TKA standar, dan ekspor rekap nilai ke format Excel dengan satu klik.",
    color: "from-cyan-500/10 via-sky-500/10 to-transparent",
    border: "border-cyan-100"
  },
];

const steps = [
  {
    icon: <LayoutDashboard size={20} />,
    step: "01",
    title: "Setup Data & Kelas",
    desc: "Kelola tahun pelajaran, semester aktif, rombel kelas, serta akun Guru Kelas dan Guru Mapel."
  },
  {
    icon: <UploadCloud size={20} />,
    step: "02",
    title: "Susun Stimulus & Soal",
    desc: "Buat wacana teks, tabel data, atau gambar, lalu input soal manual atau unggah dokumen melalui AI."
  },
  {
    icon: <Zap size={20} />,
    step: "03",
    title: "Rilis Token & Ujian",
    desc: "Buka sesi ujian per mata pelajaran dan pantau status siswa mengerjakan secara langsung di layar proctoring."
  },
  {
    icon: <FileCheck2 size={20} />,
    step: "04",
    title: "Analisis & Cetak Laporan",
    desc: "Periksa nilai yang terkoreksi otomatis, lakukan verifikasi esai, dan unduh laporan hasil asesmen lengkap."
  },
];

const questionFormats = [
  { id: 1, name: "Pilihan Ganda", desc: "1 jawaban benar dari 4-5 opsi pilihan", tag: "Standar" },
  { id: 2, name: "Pilihan Ganda Kompleks", desc: "Multi-jawaban benar untuk menguji ketelitian", tag: "TKA Inti" },
  { id: 3, name: "Benar / Salah", desc: "Validasi kebenaran pernyataan berdasarkan stimulus", tag: "Analitis" },
  { id: 4, name: "Menjodohkan", desc: "Memasangkan premis kiri dengan pasangan tepat", tag: "Interaktif" },
  { id: 5, name: "Isian Singkat", desc: "Koreksi otomatis cerdas case-insensitive", tag: "Otomatis" },
  { id: 6, name: "Uraian / Esai", desc: "Penilaian komprehensif dengan rubrik skor guru", tag: "Kognitif" }
];

export default function Landing({ onEnterApp }) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  // Parallax subtle effects (desktop only)
  const heroY = useTransform(scrollY, [0, 400], [0, 80]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.2]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-x-hidden selection:bg-indigo-200 selection:text-indigo-900">

      {/* BACKGROUND DECOR */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[15%] -left-[10%] w-[55%] h-[55%] rounded-full bg-gradient-to-br from-indigo-200/50 via-purple-200/30 to-transparent blur-[90px]" />
        <div className="absolute top-[25%] -right-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-br from-fuchsia-200/40 via-pink-200/30 to-transparent blur-[90px]" />
        <div className="absolute -bottom-[15%] left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-cyan-200/40 via-blue-200/20 to-transparent blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-xs py-2.5 sm:py-3' : 'bg-transparent py-3.5 sm:py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 flex justify-between items-center">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-white p-1.5 rounded-xl shadow-xs border border-slate-200/80 flex items-center justify-center">
              <img src={LOGO} alt="e-Quest Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <div className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-800 leading-none">
                e-<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600">Quest</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">TKA CBT System</span>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PwaInstallPrompt variant="button" />

            <button
              onClick={() => onEnterApp('admin')}
              className="text-xs sm:text-sm font-bold text-slate-600 hover:text-indigo-600 px-2.5 sm:px-3.5 py-2 rounded-xl transition-colors hidden sm:flex items-center gap-1.5"
            >
              <UserCheck size={16} className="text-indigo-600" />
              Masuk Guru / Admin
            </button>

            <button
              onClick={() => onEnterApp('student')}
              className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95"
            >
              <span>Portal Siswa</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-28 pb-16 sm:pt-36 sm:pb-24 md:pt-44 md:pb-28 px-4 sm:px-6">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-4xl mx-auto text-center">

          {/* Badge Modern TKA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-md border border-indigo-200/80 shadow-xs mb-6 sm:mb-8"
          >
            <Sparkles size={14} className="text-fuchsia-600 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-indigo-800 tracking-wide">
              Generasi Baru CBT & Tes Kemampuan Akademik (TKA)
            </span>
          </motion.div>

          {/* Heading Responsif */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.2] mb-5 sm:mb-6"
          >
            Ujian Digital & Simulasi TKA <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600">
              Cerdas, Akurat & Terpadu
            </span>
          </motion.h1>

          {/* Subtitle Ringkas & Padat */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-medium px-2"
          >
            Platform Computer-Based Test (CBT) resmi <strong className="text-slate-800 font-bold">SD Negeri 2 Palapi</strong>. Mengintegrasikan pembuatan soal berbasis AI, stimulus wacana & tabel data, koreksi otomatis instan, serta administrasi ujian lengkap.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto px-4"
          >
            <button
              onClick={() => onEnterApp('student')}
              className="w-full sm:w-auto px-7 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
            >
              <GraduationCap size={20} className="text-indigo-400" />
              <span>Portal Siswa (Mulai Ujian)</span>
              <ChevronRight size={18} />
            </button>

            <button
              onClick={() => onEnterApp('admin')}
              className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-4 rounded-2xl bg-white/80 hover:bg-white backdrop-blur-md text-slate-700 border border-slate-200 hover:border-indigo-300 font-bold text-sm sm:text-base shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <UserCheck size={18} className="text-indigo-600" />
              <span>Masuk Guru / Edukator</span>
            </button>
          </motion.div>

          {/* Feature Trust Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs font-semibold text-slate-500"
          >
            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500 font-bold" /> Standar Soal TKA Modern</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500 font-bold" /> PWA HP Android, iOS & Laptop</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500 font-bold" /> Koreksi Real-Time</span>
          </motion.div>

        </motion.div>
      </section>

      {/* METRICS & QUICK STATS */}
      <section className="relative z-10 px-4 sm:px-6 max-w-5xl mx-auto -mt-4 sm:-mt-6 mb-20 sm:mb-28">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Bentuk Soal TKA", val: "6+", sub: "PG, Kompleks, B/S, Jodohkan, Isian, Esai" },
            { label: "Penyusunan Soal", val: "AI", sub: "Ekstrak Cerdas & Deteksi Kognitif" },
            { label: "Format Stimulus", val: "Multi", sub: "Wacana, Tabel Data & Infografis" },
            { label: "Koreksi Nilai", val: "Instan", sub: "Hasil Detik Itu Juga & Rekap Excel" }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all text-center flex flex-col justify-between"
            >
              <div className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight mb-1">
                {item.val}
              </div>
              <div className="text-xs sm:text-sm font-bold text-indigo-700 mb-1">
                {item.label}
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-tight">
                {item.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HIGHLIGHT: FITUR STIMULUS SOAL & TKA READY */}
      <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto mb-16">
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-4">
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
                  Cerita fiksi, wacana sains, artikel ilmiah, atau berita kasus untuk uji pemahaman membaca dan penalaran kritis.
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
                  Bagan daur hidup, siklus alam, diagram alir, maupun peta tematik dengan penyesuaian resolusi layar otomatis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 bg-white/50 border-y border-slate-200/80 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Keunggulan Ekosistem</h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">Solusi Asesmen Lengkap Tanpa Ribet</h3>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto text-xs sm:text-sm font-medium">Dirancang dari masukan nyata para pendidik untuk menyederhanakan pelaksanaan ujian sekolah dan persiapan TKA.</p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs">
                      {f.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {f.badge}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-2">{f.title}</h4>
                  <p className="text-slate-600 leading-relaxed text-xs sm:text-sm font-normal">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 6 FORMAT SOAL SESUAI TKA */}
      <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-2 block">Keseragaman Format Soal</span>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">6 Tipe Format Soal Sesuai Standar TKA</h3>
          <p className="mt-2 text-slate-500 text-xs sm:text-sm max-w-xl mx-auto font-medium">
            Tidak terbatas pada pilihan ganda biasa. e-Quest CBTku menyediakan 6 format soal komprehensif yang dirancang untuk menguji kompetensi siswa secara utuh.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {questionFormats.map((qf) => (
            <div
              key={qf.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    Format #{qf.id}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {qf.tag}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base mb-1">{qf.name}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{qf.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4 LANGKAH PRAKTIS (WORKFLOW) */}
      <section className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 bg-slate-900 text-white rounded-3xl max-w-6xl mx-auto mb-20 overflow-hidden">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 block">Alur Kerja Efisien</span>
          <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Cukup 4 Langkah Mudah</h3>
          <p className="mt-2 text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
            Dari persiapan data hingga pencetakan rapor asesmen, semua langkah tertata sistematis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 relative z-10">
          {steps.map((st, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-black text-sm">
                    {st.step}
                  </div>
                  <div className="text-slate-400">{st.icon}</div>
                </div>
                <h4 className="font-bold text-base text-white mb-1.5">{st.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 rounded-3xl p-8 sm:p-14 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Siap Melangkah ke Era CBT & TKA Modern?
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-indigo-100 max-w-xl mx-auto mb-8 font-normal">
              Kemudahan bagi bapak/ibu guru dalam menyusun soal, kenyamanan bagi siswa SD Negeri 2 Palapi dalam mengerjakan ujian di semua perangkat.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onEnterApp('student')}
                className="w-full sm:w-auto bg-white text-indigo-700 hover:bg-slate-50 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Buka Portal Siswa</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => onEnterApp('admin')}
                className="w-full sm:w-auto bg-black/20 hover:bg-black/30 text-white border border-white/20 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Masuk Panel Edukator</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-white border-t border-slate-200 py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <img src={LOGO} alt="e-Quest Logo" className="w-7 h-7 object-contain" />
            <div className="font-bold text-slate-800 text-sm">
              e-Quest CBTku <span className="text-slate-400 font-normal text-xs ml-1">• SD Negeri 2 Palapi</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} SD Negeri 2 Palapi. Dikembangkan oleh Mas Alfy.
          </p>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
            <button onClick={() => onEnterApp('admin')} className="hover:text-indigo-600 transition-colors">Admin Panel</button>
            <span>•</span>
            <button onClick={() => onEnterApp('student')} className="hover:text-indigo-600 transition-colors">Portal Siswa</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
