import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Brain, ShieldCheck, Sparkles, LayoutDashboard, Zap, 
  Target, BookOpen, MonitorPlay, ChevronRight, ArrowRight,
  ClipboardList, CheckCircle, UploadCloud, BarChart3, Clock,
  LockKeyhole, FileCheck2
} from 'lucide-react';

const LOGO = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhkZZ6nl3Pq7mFou917u9D1yJnyd4AmsDSQI4VyCjaktVQOk6Yj0teuLBiiyBeiyyKhhbBRC5SJW9Ml6QZZ5vlH-ZlR1lrrKO6auMpiFZrs_DC-VINjninMxAh57pj7yVza53Z2qgyUKiGw8RWviLJ8_Cvl_DamdXJG_OVk_CYc8iwVa4BReULUElQxinWK/s16000/logo%20e-quest.png";

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// --- DATA ---
const features = [
  { icon: <Brain size={24} className="text-indigo-500" />, title: "AI-Powered Generator", desc: "Sistem otomatis membaca file Word/PDF dan mengekstrak soal, opsi, hingga mengklasifikasikan LOTS, MOTS, dan HOTS.", color: "from-indigo-500/10 to-blue-500/10" },
  { icon: <LockKeyhole size={24} className="text-emerald-500" />, title: "Sistem Keamanan Token", desc: "Akses ujian dijaga ketat dengan token real-time yang hanya dapat dikendalikan oleh Pengawas Ruang.", color: "from-emerald-500/10 to-teal-500/10" },
  { icon: <BarChart3 size={24} className="text-fuchsia-500" />, title: "Koreksi & Analisis Instan", desc: "Nilai ujian, analisis butir soal, dan pemetaan kemampuan kognitif siswa keluar detik itu juga saat ujian selesai.", color: "from-fuchsia-500/10 to-pink-500/10" },
  { icon: <ClipboardList size={24} className="text-amber-500" />, title: "Administrasi Cetak Nasional", desc: "Berita acara, daftar hadir, kartu login, hingga laporan nilai terformat sesuai standar operasional baku.", color: "from-amber-500/10 to-orange-500/10" },
  { icon: <Target size={24} className="text-rose-500" />, title: "Blueprint Kognitif", desc: "Atur cetak biru distribusi LOTS, MOTS, HOTS. Sistem akan merakit bank soal secara acak namun proporsional.", color: "from-rose-500/10 to-red-500/10" },
  { icon: <MonitorPlay size={24} className="text-cyan-500" />, title: "Live Proctoring", desc: "Pantau layar dashboard untuk melihat siapa yang sedang login, mengerjakan, selesai, hingga indikasi mencontek.", color: "from-cyan-500/10 to-sky-500/10" },
];

const steps = [
  { icon: <LayoutDashboard size={20} />, title: "Setup Database", desc: "Atur data sekolah, kelas, mata pelajaran, dan profil guru & siswa dalam satu panel." },
  { icon: <UploadCloud size={20} />, title: "Upload Soal", desc: "Input manual atau biarkan AI mengekstrak soal dari dokumen yang Anda unggah." },
  { icon: <Zap size={20} />, title: "Luncurkan Ujian", desc: "Buat token ujian, tentukan alokasi waktu, dan pantau jalannya asesmen secara real-time." },
  { icon: <FileCheck2 size={20} />, title: "Cetak Laporan", desc: "Unduh nilai ke Excel, verifikasi jawaban uraian, lalu cetak laporan administrasi lengkap." },
];

export default function Landing({ onEnterApp }) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  // Parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const bgY = useTransform(scrollY, [0, 1000], [0, 300]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-x-hidden selection:bg-indigo-200 selection:text-indigo-900">
      
      {/* Background Decor (Light Glassmorphism) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div style={{ y: bgY }} className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-200/40 blur-[100px]" />
        <motion.div style={{ y: bgY }} className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-fuchsia-200/40 blur-[100px]" />
        <motion.div style={{ y: bgY }} className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-cyan-200/40 blur-[120px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQ4LCAxNjMsIDE4NCwgMC4xNSkiLz48L3N2Zz4=')] opacity-50" />
      </div>

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                <img src={LOGO} alt="e-Quest Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="font-extrabold text-xl tracking-tight text-slate-800">
              e-<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-500">Quest</span>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
            <button onClick={onEnterApp} className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              Masuk
            </button>
            <button onClick={onEnterApp} className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_8px_20px_rgba(79,70,229,0.25)] hover:shadow-[0_12px_25px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
              Buka Aplikasi <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-5xl mx-auto text-center">
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white shadow-sm mb-8">
            <Sparkles size={16} className="text-fuchsia-500" />
            <span className="text-xs md:text-sm font-bold text-indigo-700 tracking-wide uppercase">The Future of Smart Assessment</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-5xl md:text-7xl font-extrabold text-slate-800 tracking-tight leading-[1.1] mb-6">
            Ujian Digital yang <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-rose-500">
              Cerdas & Elegan
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10 font-medium">
            <strong className="text-indigo-600 font-bold">Electronic Question, Evaluation & Examination System</strong><br/>
            Platform CBT terpadu untuk SD Negeri 2 Palapi. Mengintegrasikan pembuatan soal AI, pelaksanaan ujian interaktif, hingga koreksi dan administrasi otomatis.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onEnterApp} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold text-lg shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
              Mulai Sekarang <ChevronRight size={20} />
            </button>
            <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/60 backdrop-blur-md text-slate-700 border border-white font-bold text-lg shadow-sm hover:bg-white transition-all">
              Pelajari Fitur
            </button>
          </motion.div>
          
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 text-sm font-bold tracking-widest uppercase text-slate-400">
            "Mudah untuk Guru, Seru untuk Siswa, Cerdas untuk Semua"
          </motion.p>
        </motion.div>
      </section>

      {/* METRICS / STATS */}
      <section className="relative z-10 px-6 max-w-6xl mx-auto -mt-8 md:-mt-12 mb-32">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white p-8 md:p-10 shadow-2xl shadow-indigo-900/5 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-200/50">
          {[
            { label: "Format Soal", val: "6+" },
            { label: "Generasi Soal", val: "AI" },
            { label: "Penyimpanan", val: "Cloud" },
            { label: "Koreksi Nilai", val: "Instan" }
          ].map((stat, i) => (
            <div key={i} className={`text-center ${i % 2 === 0 ? '' : 'border-l border-slate-200/50 md:border-0'}`}>
              <div className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight mb-2">{stat.val}</div>
              <div className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 py-24 px-6 bg-white/40 border-y border-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-3">Keunggulan Ekosistem</h2>
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-800">Semua Fitur dalam Satu Platform</h3>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto font-medium">Bukan sekadar aplikasi ujian. e-Quest adalah asisten guru yang mengotomatisasi pekerjaan dari awal hingga akhir.</p>
          </div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeInUp} className="group bg-white/60 backdrop-blur-lg border border-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 border border-white/50 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-3">{f.title}</h4>
                <p className="text-slate-600 leading-relaxed text-sm font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* WORKFLOW / STEPS */}
      <section className="relative z-10 py-32 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-sm font-bold text-fuchsia-600 uppercase tracking-widest mb-3">Alur Kerja Cerdas</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800">Cukup 4 Langkah Praktis</h3>
        </div>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6 relative z-10">
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-xl shadow-slate-200/50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl mb-6 relative group">
                  <div className="absolute inset-0 bg-indigo-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity" />
                  {i + 1}
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* QUESTION TYPES - VISUAL SECTION */}
      <section className="relative z-10 py-24 px-6 bg-slate-900 text-white overflow-hidden rounded-t-[3rem] md:rounded-t-[5rem]">
        {/* Dark theme decors */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
            <div className="max-w-xl">
              <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-3">Tipe Soal Lengkap</h2>
              <h3 className="text-3xl md:text-5xl font-extrabold mb-6">Mendukung Kurikulum Modern</h3>
              <p className="text-slate-400 text-lg">Platform ini dilengkapi 6 format bentuk soal yang komprehensif, sesuai dengan standar Asesmen Nasional (AN) dan Kurikulum Merdeka.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              {['Pilihan Ganda', 'Pilihan Kompleks', 'Benar/Salah', 'Menjodohkan', 'Isian Singkat', 'Uraian / Essay'].map((t, i) => (
                <div key={i} className="bg-white/10 border border-white/10 backdrop-blur-md px-5 py-4 rounded-2xl flex items-center gap-3 hover:bg-white/20 transition-colors">
                  <CheckCircle className="text-indigo-400" size={18} />
                  <span className="font-bold text-sm">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative z-10 py-32 px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-rose-500 rounded-[2.5rem] p-10 md:p-16 text-center text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden">
          {/* Decorative lines */}
          <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik0wIDYwaDYwTTAgMzBoNjBNMCAwaDYwTTAgMGgwTTYwIDB2NjBNMzAgMHY2ME0wIDB2NjAiLz48L2c+PC9zdmc+')] mix-blend-overlay" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Siap Melangkah ke Era CBT Pintar?</h2>
            <p className="text-lg md:text-xl text-indigo-100 font-medium mb-10 max-w-2xl mx-auto">
              Tinggalkan cara manual. Hemat waktu guru, berikan pengalaman modern bagi siswa SD Negeri 2 Palapi.
            </p>
            <button onClick={onEnterApp} className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 mx-auto uppercase tracking-wide">
              Masuk ke Aplikasi e-Quest <ArrowRight size={22} />
            </button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-white border-t border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="e-Quest Logo" className="w-8 h-8 object-contain" />
            <div className="font-bold text-slate-800 text-lg">
              e-Quest <span className="text-slate-400 font-semibold text-sm ml-2">CBT System</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500 text-center md:text-left">
            &copy; {new Date().getFullYear()} SD Negeri 2 Palapi. Dikembangkan oleh Mas Alfy.
          </p>
          <div className="flex gap-4">
            <button onClick={onEnterApp} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Admin Panel</button>
            <button onClick={onEnterApp} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Portal Siswa</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
