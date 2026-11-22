import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from './firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, updateDoc } from 'firebase/firestore';
import { aiService } from './services/aiService';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import {
    Clock, User, Key, ChevronLeft, ChevronRight, CheckCircle, LogOut,
    LayoutDashboard, Lock, Eye, EyeOff, BadgeCheck, CheckSquare,
    Image as ImageIcon, Users, BookOpen, BarChart2, Settings, Plus,
    Trash2, Edit, Printer, Download, RefreshCw, Menu, X, Save, FileText,
    ArrowLeft, FolderOpen, GraduationCap, UserCog, School, ClipboardList,
    Info, Layers, Grid, Sparkles, Loader2, Upload, AlertTriangle, Power,
    Bell, Check, AlertCircle, Filter, Search, MonitorPlay, Calendar,
    FileSpreadsheet, BrainCircuit, Play, ChevronDown, ChevronUp, FileUp,
    FileBox, FileText as FileWord, Wand2, ImagePlus, FileCheck, Table
} from 'lucide-react';

// --- INITIAL DATA & MOCKUP DATABASE ---

const EQUEST_LOGO = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhkZZ6nl3Pq7mFou917u9D1yJnyd4AmsDSQI4VyCjaktVQOk6Yj0teuLBiiyBeiyyKhhbBRC5SJW9Ml6QZZ5vlH-ZlR1lrrKO6auMpiFZrs_DC-VINjninMxAh57pj7yVza53Z2qgyUKiGw8RWviLJ8_Cvl_DamdXJG_OVk_CYc8iwVa4BReULUElQxinWK/s16000/logo%20e-quest.png";

const INITIAL_SCHOOL_DATA = {
    name: "SD Negeri 2 Palapi",
    address: "Jl. Pendidikan Cerdas No. 1, Jakarta Selatan",
    semester: "Ganjil",
    academicYear: "2025/2026",
    term: "Ganjil 2025/2026",
    dinasPendidikan: "Dinas Pendidikan Pemuda dan Olahraga",
    kabupaten: "Kabupaten Muna",
    kepsekName: "Samsuddin, S.Pd., M.Pd.",
    kepsekNip: "19800101 200501 1 002",
    adminName: "Administrator Pusat",
    adminEmail: "alfyarnaim@gmail.com",
    adminUsername: "admin",
    adminPassword: "masfy",
    logo: EQUEST_LOGO,
    schoolLogo: "",
    apiKey: "",
    aiModel: "gemini-1.5-flash",
    availableAiModels: [],
    optionCount: 5
};

const INITIAL_TEACHERS = [
    {
        id: 101,
        name: "Budi Santoso, S.Pd",
        username: "guru1",
        password: "123",
        teacherType: "guru_mapel",
        subjectName: "Matematika",
        assignedClasses: ["Kelas 6A", "Kelas 6B"]
    },
    {
        id: 102,
        name: "Siti Aminah, M.Pd",
        username: "guru2",
        password: "123",
        teacherType: "guru_kelas",
        assignedClass: "Kelas 6A",
        assignedClasses: ["Kelas 6A"],
        subjectName: ""
    }
];

const INITIAL_CLASSES = [
    { id: 1, name: "Kelas 6A", level: "6", academicYear: "2025/2026" },
    { id: 2, name: "Kelas 6B", level: "6", academicYear: "2025/2026" },
    { id: 3, name: "Kelas 5A", level: "5", academicYear: "2025/2026" },
    { id: 4, name: "Kelas 5A (Arsip)", level: "5", academicYear: "2024/2025" },
];

const INITIAL_SUBJECTS = [
    { id: 1, name: "Matematika", code: "MTK-6A", class: "Kelas 6A", academicYear: "2025/2026", teacherId: 101 },
    { id: 2, name: "Ilmu Pengetahuan Alam", code: "IPA-6A", class: "Kelas 6A", academicYear: "2025/2026", teacherId: 102 },
    { id: 3, name: "Pendidikan Jasmani", code: "PJOK-5A", class: "Kelas 5A", academicYear: "2025/2026", teacherId: 101 },
    { id: 4, name: "Matematika", code: "MTK-6B", class: "Kelas 6B", academicYear: "2025/2026", teacherId: 101 },
    { id: 5, name: "Matematika", code: "MTK-5A-24", class: "Kelas 5A (Arsip)", academicYear: "2024/2025", teacherId: 101 },
];

const INITIAL_STUDENTS = [
    { id: 1, nis: '12345', name: 'Ahmad Dahlan', class: 'Kelas 6A', password: '123' },
    { id: 2, nis: '12346', name: 'Citra Kirana', class: 'Kelas 6A', password: '123' },
    { id: 3, nis: '12347', name: 'Raden Ajeng', class: 'Kelas 6B', password: '123' },
];

const INITIAL_STIMULI = [
    {
        id: 1,
        title: "Wacana: Hutan Mangrove Pelindung Pesisir",
        type: "text",
        content: "Hutan mangrove atau hutan bakau merupakan ekosistem khas di daerah muara sungai dan pantai berlumpur. Sistem perakaran bakau yang kokoh terbukti mampu meredam energi gelombang ombak hingga 66%, mencegah abrasi tanah pantai, dan menjadi tempat pemijahan (nursery ground) bagi berbagai jenis udang dan ikan karang muda.",
        imageUrl: "",
        tableData: [],
        source: "Modul Literasi Sains SD",
        subjectId: 1,
        createdAt: "2026-11-20T08:00:00Z"
    },
    {
        id: 2,
        title: "Tabel Data: Percobaan Kecepatan Tumbuh Kecambah",
        type: "table",
        content: "Sekelompok siswa kelas 6 melakukan uji coba perkecambahan biji kacang hijau selama 5 hari dengan variasi intensitas cahaya matahari. Berikut adalah tabel catatan pengamatan tinggi batang (cm):",
        imageUrl: "",
        tableData: [
            ["Hari Ke-", "Kondisi Terang (cm)", "Kondisi Redup (cm)", "Kondisi Gelap (cm)"],
            ["Hari 1", "0.4", "0.6", "0.9"],
            ["Hari 2", "1.1", "1.8", "2.5"],
            ["Hari 3", "2.3", "3.6", "5.1"],
            ["Hari 4", "3.7", "5.4", "7.8"],
            ["Hari 5", "5.2", "7.1", "10.4"]
        ],
        source: "Buku Praktikum Sains Tematik",
        subjectId: 1,
        createdAt: "2026-11-20T08:30:00Z"
    },
    {
        id: 3,
        title: "Infografis: Siklus Metamorfosis Kupu-Kupu",
        type: "image",
        content: "Perhatikan bagan daur hidup metamorfosis sempurna berikut untuk menjawab soal nomor di bawah ini:",
        imageUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&q=80&w=700",
        tableData: [],
        source: "Ensiklopedia Biologi Nusantara",
        subjectId: 1,
        createdAt: "2026-11-20T09:00:00Z"
    }
];

const INITIAL_QUESTIONS = [
    {
        id: 1, subjectId: 1, type: 'single',
        text: "Berdasarkan tabel data percobaan perkecambahan di atas, pada kondisi manakah batang kecambah tumbuh paling tinggi pada hari ke-5?",
        options: ["Kondisi Terang", "Kondisi Redup", "Kondisi Gelap", "Semua kondisi sama", "Kondisi Redup dan Terang"],
        correct: "2", difficulty: "MOTS", weight: 20, indicator: "Siswa dapat menganalisis data tabel perkecambahan",
        stimulusId: 2,
        semester: "Ganjil", academicYear: "2025/2026"
    },
    {
        id: 2, subjectId: 1, type: 'multiple',
        text: "Pilihlah bangun datar yang memiliki 4 sisi sama panjang.",
        options: ["Persegi", "Persegi Panjang", "Belah Ketupat", "Layang-layang", "Trapesium"],
        correct: "0,2", difficulty: "MOTS", weight: 30, indicator: "Siswa dapat mengidentifikasi ciri bangun datar",
        semester: "Ganjil", academicYear: "2025/2026"
    },
    {
        id: 3, subjectId: 1, type: 'boolean',
        text: "Semua bilangan genap dapat dibagi 2 tanpa sisa.",
        options: ["Benar", "Salah"],
        correct: "0", difficulty: "LOTS", weight: 10, indicator: "Siswa memahami sifat bilangan genap",
        semester: "Ganjil", academicYear: "2025/2026"
    }
];

const INITIAL_RESULTS = [];

const QUOTES = [
    "Pendidikan adalah senjata paling mematikan di dunia. - Nelson Mandela",
    "Belajarlah seolah engkau hidup selamanya. - Mahatma Gandhi",
    "Tujuan pendidikan itu untuk mempertajam kecerdasan. - Tan Malaka",
    "Ing ngarsa sung tulada, ing madya mangun karsa, tut wuri handayani."
];

// --- UTILITY COMPONENTS & SHEETJS LOADER ---

const loadSheetJS = () => {
    return new Promise((resolve, reject) => {
        if (window.XLSX) return resolve(window.XLSX);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => resolve(window.XLSX);
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);

    const bgClass = type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800';

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg mb-3 animate-slide-in-right ${bgClass} min-w-[300px] z-[9999]`}>
            {type === 'success' ? <CheckCircle size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-rose-500" />}
            <span className="font-semibold text-sm flex-1">{String(message)}</span>
            <button onClick={onClose} className="ml-auto opacity-50 hover:opacity-100 transition-opacity"><X size={16} /></button>
        </div>
    );
};

const TiltLogo = ({ logoUrl }) => {
    const cardRef = useRef(null);
    const [rotate, setRotate] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        setRotate({ x: ((y - centerY) / centerY) * -15, y: ((x - centerX) / centerX) * 15 });
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setRotate({ x: 0, y: 0 })}
            style={{ transform: `perspective(500px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`, transition: 'transform 0.1s ease-out' }}
            className="w-28 h-28 md:w-32 md:h-32 bg-white/10 backdrop-blur-md p-4 rounded-2xl shadow-xl mb-6 flex items-center justify-center cursor-pointer hover:shadow-indigo-500/20 transition-all border border-white/20 z-20"
        >
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
        </div>
    );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[9999] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-100">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm mb-6">{message}</p>
                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm">Batal</button>
                    <button type="button" onClick={onConfirm} className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200 transition-all text-sm">Lanjutkan</button>
                </div>
            </div>
        </div>
    );
};

const ImportModal = ({ isOpen, onClose, type, onImport, showToast, apiKey, aiModel }) => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [useAI, setUseAI] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [summaryMessage, setSummaryMessage] = useState("");

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            showToast(`File ${e.target.files[0].name} dipilih.`, "success");
        }
    };

    const downloadTemplate = async () => {
        try {
            const XLSX = await loadSheetJS();
            let data = [];
            if (type === 'Bank Soal') {
                data = [
                    ["Tipe Soal", "Level Kognitif", "Bobot", "Indikator", "Teks Soal", "Opsi A", "Opsi B", "Opsi C", "Opsi D", "Opsi E", "Kunci Jawaban"],
                    ["single", "LOTS", 10, "Menghitung dasar", "Berapakah 1+1?", "1", "2", "3", "4", "5", "1"],
                    ["multiple", "MOTS", 20, "Ciri makhluk hidup", "Pilih ciri makhluk hidup:", "Bernapas", "Mati", "Tumbuh", "Diam", "Makan", "0,2,4"],
                    ["boolean", "LOTS", 10, "Fakta tata surya", "Matahari mengelilingi bumi.", "", "", "", "", "", "1"],
                    ["matching", "MOTS", 20, "Ibukota negara", "Jodohkan negara berikut!", "", "", "", "", "", "Indonesia | Jakarta\nJepang | Tokyo"],
                    ["short", "LOTS", 15, "Pengetahuan Umum", "Ibukota Indonesia adalah...", "", "", "", "", "", "Jakarta"],
                    ["essay", "HOTS", 30, "Proses alam", "Jelaskan proses hujan!", "", "", "", "", "", "Air menguap menjadi awan dan turun hujan."]
                ];
            } else if (type === 'Data Murid') {
                data = [
                    ["Nama Lengkap", "Kelas", "NIS", "Password"],
                    ["Budi Santoso", "Kelas 6A", "1001", "123"],
                    ["Siti Aminah", "Kelas 6A", "1002", "123"]
                ];
            } else if (type === 'Data Kelas') {
                data = [
                    ["Nama Kelas", "Tingkat"],
                    ["Kelas 6A", "6"],
                    ["Kelas 7A", "7"]
                ];
            }

            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Template");
            XLSX.writeFile(wb, `Template_${type.replace(/\s+/g, '_')}.xlsx`);
            showToast("Template .xlsx berhasil diunduh!", "success");
        } catch (e) {
            showToast("Gagal memuat modul Excel. Pastikan koneksi internet aktif.", "error");
        }
    };

    const handleMockImport = async () => {
        if (!selectedFile) return showToast("Pilih file terlebih dahulu!", "error");

        if (useAI && (!apiKey || apiKey.trim() === '')) {
            return showToast("API Key belum disetting! Buka Pengaturan Sistem untuk mengintegrasikan AI.", "error");
        }

        setLoading(true);
        setProgress(0);
        setStatusText(useAI ? "Menghubungkan ke Engine AI..." : "Mempersiapkan file...");

        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += Math.floor(Math.random() * 15) + 5;
            if (currentProgress > 90) currentProgress = 90;
            setProgress(currentProgress);

            if (currentProgress > 20 && currentProgress <= 50) {
                setStatusText(useAI ? "AI Menganalisis Teks Dokumen..." : "Membaca data baris per baris...");
            } else if (currentProgress > 50 && currentProgress <= 80) {
                setStatusText(useAI ? "Memisahkan Soal & Kunci Jawaban..." : "Memvalidasi format data...");
            } else if (currentProgress > 80) {
                setStatusText(useAI ? "Membangun struktur data..." : "Menyimpan ke database...");
            }
        }, 500);

        const finishImport = (parsedRows = null, resultCount = 0) => {
            clearInterval(interval);
            setProgress(100);
            setStatusText("Selesai!");

            setTimeout(() => {
                setLoading(false);
                setIsSuccess(true);
                setSummaryMessage(`Berhasil memproses ${resultCount || 'beberapa'} data dari file ${selectedFile.name}`);
                onImport(type, useAI, selectedFile.name, parsedRows);
            }, 800);
        };

        if ((selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) && !useAI) {
            try {
                const XLSX = await loadSheetJS();
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    const validCount = json.filter(row => row && row.length > 0).length - 1;
                    finishImport(json, validCount > 0 ? validCount : 0);
                };
                reader.readAsArrayBuffer(selectedFile);
            } catch (e) {
                clearInterval(interval);
                setLoading(false);
                showToast("Gagal membaca file Excel. Pastikan file tidak rusak.", "error");
            }
        } else {
            // For AI, we pass the file to be processed by processImport
            setTimeout(() => {
                onImport(type, useAI, selectedFile.name, null, selectedFile);
                clearInterval(interval);
                setProgress(100);
                setStatusText("Selesai!");
                setTimeout(() => {
                    setLoading(false);
                    setIsSuccess(true);
                    setSummaryMessage(`File ${selectedFile.name} berhasil dikirim ke Engine AI!`);
                }, 800);
            }, 1000); // We don't finishImport here, we just pass to onImport
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-fade-in backdrop-blur-md">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center border border-slate-100 transform transition-all scale-100">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CheckSquare size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Import Selesai!</h3>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">{summaryMessage}</p>
                    <button
                        onClick={() => {
                            setIsSuccess(false);
                            setSelectedFile(null);
                            onClose();
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all hover:-translate-y-1"
                    >
                        Tutup Jendela
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-fade-in backdrop-blur-md">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 border border-slate-100">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Upload size={22} className="text-indigo-500" /> Import {type}</h3>
                    <button onClick={onClose} disabled={loading} className="text-slate-400 hover:bg-rose-50 hover:text-rose-500 p-2 rounded-xl transition-colors disabled:opacity-50"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-indigo-50/80 p-5 rounded-2xl border border-indigo-100/50">
                        <div>
                            <p className="font-bold text-indigo-900 text-sm">Unduh Format Template</p>
                            <p className="text-[11px] text-indigo-600/80 mt-1 font-medium">Buka & edit langsung di Excel.</p>
                        </div>
                        <button type="button" onClick={downloadTemplate} disabled={loading} className="bg-white text-indigo-600 border border-indigo-100 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50 hover:-translate-y-0.5"><Download size={16} /> Template.xlsx</button>
                    </div>

                    <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all relative group ${selectedFile ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300'} ${loading ? 'opacity-70 pointer-events-none' : 'cursor-pointer'}`}>
                        <input type="file" onChange={handleFileChange} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" accept=".xlsx,.xls,.doc,.docx,.pdf" />
                        {selectedFile ? (
                            <div className="animate-fade-in">
                                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-emerald-500"><FileCheck size={28} /></div>
                                <p className="font-bold text-emerald-700 text-sm truncate px-4">{selectedFile.name}</p>
                                <p className="text-xs text-emerald-600/70 mt-1.5 font-medium">Siap diproses</p>
                            </div>
                        ) : (
                            <div>
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform text-indigo-500"><FileUp size={28} /></div>
                                <p className="font-bold text-slate-700 text-sm">Drag & Drop file Anda</p>
                                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Mendukung .xlsx, atau PDF/Word (via AI)</p>
                            </div>
                        )}
                    </div>

                    {type === 'Bank Soal' && (
                        <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 p-5 rounded-2xl border border-purple-100 flex items-start gap-4 shadow-sm">
                            <input type="checkbox" id="useAI" checked={useAI} onChange={() => setUseAI(!useAI)} disabled={loading} className="mt-1 w-5 h-5 accent-purple-600 rounded cursor-pointer disabled:opacity-50" />
                            <div>
                                <label htmlFor="useAI" className={`font-bold text-purple-900 text-sm flex items-center gap-1.5 ${loading ? '' : 'cursor-pointer'}`}><BrainCircuit size={16} /> AI Document Parser</label>
                                <p className="text-xs text-purple-700/80 mt-1.5 leading-relaxed font-medium">Pilih ini jika mengunggah file Word/PDF. AI akan mengekstrak narasi soal & opsi secara otomatis.</p>
                                {useAI && <span className="text-[10px] text-purple-700 bg-white/80 border border-purple-200 px-2 py-0.5 rounded-md font-mono font-bold mt-2 inline-block">Engine: {aiModel || "gemini-1.5-flash"}</span>}
                                {!apiKey && useAI && <p className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1"><AlertCircle size={12} /> Mohon isi API Key di Pengaturan Sistem terlebih dahulu.</p>}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="animate-fade-in bg-slate-50 p-5 rounded-2xl border border-slate-200">
                            <div className="flex justify-between text-xs font-bold text-indigo-600 mb-3">
                                <span className="animate-pulse">{statusText}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    ) : (
                        <button onClick={handleMockImport} disabled={!selectedFile} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-2 hover:-translate-y-1">
                            Mulai Import Data
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const PrintLayout = ({ type, data, schoolData, onBack }) => {
    const formatDate = (ds) => ds ? new Date(ds).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-";
    const getDayName = (ds) => ds ? new Date(ds).toLocaleDateString('id-ID', { weekday: 'long' }) : "-";

    return (
        <div className="min-h-screen bg-white text-black p-8 font-serif max-w-5xl mx-auto print:p-0 print:max-w-full z-[1000] relative">
            <div className="mb-8 flex justify-between items-center print:hidden bg-slate-50 p-4 rounded-xl border border-slate-200">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm"><ArrowLeft size={16} /> Kembali</button>
                <button onClick={() => window.print()} className="bg-indigo-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm hover:bg-indigo-700 shadow-sm"><Printer size={16} /> Cetak Dokumen</button>
            </div>

            <div className="border-b-[3px] border-black pb-4 mb-6 flex items-center gap-6">
                <img src={schoolData.logo} alt="Logo" className="w-20 h-20 object-contain" />
                <div className="text-center flex-1">
                    <h1 className="text-xl font-bold uppercase tracking-wider mb-1">{schoolData.dinasPendidikan || "PEMERINTAH DAERAH SETEMPAT"}</h1>
                    <h2 className="text-2xl font-bold uppercase mb-1">{schoolData.name}</h2>
                    <p className="text-sm">{schoolData.address} {schoolData.kabupaten ? `- ${schoolData.kabupaten}` : ''}</p>
                </div>
            </div>

            {type === 'kartu_login' && (
                <div className="grid grid-cols-2 gap-6 print:grid-cols-2">
                    {data.students.map(s => (
                        <div key={s.id} className="border-2 border-black rounded-lg p-4 relative">
                            <div className="text-center border-b-2 border-black pb-2 mb-3">
                                <h3 className="font-bold uppercase text-sm">{schoolData.name}</h3>
                                <p className="text-xs font-bold bg-black text-white py-1 mt-1 uppercase">{data.printForm?.activityName || 'KARTU LOGIN UJIAN'}</p>
                            </div>
                            <table className="w-full text-xs font-bold">
                                <tbody>
                                    <tr><td className="py-1 w-24">Nama Peserta</td><td>: {s.name}</td></tr>
                                    <tr><td className="py-1">Kelas</td><td>: {s.class}</td></tr>
                                    <tr><td className="py-1">Username (NIS)</td><td>: <span className="font-black text-sm">{s.nis}</span></td></tr>
                                    <tr><td className="py-1">Password</td><td>: <span className="font-black text-sm">{s.password}</span></td></tr>
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}

            {type === 'kisi-kisi' && (
                <div>
                    <h3 className="text-center text-lg font-bold underline mb-6 uppercase">KISI-KISI & BLUEPRINT SOAL TES KEMAMPUAN AKADEMIK (TKA)</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-medium">
                        <div><p><span className="inline-block w-32">Mata Pelajaran</span>: {data.subjectName}</p><p><span className="inline-block w-32">Kelas</span>: {data.class}</p></div>
                        <div><p><span className="inline-block w-32">Guru Pengampu</span>: {data.teacherName}</p><p><span className="inline-block w-32">Tahun Ajaran</span>: {schoolData.term}</p></div>
                    </div>
                    <table className="w-full border-collapse border border-black text-sm text-left">
                        <thead><tr className="bg-slate-100"><th className="border border-black p-2 text-center w-10">No</th><th className="border border-black p-2">Indikator Soal</th><th className="border border-black p-2 text-center w-24">Level Kognitif</th><th className="border border-black p-2 text-center w-24">Bentuk Soal</th><th className="border border-black p-2 text-center w-16">Bobot</th><th className="border border-black p-2 text-center w-16">Kunci</th></tr></thead>
                        <tbody>
                            {data.questions.map((q, i) => (
                                <tr key={q.id}>
                                    <td className="border border-black p-2 text-center">{i + 1}</td>
                                    <td className="border border-black p-2">{q.indicator || "-"}</td>
                                    <td className="border border-black p-2 text-center font-bold">{q.difficulty || "MOTS"}</td>
                                    <td className="border border-black p-2 text-center uppercase">{q.type}</td>
                                    <td className="border border-black p-2 text-center">{q.weight || 10}</td>
                                    <td className="border border-black p-2 text-center font-bold text-indigo-600">{q.type === 'single' && !isNaN(q.correct) ? String.fromCharCode(65 + Number(q.correct)) : "Simulasi"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {type === 'attendance' && (
                <div>
                    <h3 className="text-center text-lg font-bold underline mb-6 uppercase">DAFTAR HADIR PESERTA UJIAN</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-medium">
                        <div><p><span className="inline-block w-32">Mata Pelajaran</span>: {data.subjectName}</p><p><span className="inline-block w-32">Kelas</span>: {data.class}</p><p><span className="inline-block w-32">Kegiatan</span>: {data.printForm?.activityName || 'Ujian'}</p></div>
                        <div><p><span className="inline-block w-32">Hari / Tanggal</span>: {getDayName(data.date)}, {formatDate(data.date)}</p><p><span className="inline-block w-32">Pengawas</span>: {data.printForm?.pengawas || '................................'}</p></div>
                    </div>
                    <table className="w-full border-collapse border border-black text-sm mb-10">
                        <thead><tr className="bg-slate-100"><th className="border border-black p-2 w-12">NO</th><th className="border border-black p-2 w-32">NIS</th><th className="border border-black p-2">NAMA PESERTA</th><th className="border border-black p-2 w-48">TANDA TANGAN</th><th className="border border-black p-2 w-24">KET</th></tr></thead>
                        <tbody>
                            {data.students.map((s, idx) => (
                                <tr key={s.id}><td className="border border-black p-3 text-center">{idx + 1}</td><td className="border border-black p-3 text-center">{s.nis}</td><td className="border border-black p-3 font-bold">{s.name}</td><td className="border border-black p-3"><div className={`text-xs text-slate-500 ${idx % 2 === 0 ? 'text-left pl-2' : 'text-center pl-8'}`}>{idx + 1}. ...........</div></td><td className="border border-black p-3"></td></tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="grid grid-cols-2 gap-8 text-center mt-12">
                        <div><p>Mengetahui,</p><p>Kepala Sekolah</p><div className="h-24"></div><p className="font-bold underline">{schoolData.kepsekName || schoolData.adminName}</p><p>NIP. {schoolData.kepsekNip || schoolData.adminUsername || "-"}</p></div>
                        <div><p>&nbsp;</p><p>Pengawas Ujian</p><div className="h-24"></div><p className="font-bold underline">{data.printForm?.pengawas || "......................................."}</p><p>NIP. .......................................</p></div>
                    </div>
                </div>
            )}

            {type === 'report' && (
                <div className="leading-relaxed text-justify">
                    <h3 className="text-center text-lg font-bold underline mb-8 uppercase">BERITA ACARA PELAKSANAAN UJIAN</h3>
                    <p className="mb-6">Pada hari ini <strong>{getDayName(data.date)}</strong> tanggal <strong>{formatDate(data.date)}</strong>, telah dilaksanakan {data.printForm?.activityName || 'Ujian'} Tahun Pelajaran {schoolData.term} di {schoolData.name}.</p>
                    <table className="w-full mb-8" style={{ border: 'none' }}><tbody><tr><td className="w-48 py-1">Mata Pelajaran</td><td className="py-1">: <strong>{data.subjectName}</strong></td></tr><tr><td className="w-48 py-1">Kelas / Ruang</td><td className="py-1">: <strong>{data.class}</strong></td></tr><tr><td className="w-48 py-1">Waktu Pelaksanaan</td><td className="py-1">: {data.printForm?.waktuMulai || '07:30'} s.d {data.printForm?.waktuSelesai || '09:30'} WIB</td></tr><tr><td className="w-48 py-1">Jumlah Seharusnya</td><td className="py-1">: {data.printForm?.seharusnya || data.students.length} Orang</td></tr><tr><td className="w-48 py-1">Hadir</td><td className="py-1">: {data.printForm?.hadir || '........'} Orang</td></tr><tr><td className="w-48 py-1">Tidak Hadir</td><td className="py-1">: {data.printForm?.tidakHadir || '........'} Orang</td></tr><tr><td className="w-48 py-1 align-top">Catatan Pelaksanaan</td><td className="py-1">: {data.printForm?.catatan || '-'}</td></tr></tbody></table>
                    <div className="grid grid-cols-2 gap-8 text-center mt-12">
                        <div><p>Mengetahui,</p><p>Kepala Sekolah</p><div className="h-24"></div><p className="font-bold underline">{schoolData.kepsekName || schoolData.adminName}</p><p>NIP. {schoolData.kepsekNip || schoolData.adminUsername || "-"}</p></div>
                        <div><p>&nbsp;</p><p>Pengawas Ujian</p><div className="h-24"></div><p className="font-bold underline">{data.printForm?.pengawas || "......................................."}</p><p>NIP. .......................................</p></div>
                    </div>
                </div>
            )}
            {type === 'results' && (
                <div>
                    <h3 className="text-center text-lg font-bold underline mb-6 uppercase">LAPORAN HASIL UJIAN</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-medium">
                        <div><p><span className="inline-block w-32">Mata Pelajaran</span>: {data.subjectName}</p><p><span className="inline-block w-32">Kelas</span>: {data.className}</p></div>
                        <div><p><span className="inline-block w-32">Tanggal Cetak</span>: {formatDate(data.date)}</p><p><span className="inline-block w-32">Tahun Ajaran</span>: {schoolData.term}</p></div>
                    </div>
                    <table className="w-full border-collapse border border-black text-sm text-left">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-black p-2 text-center w-12">Rank</th>
                                <th className="border border-black p-2">Nama Peserta</th>
                                <th className="border border-black p-2 text-center">Kelas</th>
                                <th className="border border-black p-2 text-center">Nilai Akhir</th>
                                <th className="border border-black p-2 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.results.map((r, i) => (
                                <tr key={r.id}>
                                    <td className="border border-black p-2 text-center font-bold">{i + 1}</td>
                                    <td className="border border-black p-2 font-semibold">{r.studentName}</td>
                                    <td className="border border-black p-2 text-center">{r.class}</td>
                                    <td className="border border-black p-2 text-center font-bold">{r.score.toFixed(0)}</td>
                                    <td className="border border-black p-2 text-center font-bold">{r.score >= 75 ? 'LULUS' : 'REMEDIAL'}</td>
                                </tr>
                            ))}
                            {data.results.length === 0 && (
                                <tr><td colSpan="5" className="border border-black p-4 text-center">Belum ada data nilai pada mata pelajaran ini.</td></tr>
                            )}
                        </tbody>
                    </table>
                    <div className="grid grid-cols-2 gap-8 text-center mt-12">
                        <div></div>
                        <div><p>{schoolData.kabupaten || 'Kota'}, {formatDate(data.date)}</p><p>Guru / Pengampu</p><div className="h-24"></div><p className="font-bold underline">{schoolData.adminName || '..........................'}</p></div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN APP COMPONENT ---

export default function App({ defaultLogin = 'student', onBack }) {
    const [role, setRole] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loginTab, setLoginTab] = useState(defaultLogin);

    useEffect(() => {
        setLoginTab(defaultLogin);
    }, [defaultLogin]);
    const [dbLoaded, setDbLoaded] = useState(false);
    const dbLoadedKeys = useRef(new Set());
    const DB_TOTAL_COLLECTIONS = 10;

    // State awal dengan fallback data awal — data asli otomatis disinkronkan dari Firestore
    const [schoolData, setSchoolData] = useState(INITIAL_SCHOOL_DATA);
    const [teachers, setTeachers] = useState(INITIAL_TEACHERS);
    const [classes, setClasses] = useState(INITIAL_CLASSES);
    const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);
    const [students, setStudents] = useState(INITIAL_STUDENTS);
    const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
    const [stimuli, setStimuli] = useState(INITIAL_STIMULI);
    const [results, setResults] = useState([]);
    const [activeExams, setActiveExams] = useState([]);
    const [liveStatus, setLiveStatus] = useState({});

    // Akses Semester & Tahun Pelajaran yang Aktif
    const activeSemester = schoolData.semester || (schoolData.term?.toLowerCase().includes('genap') ? 'Genap' : 'Ganjil');
    const activeAcademicYear = schoolData.academicYear || schoolData.term?.replace(/Ganjil|Genap/gi, '').trim() || '2025/2026';

    // Model AI Generator & Filter Soal
    const [availableAiModels, setAvailableAiModels] = useState([]);
    const [isCheckingAiKey, setIsCheckingAiKey] = useState(false);
    const [aiKeyStatus, setAiKeyStatus] = useState(null);
    const [questionSemesterFilter, setQuestionSemesterFilter] = useState('active'); // 'active' | 'all' | 'Ganjil' | 'Genap'

    const [adminMenu, setAdminMenu] = useState('dashboard');
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [mobileAdminDrawerOpen, setMobileAdminDrawerOpen] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [quote, setQuote] = useState("");
    const [openMenuGroups, setOpenMenuGroups] = useState({ master: true, evaluasi: true, laporan: true, sistem: true });

    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [modalType, setModalType] = useState('');
    const [teacherFormType, setTeacherFormType] = useState('guru_kelas');
    const [teacherAssignedClass, setTeacherAssignedClass] = useState('');
    const [teacherSubjectName, setTeacherSubjectName] = useState('');
    const [teacherSelectedClasses, setTeacherSelectedClasses] = useState([]);
    const [importModalConfig, setImportModalConfig] = useState({ isOpen: false, type: '' });
    const [deleteConfig, setDeleteConfig] = useState({ isOpen: false, type: '', id: null });
    const [tempLogo, setTempLogo] = useState(null);

    const [studentStep, setStudentStep] = useState('token');
    const [studentScore, setStudentScore] = useState(0);
    const [currentExamSubject, setCurrentExamSubject] = useState(null);
    const [examAnswers, setExamAnswers] = useState({});
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [examTimeLeft, setExamTimeLeft] = useState(7200);
    const [shuffledExamQuestions, setShuffledExamQuestions] = useState([]);

    const [examBlueprint, setExamBlueprint] = useState({ subjectId: '', total: 25, lots: 20, mots: 50, hots: 30, semester: 'Ganjil', academicYear: '2025/2026' });

    const [classSearch, setClassSearch] = useState('');
    const [studentFilterClass, setStudentFilterClass] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [analysisFilterClass, setAnalysisFilterClass] = useState('');
    const [analysisFilterSubject, setAnalysisFilterSubject] = useState('');
    const [selectedSubjectForQuestions, setSelectedSubjectForQuestions] = useState(null);
    const [questionFormType, setQuestionFormType] = useState('single');

    // State Stimulus Soal
    const [bankSubjectTab, setBankSubjectTab] = useState('questions'); // 'questions' | 'stimuli'
    const [questionUseStimulus, setQuestionUseStimulus] = useState(false);
    const [questionStimulusId, setQuestionStimulusId] = useState('');
    const [stimulusType, setStimulusType] = useState('text'); // 'text' | 'table' | 'image' | 'combined'
    const [stimulusTableRaw, setStimulusTableRaw] = useState('');
    const [stimulusPreviewImage, setStimulusPreviewImage] = useState('');
    const [activeStimulusModal, setActiveStimulusModal] = useState(null); // popup pratinjau stimulus

    // Filter Tahun Pelajaran & Kelas
    const [classYearFilter, setClassYearFilter] = useState('active'); // 'active' | 'all' | '2025/2026' ...
    const [questionClassFilter, setQuestionClassFilter] = useState('all');
    const [questionYearFilter, setQuestionYearFilter] = useState('active');
    const [questionSearchSubj, setQuestionSearchSubj] = useState('');
    const [subjectClassFilter, setSubjectClassFilter] = useState('all');
    const [subjectYearFilter, setSubjectYearFilter] = useState('active');
    const [subjectSearch, setSubjectSearch] = useState('');

    // State untuk Pembuatan Mapel Multi-Kelas
    const [subjectClassScope, setSubjectClassScope] = useState('all'); // 'all' | 'custom' | 'single'
    const [subjectTargetClasses, setSubjectTargetClasses] = useState([]);
    const [subjectAcademicYear, setSubjectAcademicYear] = useState('');

    // State API Key Mandiri untuk Guru
    const [teacherApiKeyInput, setTeacherApiKeyInput] = useState('');
    const [showTeacherKeyBox, setShowTeacherKeyBox] = useState(false);
    const [isVerifyingTeacherKey, setIsVerifyingTeacherKey] = useState(false);

    // Dynamic Effective AI Key & Model
    const effectiveApiKey = (role === 'guru' && currentUser?.apiKey?.trim())
        ? currentUser.apiKey.trim()
        : (schoolData.apiKey?.trim() || '');
    const effectiveAiModel = (role === 'guru' && currentUser?.aiModel)
        ? currentUser.aiModel
        : (schoolData.aiModel || 'gemini-1.5-flash');
    const effectiveAvailableModels = (role === 'guru' && currentUser?.availableAiModels?.length > 0)
        ? currentUser.availableAiModels
        : (availableAiModels?.length > 0 ? availableAiModels : (schoolData.availableAiModels || []));

    const [printForm, setPrintForm] = useState({ class: '', subject: '', date: new Date().toISOString().split('T')[0], activityName: 'Ujian Sekolah Berbasis Komputer (CBT)', pengawas: '', waktuMulai: '07:30', waktuSelesai: '09:30', hadir: '', tidakHadir: '', seharusnya: '', catatan: '' });
    const [printData, setPrintData] = useState(null);

    const [aiWizardOpen, setAiWizardOpen] = useState(false);
    const [aiStep, setAiStep] = useState(1);
    const [aiParams, setAiParams] = useState({
        subject: '', topic: '', cptp: '',
        semester: 'Ganjil', academicYear: '2025/2026',
        counts: { single: 5, multiple: 0, boolean: 0, matching: 0, short: 0, essay: 0 },
        pcts: { lots: 20, mots: 50, hots: 30 }
    });
    const [aiLoading, setAiLoading] = useState(false);
    const [aiDrafts, setAiDrafts] = useState([]);

    const handleDetectAiModels = async (keyToTest, autoNotify = true) => {
        const key = (keyToTest !== undefined ? keyToTest : schoolData.apiKey) || '';
        if (!key.trim()) {
            if (autoNotify) showToast("Masukkan API Key Gemini terlebih dahulu!", "error");
            setAiKeyStatus({ type: 'error', message: "API Key belum diisi." });
            return;
        }
        setIsCheckingAiKey(true);
        setAiKeyStatus({ type: 'loading', message: "Menghubungi Google AI dan memeriksa model yang diizinkan..." });
        try {
            const res = await aiService.fetchAvailableModels(key.trim());
            if (res.success && res.models.length > 0) {
                setAvailableAiModels(res.models);
                setAiKeyStatus({
                    type: 'success',
                    message: `Terhubung! Ditemukan ${res.models.length} model resmi untuk API Key Anda.`
                });
                if (autoNotify) showToast(`Berhasil mendeteksi ${res.models.length} model Google AI!`, "success");

                const modelExists = res.models.some(m => m.id === schoolData.aiModel);
                let chosen = schoolData.aiModel;
                if (!chosen || !modelExists) {
                    chosen = res.models[0].id;
                }
                setSchoolData(prev => {
                    const next = { ...prev, apiKey: key.trim(), aiModel: chosen, availableAiModels: res.models };
                    updateGlobalState({ schoolData: next });
                    return next;
                });
            } else {
                setAiKeyStatus({
                    type: 'error',
                    message: res.error || "Gagal mendeteksi model. Pastikan API Key benar dan aktif."
                });
                if (autoNotify) showToast(res.error || "Gagal memverifikasi API Key.", "error");
            }
        } catch (err) {
            setAiKeyStatus({ type: 'error', message: err.message || "Gagal menghubungi server Google AI." });
            if (autoNotify) showToast("Error: " + err.message, "error");
        } finally {
            setIsCheckingAiKey(false);
        }
    };

    const handleSaveTeacherApiKey = async (rawKey) => {
        if (!rawKey || !rawKey.trim()) {
            showToast("Masukkan API Key Gemini terlebih dahulu!", "error");
            return;
        }
        const key = rawKey.trim();
        setIsVerifyingTeacherKey(true);
        try {
            const res = await aiService.fetchAvailableModels(key);
            setIsVerifyingTeacherKey(false);
            if (res.success && res.models && res.models.length > 0) {
                const chosen = res.models.find(m => m.id === 'gemini-2.0-flash')?.id
                    || res.models.find(m => m.id === 'gemini-1.5-flash')?.id
                    || res.models[0].id;

                const updatedTeacher = {
                    ...currentUser,
                    apiKey: key,
                    aiModel: chosen,
                    availableAiModels: res.models
                };
                setCurrentUser(updatedTeacher);

                setTeachers(prev => {
                    const next = prev.map(t => t.id === currentUser.id ? { ...t, apiKey: key, aiModel: chosen, availableAiModels: res.models } : t);
                    updateGlobalState({ teachers: next });
                    return next;
                });

                showToast(`API Key Guru berhasil dihubungkan! Model aktif: ${chosen}`, "success");
                setShowTeacherKeyBox(false);
                setTeacherApiKeyInput('');
            } else {
                showToast("API Key tidak valid atau tidak memiliki akses ke Gemini API!", "error");
            }
        } catch (e) {
            setIsVerifyingTeacherKey(false);
            showToast("Gagal memverifikasi API Key: " + (e.message || "Periksa koneksi"), "error");
        }
    };

    const handleSelectTeacherModel = (modelId) => {
        const updatedTeacher = { ...currentUser, aiModel: modelId };
        setCurrentUser(updatedTeacher);
        setTeachers(prev => {
            const next = prev.map(t => t.id === currentUser.id ? { ...t, aiModel: modelId } : t);
            updateGlobalState({ teachers: next });
            return next;
        });
        showToast(`Model AI aktif diubah ke ${modelId}`, "success");
    };

    const updateGlobalState = async (updates) => {
        try {
            const keys = Object.keys(updates);
            for (let key of keys) {
                let payload = updates[key];
                // Firestore menolak nested array langsung; lakukan serialisasi JSON aman jika key === 'stimuli'
                if (key === 'stimuli' && Array.isArray(payload)) {
                    payload = payload.map(s => ({
                        ...s,
                        tableData: Array.isArray(s.tableData) ? JSON.stringify(s.tableData) : (s.tableData || '[]')
                    }));
                }
                await setDoc(doc(db, key, 'data'), { data: payload });
            }
        } catch (e) {
            console.error("Firestore Write Error:", e);
        }
    };

    useEffect(() => {
        // Fallback safety timeout: jika koneksi Firestore tertunda / lambat,
        // jangan biarkan aplikasi tertahan di layar loading "Menghubungkan ke database..."
        const safetyTimeout = setTimeout(() => {
            setDbLoaded(true);
        }, 3000);

        const collections = [
            { key: 'results', setter: setResults, init: [] },
            { key: 'activeExams', setter: setActiveExams, init: [] },
            { key: 'liveStatus', setter: setLiveStatus, init: {} },
            { key: 'schoolData', setter: setSchoolData, init: INITIAL_SCHOOL_DATA },
            { key: 'teachers', setter: setTeachers, init: INITIAL_TEACHERS },
            { key: 'classes', setter: setClasses, init: INITIAL_CLASSES },
            { key: 'subjects', setter: setSubjects, init: INITIAL_SUBJECTS },
            { key: 'students', setter: setStudents, init: INITIAL_STUDENTS },
            { key: 'questions', setter: setQuestions, init: INITIAL_QUESTIONS },
            { key: 'stimuli', setter: setStimuli, init: INITIAL_STIMULI }
        ];

        const unsubs = collections.map(({ key, setter, init }) => {
            return onSnapshot(
                doc(db, key, 'data'),
                (docSnap) => {
                    if (docSnap.exists()) {
                        let data = docSnap.data()?.data;
                        if (key === 'stimuli' && Array.isArray(data)) {
                            data = data.map(s => {
                                let parsedTable = [];
                                if (typeof s.tableData === 'string') {
                                    try { parsedTable = JSON.parse(s.tableData); } catch (e) { parsedTable = []; }
                                } else if (Array.isArray(s.tableData)) {
                                    parsedTable = s.tableData;
                                }
                                return { ...s, tableData: parsedTable };
                            });
                        }
                        setter(data !== undefined ? data : init);
                    } else {
                        console.warn(`[Firestore] Collection '${key}' belum ada, melakukan seed awal...`);
                        let seedData = init;
                        if (key === 'stimuli' && Array.isArray(seedData)) {
                            seedData = seedData.map(s => ({
                                ...s,
                                tableData: Array.isArray(s.tableData) ? JSON.stringify(s.tableData) : (s.tableData || '[]')
                            }));
                        }
                        setDoc(doc(db, key, 'data'), { data: seedData }).catch(e => console.error("Seed error for " + key, e));
                    }
                    dbLoadedKeys.current.add(key);
                    if (dbLoadedKeys.current.size >= DB_TOTAL_COLLECTIONS) {
                        setDbLoaded(true);
                    }
                },
                (error) => {
                    console.error(`[Firestore] Gagal membaca '${key}':`, error.message);
                    dbLoadedKeys.current.add(key);
                    if (dbLoadedKeys.current.size >= DB_TOTAL_COLLECTIONS) {
                        setDbLoaded(true);
                    }
                }
            );
        });

        return () => {
            clearTimeout(safetyTimeout);
            unsubs.forEach(unsub => unsub());
        };
    }, []);

    useEffect(() => {
        const handleBlur = () => {
            if (role === 'student' && studentStep === 'exam' && currentUser) {
                setLiveStatus(prev => {
                    const newStatus = { ...prev, [currentUser.id]: { status: 'Mencontek', cheat: true, time: Date.now() } };
                    updateGlobalState({ liveStatus: newStatus });
                    return newStatus;
                });
            }
        };
        const handleFocus = () => {
            if (role === 'student' && studentStep === 'exam' && currentUser) {
                setLiveStatus(prev => {
                    const currentCheat = prev[currentUser.id]?.cheat || false;
                    const newStatus = { ...prev, [currentUser.id]: { status: 'Mengerjakan', cheat: currentCheat, time: Date.now() } };
                    updateGlobalState({ liveStatus: newStatus });
                    return newStatus;
                });
            }
        };
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [role, studentStep, currentUser]);

    useEffect(() => {
        // Auto-kick if admin stops the exam
        if (role === 'student' && studentStep === 'exam' && currentExamSubject) {
            const stillActive = activeExams.find(e => e.subjectId === currentExamSubject.id);
            if (!stillActive) {
                handleStudentFinish(examAnswers);
                showToast("Sesi ujian telah diakhiri oleh Pengawas!", "error");
            }
        }
    }, [activeExams, role, studentStep, currentExamSubject, examAnswers]);

    useEffect(() => {
        let timer;
        if (role === 'student' && studentStep === 'exam' && examTimeLeft > 0) {
            timer = setInterval(() => {
                setExamTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleStudentFinish(examAnswers);
                        showToast("Waktu habis! Ujian otomatis diakhiri.", "error");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [role, studentStep, examTimeLeft, examAnswers]);

    // Injeksi Dinamis Favicon & OG Image
    useEffect(() => {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhkZZ6nl3Pq7mFou917u9D1yJnyd4AmsDSQI4VyCjaktVQOk6Yj0teuLBiiyBeiyyKhhbBRC5SJW9Ml6QZZ5vlH-ZlR1lrrKO6auMpiFZrs_DC-VINjninMxAh57pj7yVza53Z2qgyUKiGw8RWviLJ8_Cvl_DamdXJG_OVk_CYc8iwVa4BReULUElQxinWK/s16000/logo%20e-quest.png";

        let metaOg = document.querySelector("meta[property='og:image']");
        if (!metaOg) {
            metaOg = document.createElement('meta');
            metaOg.setAttribute('property', 'og:image');
            document.getElementsByTagName('head')[0].appendChild(metaOg);
        }
        metaOg.content = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhkZZ6nl3Pq7mFou917u9D1yJnyd4AmsDSQI4VyCjaktVQOk6Yj0teuLBiiyBeiyyKhhbBRC5SJW9Ml6QZZ5vlH-ZlR1lrrKO6auMpiFZrs_DC-VINjninMxAh57pj7yVza53Z2qgyUKiGw8RWviLJ8_Cvl_DamdXJG_OVk_CYc8iwVa4BReULUElQxinWK/s16000/logo%20e-quest.png";

        document.title = "e-Quest Premium CBT";
    }, []);

    // CSS Injection
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .glass-panel { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-right: 1px solid rgba(255, 255, 255, 0.6); }
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    useEffect(() => { setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]); }, []);

    const showToast = (message, type = 'success') => {
        setToasts(p => [...p, { id: Date.now(), message: String(message), type }]);
    };
    const removeToast = (id) => setToasts(p => p.filter(t => t.id !== id));

    const openModal = (type, item = null) => {
        setModalType(type); setEditingItem(item);
        if (type === 'question') {
            setQuestionFormType(item?.type || 'single');
            setQuestionUseStimulus(Boolean(item?.stimulusId));
            setQuestionStimulusId(item?.stimulusId ? String(item.stimulusId) : '');
        }
        if (type === 'stimulus') {
            setStimulusType(item?.type || 'text');
            const rawTbl = item?.tableData && item.tableData.length > 0 
                ? item.tableData.map(row => Array.isArray(row) ? row.join(' | ') : String(row)).join('\n') 
                : '';
            setStimulusTableRaw(rawTbl);
            setStimulusPreviewImage(item?.imageUrl || '');
        }
        if (type === 'teacher') {
            const tType = item?.teacherType || (item?.subjectName ? 'guru_mapel' : 'guru_kelas');
            setTeacherFormType(tType);
            setTeacherAssignedClass(item?.assignedClass || item?.assignedClasses?.[0] || classes[0]?.name || '');
            setTeacherSubjectName(item?.subjectName || '');
            setTeacherSelectedClasses(
                Array.isArray(item?.assignedClasses) && item.assignedClasses.length > 0
                    ? item.assignedClasses
                    : (item?.assignedClass ? [item.assignedClass] : (classes[0]?.name ? [classes[0].name] : []))
            );
        }
        if (type === 'subject') {
            if (item) {
                setSubjectClassScope('single');
                setSubjectTargetClasses([item.class]);
                setSubjectAcademicYear(item.academicYear || activeAcademicYear);
            } else {
                setSubjectClassScope('all');
                setSubjectTargetClasses(getMyClasses().map(c => c.name));
                setSubjectAcademicYear(activeAcademicYear);
            }
        }
        setModalOpen(true);
    };

    const getTeacherClasses = (teacher) => {
        if (!teacher) return [];
        if (teacher.teacherType === 'guru_kelas') {
            return teacher.assignedClass ? [teacher.assignedClass] : (classes[0]?.name ? [classes[0].name] : []);
        }
        if (teacher.teacherType === 'guru_mapel') {
            if (Array.isArray(teacher.assignedClasses) && teacher.assignedClasses.length > 0) {
                return teacher.assignedClasses;
            }
            const cls = subjects.filter(s => s.teacherId === teacher.id).map(s => s.class);
            return Array.from(new Set(cls));
        }
        if (teacher.assignedClass) return [teacher.assignedClass];
        if (Array.isArray(teacher.assignedClasses) && teacher.assignedClasses.length > 0) return teacher.assignedClasses;
        const cls = subjects.filter(s => s.teacherId === teacher.id).map(s => s.class);
        return cls.length > 0 ? Array.from(new Set(cls)) : (classes[0]?.name ? [classes[0].name] : []);
    };

    const getMyClasses = () => {
        if (role === 'admin') return classes;
        if (role === 'guru' && currentUser) {
            const currentTeacher = teachers.find(t => t.id === currentUser.id) || currentUser;
            const allowedNames = getTeacherClasses(currentTeacher);
            return classes.filter(c => allowedNames.includes(c.name));
        }
        return [];
    };

    const getMySubjects = () => {
        if (role === 'admin') return subjects;
        if (role === 'guru' && currentUser) {
            const currentTeacher = teachers.find(t => t.id === currentUser.id) || currentUser;
            const tType = currentTeacher.teacherType || (currentTeacher.subjectName ? 'guru_mapel' : 'guru_kelas');

            if (tType === 'guru_kelas') {
                const myClass = currentTeacher.assignedClass || getTeacherClasses(currentTeacher)[0];
                return subjects.filter(s => s.class === myClass || s.teacherId === currentTeacher.id);
            } else {
                // Guru Mapel (multi-kelas)
                const allowedClasses = getTeacherClasses(currentTeacher);
                const subjLower = (currentTeacher.subjectName || '').toLowerCase().trim();
                return subjects.filter(s => {
                    if (s.teacherId === currentTeacher.id) return true;
                    if (allowedClasses.includes(s.class)) {
                        if (!subjLower) return true;
                        const sNameLower = s.name.toLowerCase();
                        return sNameLower.includes(subjLower) || subjLower.includes(sNameLower);
                    }
                    return false;
                });
            }
        }
        return [];
    };
    const getMyQuestions = () => {
        const myIds = getMySubjects().map(s => s.id);
        return questions.filter(q => myIds.includes(q.subjectId));
    };
    const getMyResults = () => {
        if (role === 'admin') return results;
        if (role === 'guru' && currentUser) {
            const currentTeacher = teachers.find(t => t.id === currentUser.id) || currentUser;
            const tType = currentTeacher.teacherType || (currentTeacher.subjectName ? 'guru_mapel' : 'guru_kelas');
            const allowedClasses = getTeacherClasses(currentTeacher);
            const mySubjNames = getMySubjects().map(s => s.name.toLowerCase());
            return results.filter(r => {
                if (!allowedClasses.includes(r.class)) return false;
                if (tType === 'guru_kelas') return true;
                return mySubjNames.includes((r.subject || '').toLowerCase());
            });
        }
        return [];
    };

    const handleSystemLogin = (e) => {
        e.preventDefault();
        const u = e.target.username.value; const p = e.target.password.value;
        if (u === schoolData.adminUsername && p === schoolData.adminPassword) {
            setCurrentUser({ name: schoolData.adminName, id: 0 }); setRole('admin'); showToast("Login Super Admin Berhasil!");
        } else {
            const teacher = teachers.find(t => t.username === u && t.password === p);
            if (teacher) { setCurrentUser(teacher); setRole('guru'); showToast(`Selamat Datang, ${teacher.name}`); }
            else { showToast("Username atau Password Salah!", "error"); }
        }
    };

    const handleStudentLogin = (e) => {
        e.preventDefault();
        const s = students.find(i => i.nis === e.target.username.value && i.password === e.target.password.value);
        if (s) { setCurrentUser(s); setRole('student'); setStudentStep('token'); showToast("Login Siswa Berhasil!"); }
        else { showToast("NIS atau Password salah!", "error"); }
    };

    const handleTokenSubmit = (e) => {
        e.preventDefault();
        const inputToken = e.target.token.value.toUpperCase();
        const exam = activeExams.find(ex => ex.token === inputToken);
        if (exam) {
            const subjectObj = subjects.find(s => s.id === exam.subjectId);
            if (subjectObj.class !== currentUser.class) { showToast("Token ini bukan untuk kelas Anda!", "error"); return; }

            const examSem = exam.semester || activeSemester;
            const examYr = exam.academicYear || activeAcademicYear;

            const alreadyTaken = results.find(r => r.studentName === currentUser.name && r.subject === subjectObj.name && r.token === exam.token);
            if (alreadyTaken) {
                setStudentScore(alreadyTaken.score);
                setCurrentExamSubject({ ...subjectObj, token: exam.token, blueprint: exam.blueprint, semester: examSem, academicYear: examYr });
                setStudentStep('result');
                showToast("Anda sudah menyelesaikan sesi ujian ini.", "success");
                return;
            }

            setCurrentExamSubject({ ...subjectObj, token: exam.token, blueprint: exam.blueprint, semester: examSem, academicYear: examYr }); setExamAnswers({}); setCurrentQIndex(0); setExamTimeLeft(7200); showToast("Token Valid! Memverifikasi Soal...", "success"); setStudentStep('biodata');
        } else { showToast("Token tidak ditemukan / tidak aktif!", "error"); }
    };

    const handleStudentFinish = (answers) => {
        const examSem = currentExamSubject?.semester || activeSemester;
        const examYr = currentExamSubject?.academicYear || activeAcademicYear;
        const examQuestions = shuffledExamQuestions.length > 0 ? shuffledExamQuestions : questions.filter(q => q.subjectId === currentExamSubject.id && ((q.semester || activeSemester).toLowerCase() === examSem.toLowerCase()));
        let earned = 0; let max = 0;

        let earnedScores = {};
        let rawAnswersMap = {};

        examQuestions.forEach((q, i) => {
            const weight = Number(q.weight) || 10;
            max += weight;
            let earnedThisQ = 0;
            if (q.type === 'single' && String(answers[i]) === String(q.correct)) {
                earnedThisQ = weight;
            } else if (q.type === 'multiple') {
                const ansArr = String(answers[i] || "").split(',').filter(Boolean).sort();
                const corrArr = String(q.correct).split(',').filter(Boolean).sort();
                if (JSON.stringify(ansArr) === JSON.stringify(corrArr)) earnedThisQ = weight;
            } else if (q.type === 'boolean' && String(answers[i]) === String(q.correct)) {
                earnedThisQ = weight;
            } else if (q.type === 'matching') {
                try {
                    const studentPairs = JSON.parse(answers[i] || "{}");
                    const correctPairs = String(q.correct).split('\n').filter(Boolean).map(line => line.split('|').map(s => s.trim()));
                    let allCorrect = true;
                    for (let pair of correctPairs) {
                        if (studentPairs[pair[0]] !== pair[1]) {
                            allCorrect = false;
                            break;
                        }
                    }
                    if (allCorrect && correctPairs.length > 0) earnedThisQ = weight;
                } catch (e) { }
            } else if ((q.type === 'short' || q.type === 'essay') && String(answers[i]).toLowerCase().trim() === String(q.correct).toLowerCase().trim()) {
                earnedThisQ = weight;
            }
            earned += earnedThisQ;
            earnedScores[q.id] = earnedThisQ;
            rawAnswersMap[q.id] = answers[i] !== undefined ? answers[i] : null;
        });

        const currentToken = activeExams.find(ex => ex.subjectId === currentExamSubject.id)?.token || '';
        const finalScore = max > 0 ? (earned / max) * 100 : 0;
        setStudentScore(finalScore);
        setResults(prev => {
            const next = [...prev, {
                id: Date.now(),
                studentId: currentUser.id,
                studentName: currentUser.name,
                class: currentUser.class,
                subject: currentExamSubject.name,
                token: currentToken,
                score: finalScore,
                semester: examSem,
                academicYear: examYr,
                totalWeight: max,
                earnedTotal: earned,
                earnedScores,
                rawAnswersMap,
                submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }];
            updateGlobalState({ results: next });
            return next;
        });
        setStudentStep('result');
        setLiveStatus(prev => {
            const newStatus = { ...prev, [currentUser.id]: { status: 'Selesai', cheat: false, time: Date.now() } };
            updateGlobalState({ liveStatus: newStatus });
            return newStatus;
        });
        showToast("Ujian Selesai. Hasil terkirim ke server!", "success");
    };

    const handleSave = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const d = Object.fromEntries(formData.entries());

        if (modalType === 'teacher') {
            const teacherType = teacherFormType;
            let assignedClass = '';
            let assignedClasses = [];
            let subjectName = '';

            if (teacherType === 'guru_kelas') {
                assignedClass = teacherAssignedClass || d.assignedClass || classes[0]?.name || '';
                assignedClasses = assignedClass ? [assignedClass] : [];
                subjectName = '';
            } else {
                subjectName = (teacherSubjectName || d.subjectName || '').trim();
                assignedClasses = teacherSelectedClasses.length > 0 ? teacherSelectedClasses : (classes[0]?.name ? [classes[0].name] : []);
                assignedClass = assignedClasses[0] || '';
            }

            const teacherRecord = {
                name: (d.name || '').trim(),
                username: (d.username || '').trim(),
                password: (d.password || '').trim(),
                teacherType,
                assignedClass,
                assignedClasses,
                subjectName,
                apiKey: (d.apiKey !== undefined ? d.apiKey : (editingItem?.apiKey || '')).trim()
            };

            const teacherId = editingItem ? editingItem.id : Date.now();

            setTeachers(p => {
                const next = editingItem
                    ? p.map(i => i.id === editingItem.id ? { ...i, ...teacherRecord } : i)
                    : [...p, { id: teacherId, ...teacherRecord }];
                updateGlobalState({ teachers: next });
                return next;
            });

            // Update currentUser if current user is this teacher
            if (currentUser && currentUser.id === teacherId) {
                setCurrentUser(prev => ({ ...prev, ...teacherRecord }));
            }

            // Auto-sync mata pelajaran untuk Guru Mapel ke semua kelas yang dipilih
            if (teacherType === 'guru_mapel' && subjectName && assignedClasses.length > 0) {
                setSubjects(prevSubjects => {
                    let updated = [...prevSubjects];
                    let hasChanges = false;
                    assignedClasses.forEach(clsName => {
                        const existingIdx = updated.findIndex(
                            s => s.name.toLowerCase() === subjectName.toLowerCase() && s.class === clsName
                        );
                        if (existingIdx >= 0) {
                            if (updated[existingIdx].teacherId !== teacherId) {
                                updated[existingIdx] = { ...updated[existingIdx], teacherId };
                                hasChanges = true;
                            }
                        } else {
                            const code = `${subjectName.substring(0, 3).toUpperCase()}-${clsName.replace(/\s+/g, '')}`;
                            updated.push({
                                id: Date.now() + Math.floor(Math.random() * 10000),
                                name: subjectName,
                                code,
                                class: clsName,
                                academicYear: activeAcademicYear,
                                teacherId
                            });
                            hasChanges = true;
                        }
                    });
                    if (hasChanges) {
                        updateGlobalState({ subjects: updated });
                    }
                    return updated;
                });
            }
            showToast(`Data Guru "${d.name}" Berhasil Disimpan!`);
            setModalOpen(false);
        } else if (modalType === 'student') {
            setStudents(p => { const next = editingItem ? p.map(i => i.id === editingItem.id ? { ...i, ...d } : i) : [...p, { id: Date.now(), ...d }]; updateGlobalState({ students: next }); return next; });
            showToast(`Data Murid "${d.name}" Berhasil Disimpan!`);
            setModalOpen(false);
        } else if (modalType === 'class') {
            const classRecord = {
                name: (d.name || '').trim(),
                level: d.level || '1',
                academicYear: (d.academicYear || activeAcademicYear).trim()
            };
            setClasses(p => {
                const next = editingItem
                    ? p.map(i => i.id === editingItem.id ? { ...i, ...classRecord } : i)
                    : [...p, { id: Date.now(), ...classRecord }];
                updateGlobalState({ classes: next });
                return next;
            });
            showToast(`Data Kelas "${classRecord.name}" Berhasil Disimpan!`);
            setModalOpen(false);
        } else if (modalType === 'subject') {
            const sName = (d.name || '').trim();
            const sCode = ((d.code || sName.substring(0, 3)).toUpperCase()).trim();
            const sYear = (d.academicYear || subjectAcademicYear || activeAcademicYear).trim();
            const targetTeacherId = parseInt(d.teacherId) || (role === 'guru' && currentUser?.id ? currentUser.id : (teachers[0]?.id || 101));

            if (editingItem) {
                setSubjects(p => {
                    const next = p.map(i => i.id === editingItem.id ? {
                        ...i,
                        name: sName,
                        code: sCode,
                        class: d.class || i.class,
                        academicYear: sYear,
                        teacherId: targetTeacherId
                    } : i);
                    updateGlobalState({ subjects: next });
                    return next;
                });
                showToast(`Mata pelajaran "${sName}" berhasil diperbarui!`);
            } else {
                let targetClasses = [];
                if (subjectClassScope === 'all') {
                    targetClasses = getMyClasses().map(c => c.name);
                } else if (subjectClassScope === 'custom') {
                    targetClasses = subjectTargetClasses.length > 0 ? subjectTargetClasses : getMyClasses().map(c => c.name);
                } else {
                    targetClasses = [d.class || getMyClasses()[0]?.name];
                }

                setSubjects(prev => {
                    let updated = [...prev];
                    targetClasses.forEach((clsName, idx) => {
                        const existingIdx = updated.findIndex(s =>
                            s.name.toLowerCase() === sName.toLowerCase() &&
                            s.class === clsName &&
                            (s.academicYear || activeAcademicYear).toLowerCase() === sYear.toLowerCase()
                        );
                        if (existingIdx >= 0) {
                            updated[existingIdx] = {
                                ...updated[existingIdx],
                                code: `${sCode}-${clsName.replace(/\s+/g, '')}`,
                                teacherId: targetTeacherId
                            };
                        } else {
                            updated.push({
                                id: Date.now() + idx + Math.floor(Math.random() * 1000),
                                name: sName,
                                code: `${sCode}-${clsName.replace(/\s+/g, '')}`,
                                class: clsName,
                                academicYear: sYear,
                                teacherId: targetTeacherId
                            });
                        }
                    });
                    updateGlobalState({ subjects: updated });
                    return updated;
                });
                showToast(`Mata pelajaran "${sName}" berhasil diterapkan untuk ${targetClasses.length} kelas!`);
            }
            setModalOpen(false);
        } else if (modalType === 'question') {
            let correctData = d.correct;
            let optionsData = [d.optA, d.optB, d.optC, d.optD, d.optE];

            if (d.type !== 'single' && d.type !== 'multiple') {
                if (d.type === 'boolean') optionsData = ["Benar", "Salah"];
                else optionsData = [];
            }

            const chosenStimulusId = questionUseStimulus && questionStimulusId ? parseInt(questionStimulusId) : null;

            const newQ = {
                id: editingItem ? editingItem.id : Date.now(),
                subjectId: parseInt(d.subjectId), type: d.type, text: d.text,
                options: optionsData, correct: correctData,
                difficulty: d.difficulty, weight: parseInt(d.weight),
                indicator: d.indicator, image: d.image,
                stimulusId: chosenStimulusId,
                semester: d.semester || activeSemester,
                academicYear: d.academicYear || activeAcademicYear
            };
            setQuestions(p => { const next = editingItem ? p.map(i => i.id === newQ.id ? newQ : i) : [...p, newQ]; updateGlobalState({ questions: next }); return next; });
        } else if (modalType === 'stimulus') {
            const rawLines = (d.tableDataRaw || stimulusTableRaw || '').trim();
            let parsedTable = [];
            if (rawLines) {
                parsedTable = rawLines.split('\n').filter(Boolean).map(row => {
                    if (row.includes('|')) return row.split('|').map(c => c.trim());
                    if (row.includes('\t')) return row.split('\t').map(c => c.trim());
                    return row.split(',').map(c => c.trim());
                });
            }
            const newStimulus = {
                id: editingItem ? editingItem.id : Date.now(),
                title: (d.title || '').trim() || 'Stimulus Soal',
                type: stimulusType || d.type || 'text',
                content: (d.content || '').trim(),
                imageUrl: (d.imageUrl || stimulusPreviewImage || '').trim(),
                tableData: parsedTable,
                source: (d.source || '').trim(),
                subjectId: parseInt(d.subjectId) || selectedSubjectForQuestions?.id || null,
                createdAt: editingItem?.createdAt || new Date().toISOString()
            };
            setStimuli(p => {
                const next = editingItem ? p.map(i => i.id === newStimulus.id ? newStimulus : i) : [...p, newStimulus];
                updateGlobalState({ stimuli: next });
                return next;
            });
            showToast(`Stimulus "${newStimulus.title}" berhasil disimpan!`);
        } else if (modalType === 'verify') {
            const studentResult = results.find(r => r.id === editingItem.id);
            if (studentResult) {
                let newEarnedTotal = 0;
                const newEarnedScores = { ...(studentResult.earnedScores || {}) };

                Object.keys(d).forEach(k => {
                    if (k.startsWith('score_')) {
                        const qid = parseInt(k.replace('score_', ''));
                        newEarnedScores[qid] = parseInt(d[k]) || 0;
                    }
                });

                newEarnedTotal = Object.values(newEarnedScores).reduce((a, b) => a + b, 0);
                const newScore = studentResult.totalWeight > 0 ? (newEarnedTotal / studentResult.totalWeight) * 100 : 0;

                setResults(p => {
                    const next = p.map(r => r.id === studentResult.id ? { ...r, earnedTotal: newEarnedTotal, score: newScore, earnedScores: newEarnedScores, verified: true } : r);
                    updateGlobalState({ results: next });
                    return next;
                });
            }
        }
        setModalOpen(false); setEditingItem(null); showToast("Data berhasil disimpan!");
    };

    const initiateDelete = (type, id) => { setDeleteConfig({ isOpen: true, type, id }); };
    const confirmDelete = () => {
        const { type, id } = deleteConfig;
        if (type === 'teacher') setTeachers(p => { const next = p.filter(i => i.id !== id); updateGlobalState({ teachers: next }); return next; });
        if (type === 'student') setStudents(p => { const next = p.filter(i => i.id !== id); updateGlobalState({ students: next }); return next; });
        if (type === 'class') setClasses(p => { const next = p.filter(i => i.id !== id); updateGlobalState({ classes: next }); return next; });
        if (type === 'subject') setSubjects(p => { const next = p.filter(i => i.id !== id); updateGlobalState({ subjects: next }); return next; });
        if (type === 'stimulus') {
            setStimuli(p => { const next = p.filter(i => i.id !== id); updateGlobalState({ stimuli: next }); return next; });
            setQuestions(p => { const next = p.map(q => q.stimulusId === id ? { ...q, stimulusId: null } : q); updateGlobalState({ questions: next }); return next; });
        }
        if (type === 'question') setQuestions(p => { const next = p.filter(i => i.id !== id); updateGlobalState({ questions: next }); return next; });
        if (type === 'clear_subject') setQuestions(p => { const next = p.filter(i => i.subjectId !== id); updateGlobalState({ questions: next }); return next; });
        if (type === 'result') {
            let sid = null;
            setResults(p => {
                const toDelete = p.find(i => i.id === id);
                if (toDelete) sid = toDelete.studentId;
                const next = p.filter(i => i.id !== id);
                updateGlobalState({ results: next });
                return next;
            });
            if (sid) setLiveStatus(prev => { const next = { ...prev }; delete next[sid]; updateGlobalState({ liveStatus: next }); return next; });
        }
        setDeleteConfig({ isOpen: false, type: '', id: null }); showToast("Data terhapus.");
    };

    const generateNewToken = (e) => {
        e.preventDefault();
        if (!examBlueprint.subjectId) return showToast("Pilih Mapel!", "error");
        const totalPct = parseInt(examBlueprint.lots) + parseInt(examBlueprint.mots) + parseInt(examBlueprint.hots);
        if (totalPct !== 100) return showToast("Total Proporsi Kognitif harus 100%!", "error");

        const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
        const sem = examBlueprint.semester || activeSemester;
        const yr = examBlueprint.academicYear || activeAcademicYear;
        setActiveExams(prev => {
            const next = [...prev, {
                token: newToken,
                subjectId: parseInt(examBlueprint.subjectId),
                blueprint: examBlueprint,
                semester: sem,
                academicYear: yr
            }];
            updateGlobalState({ activeExams: next });
            return next;
        });
        setExamBlueprint({ subjectId: '', total: 25, lots: 20, mots: 50, hots: 30, semester: activeSemester, academicYear: activeAcademicYear });
        showToast(`Blueprint Ujian diaktifkan! Token: ${newToken} (Semester ${sem})`);
    };

    const stopExam = (token) => {
        setActiveExams(p => {
            const next = p.filter(e => e.token !== token);
            updateGlobalState({ activeExams: next });
            return next;
        });
        showToast("Sesi dihentikan.");
    };
    const toggleGroup = (group) => setOpenMenuGroups(prev => ({ ...prev, [group]: !prev[group] }));

    const handleGenerateVisual = () => {
        showToast("AI sedang mengkalkulasi dan membuat visual...");
        setTimeout(() => {
            const imgUrl = "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&q=80&w=600";
            setEditingItem(prev => ({ ...prev, image: imgUrl }));
            showToast("Visual berhasil disisipkan!");
        }, 2500);
    };

    const generateAIQuestions = async () => {
        if (!isAiWizardFormValid) return showToast("Lengkapi Mapel dan Topik Spesifik terlebih dahulu!", "error");
        const totalPct = Number(aiParams.pcts.lots) + Number(aiParams.pcts.mots) + Number(aiParams.pcts.hots);
        if (totalPct !== 100) return showToast("Total persentase Kognitif harus tepat 100%!", "error");

        const totalQ = Object.values(aiParams.counts).reduce((a, b) => a + Number(b), 0);
        if (totalQ === 0) return showToast("Jumlah soal tidak boleh kosong!", "error");

        if (!effectiveApiKey) return showToast("API Key Gemini belum diatur! Silakan masukkan API Key Anda di panel AI Wizard di bawah.", "error");

        setAiLoading(true);

        const chosenModel = effectiveAiModel || "gemini-1.5-flash";
        const targetSem = aiParams.semester || activeSemester;
        const targetYear = aiParams.academicYear || activeAcademicYear;
        const subObj = subjects.find(s => s.id === parseInt(aiParams.subject));

        const promptText = `Anda adalah pembuat soal CBT profesional. Buatlah ${totalQ} butir soal ujian untuk mata pelajaran "${subObj?.name || 'Mata Pelajaran'}" (Kelas ${subObj?.class || ''}) pada Semester ${targetSem} Tahun Pelajaran ${targetYear} dengan topik: "${aiParams.topic}".
${aiParams.cptp ? `Capaian / Tujuan Pembelajaran: ${aiParams.cptp}` : ''}
Ketentuan:
- Opsi Pilihan Ganda (single / multiple): Maksimal ${schoolData.optionCount || 5} opsi.
- Jumlah Soal Pilihan Ganda (single): ${aiParams.counts.single}
- Jumlah Soal PG Kompleks (multiple): ${aiParams.counts.multiple}
- Jumlah Soal Benar/Salah (boolean): ${aiParams.counts.boolean}
- Jumlah Soal Menjodohkan (matching): ${aiParams.counts.matching} (format correct wajib: "Premis 1 | Pasangan 1\\nPremis 2 | Pasangan 2")
- Jumlah Soal Isian Singkat (short): ${aiParams.counts.short}
- Jumlah Soal Esai (essay): ${aiParams.counts.essay}
- Proporsi Kesulitan: ${aiParams.pcts.lots}% LOTS, ${aiParams.pcts.mots}% MOTS, ${aiParams.pcts.hots}% HOTS.

Format Output WAJIB berupa Array JSON murni (tanpa block code markdown) dengan struktur:
[
  { 
    "type": "single|multiple|boolean|matching|short|essay", 
    "text": "Pertanyaan lengkap", 
    "options": ["Opsi A", "Opsi B"], 
    "correct": "0", 
    "difficulty": "LOTS", 
    "weight": 10, 
    "indicator": "Siswa dapat..." 
  }
]
Perhatian: 
- "correct" untuk single/boolean adalah index (String angka, misal "0").
- "correct" untuk multiple adalah daftar index dipisah koma (misal "0,2").
- "correct" untuk boolean HARUS "0" (jika Opsi A Benar) atau "1" (jika Opsi B Salah), options-nya: ["Benar", "Salah"].
- "correct" untuk matching adalah pasangan seperti contoh di atas.
- "correct" untuk short/essay adalah langsung ketikkan teks kunci jawaban atau rubriknya.
- Jangan gunakan formatting block \`\`\`json pada output, langsung array!`;

        try {
            let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${effectiveApiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
            });
            let data = await res.json();

            // Auto-fallback if chosen model fails
            if (!res.ok && chosenModel !== 'gemini-1.5-flash') {
                console.warn(`Model ${chosenModel} gagal, mencoba fallback ke gemini-1.5-flash...`);
                res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveApiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
                });
                data = await res.json();
            }

            if (!res.ok) throw new Error(data.error?.message || "Failed to fetch");

            let responseText = data.candidates[0].content.parts[0].text;
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

            const parsedMocks = JSON.parse(responseText);
            const mappedMocks = parsedMocks.map((m, idx) => {
                let t = String(m.type || m.tipe || 'single').toLowerCase().trim();
                if (t.includes('short') || t.includes('isian')) t = 'short';
                else if (t.includes('essay') || t.includes('uraian')) t = 'essay';
                else if (t.includes('match') || t.includes('jodoh')) t = 'matching';
                else if (t.includes('bool') || t.includes('salah')) t = 'boolean';
                else if (t.includes('multi') || t.includes('kompleks')) t = 'multiple';
                else t = 'single';

                const opts = m.options || m.opsi || m.pilihan || m.jawaban_pilihan || [];
                let corrAns = String(m.correct ?? m.jawaban ?? m.kunci ?? m.kunci_jawaban ?? m.answer ?? "0").trim();

                if (t === 'single') {
                    if (/^[a-eA-E]$/.test(corrAns)) {
                        corrAns = String(corrAns.toUpperCase().charCodeAt(0) - 65);
                    }
                } else if (t === 'multiple') {
                    corrAns = corrAns.split(',').map(c => {
                        let x = c.trim();
                        if (/^[a-eA-E]$/.test(x)) return String(x.toUpperCase().charCodeAt(0) - 65);
                        return x;
                    }).filter(c => c !== "").join(',');
                }

                const txt = m.text || m.pertanyaan || m.soal || "Soal tidak valid";
                const ind = m.indicator || m.indikator || "";
                const dif = m.difficulty || m.kesulitan || m.level || "MOTS";

                return {
                    ...m,
                    type: t,
                    options: opts,
                    correct: corrAns,
                    text: txt,
                    indicator: ind,
                    difficulty: dif,
                    semester: targetSem,
                    academicYear: targetYear,
                    id: `draft_${Date.now()}_${idx}`,
                    weight: Number(m.weight || m.bobot) || 10
                };
            });

            setAiDrafts(mappedMocks);
            setAiStep(2);
            showToast(`Soal berhasil digenerate AI (${chosenModel})!`, "success");
        } catch (err) {
            console.error(err);
            showToast("Gagal men-generate soal: " + err.message, "error");
        } finally {
            setAiLoading(false);
        }
    };

    const saveAIDrafts = () => {
        const targetSem = aiParams.semester || activeSemester;
        const targetYear = aiParams.academicYear || activeAcademicYear;
        const finalQuestions = aiDrafts.map(d => ({
            ...d,
            subjectId: parseInt(aiParams.subject),
            semester: d.semester || targetSem,
            academicYear: d.academicYear || targetYear,
            id: Date.now() + Math.random()
        }));
        setQuestions(prev => { const next = [...prev, ...finalQuestions]; updateGlobalState({ questions: next }); return next; }); setAiStep(3);
    };

    const handleAiOptionClick = (idx, oIdx, type) => {
        const n = [...aiDrafts];
        if (type === 'single') {
            n[idx].correct = String(oIdx);
        } else {
            let curr = String(n[idx].correct).split(',').filter(x => x !== "");
            if (curr.includes(String(oIdx))) {
                curr = curr.filter(x => x !== String(oIdx));
            } else {
                curr.push(String(oIdx));
            }
            n[idx].correct = curr.join(',');
        }
        setAiDrafts(n);
    };

    const handleAiFieldChange = (idx, field, value, oIdx = null) => {
        const n = [...aiDrafts];
        if (oIdx !== null) {
            n[idx].options[oIdx] = value;
        } else {
            n[idx][field] = value;
        }
        setAiDrafts(n);
    };

    const availableClassYears = Array.from(new Set([
        activeAcademicYear,
        ...classes.map(c => c.academicYear).filter(Boolean),
        ...subjects.map(s => s.academicYear).filter(Boolean)
    ])).filter(Boolean).sort().reverse();

    const filteredClassesList = getMyClasses().filter(c => {
        const matchSearch = c.name.toLowerCase().includes(classSearch.toLowerCase());
        const cYear = c.academicYear || activeAcademicYear;
        const matchYear = !classYearFilter || classYearFilter === 'all'
            ? true
            : (classYearFilter === 'active' ? cYear === activeAcademicYear : cYear === classYearFilter);
        return matchSearch && matchYear;
    });

    const filteredSubjectsList = getMySubjects().filter(s => {
        const sYear = s.academicYear || activeAcademicYear;
        const matchYear = !subjectYearFilter || subjectYearFilter === 'all'
            ? true
            : (subjectYearFilter === 'active' ? sYear === activeAcademicYear : sYear === subjectYearFilter);
        const matchClass = !subjectClassFilter || subjectClassFilter === 'all' || s.class === subjectClassFilter;
        const matchSearch = !subjectSearch || s.name.toLowerCase().includes(subjectSearch.toLowerCase()) || (s.code && s.code.toLowerCase().includes(subjectSearch.toLowerCase()));
        return matchYear && matchClass && matchSearch;
    });

    const filteredBankSubjects = getMySubjects().filter(s => {
        const sYear = s.academicYear || activeAcademicYear;
        const matchYear = !questionYearFilter || questionYearFilter === 'all'
            ? true
            : (questionYearFilter === 'active' ? sYear === activeAcademicYear : sYear === questionYearFilter);
        const matchClass = !questionClassFilter || questionClassFilter === 'all' || s.class === questionClassFilter;
        const matchSearch = !questionSearchSubj || s.name.toLowerCase().includes(questionSearchSubj.toLowerCase()) || (s.code && s.code.toLowerCase().includes(questionSearchSubj.toLowerCase()));
        return matchYear && matchClass && matchSearch;
    });
    const filteredStudentsList = students.filter(s => {
        if (role === 'guru') {
            const allowedClasses = getMyClasses().map(c => c.name);
            if (!allowedClasses.includes(s.class)) return false;
        }
        const matchClass = studentFilterClass ? s.class === studentFilterClass : true;
        const matchSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.nis.includes(studentSearch);
        return matchClass && matchSearch;
    });
    const filteredResultsList = getMyResults().filter(res => {
        const matchClass = analysisFilterClass ? res.class === analysisFilterClass : true;
        const matchSubject = analysisFilterSubject ? res.subject === analysisFilterSubject : true;
        return matchClass && matchSubject;
    });

    const getExamMonitoringData = () => students.map((s, idx) => ({ ...s, status: idx % 3 === 0 ? 'SELESAI' : idx % 3 === 1 ? 'LOGIN' : 'BELUM' }));
    const monitoringData = activeExams.length > 0 ? getExamMonitoringData() : [];
    const statsMonitoring = {
        login: monitoringData.filter(s => s.status === 'LOGIN').length,
        belum: monitoringData.filter(s => s.status === 'BELUM').length,
        selesai: monitoringData.filter(s => s.status === 'SELESAI').length
    };

    const handlePrintResults = () => {
        if (!analysisFilterSubject) return showToast("Silakan filter berdasarkan Mata Pelajaran terlebih dahulu!", "error");

        setPrintData({
            type: 'results',
            subjectName: analysisFilterSubject,
            className: analysisFilterClass || 'Semua Kelas',
            results: filteredResultsList.sort((a, b) => b.score - a.score),
            date: new Date().toISOString()
        });
    };

    const handlePrintExcel = () => {
        const headers = ["Rank,Nama,Kelas,Mata Pelajaran,Waktu,Nilai,Status"];
        const rows = filteredResultsList.sort((a, b) => b.score - a.score).map((res, idx) => {
            const status = res.score >= 75 ? "LULUS" : "REMEDIAL";
            return `${idx + 1},"${res.studentName}","${res.class}","${res.subject}",${res.submittedAt},${res.score},${status}`;
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `Nilai_Ujian.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link); showToast("Data Excel Diunduh!");
    };

    const handleOpenPrintPreview = (type) => {
        if (!printForm.class || !printForm.subject || !printForm.date) return showToast("Lengkapi form administrasi!", "error");
        const classStudents = students.filter(s => s.class === printForm.class);
        const selectedSubjObj = subjects.find(s => String(s.id) === String(printForm.subject));
        const teacherName = teachers.find(t => t.id === selectedSubjObj?.teacherId)?.name || schoolData.adminName;

        setPrintData({
            type,
            class: printForm.class,
            subjectName: selectedSubjObj?.name || 'Mapel',
            date: printForm.date,
            students: classStudents,
            teacherName: teacherName,
            questions: questions.filter(q => String(q.subjectId) === String(printForm.subject)),
            printForm: printForm
        });
    };

    const handleQuestionImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditingItem(prev => ({ ...prev, image: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleLogoUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setTempLogo(reader.result); reader.readAsDataURL(file); } };
    const [tempSchoolLogo, setTempSchoolLogo] = useState(null);
    const handleSchoolLogoUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setTempSchoolLogo(reader.result); reader.readAsDataURL(file); } };
    const handleSaveSchool = (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.target).entries());
        const sem = d.semester || activeSemester;
        const year = d.academicYear || activeAcademicYear;
        const term = `${sem} ${year}`;
        setSchoolData(p => {
            const next = {
                ...p,
                ...d,
                semester: sem,
                academicYear: year,
                term: term,
                logo: EQUEST_LOGO,
                schoolLogo: tempSchoolLogo || p.schoolLogo || ''
            };
            updateGlobalState({ schoolData: next });
            return next;
        });
        showToast("Pengaturan Berhasil Disimpan!", "success");
    };

    const processImport = async (type, useAI, fileName, parsedRows, rawFile) => {
        if (type === 'Data Murid' && parsedRows) {
            if (parsedRows.length <= 1) return showToast("File Excel kosong atau format salah", "error");
            const newStudents = [];
            for (let i = 1; i < parsedRows.length; i++) {
                const cols = parsedRows[i];
                if (cols.length >= 4 && cols[0]) {
                    newStudents.push({ id: Date.now() + i, name: String(cols[0]), class: String(cols[1]), nis: String(cols[2]), password: String(cols[3]) });
                }
            }
            setStudents(p => { const next = [...p, ...newStudents]; updateGlobalState({ students: next }); return next; });
            showToast(`Berhasil import ${newStudents.length} data murid dari file ${fileName}`, "success");
        }
        else if (type === 'Data Kelas' && parsedRows) {
            if (parsedRows.length <= 1) return showToast("File Excel kosong atau format salah", "error");
            const newClasses = [];
            for (let i = 1; i < parsedRows.length; i++) {
                const cols = parsedRows[i];
                if (cols.length >= 2 && cols[0]) {
                    newClasses.push({ id: Date.now() + i, name: String(cols[0]), level: String(cols[1]) });
                }
            }
            setClasses(p => { const next = [...p, ...newClasses]; updateGlobalState({ classes: next }); return next; });
            showToast(`Berhasil import ${newClasses.length} data kelas dari file ${fileName}`, "success");
        }
        else if (type === 'Bank Soal') {
            const subId = selectedSubjectForQuestions ? selectedSubjectForQuestions.id : subjects[0]?.id;
            if (!subId) return showToast("Pilih mapel terlebih dahulu sebelum mengimpor soal!", "error");

            if (parsedRows && !useAI) {
                if (parsedRows.length <= 1) return showToast("File Excel kosong atau format salah", "error");
                const newQuestions = [];
                for (let i = 1; i < parsedRows.length; i++) {
                    const cols = parsedRows[i];
                    if (cols.length >= 5 && cols[0]) {
                        let qType = String(cols[0]).toLowerCase().trim();
                        if (qType.includes('short') || qType.includes('isian')) qType = 'short';
                        else if (qType.includes('essay') || qType.includes('uraian')) qType = 'essay';
                        else if (qType.includes('match') || qType.includes('jodoh')) qType = 'matching';
                        else if (qType.includes('bool') || qType.includes('salah')) qType = 'boolean';
                        else if (qType.includes('multi') || qType.includes('kompleks')) qType = 'multiple';
                        else qType = 'single';

                        let optionsArr = [cols[5] || "", cols[6] || "", cols[7] || "", cols[8] || "", cols[9] || ""];
                        if (qType !== 'single' && qType !== 'multiple') optionsArr = [];

                        let corrAns = String(cols[10] ?? "").trim();
                        if (qType === 'single') {
                            if (/^[a-eA-E]$/.test(corrAns)) {
                                corrAns = String(corrAns.toUpperCase().charCodeAt(0) - 65);
                            } else {
                                corrAns = corrAns || "0";
                            }
                        } else if (qType === 'multiple') {
                            corrAns = corrAns.split(',').map(c => {
                                let t = c.trim();
                                if (/^[a-eA-E]$/.test(t)) return String(t.toUpperCase().charCodeAt(0) - 65);
                                return t;
                            }).filter(c => c !== "").join(',');
                        } else if (qType === 'boolean') {
                            corrAns = corrAns || "0";
                        }

                        newQuestions.push({
                            id: Date.now() + i,
                            subjectId: subId,
                            type: qType,
                            difficulty: String(cols[1] || 'MOTS'),
                            weight: parseInt(cols[2]) || 10,
                            indicator: String(cols[3] || ''),
                            text: String(cols[4] || 'Soal tidak valid'),
                            options: optionsArr,
                            correct: corrAns,
                            semester: activeSemester,
                            academicYear: activeAcademicYear
                        });
                    }
                }
                setQuestions(p => { const next = [...p, ...newQuestions]; updateGlobalState({ questions: next }); return next; });
                showToast(`Berhasil import ${newQuestions.length} soal presisi dari Excel!`, "success");
            } else if (useAI && rawFile) {
                setAiLoading(true);
                try {
                    const base64Data = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result.split(',')[1]);
                        reader.readAsDataURL(rawFile);
                    });
                    const mimeType = rawFile.type || "text/plain";

                    const promptText = `Ekstrak soal-soal dari dokumen ini. Anda adalah pembuat soal CBT profesional. Ubah soal-soal dalam dokumen menjadi format JSON Array murni.
Ketentuan struktur JSON untuk setiap objek soal:
{ "type": "single|multiple|boolean|matching|short|essay", "text": "Pertanyaan lengkap", "options": ["Opsi A", "Opsi B"], "correct": "0", "difficulty": "MOTS", "weight": 10, "indicator": "Materi terkait" }
Catatan: 
- "correct" untuk 'single'/'boolean' adalah index dari options (0,1,2..).
- "correct" untuk 'short'/'essay'/'matching' adalah teks langsung dari kunci jawaban atau rubriknya.
Hanya outputkan JSON Array tanpa tag markdown \`\`\`json.`;

                    const modelToUse = schoolData.aiModel || "gemini-1.5-flash";
                    let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${schoolData.apiKey}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: promptText }, { inlineData: { mimeType, data: base64Data } }] }]
                        })
                    });
                    let data = await res.json();

                    if (!res.ok && modelToUse !== 'gemini-1.5-flash') {
                        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${schoolData.apiKey}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: promptText }, { inlineData: { mimeType, data: base64Data } }] }]
                            })
                        });
                        data = await res.json();
                    }

                    if (!res.ok) throw new Error(data.error?.message || "Gagal dari API Gemini");

                    let responseText = data.candidates[0].content.parts[0].text;
                    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

                    const parsedArray = JSON.parse(responseText);
                    const newQuestions = parsedArray.map((m, idx) => {
                        let t = String(m.type || m.tipe || 'single').toLowerCase().trim();
                        if (t.includes('short') || t.includes('isian')) t = 'short';
                        else if (t.includes('essay') || t.includes('uraian')) t = 'essay';
                        else if (t.includes('match') || t.includes('jodoh')) t = 'matching';
                        else if (t.includes('bool') || t.includes('salah')) t = 'boolean';
                        else if (t.includes('multi') || t.includes('kompleks')) t = 'multiple';
                        else t = 'single';

                        const opts = m.options || m.opsi || m.pilihan || m.jawaban_pilihan || [];
                        const corr = m.correct ?? m.jawaban ?? m.kunci ?? m.kunci_jawaban ?? m.answer ?? "0";
                        const txt = m.text || m.pertanyaan || m.soal || "Soal tidak valid";
                        const ind = m.indicator || m.indikator || "";
                        const dif = m.difficulty || m.kesulitan || m.level || "MOTS";

                        return {
                            ...m,
                            type: t,
                            options: opts,
                            correct: corr,
                            text: txt,
                            indicator: ind,
                            difficulty: dif,
                            id: Date.now() + idx,
                            subjectId: subId,
                            semester: activeSemester,
                            academicYear: activeAcademicYear,
                            weight: Number(m.weight || m.bobot) || 10
                        };
                    });

                    setQuestions(prev => { const next = [...prev, ...newQuestions]; updateGlobalState({ questions: next }); return next; });
                    showToast(`AI berhasil mengekstrak ${newQuestions.length} soal presisi dari dokumen!`, "success");
                } catch (err) {
                    console.error(err);
                    showToast("AI Gagal mengekstrak soal: " + err.message, "error");
                } finally {
                    setAiLoading(false);
                }
            }
        } else {
            showToast(`Import ${type} dari file ${fileName} berhasil disimulasikan.`, "success");
        }
    };

    const isAiWizardFormValid = aiParams.subject && aiParams.topic && !aiLoading && Object.values(aiParams.counts).reduce((a, b) => a + Number(b), 0) > 0;
    const totalAiKognitif = Number(aiParams.pcts.lots) + Number(aiParams.pcts.mots) + Number(aiParams.pcts.hots);
    const totalAiSoal = Object.values(aiParams.counts).reduce((a, b) => a + Number(b), 0);

    // --- RENDERERS ---

    if (printData) return <PrintLayout type={printData.type} data={printData} schoolData={schoolData} onBack={() => setPrintData(null)} />;

    // Tampilkan loading screen selama data dari Firestore belum selesai dimuat
    if (!dbLoaded) return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
                <img src={EQUEST_LOGO} alt="Logo" className="w-14 h-14 object-contain" />
            </div>
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm font-semibold">Menghubungkan ke database...</p>
            </div>
        </div>
    );

    if (!role) return (
        <div className="min-h-screen bg-slate-900 relative overflow-hidden flex flex-col justify-center items-center p-4 sm:p-8 font-sans no-scrollbar">

            {/* Elegant Architectural Background */}
            <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute left-0 right-0 top-[-10%] -z-10 m-auto h-[400px] w-[400px] rounded-full bg-blue-600 opacity-20 blur-[120px] pointer-events-none"></div>

            <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3">
                {toasts.map(t => <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />)}
            </div>

            {loginTab === 'student' ? (
                /* Main Student Login Form */
                <motion.div
                    key="student-login"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full max-w-[420px] bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/50 p-8 sm:p-10 z-10 flex flex-col relative overflow-hidden"
                >
                    <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-blue-600 transition-colors p-2 bg-white/50 rounded-full hover:bg-white"><ChevronLeft size={18} /></button>

                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"></div>

                    <div className="flex justify-center mb-8 mt-2">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-24 h-24 bg-white p-4 rounded-[1.5rem] shadow-xl shadow-blue-900/10 flex items-center justify-center border border-white"
                        >
                            <img src={schoolData.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
                        </motion.div>
                    </div>

                    <div className="text-center mb-5">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mb-2">Portal Siswa</h1>
                        <p className="text-slate-500 text-[11px] font-bold tracking-[0.2em] uppercase">
                            {schoolData.name}
                        </p>
                    </div>

                    <div className="mb-6">
                        <PwaInstallPrompt variant="card" />
                    </div>

                    <form onSubmit={handleStudentLogin} className="space-y-5 w-full">
                        <div className="space-y-1.5 text-left">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nomor Induk Siswa</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input name="username" required placeholder="Masukkan NIS Anda" className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/80 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-800 font-bold placeholder-slate-400 text-sm shadow-sm backdrop-blur-sm" />
                            </div>
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kata Sandi</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input name="password" type="password" required placeholder="••••••••" className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/80 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-800 font-bold placeholder-slate-400 text-sm shadow-sm backdrop-blur-sm" />
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all mt-8 text-sm flex justify-center items-center gap-2 uppercase tracking-widest"
                        >
                            Mulai Ujian <ChevronRight size={18} />
                        </motion.button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-200/50">
                        <button
                            type="button"
                            onClick={() => setLoginTab('admin')}
                            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 text-[10px] font-bold uppercase tracking-wider transition-colors py-2"
                        >
                            <UserCog size={16} /> Akses Login Guru / Admin
                        </button>
                    </div>
                </motion.div>
            ) : (
                /* Admin Login Full Page Form */
                <motion.div
                    key="admin-login"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full max-w-[400px] bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 sm:p-10 z-10 relative overflow-hidden"
                >
                    <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600 transition-colors p-2 bg-slate-100 rounded-full hover:bg-indigo-50"><ChevronLeft size={18} /></button>

                    <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-900"></div>

                    <div className="text-center mb-8 mt-2">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <UserCog size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Portal Edukator</h2>
                        <p className="text-slate-500 text-xs mt-1 font-medium">Manajemen sistem dan laporan CBT</p>
                    </div>

                    <form onSubmit={handleSystemLogin} className="space-y-5">
                        <div className="space-y-1.5 text-left">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <input name="username" required placeholder="Username Anda" className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-800 font-bold placeholder-slate-400 text-sm" />
                            </div>
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kata Sandi</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <input name="password" type="password" required placeholder="••••••••" className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-800 font-bold placeholder-slate-400 text-sm" />
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-4 rounded-xl shadow-lg transition-all mt-8 text-sm flex justify-center items-center gap-2 uppercase tracking-widest"
                        >
                            Masuk Panel <ChevronRight size={18} />
                        </motion.button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-200/50">
                        <button
                            type="button"
                            onClick={() => setLoginTab('student')}
                            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-blue-600 text-[10px] font-bold uppercase tracking-wider transition-colors py-2"
                        >
                            Akses Login Siswa
                        </button>
                    </div>
                </motion.div>
            )}

            <div className="w-full text-center mt-12 text-[10px] font-bold tracking-widest uppercase text-slate-400 z-10 opacity-70">
                e-Quest Premium CBT &copy; {new Date().getFullYear()} • Secure Access<br />By Mas Alfy | {schoolData.name}
            </div>
        </div>
    );

    if (role === 'student') {
        const activeExamSemester = currentExamSubject?.semester || activeSemester;
        const activeExamYear = currentExamSubject?.academicYear || activeAcademicYear;
        const stdQuestions = studentStep === 'exam' ? shuffledExamQuestions : questions.filter(q => q.subjectId === currentExamSubject?.id && ((q.semester || activeSemester).toLowerCase() === activeExamSemester.toLowerCase()));
        return (
            <div className="min-h-screen bg-slate-50 font-sans">
                <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2">{toasts.map(t => <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />)}</div>
                {studentStep === 'token' ? (
                    <div className="min-h-screen flex items-center justify-center p-6">
                        <form onSubmit={handleTokenSubmit} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm space-y-5 text-center border border-slate-100 animate-fade-in">
                            <div className="bg-indigo-50 p-4 rounded-2xl inline-flex text-indigo-600 mb-1">
                                <Key size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Masukkan Token Ujian</h2>
                                <p className="text-slate-500 text-xs mt-1">Minta token ujian yang aktif kepada Pengawas.</p>
                            </div>

                            <PwaInstallPrompt variant="card" />

                            <input 
                                name="token" 
                                required 
                                placeholder="TOKEN" 
                                className="w-full p-4 text-center text-xl font-mono tracking-widest border border-slate-200 rounded-2xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none uppercase font-bold text-slate-700 shadow-sm" 
                            />
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-indigo-500/20 transition-all">
                                VALIDASI TOKEN
                            </button>
                            <button type="button" onClick={() => setRole(null)} className="text-slate-400 hover:text-indigo-600 text-xs font-semibold block mx-auto">
                                ← Kembali ke Login
                            </button>
                        </form>
                    </div>
                ) : studentStep === 'biodata' ? (
                    <div className="min-h-screen flex items-center justify-center p-6"><div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100"><div className="bg-indigo-600 p-6 text-white flex justify-between items-center"><div><h1 className="text-lg font-bold">Konfirmasi Data</h1><p className="text-indigo-200 text-xs mt-1">Cek data sebelum ujian</p></div><User className="w-10 h-10 bg-indigo-500/50 p-2 rounded-xl" /></div><div className="p-6 space-y-6"><div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-100"><div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500 text-sm">Nama</span><span className="font-bold text-slate-800">{currentUser.name}</span></div><div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500 text-sm">Kelas</span><span className="font-bold text-slate-800">{currentUser.class}</span></div><div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500 text-sm">Ujian Aktif</span><span className="font-bold text-indigo-600">{currentExamSubject?.name}</span></div><div className="flex justify-between"><span className="text-slate-500 text-sm">Semester Ujian</span><span className="font-bold text-purple-700">Semester {activeExamSemester} ({activeExamYear})</span></div></div><button onClick={() => {
                        const targetSemester = activeExamSemester.toLowerCase();
                        const baseQ = questions.filter(q => {
                            const matchSubject = q.subjectId === currentExamSubject?.id;
                            const qSem = (q.semester || activeSemester).toLowerCase();
                            return matchSubject && (qSem === targetSemester);
                        });

                        if (baseQ.length === 0) {
                            showToast(`Belum ada butir soal untuk mata pelajaran ini pada Semester ${activeExamSemester}. Silakan hubungi pengawas / guru.`, "error");
                            return;
                        }

                        let finalQuestions = baseQ;
                        if (currentExamSubject?.blueprint) {
                            const { total = 25, lots = 20, mots = 50, hots = 30 } = currentExamSubject.blueprint;
                            const totalNum = parseInt(total) || 25;
                            const tLots = Math.round((parseInt(lots) / 100) * totalNum);
                            const tMots = Math.round((parseInt(mots) / 100) * totalNum);
                            const tHots = totalNum - tLots - tMots;

                            const qLots = baseQ.filter(q => q.difficulty === 'LOTS').sort(() => Math.random() - 0.5);
                            const qMots = baseQ.filter(q => q.difficulty === 'MOTS').sort(() => Math.random() - 0.5);
                            const qHots = baseQ.filter(q => q.difficulty === 'HOTS').sort(() => Math.random() - 0.5);

                            let picked = [...qLots.slice(0, tLots), ...qMots.slice(0, tMots), ...qHots.slice(0, tHots)];
                            if (picked.length < totalNum) {
                                const pickedIds = new Set(picked.map(q => q.id));
                                const remaining = baseQ.filter(q => !pickedIds.has(q.id)).sort(() => Math.random() - 0.5);
                                picked = [...picked, ...remaining.slice(0, totalNum - picked.length)];
                            }
                            finalQuestions = picked;
                        }

                        const shuffled = finalQuestions.map(q => {
                            if (q.type === 'single' || q.type === 'multiple') {
                                const optsWithOrig = (q.options || []).map((text, idx) => ({ text: String(text || ""), origIndex: idx })).filter(o => o.text.trim() !== "");
                                optsWithOrig.sort(() => Math.random() - 0.5);
                                const newOptions = optsWithOrig.map(o => o.text);
                                let newCorrect = q.correct;
                                if (q.type === 'single') {
                                    newCorrect = String(optsWithOrig.findIndex(o => o.origIndex === parseInt(q.correct)));
                                } else if (q.type === 'multiple') {
                                    const cInts = String(q.correct).split(',').map(Number);
                                    newCorrect = cInts.map(c => optsWithOrig.findIndex(o => o.origIndex === c)).filter(i => i !== -1).join(',');
                                }
                                return { ...q, options: newOptions, correct: newCorrect };
                            } else if (q.type === 'boolean') {
                                return { ...q, options: ['Benar', 'Salah'] };
                            } else if (q.type === 'matching') {
                                const pairs = String(q.correct).split('\n').filter(Boolean).map(line => line.split('|').map(s => s.trim()));
                                const rightItems = [...new Set(pairs.map(p => p[1]))];
                                rightItems.sort(() => Math.random() - 0.5);
                                return { ...q, options: rightItems };
                            }
                            return q;
                        }).sort(() => Math.random() - 0.5);
                        setShuffledExamQuestions(shuffled);
                        setStudentStep('exam');
                        setLiveStatus(prev => { const newStatus = { ...prev, [currentUser.id]: { status: 'Mengerjakan', cheat: false, time: Date.now() } }; updateGlobalState({ liveStatus: newStatus }); return newStatus; });
                    }} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 shadow-sm">MULAI KERJAKAN</button></div></div></div>
                ) : studentStep === 'exam' ? (
                    <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden select-none no-scrollbar">
                        <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm z-20 shrink-0 border-b border-slate-200">
                            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><User size={20} /></div><div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Siswa Aktif</div><div className="font-bold text-slate-800 text-sm">{currentUser.name} ({currentUser.class})</div></div></div>
                            <div className="hidden sm:flex flex-col items-center">
                                <div className="font-bold text-slate-800 text-sm">{currentExamSubject?.name}</div>
                                <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">Semester {activeExamSemester} • TP {activeExamYear}</div>
                            </div>
                            <div className="flex gap-2"><div className={`px-4 py-2 rounded-lg font-bold text-sm flex gap-2 items-center ${examTimeLeft < 300 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}><Clock size={16} /> {Math.floor(examTimeLeft / 3600).toString().padStart(2, '0')}:{Math.floor((examTimeLeft % 3600) / 60).toString().padStart(2, '0')}:{(examTimeLeft % 60).toString().padStart(2, '0')}</div></div>
                        </div>
                        <div className="flex-1 flex overflow-hidden bg-slate-50">
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col lg:flex-row items-center lg:items-start gap-6 no-scrollbar">
                                {stdQuestions.length > 0 ? (
                                    <>
                                        <div className="w-full max-w-3xl flex-1 flex flex-col gap-6">
                                            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 w-full">
                                                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                                    <h2 className="text-lg font-bold text-slate-800">Soal {currentQIndex + 1} dari {stdQuestions.length}</h2>
                                                    <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-bold text-sm">Bobot: {stdQuestions[currentQIndex].weight}</div>
                                                </div>

                                                {/* BLOK STIMULUS SOAL SISWA */}
                                                {(() => {
                                                    const curQ = stdQuestions[currentQIndex];
                                                    const stim = stimuli.find(s => s.id === curQ?.stimulusId);
                                                    if (!stim) return null;
                                                    return (
                                                        <div className="mb-6 bg-gradient-to-br from-indigo-50/80 via-slate-50 to-purple-50/60 border-2 border-indigo-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-indigo-100">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg tracking-wide uppercase flex items-center gap-1.5 shadow-xs">
                                                                        <BookOpen size={13} /> Stimulus Soal
                                                                    </span>
                                                                    <span className="text-xs font-bold text-slate-800">{stim.title}</span>
                                                                </div>
                                                                {stim.source && (
                                                                    <span className="text-[10px] text-slate-500 italic bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                                                                        Sumber: {stim.source}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Gambar Stimulus */}
                                                            {stim.imageUrl && (
                                                                <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 bg-white p-1 shadow-xs max-w-lg mx-auto">
                                                                    <img src={stim.imageUrl} alt={stim.title} className="w-full max-h-72 object-contain rounded-lg mx-auto" />
                                                                </div>
                                                            )}

                                                            {/* Tabel Stimulus */}
                                                            {stim.tableData && stim.tableData.length > 0 && (
                                                                <div className="mb-4 overflow-x-auto rounded-xl border border-indigo-200/80 bg-white shadow-xs">
                                                                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                                                        {stim.tableData[0] && (
                                                                            <thead className="bg-indigo-600 text-white font-semibold">
                                                                                <tr>
                                                                                    {stim.tableData[0].map((th, thIdx) => (
                                                                                        <th key={thIdx} className="p-2.5 sm:p-3 border-b border-indigo-700 font-semibold tracking-wide">{th}</th>
                                                                                    ))}
                                                                                </tr>
                                                                            </thead>
                                                                        )}
                                                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                                                            {stim.tableData.slice(1).map((row, rIdx) => (
                                                                                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white hover:bg-indigo-50/40 transition-colors' : 'bg-slate-50/70 hover:bg-indigo-50/40 transition-colors'}>
                                                                                    {row.map((cell, cIdx) => (
                                                                                        <td key={cIdx} className="p-2.5 sm:p-3">{cell}</td>
                                                                                    ))}
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}

                                                            {/* Naskah / Teks Stimulus */}
                                                            {stim.content && (
                                                                <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-normal bg-white/80 p-3.5 rounded-xl border border-slate-200/80">
                                                                    {stim.content}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {stdQuestions[currentQIndex].image && <img src={stdQuestions[currentQIndex].image} alt="Ilustrasi" className="max-h-64 object-contain rounded-xl mb-6 border border-slate-200 mx-auto" />}
                                                <p className="text-slate-800 text-base font-medium mb-8 leading-relaxed whitespace-pre-wrap">{stdQuestions[currentQIndex].text}</p>

                                                <div className="space-y-3 mb-8">
                                                    {(stdQuestions[currentQIndex].type?.toLowerCase().trim() === 'single' || stdQuestions[currentQIndex].type?.toLowerCase().trim() === 'boolean') ? (
                                                        (stdQuestions[currentQIndex].options || []).map((opt, i) => (
                                                            <label key={i} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${examAnswers[currentQIndex] === String(i) ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                                                                <input type="radio" name={`q_${currentQIndex}`} className="hidden" checked={examAnswers[currentQIndex] === String(i)} onChange={() => setExamAnswers(p => ({ ...p, [currentQIndex]: String(i) }))} />
                                                                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shrink-0 ${examAnswers[currentQIndex] === String(i) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>{stdQuestions[currentQIndex].type === 'boolean' ? (i === 0 ? 'B' : 'S') : String.fromCharCode(65 + i)}</span>
                                                                <span className="text-sm font-medium">{opt}</span>
                                                            </label>
                                                        ))
                                                    ) : stdQuestions[currentQIndex].type?.toLowerCase().trim() === 'multiple' ? (
                                                        (stdQuestions[currentQIndex].options || []).map((opt, i) => {
                                                            const currentAns = examAnswers[currentQIndex] ? String(examAnswers[currentQIndex]).split(',') : [];
                                                            const isChecked = currentAns.includes(String(i));
                                                            return (
                                                                <label key={i} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isChecked ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                                                                    <input type="checkbox" className="hidden" checked={isChecked} onChange={(e) => {
                                                                        let newAns = [...currentAns];
                                                                        if (e.target.checked) newAns.push(String(i)); else newAns = newAns.filter(a => a !== String(i));
                                                                        setExamAnswers(p => ({ ...p, [currentQIndex]: newAns.join(',') }));
                                                                    }} />
                                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>{isChecked && <Check size={14} />}</div>
                                                                    <span className="text-sm font-medium">{opt}</span>
                                                                </label>
                                                            )
                                                        })
                                                    ) : stdQuestions[currentQIndex].type?.toLowerCase().trim() === 'matching' ? (
                                                        <div className="space-y-4">
                                                            {String(stdQuestions[currentQIndex].correct).split('\n').filter(Boolean).map((line, idx) => {
                                                                const leftItem = line.split('|')[0]?.trim();
                                                                if (!leftItem) return null;
                                                                let currentAns = {};
                                                                try { currentAns = JSON.parse(examAnswers[currentQIndex] || "{}"); } catch (e) { }
                                                                return (
                                                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-colors">
                                                                        <div className="flex-1 font-medium text-slate-700">{leftItem}</div>
                                                                        <select
                                                                            className="w-full sm:w-1/2 p-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium text-slate-700 cursor-pointer"
                                                                            value={currentAns[leftItem] || ""}
                                                                            onChange={(e) => {
                                                                                const selectedVal = e.target.value;
                                                                                if (selectedVal !== "" && Object.values(currentAns).includes(selectedVal)) {
                                                                                    showToast("Jawaban ini sudah digunakan di pernyataan lain!", "error");
                                                                                    return;
                                                                                }
                                                                                const newAns = { ...currentAns, [leftItem]: selectedVal };
                                                                                setExamAnswers(p => ({ ...p, [currentQIndex]: JSON.stringify(newAns) }));
                                                                            }}
                                                                        >
                                                                            <option value="">-- Pilih Pasangan --</option>
                                                                            {(stdQuestions[currentQIndex].options || []).map((opt, oIdx) => (
                                                                                <option key={oIdx} value={opt}>{opt}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <textarea rows="4" className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-700 transition-all" placeholder="Ketik jawaban Anda di sini..." value={examAnswers[currentQIndex] || ''} onChange={e => setExamAnswers(p => ({ ...p, [currentQIndex]: e.target.value }))}></textarea>
                                                    )}
                                                </div>

                                                <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                                                    <button onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))} disabled={currentQIndex === 0} className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 disabled:opacity-50 hover:bg-slate-200 transition-all flex items-center gap-2"><ChevronLeft size={18} /> Sebelumnya</button>
                                                    {currentQIndex === stdQuestions.length - 1 ? (
                                                        <button onClick={() => handleStudentFinish(examAnswers)} className="px-8 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2">Selesai & Kirim <CheckCircle size={18} /></button>
                                                    ) : (
                                                        <button onClick={() => setCurrentQIndex(currentQIndex + 1)} className="px-8 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2">Selanjutnya <ChevronRight size={18} /></button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full lg:w-72 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 shrink-0">
                                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Grid size={18} /> Navigasi Soal</h3>
                                            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2">
                                                {stdQuestions.map((q, idx) => {
                                                    let isAnswered = false;
                                                    const ans = examAnswers[idx];
                                                    if (ans !== undefined && ans !== null && ans !== "") {
                                                        if (q.type === 'matching') {
                                                            try {
                                                                const parsed = JSON.parse(ans);
                                                                isAnswered = Object.keys(parsed).length > 0;
                                                            } catch (e) { }
                                                        } else {
                                                            isAnswered = true;
                                                        }
                                                    }
                                                    const isCurrent = currentQIndex === idx;
                                                    return (
                                                        <button key={idx} onClick={() => setCurrentQIndex(idx)}
                                                            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold border transition-colors ${isCurrent ? 'ring-2 ring-indigo-500 border-indigo-500 ' : ''
                                                                } ${isAnswered ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                                                }`}>
                                                            {idx + 1}
                                                        </button>
                                                    )
                                                })}
                                            </div>

                                            <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-4">
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600"><div className="w-4 h-4 rounded bg-indigo-600"></div> Sudah Dijawab</div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600"><div className="w-4 h-4 rounded bg-white border border-slate-300"></div> Belum Dijawab</div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600"><div className="w-4 h-4 rounded border-2 border-indigo-500"></div> Posisi Saat Ini</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center mt-10 w-full max-w-3xl mx-auto">
                                        <AlertTriangle size={48} className="mx-auto text-rose-500 mb-4" />
                                        <h2 className="text-lg font-bold text-slate-800 mb-2">Soal Belum Tersedia</h2>
                                        <p className="text-slate-500 text-sm">Belum ada soal untuk mata pelajaran ini. Silakan lapor ke pengawas.</p>
                                        <button onClick={() => setRole(null)} className="mt-6 px-6 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Kembali ke Login</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="min-h-screen flex items-center justify-center p-6">
                        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center space-y-6 max-w-sm w-full">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500"><CheckCircle size={32} /></div>
                            <h2 className="text-2xl font-bold text-slate-800">Ujian Selesai</h2>
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Skor Akhir (Sistem Bobot)</div>
                                <div className="text-4xl font-black text-indigo-600">{studentScore.toFixed(0)}</div>
                            </div>
                            {studentScore >= 75 && (
                                <button onClick={() => {
                                    const certWindow = window.open('', '_blank');
                                    certWindow.document.write(`
                                <html><head><title>Sertifikat Kelulusan - ${currentUser?.name}</title><style>
                                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f1f5f9; margin: 0; }
                                .cert { width: 800px; padding: 40px; background: white; border: 10px solid #4f46e5; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); position: relative; }
                                .title { font-size: 48px; color: #1e293b; font-weight: 900; margin-bottom: 10px; text-transform: uppercase; }
                                .subtitle { font-size: 20px; color: #64748b; margin-bottom: 40px; }
                                .name { font-size: 40px; color: #4f46e5; font-weight: bold; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; display: inline-block; min-width: 400px; margin-bottom: 30px; }
                                .desc { font-size: 18px; color: #475569; line-height: 1.6; margin-bottom: 40px; }
                                .score { font-size: 32px; font-weight: bold; color: #10b981; margin-bottom: 40px; }
                                .footer { display: flex; justify-content: space-between; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; font-size: 14px; }
                                </style></head><body>
                                <div class="cert">
                                    <div class="title">SERTIFIKAT KELULUSAN</div>
                                    <div class="subtitle">Diberikan secara resmi kepada:</div>
                                    <div class="name">${currentUser?.name}</div>
                                    <div class="desc">Telah berhasil menyelesaikan ujian <strong>${currentExamSubject?.name}</strong><br/>dengan hasil yang sangat memuaskan dan dinyatakan <strong>LULUS</strong>.</div>
                                    <div class="score">Skor Akhir: ${studentScore.toFixed(0)}</div>
                                    <div class="footer">
                                        <div>Diterbitkan pada: ${new Date().toLocaleDateString('id-ID')}</div>
                                        <div>Disahkan oleh: ${schoolData.name}</div>
                                    </div>
                                </div>
                                <script>setTimeout(() => window.print(), 500);</script>
                                </body></html>
                                `);
                                    certWindow.document.close();
                                }} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 shadow-md flex items-center justify-center gap-2 mb-2 transition-all">
                                    <BadgeCheck size={18} /> Cetak Sertifikat
                                </button>
                            )}
                            <button onClick={() => setRole(null)} className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold hover:bg-slate-900 shadow-sm">Kembali ke Beranda</button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // --- ADMIN / GURU DASHBOARD RENDER ---
    return (
        <div className="min-h-screen bg-slate-50 relative flex font-sans overflow-hidden no-scrollbar">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none"></div>

            <div className="fixed top-6 right-6 z-[999] flex flex-col gap-3">{toasts.map(t => <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />)}</div>

            <ConfirmModal isOpen={deleteConfig.isOpen} onClose={() => setDeleteConfig({ isOpen: false, type: '', id: null })} onConfirm={confirmDelete} title="Konfirmasi Hapus" message="Data yang dihapus tidak bisa dikembalikan." />
            <ImportModal isOpen={importModalConfig.isOpen} type={importModalConfig.type} showToast={showToast} onClose={() => setImportModalConfig({ isOpen: false, type: '' })} onImport={processImport} apiKey={effectiveApiKey} aiModel={effectiveAiModel || "gemini-1.5-flash"} />

            {/* AI WIZARD OVERLAY */}
            {aiWizardOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 sm:p-8 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/50 relative">
                        <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 p-6 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
                            <div className="absolute right-0 top-0 opacity-10 scale-150 transform -translate-y-4"><BrainCircuit size={120} /></div>
                            <div className="relative z-10">
                                <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles size={20} className="text-fuchsia-300" /> AI Wizard Premium</h2>
                                <p className="text-purple-100 text-xs font-medium mt-1">Otomatisasi pembuatan soal cerdas terintegrasi kurikulum.</p>
                            </div>
                            <button onClick={() => setAiWizardOpen(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors relative z-10"><X size={20} /></button>
                        </div>

                        <div className="flex bg-slate-50 p-3 shrink-0 border-b border-slate-200">
                            <div className={`flex-1 text-center font-bold tracking-wider uppercase text-[10px] border-b-[3px] pb-2 transition-all ${aiStep >= 1 ? 'border-fuchsia-500 text-fuchsia-700' : 'border-slate-200 text-slate-400'}`}>Langkah 1 <br /><span className="text-xs capitalize tracking-normal font-semibold mt-1 inline-block">Parameter Pembelajaran</span></div>
                            <div className={`flex-1 text-center font-bold tracking-wider uppercase text-[10px] border-b-[3px] pb-2 transition-all ${aiStep >= 2 ? 'border-fuchsia-500 text-fuchsia-700' : 'border-slate-200 text-slate-400'}`}>Langkah 2 <br /><span className="text-xs capitalize tracking-normal font-semibold mt-1 inline-block">Review & Edit Kognitif</span></div>
                            <div className={`flex-1 text-center font-bold tracking-wider uppercase text-[10px] border-b-[3px] pb-2 transition-all ${aiStep >= 3 ? 'border-fuchsia-500 text-fuchsia-700' : 'border-slate-200 text-slate-400'}`}>Langkah 3 <br /><span className="text-xs capitalize tracking-normal font-semibold mt-1 inline-block">Distribusi Soal</span></div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 no-scrollbar">
                            {aiStep === 1 && (
                                <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-fuchsia-100 text-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-3"><Settings size={32} /></div>
                                        <h3 className="text-2xl font-bold text-slate-800">Tentukan Parameter & Distribusi</h3>
                                        {!effectiveApiKey && <p className="text-xs font-bold text-rose-500 mt-2 flex items-center justify-center gap-1"><AlertCircle size={14} />Peringatan: API Key Gemini belum diatur. Masukkan API Key di bawah untuk mulai membuat soal.</p>}
                                    </div>

                                    {/* Versi Model AI & API Key Mandiri */}
                                    {role === 'guru' ? (
                                        <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 p-4 rounded-2xl border border-purple-200 shadow-xs space-y-3">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                                        <BrainCircuit size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Model AI Terhubung</span>
                                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${currentUser?.apiKey ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}`}>
                                                                {currentUser?.apiKey ? 'API Key Mandiri Guru' : 'API Key Sekolah'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{effectiveAiModel}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <select
                                                        value={effectiveAiModel}
                                                        onChange={e => handleSelectTeacherModel(e.target.value)}
                                                        className="p-2.5 text-xs border border-purple-200 rounded-xl bg-white font-mono font-semibold text-purple-900 outline-none w-full sm:w-auto shadow-xs"
                                                    >
                                                        {effectiveAvailableModels && effectiveAvailableModels.length > 0 ? (
                                                            effectiveAvailableModels.map(m => (
                                                                <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                                                            ))
                                                        ) : (
                                                            <>
                                                                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                                                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                                            </>
                                                        )}
                                                    </select>

                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTeacherKeyBox(!showTeacherKeyBox)}
                                                        className="px-3 py-2.5 bg-white text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-100 text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
                                                    >
                                                        <Key size={14} />
                                                        {showTeacherKeyBox ? 'Tutup' : (currentUser?.apiKey ? 'Ganti Key' : 'Input Key Guru')}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expandable Teacher API Key Box */}
                                            {showTeacherKeyBox && (
                                                <div className="pt-3 border-t border-purple-200/70 space-y-2 animate-fade-in">
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <input
                                                            type="password"
                                                            value={teacherApiKeyInput}
                                                            onChange={e => setTeacherApiKeyInput(e.target.value)}
                                                            placeholder={currentUser?.apiKey ? `Key aktif (${currentUser.apiKey.substring(0, 6)}••••). Masukkan yang baru untuk mengganti...` : "Tempel Google Gemini API Key Guru Anda di sini (AIzaSy...)"}
                                                            className="flex-1 p-2.5 text-xs font-mono border border-purple-300 rounded-xl bg-white outline-none focus:border-purple-500 shadow-xs"
                                                        />
                                                        <button
                                                            type="button"
                                                            disabled={isVerifyingTeacherKey || !teacherApiKeyInput.trim()}
                                                            onClick={() => handleSaveTeacherApiKey(teacherApiKeyInput)}
                                                            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                                                        >
                                                            {isVerifyingTeacherKey ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                            Hubungkan & Deteksi
                                                        </button>
                                                        {currentUser?.apiKey && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updatedTeacher = { ...currentUser, apiKey: '', aiModel: schoolData.aiModel || 'gemini-1.5-flash', availableAiModels: [] };
                                                                    setCurrentUser(updatedTeacher);
                                                                    setTeachers(prev => {
                                                                        const next = prev.map(t => t.id === currentUser.id ? { ...t, apiKey: '', aiModel: schoolData.aiModel || 'gemini-1.5-flash', availableAiModels: [] } : t);
                                                                        updateGlobalState({ teachers: next });
                                                                        return next;
                                                                    });
                                                                    setShowTeacherKeyBox(false);
                                                                    showToast("Beralih ke API Key Sekolah.", "success");
                                                                }}
                                                                className="px-3 py-2.5 bg-white text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors shrink-0"
                                                                title="Gunakan API Key Sekolah"
                                                            >
                                                                Pakai Key Sekolah
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-purple-700">
                                                        💡 Setiap guru dapat menggunakan API Key Gemini mandiri (gratis dari Google AI Studio) sehingga kuota dan generate soal tidak terbagi dengan guru lain.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 p-4 rounded-2xl border border-purple-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                                    <BrainCircuit size={20} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Versi Model AI</span>
                                                        <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Mode Otomatis</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{schoolData.aiModel || "gemini-1.5-flash"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <select
                                                    value={schoolData.aiModel || "gemini-1.5-flash"}
                                                    onChange={e => {
                                                        const nm = e.target.value;
                                                        setSchoolData(p => { const next = { ...p, aiModel: nm }; updateGlobalState({ schoolData: next }); return next; });
                                                        showToast(`Model AI dialihkan ke ${nm}`, "success");
                                                    }}
                                                    className="p-2.5 text-xs border border-purple-200 rounded-xl bg-white font-mono font-semibold text-purple-900 outline-none w-full sm:w-auto shadow-xs"
                                                >
                                                    {availableAiModels && availableAiModels.length > 0 ? (
                                                        availableAiModels.map(m => (
                                                            <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                                                        ))
                                                    ) : (
                                                        <>
                                                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                                            <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                                                        </>
                                                    )}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDetectAiModels(schoolData.apiKey)}
                                                    title="Deteksi ulang model dari API Key"
                                                    className="p-2.5 bg-white text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors shadow-xs"
                                                >
                                                    <RefreshCw size={14} className={isCheckingAiKey ? 'animate-spin' : ''} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                                            <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2"><BookOpen size={18} /> Identitas Materi</h4>
                                            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Mapel Ampuan</label><select value={aiParams.subject} onChange={e => setAiParams({ ...aiParams, subject: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-fuchsia-400 bg-slate-50 font-semibold text-sm text-slate-700"><option value="">-- Pilih --</option>{getMySubjects().map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}</select></div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Semester</label>
                                                    <select
                                                        value={aiParams.semester || activeSemester}
                                                        onChange={e => setAiParams({ ...aiParams, semester: e.target.value })}
                                                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-fuchsia-400 bg-slate-50 font-semibold text-sm text-slate-700"
                                                    >
                                                        <option value="Ganjil">Semester Ganjil</option>
                                                        <option value="Genap">Semester Genap</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Tahun Pelajaran</label>
                                                    <input
                                                        value={aiParams.academicYear || activeAcademicYear}
                                                        onChange={e => setAiParams({ ...aiParams, academicYear: e.target.value })}
                                                        placeholder="Contoh: 2025/2026"
                                                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-fuchsia-400 bg-slate-50 font-medium text-sm text-slate-700"
                                                    />
                                                </div>
                                            </div>

                                            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Topik Spesifik</label><input value={aiParams.topic} onChange={e => setAiParams({ ...aiParams, topic: e.target.value })} placeholder="Contoh: Ekosistem Laut" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-fuchsia-400 bg-slate-50 font-medium text-sm text-slate-700" /></div>
                                            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Capaian / Tujuan Pembelajaran (Opsional)</label><textarea value={aiParams.cptp} onChange={e => setAiParams({ ...aiParams, cptp: e.target.value })} placeholder="Tempelkan teks CP/TP dari RPP..." rows="3" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-fuchsia-400 bg-slate-50 font-medium text-sm text-slate-700 leading-relaxed" /></div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                                                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Layers size={18} /> Komposisi Bentuk Soal</h4>
                                                    <div className="bg-fuchsia-50 text-fuchsia-700 px-3 py-1 rounded-lg text-xs font-black">Total: {totalAiSoal}</div>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                    <div><label className="block text-[10px] font-bold text-slate-500 mb-1 leading-tight">PG Tunggal</label><input type="number" min="0" value={aiParams.counts.single} onChange={e => setAiParams({ ...aiParams, counts: { ...aiParams.counts, single: e.target.value } })} className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold text-sm outline-none focus:border-fuchsia-400 bg-slate-50" /></div>
                                                    <div><label className="block text-[10px] font-bold text-slate-500 mb-1 leading-tight">PG Kompleks</label><input type="number" min="0" value={aiParams.counts.multiple} onChange={e => setAiParams({ ...aiParams, counts: { ...aiParams.counts, multiple: e.target.value } })} className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold text-sm outline-none focus:border-fuchsia-400 bg-slate-50" /></div>
                                                    <div><label className="block text-[10px] font-bold text-slate-500 mb-1 leading-tight">Benar / Salah</label><input type="number" min="0" value={aiParams.counts.boolean} onChange={e => setAiParams({ ...aiParams, counts: { ...aiParams.counts, boolean: e.target.value } })} className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold text-sm outline-none focus:border-fuchsia-400 bg-slate-50" /></div>
                                                    <div><label className="block text-[10px] font-bold text-slate-500 mb-1 leading-tight">Menjodohkan</label><input type="number" min="0" value={aiParams.counts.matching} onChange={e => setAiParams({ ...aiParams, counts: { ...aiParams.counts, matching: e.target.value } })} className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold text-sm outline-none focus:border-fuchsia-400 bg-slate-50" /></div>
                                                    <div><label className="block text-[10px] font-bold text-slate-500 mb-1 leading-tight">Isian Singkat</label><input type="number" min="0" value={aiParams.counts.short} onChange={e => setAiParams({ ...aiParams, counts: { ...aiParams.counts, short: e.target.value } })} className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold text-sm outline-none focus:border-fuchsia-400 bg-slate-50" /></div>
                                                    <div><label className="block text-[10px] font-bold text-slate-500 mb-1 leading-tight">Uraian / Essay</label><input type="number" min="0" value={aiParams.counts.essay} onChange={e => setAiParams({ ...aiParams, counts: { ...aiParams.counts, essay: e.target.value } })} className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold text-sm outline-none focus:border-fuchsia-400 bg-slate-50" /></div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                                                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><BrainCircuit size={18} /> Kognitif (Wajib 100%)</h4>
                                                    <div className={`px-3 py-1 rounded-lg text-xs font-black ${totalAiKognitif === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>Total: {totalAiKognitif}%</div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div><label className="block text-[10px] font-bold text-slate-500 mb-1">LOTS (%)</label><input type="number" min="0" max="100" value={aiParams.pcts.lots} onChange={e => setAiParams({ ...aiParams, pcts: { ...aiParams.pcts, lots: e.target.value } })} className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold text-sm outline-none focus:border-emerald-400 bg-emerald-50 text-emerald-700" /></div>
                                                    <div><label className="block text-[10px] font-bold text-slate-500 mb-1">MOTS (%)</label><input type="number" min="0" max="100" value={aiParams.pcts.mots} onChange={e => setAiParams({ ...aiParams, pcts: { ...aiParams.pcts, mots: e.target.value } })} className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold text-sm outline-none focus:border-amber-400 bg-amber-50 text-amber-700" /></div>
                                                    <div><label className="block text-[10px] font-bold text-slate-500 mb-1">HOTS (%)</label><input type="number" min="0" max="100" value={aiParams.pcts.hots} onChange={e => setAiParams({ ...aiParams, pcts: { ...aiParams.pcts, hots: e.target.value } })} className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold text-sm outline-none focus:border-rose-400 bg-rose-50 text-rose-700" /></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button type="button" onClick={generateAIQuestions} className="w-full max-w-lg mx-auto mt-6 block bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-md shadow-fuchsia-500/20 disabled:opacity-50 flex items-center justify-center gap-2 text-base hover:bg-fuchsia-700 transition-all hover:-translate-y-0.5">
                                        {aiLoading ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /> Merumuskan Draf Soal...</span> : <span className="flex items-center gap-2"><BrainCircuit size={20} /> Generate Kecepatan AI</span>}
                                    </button>
                                </div>
                            )}

                            {aiStep === 2 && (
                                <div className="max-w-4xl mx-auto animate-fade-in">
                                    <div className="flex flex-col md:flex-row justify-between items-center bg-fuchsia-50 p-4 rounded-2xl border border-fuchsia-100 shadow-sm text-fuchsia-900 mb-6 gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold flex items-center gap-2"><Sparkles className="text-fuchsia-500" size={18} /> Hasil Draf AI</h3>
                                            <p className="text-xs font-medium opacity-80 mt-0.5">Tinjau, sesuaikan kognitif, dan edit redaksi.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-fuchsia-100"><p className="text-[9px] font-bold text-fuchsia-400 uppercase tracking-wider">Total Soal</p><p className="text-lg font-bold leading-none mt-0.5">{aiDrafts.length}</p></div>
                                            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-fuchsia-100"><p className="text-[9px] font-bold text-fuchsia-400 uppercase tracking-wider">Est. Bobot</p><p className="text-lg font-bold leading-none mt-0.5">{aiDrafts.reduce((a, c) => a + (Number(c.weight) || 0), 0)}</p></div>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        {aiDrafts.map((draft, idx) => (
                                            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 flex">
                                                    <div className="bg-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-widest">{draft.type}</div>
                                                    <div className="bg-indigo-100 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black text-indigo-700">SOAL {idx + 1}</div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
                                                    <div className="col-span-12 md:col-span-3">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Level Kognitif</label>
                                                        <select value={draft.difficulty} onChange={(e) => handleAiFieldChange(idx, 'difficulty', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 focus:border-fuchsia-400 outline-none">
                                                            <option value="LOTS">LOTS</option>
                                                            <option value="MOTS">MOTS</option>
                                                            <option value="HOTS">HOTS</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-12 md:col-span-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Bobot Poin</label>
                                                        <input type="number" value={draft.weight} onChange={(e) => handleAiFieldChange(idx, 'weight', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50 text-center focus:border-fuchsia-400 outline-none text-fuchsia-600" />
                                                    </div>
                                                    <div className="col-span-12 md:col-span-7">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Indikator Kisi-kisi</label>
                                                        <input value={draft.indicator} onChange={(e) => handleAiFieldChange(idx, 'indicator', e.target.value)} className="w-full p-2.5 border border-yellow-200 rounded-lg text-xs bg-yellow-50 text-yellow-800 font-medium focus:border-yellow-400 outline-none" />
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Redaksi Pertanyaan</label>
                                                    <textarea value={draft.text} onChange={(e) => handleAiFieldChange(idx, 'text', e.target.value)} rows="3" className="w-full p-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:border-fuchsia-400 bg-white shadow-sm leading-relaxed" />
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Opsi Jawaban / Rubrik</label>

                                                    {(draft.type === 'single' || draft.type === 'multiple') && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                                            {draft.options.map((opt, oIdx) => {
                                                                const isCorrect = draft.type === 'single' ? String(draft.correct) === String(oIdx) : String(draft.correct).split(',').includes(String(oIdx));
                                                                return (
                                                                    <div key={oIdx} onClick={() => handleAiOptionClick(idx, oIdx, draft.type)} className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${isCorrect ? 'bg-fuchsia-50 border-fuchsia-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                                                        <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${isCorrect ? 'bg-fuchsia-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                                            {String.fromCharCode(65 + oIdx)}
                                                                        </div>
                                                                        <input value={opt} onChange={(e) => handleAiFieldChange(idx, 'options', e.target.value, oIdx)} className={`flex-1 w-full bg-transparent outline-none text-xs font-medium ${isCorrect ? 'text-fuchsia-900' : 'text-slate-700'}`} onClick={(e) => e.stopPropagation()} />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {(draft.type === 'boolean') && (
                                                        <select value={draft.correct} onChange={(e) => handleAiFieldChange(idx, 'correct', e.target.value)} className="w-full p-3 border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-emerald-700 bg-emerald-50 text-center text-sm cursor-pointer">
                                                            <option value="0">Pernyataan Bernilai BENAR</option>
                                                            <option value="1">Pernyataan Bernilai SALAH</option>
                                                        </select>
                                                    )}

                                                    {(draft.type === 'short' || draft.type === 'essay' || draft.type === 'matching') && (
                                                        <textarea value={draft.correct} onChange={(e) => handleAiFieldChange(idx, 'correct', e.target.value)} rows="3" className="w-full p-3 border border-fuchsia-200 rounded-xl outline-none focus:border-fuchsia-400 bg-fuchsia-50/50 font-medium text-slate-700 text-sm leading-relaxed" placeholder="Ketik kunci jawaban / rubrik di sini..." />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {aiStep === 3 && (
                                <div className="flex flex-col items-center justify-center h-full space-y-5 text-center py-16 animate-fade-in">
                                    <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mb-2"><CheckSquare size={48} /></div>
                                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Terintegrasi!</h2>
                                    <p className="text-slate-500 text-sm max-w-sm font-medium leading-relaxed">Seluruh soal beserta bobot nilai dan matriks kisi-kisi telah disimpan ke Database.</p>
                                    <div className="flex gap-3 mt-6">
                                        <button onClick={() => { setAiWizardOpen(false); setAdminMenu('questions'); }} className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 shadow-sm transition-all">Tutup Wizard</button>
                                        <button onClick={() => {
                                            setAiWizardOpen(false);
                                            setPrintData({
                                                type: 'kisi-kisi',
                                                class: subjects.find(s => s.id === parseInt(aiParams.subject))?.class,
                                                subjectName: subjects.find(s => s.id === parseInt(aiParams.subject))?.name,
                                                teacherName: currentUser.name,
                                                questions: questions.filter(q => q.subjectId === parseInt(aiParams.subject))
                                            });
                                        }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all text-sm">
                                            <FileSpreadsheet size={16} /> Lihat Kisi-kisi
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {aiStep === 2 && (
                            <div className="bg-white p-4 border-t border-slate-200 flex justify-end shrink-0 z-20">
                                <button onClick={saveAIDrafts} className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm hover:bg-emerald-700 flex items-center gap-2 text-sm transition-colors">Simpan ke Bank Soal <CheckCircle size={16} /></button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MOBILE TOP BAR (KHUSUS SMARTPHONE) */}
            <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-1">
                        <img src={EQUEST_LOGO} alt="e-Quest" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-xs text-slate-800 leading-tight">
                            e-<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Quest</span> CBT
                        </h1>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{currentUser?.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full">
                        {role === 'admin' ? 'Admin' : (currentUser?.teacherType === 'guru_kelas' ? 'Wali' : 'Mapel')}
                    </span>
                    <button
                        onClick={() => setRole(null)}
                        className="p-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 hover:bg-rose-100 transition-colors"
                        title="Keluar"
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </div>

            {/* SIDEBAR DESKTOP */}
            <div className={`hidden md:flex glass-panel border-r border-slate-200/60 h-screen fixed left-0 top-0 flex-col z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ${sidebarExpanded ? 'w-64' : 'w-20'}`}>
                <div className="p-5 border-b border-slate-200/50 h-20 flex items-center gap-3 overflow-hidden shrink-0">
                    <div className="w-10 h-10 shrink-0 bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-200 overflow-hidden">
                        <img src={EQUEST_LOGO} alt="e-Quest" className="w-full h-full object-contain p-1" />
                    </div>
                    {sidebarExpanded && <div className="flex-1 min-w-0"><h2 className="font-bold text-slate-800 leading-tight text-sm truncate">{currentUser.name}</h2><p className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider mt-0.5">{role}</p></div>}
                </div>

                <nav className="flex-1 p-3 space-y-4 overflow-y-auto no-scrollbar">
                    <div className="space-y-1"><button onClick={() => setAdminMenu('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${adminMenu === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'} ${!sidebarExpanded && 'justify-center'}`}><LayoutDashboard size={20} />{sidebarExpanded && 'Dashboard Utama'}</button></div>

                    <div className="space-y-1">
                        {sidebarExpanded && <div className="flex justify-between items-center px-3 mb-2 cursor-pointer group" onClick={() => toggleGroup('master')}><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">{role === 'admin' ? 'Data Master' : 'Kelas & Murid'}</p>{openMenuGroups.master ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}</div>}
                        {(!sidebarExpanded || openMenuGroups.master) && (
                            <>
                                {role === 'admin' && (
                                    <button onClick={() => setAdminMenu('teachers')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${adminMenu === 'teachers' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'} ${!sidebarExpanded && 'justify-center'}`}><UserCog size={20} />{sidebarExpanded && 'Data Guru'}</button>
                                )}
                                <button onClick={() => setAdminMenu('classes')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${adminMenu === 'classes' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'} ${!sidebarExpanded && 'justify-center'}`}><Layers size={20} />{sidebarExpanded && (role === 'admin' ? 'Data Kelas' : 'Kelas Diampu')}</button>
                                <button onClick={() => setAdminMenu('students')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${adminMenu === 'students' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'} ${!sidebarExpanded && 'justify-center'}`}><Users size={20} />{sidebarExpanded && (role === 'admin' ? 'Data Murid' : 'Murid Binaan')}</button>
                            </>
                        )}
                    </div>

                    <div className="space-y-1">
                        {sidebarExpanded && <div className="flex justify-between items-center px-3 mb-2 cursor-pointer group" onClick={() => toggleGroup('evaluasi')}><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">Akademik & Ujian</p>{openMenuGroups.evaluasi ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}</div>}
                        {(!sidebarExpanded || openMenuGroups.evaluasi) && (
                            <><button onClick={() => setAdminMenu('subjects')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${adminMenu === 'subjects' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'} ${!sidebarExpanded && 'justify-center'}`}><BookOpen size={20} />{sidebarExpanded && 'Mata Pelajaran'}</button>
                                <button onClick={() => setAdminMenu('questions')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${adminMenu === 'questions' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'} ${!sidebarExpanded && 'justify-center'}`}><FileText size={20} />{sidebarExpanded && 'Bank Soal'}</button>
                                {role === 'admin' && <button onClick={() => setAdminMenu('token')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${adminMenu === 'token' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-100'} ${!sidebarExpanded && 'justify-center'}`}><MonitorPlay size={20} />{sidebarExpanded && 'Pusat Ujian (LIVE)'}</button>}</>
                        )}
                    </div>

                    <div className="space-y-1">
                        {sidebarExpanded && <div className="flex justify-between items-center px-3 mb-2 cursor-pointer group" onClick={() => toggleGroup('laporan')}><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">Laporan & Berkas</p>{openMenuGroups.laporan ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}</div>}
                        {(!sidebarExpanded || openMenuGroups.laporan) && (
                            <><button onClick={() => setAdminMenu('analysis')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${adminMenu === 'analysis' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'} ${!sidebarExpanded && 'justify-center'}`}><BarChart2 size={20} />{sidebarExpanded && 'Analisis Nilai'}</button>
                                {role === 'admin' && <button onClick={() => setAdminMenu('documents')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${adminMenu === 'documents' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'} ${!sidebarExpanded && 'justify-center'}`}><ClipboardList size={20} />{sidebarExpanded && 'Administrasi Cetak'}</button>}</>
                        )}
                    </div>

                    {role === 'admin' && (
                        <div className="space-y-1 pt-4 border-t border-slate-200/50">
                            {(!sidebarExpanded || openMenuGroups.sistem) && (
                                <button onClick={() => setAdminMenu('school')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${adminMenu === 'school' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'} ${!sidebarExpanded && 'justify-center'}`}><Settings size={20} />{sidebarExpanded && 'Pengaturan Sistem'}</button>
                            )}
                        </div>
                    )}
                </nav>
                <div className="p-4 border-t border-slate-200/50 flex flex-col gap-3 shrink-0 bg-slate-50/80 backdrop-blur-md">
                    <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="flex items-center justify-center gap-2 w-full p-2.5 bg-white text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 shadow-sm transition-all group">
                        {sidebarExpanded ? <><ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> <span className="text-[11px] font-bold uppercase tracking-wider">Sembunyikan Menu</span></> : <Menu size={18} />}
                    </button>
                    <button onClick={() => setRole(null)} className={`w-full flex items-center justify-center gap-2 p-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl font-bold hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-0.5 ${!sidebarExpanded ? 'px-0' : ''}`}>
                        <LogOut size={18} /> {sidebarExpanded && <span className="text-sm tracking-wide">Keluar Aplikasi</span>}
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <main className={`flex-1 flex flex-col h-screen transition-all duration-300 overflow-hidden relative z-10 ml-0 ${sidebarExpanded ? 'md:ml-64' : 'md:ml-20'}`}>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 pt-16 md:pt-10 pb-28 md:pb-20 no-scrollbar">

                    {/* DASHBOARD */}
                    {adminMenu === 'dashboard' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-10 rounded-3xl text-white shadow-xl shadow-indigo-500/10 relative overflow-hidden mb-8 border border-white/20">
                                <div className="absolute right-[-5%] top-[-10%] opacity-10 transform rotate-12 scale-150 pointer-events-none"><BookOpen size={300} strokeWidth={1} /></div>
                                <div className="relative z-10 max-w-xl">
                                    <p className="text-indigo-200 font-bold tracking-widest text-xs uppercase mb-2">Selamat Datang Kembali</p>
                                    <h2 className="text-4xl font-bold mb-4 tracking-tight">{currentUser.name}</h2>
                                    <div className="p-5 bg-black/10 backdrop-blur-sm border border-white/10 rounded-2xl inline-block shadow-inner">
                                        <p className="italic text-base font-medium leading-relaxed text-indigo-50">"{quote}"</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow group">
                                    <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><BookOpen size={24} /></div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{role === 'admin' ? 'Total Mapel' : 'Mapel Diampu'}</p>
                                    <p className="text-3xl font-bold text-slate-800">{getMySubjects().length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow group">
                                    <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Layers size={24} /></div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{role === 'admin' ? 'Total Kelas' : 'Kelas Diampu'}</p>
                                    <p className="text-3xl font-bold text-slate-800">{getMyClasses().length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow group">
                                    <div className="w-14 h-14 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Bank Soal</p>
                                    <p className="text-3xl font-bold text-slate-800">{getMyQuestions().length}</p>
                                </div>
                                <div className="bg-emerald-600 p-6 rounded-2xl shadow-sm border border-emerald-500 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow group text-white relative overflow-hidden">
                                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><MonitorPlay size={24} /></div>
                                    <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">Sesi Ujian Aktif</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl font-bold">{activeExams.length}</span>
                                        {activeExams.length > 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span></span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TEACHERS DATA (ADMIN) */}
                    {adminMenu === 'teachers' && role === 'admin' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-fade-in max-w-6xl mx-auto">
                            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
                                <div>
                                    <h3 className="font-bold text-2xl text-slate-800">Manajemen Akun Guru</h3>
                                    <p className="text-slate-500 font-medium text-xs mt-1">Atur wewenang Guru Kelas (Wali Kelas) atau Guru Mapel (Multi-Kelas).</p>
                                </div>
                                <button onClick={() => openModal('teacher')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex gap-2 hover:bg-indigo-700 shadow-sm transition-all"><Plus size={18} /> Tambah Guru Baru</button>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <table className="w-full text-left bg-white">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">Nama Guru & Gelar</th>
                                            <th className="p-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">Peran & Tipe</th>
                                            <th className="p-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">Wewenang Kelas & Mapel</th>
                                            <th className="p-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">Akun Akses</th>
                                            <th className="p-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {teachers.map(t => {
                                            const isGuruKelas = t.teacherType === 'guru_kelas' || (!t.teacherType && t.assignedClass && !t.subjectName);
                                            const assignedClassDisplay = t.assignedClass || (Array.isArray(t.assignedClasses) ? t.assignedClasses[0] : null);
                                            const classesArray = Array.isArray(t.assignedClasses) && t.assignedClasses.length > 0
                                                ? t.assignedClasses
                                                : (assignedClassDisplay ? [assignedClassDisplay] : []);

                                            return (
                                                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-semibold text-slate-800 text-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${isGuruKelas ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100'
                                                                }`}>
                                                                {t.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <span className="block font-bold text-slate-800">{t.name}</span>
                                                                <span className="text-[10px] text-slate-400 font-mono">ID: {t.id}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        {isGuruKelas ? (
                                                            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                                                                <School size={13} /> Guru Kelas (Wali)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                                                                <BookOpen size={13} /> Guru Mapel
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        {isGuruKelas ? (
                                                            <div>
                                                                <span className="font-bold text-xs text-indigo-800 bg-indigo-100/70 px-2 py-0.5 rounded border border-indigo-200">
                                                                    Wali: {assignedClassDisplay || 'Belum diatur'}
                                                                </span>
                                                                <p className="text-[10px] text-slate-500 font-medium mt-1">
                                                                    Akses: <strong>Semua Mapel</strong> di kelas ini
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                    <span className="font-bold text-xs text-fuchsia-800 bg-fuchsia-100/70 px-2 py-0.5 rounded border border-fuchsia-200">
                                                                        Mapel: {t.subjectName || 'Umum'}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 font-semibold">
                                                                        ({classesArray.length} Kelas)
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {classesArray.map(c => (
                                                                        <span key={c} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                                                                            {c}
                                                                        </span>
                                                                    ))}
                                                                    {classesArray.length === 0 && <span className="text-slate-400 text-xs italic">Belum ada kelas</span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-mono text-xs">
                                                            <p className="font-bold text-indigo-600">{t.username}</p>
                                                            <p className="text-slate-400 text-[11px]">{t.password}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2 justify-center">
                                                            <button onClick={() => openModal('teacher', t)} className="bg-white border border-slate-200 text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors shadow-sm" title="Edit Data Guru"><Edit size={16} /></button>
                                                            <button onClick={() => initiateDelete('teacher', t.id)} className="bg-white border border-slate-200 text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-colors shadow-sm" title="Hapus Guru"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* CLASSES DATA */}
                    {adminMenu === 'classes' && (role === 'admin' || role === 'guru') && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-fade-in max-w-6xl mx-auto">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-100 pb-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-2xl text-slate-800">{role === 'admin' ? 'Data Master Kelas' : 'Ruang Kelas yang Anda Ampu'}</h3>
                                        {role === 'guru' && (
                                            currentUser?.teacherType === 'guru_kelas' ? (
                                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <School size={12} /> Guru Kelas (Wali)
                                                </span>
                                            ) : (
                                                <span className="bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <BookOpen size={12} /> Guru Mapel {currentUser?.subjectName} (Multi-Kelas)
                                                </span>
                                            )
                                        )}
                                    </div>
                                    <p className="text-slate-500 font-medium text-xs">
                                        {role === 'admin'
                                            ? 'Kelola ruang kelas dan rombel belajar di sekolah.'
                                            : currentUser?.teacherType === 'guru_kelas'
                                                ? `Akses kelas binaan Anda: ${currentUser.assignedClass || 'Kelas'}. Anda dapat mengelola soal untuk seluruh mapel di kelas ini.`
                                                : `Akses multi-kelas untuk mapel ${currentUser?.subjectName || ''}. Anda dapat mengelola soal untuk setiap kelas ini.`}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                    <select
                                        value={classYearFilter}
                                        onChange={e => setClassYearFilter(e.target.value)}
                                        className="p-2.5 border border-slate-200 bg-slate-50 focus:border-indigo-400 rounded-xl text-xs font-bold text-slate-700 outline-none shadow-xs"
                                    >
                                        <option value="all">Semua Tahun Pelajaran</option>
                                        <option value="active">Tahun Aktif ({activeAcademicYear})</option>
                                        {availableClassYears.filter(y => y !== activeAcademicYear).map(y => (
                                            <option key={y} value={y}>Arsip TP {y}</option>
                                        ))}
                                    </select>
                                    <div className="relative flex-1 md:w-52">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input value={classSearch} onChange={e => setClassSearch(e.target.value)} placeholder="Cari Kelas..." className="w-full pl-10 pr-3 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-sm outline-none bg-slate-50 font-medium text-slate-700" />
                                    </div>
                                    {role === 'admin' && (
                                        <>
                                            <button onClick={() => setImportModalConfig({ isOpen: true, type: 'Data Kelas' })} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm flex gap-2 hover:bg-slate-50 shadow-sm"><FileBox size={18} /> Import</button>
                                            <button onClick={() => openModal('class')} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex gap-2 shadow-sm hover:bg-indigo-700"><Plus size={18} /> Baru</button>
                                        </>
                                    )}
                                </div>
                            </div>
                            {filteredClassesList.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <Layers size={40} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-base font-bold text-slate-500">Tidak ada kelas yang ditemukan</p>
                                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau ubah filter Tahun Pelajaran.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredClassesList.map(i => {
                                        const studentCount = students.filter(s => s.class === i.name).length;
                                        const subjectCount = subjects.filter(s => s.class === i.name).length;
                                        const isArchived = i.academicYear && i.academicYear !== activeAcademicYear;
                                        return (
                                            <div key={i.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group relative flex flex-col justify-between">
                                                {role === 'admin' && (
                                                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openModal('class', i)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit size={14} /></button>
                                                        <button onClick={() => initiateDelete('class', i.id)} className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"><Trash2 size={14} /></button>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                                                        <Layers size={24} />
                                                    </div>
                                                    <h4 className="font-bold text-xl text-slate-800 mb-1">{i.name}</h4>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Tingkat {i.level}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${!isArchived
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            }`}>
                                                            TP {i.academicYear || activeAcademicYear} {isArchived ? '(Arsip)' : ''}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 text-center">
                                                        <div>
                                                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Jumlah Murid</span>
                                                            <span className="font-bold text-slate-700 text-sm">{studentCount} Siswa</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Jumlah Mapel</span>
                                                            <span className="font-bold text-indigo-600 text-sm">{subjectCount} Mapel</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 pt-2 border-t border-slate-100">
                                                    <button
                                                        onClick={() => { setStudentFilterClass(i.name); setAdminMenu('students'); }}
                                                        className="flex-1 py-2 px-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Users size={14} /> Daftar Murid
                                                    </button>
                                                    <button
                                                        onClick={() => { setQuestionClassFilter(i.name); setAdminMenu('questions'); }}
                                                        className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <FileText size={14} /> Buat Soal
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STUDENTS DATA */}
                    {adminMenu === 'students' && (role === 'admin' || role === 'guru') && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-fade-in max-w-6xl mx-auto">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-100 pb-5">
                                <div>
                                    <h3 className="font-bold text-2xl text-slate-800">{role === 'admin' ? 'Database Murid' : 'Data Murid Binaan'}</h3>
                                    <p className="text-slate-500 font-medium text-xs mt-1">
                                        {role === 'admin' ? 'Database seluruh siswa terdaftar.' : 'Daftar siswa yang berada pada kelas yang Anda ampu.'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                    <select
                                        className="p-2.5 border border-slate-200 bg-slate-50 focus:border-indigo-400 rounded-xl text-sm font-medium text-slate-600 outline-none"
                                        value={studentFilterClass}
                                        onChange={e => setStudentFilterClass(e.target.value)}
                                    >
                                        <option value="">{role === 'admin' ? 'Semua Kelas' : 'Seluruh Kelas Ampuan'}</option>
                                        {getMyClasses().map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                    <div className="relative flex-1 md:w-56">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Cari Nama/NIS..." className="pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 focus:border-indigo-400 rounded-xl text-sm outline-none font-medium text-slate-700" />
                                    </div>
                                    {role === 'admin' && (
                                        <button onClick={() => setImportModalConfig({ isOpen: true, type: 'Data Murid' })} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm flex gap-2 hover:bg-slate-50 shadow-sm"><FileBox size={18} /> Import</button>
                                    )}
                                    {(role === 'admin' || (role === 'guru' && currentUser?.teacherType === 'guru_kelas')) && (
                                        <button onClick={() => openModal('student')} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex gap-2 shadow-sm hover:bg-indigo-700"><Plus size={18} /> Baru</button>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <table className="w-full text-left bg-white">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">Nama Murid</th>
                                            <th className="p-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">Kelas</th>
                                            <th className="p-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">NIS</th>
                                            <th className="p-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">Password</th>
                                            <th className="p-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredStudentsList.map(i => (
                                            <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-semibold text-slate-800 text-sm">{i.name}</td>
                                                <td className="p-4"><span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border border-slate-200">{i.class}</span></td>
                                                <td className="p-4 font-mono font-medium text-indigo-600 text-sm">{i.nis}</td>
                                                <td className="p-4 font-mono text-slate-400 text-sm">{i.password}</td>
                                                <td className="p-4 flex gap-2 justify-center">
                                                    {(role === 'admin' || (role === 'guru' && currentUser?.teacherType === 'guru_kelas')) && (
                                                        <>
                                                            <button onClick={() => openModal('student', i)} className="bg-white border border-slate-200 text-blue-600 p-2 rounded-lg hover:bg-blue-50 shadow-sm"><Edit size={16} /></button>
                                                            <button onClick={() => initiateDelete('student', i.id)} className="bg-white border border-slate-200 text-rose-500 p-2 rounded-lg hover:bg-rose-50 shadow-sm"><Trash2 size={16} /></button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SUBJECTS DATA */}
                    {adminMenu === 'subjects' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-fade-in max-w-6xl mx-auto">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-5">
                                <div>
                                    <h3 className="font-bold text-2xl text-slate-800">
                                        {role === 'admin' ? 'Semua Mata Pelajaran' : (currentUser?.teacherType === 'guru_kelas' ? `Mata Pelajaran ${currentUser.assignedClass || ''} (Kelas Binaan)` : `Mata Pelajaran ${currentUser?.subjectName || ''} (Multi-Kelas)`)}
                                    </h3>
                                    <p className="text-slate-500 font-medium text-xs mt-1">
                                        {role === 'admin'
                                            ? 'Daftar mata pelajaran yang terdaftar di sekolah.'
                                            : currentUser?.teacherType === 'guru_kelas'
                                                ? `Sebagai Guru Kelas, Anda berwenang membuat dan mengelola soal seluruh mata pelajaran di ${currentUser.assignedClass || 'kelas ini'}.`
                                                : `Sebagai Guru Mapel, Anda berwenang membuat dan mengelola soal ${currentUser?.subjectName || ''} di setiap kelas yang Anda ampu.`}
                                    </p>
                                </div>
                                <button onClick={() => openModal('subject')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex gap-2 shadow-sm hover:bg-indigo-700 shrink-0"><Plus size={18} /> Mapel Baru</button>
                            </div>

                            {/* Filter Bar Mata Pelajaran */}
                            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 mb-6">
                                <div className="flex items-center gap-2">
                                    <Filter size={15} className="text-indigo-600" />
                                    <span className="text-xs font-bold text-slate-600">Filter:</span>
                                </div>
                                <select
                                    value={subjectYearFilter}
                                    onChange={e => setSubjectYearFilter(e.target.value)}
                                    className="p-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 outline-none shadow-xs"
                                >
                                    <option value="all">Semua Tahun Pelajaran</option>
                                    <option value="active">Tahun Aktif ({activeAcademicYear})</option>
                                    {availableClassYears.filter(y => y !== activeAcademicYear).map(y => (
                                        <option key={y} value={y}>Arsip TP {y}</option>
                                    ))}
                                </select>
                                <select
                                    value={subjectClassFilter}
                                    onChange={e => setSubjectClassFilter(e.target.value)}
                                    className="p-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 outline-none shadow-xs"
                                >
                                    <option value="all">Semua Kelas</option>
                                    {getMyClasses().map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                    <input
                                        value={subjectSearch}
                                        onChange={e => setSubjectSearch(e.target.value)}
                                        placeholder="Cari Mata Pelajaran atau Kode..."
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-white rounded-xl text-xs outline-none font-medium text-slate-700 shadow-xs"
                                    />
                                </div>
                            </div>

                            {filteredSubjectsList.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <BookOpen size={40} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-base font-bold text-slate-500">Tidak ada mata pelajaran ditemukan</p>
                                    <p className="text-xs text-slate-400 mt-1">Sesuaikan filter atau klik tombol "+ Mapel Baru" untuk menambahkan.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredSubjectsList.map(i => {
                                        const isArchived = i.academicYear && i.academicYear !== activeAcademicYear;
                                        return (
                                            <div key={i.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all relative group flex flex-col">
                                                {(role === 'admin' || (role === 'guru' && (i.teacherId === currentUser.id || currentUser?.teacherType === 'guru_kelas'))) && (
                                                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openModal('subject', i)} className="p-1.5 bg-white border border-slate-100 text-blue-600 rounded-lg hover:bg-blue-50 shadow-sm"><Edit size={14} /></button>
                                                        <button onClick={() => initiateDelete('subject', i.id)} className="p-1.5 bg-white border border-slate-100 text-rose-500 rounded-lg hover:bg-rose-50 shadow-sm"><Trash2 size={14} /></button>
                                                    </div>
                                                )}
                                                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100"><BookOpen size={24} /></div>
                                                <h4 className="font-bold text-lg text-slate-800 mb-1">{i.name}</h4>
                                                <div className="flex flex-wrap gap-1.5 mb-4">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">{i.class}</span>
                                                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono">{i.code}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${!isArchived
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        }`}>
                                                        TP {i.academicYear || activeAcademicYear}
                                                    </span>
                                                </div>
                                                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Guru Pengampu</p>
                                                        <p className="font-semibold text-slate-700 text-sm">{teachers.find(t => t.id === i.teacherId)?.name || 'Admin'}</p>
                                                    </div>
                                                    <button onClick={() => { setSelectedSubjectForQuestions(i); setAdminMenu('questions'); }} className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors">
                                                        Bank Soal →
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* BANK SOAL (QUESTIONS) */}
                    {adminMenu === 'questions' && (
                        !selectedSubjectForQuestions ? (
                            <div className="animate-fade-in max-w-6xl mx-auto">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b border-slate-200 pb-5 gap-4">
                                    <div>
                                        <h2 className="text-3xl font-bold text-slate-800 mb-1">Bank Soal Terpadu</h2>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1.5">
                                                <Calendar size={14} /> Pelaksanaan: Semester {activeSemester} ({activeAcademicYear})
                                            </span>
                                            <p className="text-slate-500 font-medium text-xs">Pilih mata pelajaran untuk menyusun soal & kisi-kisi.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setAiStep(1); setAiWizardOpen(true); }} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex gap-2 items-center shadow-md hover:shadow-lg transition-all shrink-0"><BrainCircuit size={18} /> AI Wizard</button>
                                </div>

                                {/* Filter Bar Bank Soal */}
                                <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs mb-6">
                                    <div className="flex items-center gap-2">
                                        <Filter size={15} className="text-indigo-600" />
                                        <span className="text-xs font-bold text-slate-600">Filter Bank Soal:</span>
                                    </div>
                                    <select
                                        value={questionYearFilter}
                                        onChange={e => setQuestionYearFilter(e.target.value)}
                                        className="p-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 outline-none shadow-xs"
                                    >
                                        <option value="all">Semua Tahun Pelajaran</option>
                                        <option value="active">Tahun Aktif ({activeAcademicYear})</option>
                                        {availableClassYears.filter(y => y !== activeAcademicYear).map(y => (
                                            <option key={y} value={y}>Arsip TP {y}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={questionClassFilter}
                                        onChange={e => setQuestionClassFilter(e.target.value)}
                                        className="p-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 outline-none shadow-xs"
                                    >
                                        <option value="all">Semua Kelas</option>
                                        {getMyClasses().map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                    <div className="relative flex-1 min-w-[200px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                        <input
                                            value={questionSearchSubj}
                                            onChange={e => setQuestionSearchSubj(e.target.value)}
                                            placeholder="Cari Mata Pelajaran atau Kode..."
                                            className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none font-medium text-slate-700"
                                        />
                                    </div>
                                </div>

                                {filteredBankSubjects.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-xs">
                                        <FileText size={48} className="mx-auto text-slate-300 mb-3" />
                                        <p className="text-lg font-bold text-slate-600">Mata Pelajaran Tidak Ditemukan</p>
                                        <p className="text-sm font-medium text-slate-400 mt-1">Tidak ada mapel yang cocok dengan kriteria filter bank soal.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredBankSubjects.map((s, idx) => {
                                            const qCountActive = questions.filter(q => q.subjectId === s.id && (!q.semester || q.semester.toLowerCase() === activeSemester.toLowerCase())).length;
                                            const qCountTotal = questions.filter(q => q.subjectId === s.id).length;
                                            const colors = [
                                                'bg-blue-500 border-blue-600 text-white shadow-blue-500/20',
                                                'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20',
                                                'bg-rose-500 border-rose-600 text-white shadow-rose-500/20',
                                                'bg-purple-500 border-purple-600 text-white shadow-purple-500/20'
                                            ];
                                            const colorClass = colors[idx % colors.length];

                                            return (
                                                <div key={s.id} onClick={() => setSelectedSubjectForQuestions(s)} className={`${colorClass} p-6 rounded-2xl shadow-md text-left group transition-all hover:-translate-y-1 cursor-pointer relative overflow-hidden border`}>
                                                    <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500"><Layers size={120} strokeWidth={1} /></div>
                                                    <div className="bg-white/20 p-3 rounded-xl w-fit mb-5 backdrop-blur-sm border border-white/30"><FileText size={24} className="text-white" /></div>
                                                    <h3 className="font-bold text-xl mb-1 drop-shadow-sm relative z-10">{s.name}</h3>
                                                    <div className="flex flex-wrap gap-2 mb-5 relative z-10">
                                                        <span className="bg-black/20 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-semibold tracking-wider uppercase border border-white/10">{s.class}</span>
                                                        <span className="bg-black/20 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-semibold tracking-wider uppercase border border-white/10 font-mono">{s.code}</span>
                                                        <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold tracking-wider border border-white/20">TP {s.academicYear || activeAcademicYear}</span>
                                                    </div>
                                                    <div className="bg-white text-slate-800 rounded-lg p-3 text-xs font-bold flex items-center justify-between relative z-10 shadow-sm">
                                                        <span>Soal Sem. {activeSemester}</span>
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-indigo-600">{qCountActive} / {qCountTotal} Butir</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-fade-in max-w-6xl mx-auto">
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-slate-100 pb-6">
                                    <div>
                                        <button onClick={() => setSelectedSubjectForQuestions(null)} className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1 mb-3 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"><ArrowLeft size={14} /> Kembali</button>
                                        <h3 className="font-bold text-2xl text-slate-800">{selectedSubjectForQuestions.name}</h3>
                                        <p className="text-slate-500 font-medium text-sm mt-0.5">Area Kerja Kelas {selectedSubjectForQuestions.class} • Pelaksanaan: <span className="font-bold text-indigo-600">Semester {activeSemester} ({activeAcademicYear})</span></p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => { setPrintData({ type: 'kisi-kisi', class: selectedSubjectForQuestions.class, subjectName: selectedSubjectForQuestions.name, teacherName: currentUser.name, questions: questions.filter(q => q.subjectId === selectedSubjectForQuestions.id && (questionSemesterFilter === 'all' || (q.semester || activeSemester).toLowerCase() === (questionSemesterFilter === 'active' ? activeSemester : questionSemesterFilter).toLowerCase())) }) }} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold text-sm flex gap-2 items-center hover:bg-slate-50 shadow-sm"><FileSpreadsheet size={16} /> Kisi-kisi</button>
                                        {questions.filter(q => q.subjectId === selectedSubjectForQuestions.id).length > 0 && (
                                            <button onClick={() => initiateDelete('clear_subject', selectedSubjectForQuestions.id)} className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2 rounded-xl font-semibold text-sm flex gap-2 items-center hover:bg-rose-100 shadow-sm transition-colors"><Trash2 size={16} /> Kosongkan</button>
                                        )}
                                        <button onClick={() => { setImportModalConfig({ isOpen: true, type: 'Bank Soal' }) }} className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-semibold text-sm flex gap-2 items-center hover:bg-emerald-600 shadow-sm"><FileWord size={16} /> Import Berkas</button>
                                        <button onClick={() => openModal('stimulus', { subjectId: selectedSubjectForQuestions.id })} className="bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold text-sm flex gap-2 items-center hover:bg-amber-600 shadow-sm"><Plus size={16} /> Tambah Stimulus</button>
                                        <button onClick={() => openModal('question', { subjectId: selectedSubjectForQuestions.id })} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold text-sm flex gap-2 items-center shadow-sm hover:bg-indigo-700"><Plus size={16} /> Soal Manual</button>
                                    </div>
                                </div>

                                {/* TAB NAVIGATOR: DAFTAR SOAL vs DAFTAR STIMULUS */}
                                <div className="flex border-b border-slate-200 mb-6 gap-6">
                                    <button
                                        type="button"
                                        onClick={() => setBankSubjectTab('questions')}
                                        className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${bankSubjectTab === 'questions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                    >
                                        <FileText size={18} />
                                        Daftar Soal ({questions.filter(q => q.subjectId === selectedSubjectForQuestions.id).length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBankSubjectTab('stimuli')}
                                        className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${bankSubjectTab === 'stimuli' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                    >
                                        <BookOpen size={18} />
                                        Daftar Stimulus ({stimuli.filter(s => !s.subjectId || s.subjectId === selectedSubjectForQuestions.id).length})
                                    </button>
                                </div>

                                {bankSubjectTab === 'questions' && (
                                    <>
                                        {/* Filter Semester Soal Bar */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 mb-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Filter size={14} className="text-indigo-600" /> Filter Semester:</span>
                                                <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuestionSemesterFilter('active')}
                                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${questionSemesterFilter === 'active' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'}`}
                                                    >
                                                        Semester Aktif ({activeSemester})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuestionSemesterFilter('Ganjil')}
                                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${questionSemesterFilter === 'Ganjil' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'}`}
                                                    >
                                                        Ganjil
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuestionSemesterFilter('Genap')}
                                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${questionSemesterFilter === 'Genap' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'}`}
                                                    >
                                                        Genap
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuestionSemesterFilter('all')}
                                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${questionSemesterFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'}`}
                                                    >
                                                        Semua
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-xs font-semibold text-slate-500">
                                                Menampilkan: <span className="font-bold text-indigo-700">{
                                                    questions.filter(q => {
                                                        if (q.subjectId !== selectedSubjectForQuestions.id) return false;
                                                        if (questionSemesterFilter === 'all') return true;
                                                        const targetFilter = questionSemesterFilter === 'active' ? activeSemester : questionSemesterFilter;
                                                        return (q.semester || activeSemester).toLowerCase() === targetFilter.toLowerCase();
                                                    }).length
                                                }</span> butir soal
                                            </div>
                                        </div>

                                {questions.filter(q => {
                                    if (q.subjectId !== selectedSubjectForQuestions.id) return false;
                                    if (questionSemesterFilter === 'all') return true;
                                    const targetFilter = questionSemesterFilter === 'active' ? activeSemester : questionSemesterFilter;
                                    return (q.semester || activeSemester).toLowerCase() === targetFilter.toLowerCase();
                                }).length === 0 ? (
                                    <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <FileText size={48} className="mx-auto text-slate-300 mb-3" />
                                        <p className="text-lg font-bold text-slate-500">Belum Ada Soal</p>
                                        <p className="text-sm font-medium text-slate-400 mt-1">Tidak ada soal yang cocok dengan filter semester ini. Mulai tambahkan soal atau ubah filter.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-5">
                                        {questions.filter(q => {
                                            if (q.subjectId !== selectedSubjectForQuestions.id) return false;
                                            if (questionSemesterFilter === 'all') return true;
                                            const targetFilter = questionSemesterFilter === 'active' ? activeSemester : questionSemesterFilter;
                                            return (q.semester || activeSemester).toLowerCase() === targetFilter.toLowerCase();
                                        }).map((q, i) => (
                                            <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative flex flex-col md:flex-row gap-5">
                                                <div className="md:w-1/4 space-y-3 pr-5 md:border-r border-slate-100">
                                                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 font-bold rounded-lg flex items-center justify-center text-sm">{i + 1}</div>
                                                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tipe Soal</p><p className="font-semibold text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded inline-block text-[10px]">{q.type}</p></div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">Sem. {q.semester || activeSemester}</span>
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">TP {q.academicYear || activeAcademicYear}</span>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Level</p><p className={`font-bold text-[10px] px-2 py-0.5 rounded inline-block uppercase ${q.difficulty === 'HOTS' ? 'bg-rose-100 text-rose-700' : q.difficulty === 'MOTS' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{q.difficulty || 'MOTS'}</p></div>
                                                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bobot</p><p className="font-bold text-indigo-600 text-base leading-none">{q.weight || 10}</p></div>
                                                    </div>
                                                </div>

                                                <div className="md:w-2/4 space-y-3">
                                                    {q.indicator && <div><p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Indikator</p><p className="text-xs font-medium text-slate-600 italic bg-indigo-50/50 p-2 rounded border border-indigo-50">{q.indicator}</p></div>}
                                                    {(() => {
                                                        const sObj = stimuli.find(s => s.id === q.stimulusId);
                                                        if (!sObj) return null;
                                                        return (
                                                            <div className="flex items-center gap-2 bg-indigo-50/90 border border-indigo-200 px-3 py-1.5 rounded-xl w-fit">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                                                                    <BookOpen size={12} /> Stimulus:
                                                                </span>
                                                                <span className="text-xs font-semibold text-indigo-900 truncate max-w-[200px] sm:max-w-xs">{sObj.title}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setActiveStimulusModal(sObj)}
                                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline ml-1 cursor-pointer"
                                                                >
                                                                    Lihat
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pertanyaan / Stimulus</p>
                                                        {q.image && <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 max-w-[200px]"><img src={q.image} alt="Stimulus" className="w-full h-auto object-cover" /></div>}
                                                        <p className="font-medium text-slate-800 text-sm leading-relaxed">{q.text}</p>
                                                        {(q.type === 'single' || q.type === 'multiple') && q.options && q.options.length > 0 && (
                                                            <div className="mt-4 space-y-2">
                                                                {q.options.map((opt, oIdx) => opt ? (
                                                                    <div key={oIdx} className="flex gap-2 text-xs">
                                                                        <span className="font-bold text-slate-400">{String.fromCharCode(65 + oIdx)}.</span>
                                                                        <span className="text-slate-600">{opt}</span>
                                                                    </div>
                                                                ) : null)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="md:w-1/4 flex flex-col justify-between pl-0 md:pl-5 md:border-l border-slate-100">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kunci Jawaban</p>
                                                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                                                            {q.type === 'single' && !isNaN(q.correct) && <p className="font-bold text-emerald-700 text-base">{String.fromCharCode(65 + Number(q.correct))}</p>}
                                                            {q.type === 'multiple' && <p className="font-bold text-emerald-700 text-sm">{String(q.correct).split(',').map(n => String.fromCharCode(65 + Number(n))).join(', ')}</p>}
                                                            {q.type === 'boolean' && <p className="font-bold text-emerald-700 text-sm">{String(q.correct) === "0" ? "BENAR" : "SALAH"}</p>}
                                                            {(q.type === 'short' || q.type === 'essay' || q.type === 'matching') && <p className="font-medium text-emerald-700 text-xs whitespace-pre-wrap">{q.correct}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                                        <button onClick={() => openModal('question', q)} className="flex-1 bg-white border border-slate-200 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-xs flex items-center justify-center gap-1.5"><Edit size={14} /> Edit</button>
                                                        <button onClick={() => initiateDelete('question', q.id)} className="flex-1 bg-white border border-slate-200 text-rose-500 py-2 rounded-lg hover:bg-rose-50 transition-colors font-semibold text-xs flex items-center justify-center gap-1.5"><Trash2 size={14} /> Hapus</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* TAB DAFTAR STIMULUS */}
                        {bankSubjectTab === 'stimuli' && (
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-amber-50/70 p-4 sm:p-5 rounded-2xl border border-amber-200">
                                    <div>
                                        <h4 className="font-bold text-sm sm:text-base text-amber-900 flex items-center gap-2">
                                            <BookOpen size={18} className="text-amber-600" />
                                            Koleksi Stimulus Soal
                                        </h4>
                                        <p className="text-xs text-amber-700 mt-0.5">
                                            Stimulus berupa wacana teks, tabel data hasil percobaan, atau gambar/infografis dapat ditautkan ke satu atau beberapa butir soal sekaligus.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openModal('stimulus', { subjectId: selectedSubjectForQuestions.id })}
                                        className="bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-amber-700 shrink-0"
                                    >
                                        <Plus size={14} /> Tambah Stimulus
                                    </button>
                                </div>

                                {stimuli.filter(s => !s.subjectId || s.subjectId === selectedSubjectForQuestions.id).length === 0 ? (
                                    <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
                                        <p className="text-lg font-bold text-slate-500">Belum Ada Stimulus</p>
                                        <p className="text-sm font-medium text-slate-400 mt-1">Buat stimulus teks literasi, tabel data, atau gambar untuk mata pelajaran ini.</p>
                                        <button
                                            onClick={() => openModal('stimulus', { subjectId: selectedSubjectForQuestions.id })}
                                            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
                                        >
                                            <Plus size={14} /> Buat Stimulus Sekarang
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {stimuli.filter(s => !s.subjectId || s.subjectId === selectedSubjectForQuestions.id).map((stim) => {
                                            const linkedCount = questions.filter(q => q.stimulusId === stim.id).length;
                                            return (
                                                <div key={stim.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                                stim.type === 'table' ? 'bg-emerald-100 text-emerald-800' :
                                                                stim.type === 'image' ? 'bg-purple-100 text-purple-800' :
                                                                stim.type === 'combined' ? 'bg-rose-100 text-rose-800' :
                                                                'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {stim.type === 'table' ? '📊 Tabel Data' :
                                                                 stim.type === 'image' ? '🖼️ Gambar' :
                                                                 stim.type === 'combined' ? '📑 Gabungan' :
                                                                 '📝 Teks / Wacana'}
                                                            </span>
                                                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                                                                {linkedCount} Soal Memakai Ini
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-slate-800 text-base mb-1">{stim.title}</h4>
                                                        {stim.source && <p className="text-[11px] text-slate-400 italic mb-3">Sumber: {stim.source}</p>}

                                                        {/* Pratinjau Gambar */}
                                                        {stim.imageUrl && (
                                                            <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 max-h-36 bg-slate-50 flex items-center justify-center">
                                                                <img src={stim.imageUrl} alt={stim.title} className="max-h-36 object-contain" />
                                                            </div>
                                                        )}

                                                        {/* Pratinjau Tabel */}
                                                        {stim.tableData && stim.tableData.length > 0 && (
                                                            <div className="mb-3 overflow-x-auto rounded-lg border border-slate-200">
                                                                <table className="w-full text-left text-[11px] border-collapse">
                                                                    {stim.tableData[0] && (
                                                                        <thead className="bg-slate-100 text-slate-700 font-semibold">
                                                                            <tr>{stim.tableData[0].slice(0, 3).map((h, i) => <th key={i} className="p-1.5 border-b border-slate-200">{h}</th>)}</tr>
                                                                        </thead>
                                                                    )}
                                                                    <tbody>
                                                                        {stim.tableData.slice(1, 3).map((r, ri) => (
                                                                            <tr key={ri} className="border-b border-slate-100 text-slate-600">
                                                                                {r.slice(0, 3).map((c, ci) => <td key={ci} className="p-1.5">{c}</td>)}
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                                {stim.tableData.length > 3 && (
                                                                    <p className="text-[10px] text-slate-400 text-center py-1 bg-slate-50">+{stim.tableData.length - 3} baris lainnya...</p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Pratinjau Teks */}
                                                        {stim.content && (
                                                            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                                {stim.content}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveStimulusModal(stim)}
                                                            className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Eye size={13} /> Lihat Detail
                                                        </button>
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openModal('question', { subjectId: selectedSubjectForQuestions.id, stimulusId: stim.id })}
                                                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                                title="Buat soal yang langsung memakai stimulus ini"
                                                            >
                                                                <Plus size={13} /> Buat Soal
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openModal('stimulus', stim)}
                                                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg text-xs transition-colors"
                                                                title="Edit stimulus"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => initiateDelete('stimulus', stim.id)}
                                                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg text-xs transition-colors"
                                                                title="Hapus stimulus"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                            </div>
                        )
                    )}

                    {/* ANALYSIS / Laporan Ujian */}
                    {adminMenu === 'analysis' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-fade-in space-y-8 max-w-7xl mx-auto">
                            <div className="text-center mb-8 border-b border-slate-100 pb-6">
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3"><BarChart2 size={28} /></div>
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">LAPORAN HASIL UJIAN</h2>
                                <p className="text-slate-500 font-semibold mt-1 uppercase tracking-widest text-[10px]">{schoolData.name} - {schoolData.term}</p>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6">
                                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                                    <div className="relative flex-1"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><select className="w-full pl-10 pr-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-sm bg-white outline-none font-semibold text-slate-700 shadow-sm" value={analysisFilterClass} onChange={e => setAnalysisFilterClass(e.target.value)}><option value="">Seluruh Kelas</option>{getMyClasses().map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                                    <div className="relative flex-1"><BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><select className="w-full pl-10 pr-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-sm bg-white outline-none font-semibold text-slate-700 shadow-sm" value={analysisFilterSubject} onChange={e => setAnalysisFilterSubject(e.target.value)}><option value="">Seluruh Mata Pelajaran</option>{getMySubjects().map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handlePrintResults} className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl flex gap-1.5 items-center hover:bg-slate-50 font-semibold text-sm shadow-sm transition-colors"><Printer size={16} /> Print</button>
                                    <button onClick={handlePrintExcel} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex gap-1.5 items-center hover:bg-emerald-700 font-semibold text-sm shadow-sm transition-colors"><Download size={16} /> Excel</button>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 w-12 text-center">Rank</th>
                                            <th className="p-4">Nama Murid</th>
                                            <th className="p-4">Kelas</th>
                                            <th className="p-4">Mata Pelajaran</th>
                                            <th className="p-4 text-center">Skor Akhir</th>
                                            <th className="p-4 text-center">Status</th>
                                            <th className="p-4 text-center w-28">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredResultsList.length > 0 ? filteredResultsList.sort((a, b) => b.score - a.score).map((res, i) => (
                                            <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 text-center font-bold text-slate-400 text-sm">#{i + 1}</td>
                                                <td className="p-4 font-semibold text-slate-800 text-sm">
                                                    {res.studentName}
                                                    {res.verified && <CheckCircle size={12} className="inline ml-1 text-emerald-500" title="Sudah Diverifikasi" />}
                                                </td>
                                                <td className="p-4 font-medium text-slate-500 text-xs">{res.class}</td>
                                                <td className="p-4 font-medium text-slate-500 text-xs">{res.subject}</td>
                                                <td className="p-4 text-center"><span className={`font-black text-lg ${res.score >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>{res.score.toFixed(0)}</span></td>
                                                <td className="p-4 text-center"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${res.score >= 75 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>{res.score >= 75 ? 'LULUS' : 'REMEDIAL'}</span></td>
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => { setEditingItem(res); setModalType('verify'); setModalOpen(true); }} className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5" title="Verifikasi & Beri Nilai Manual"><CheckSquare size={14} /> Analisis Jawaban</button>
                                                        <button onClick={() => initiateDelete('result', res.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus Hasil"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className="p-12 text-center text-slate-400 bg-slate-50/50">
                                                    <BarChart2 size={40} className="mx-auto mb-3 text-slate-300" />
                                                    <p className="text-base font-bold">Belum Ada Data</p>
                                                    <p className="font-medium mt-1 text-xs">Pastikan siswa telah menyelesaikan ujian atau periksa filter Anda.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ADMIN: COMMAND CENTER TOKEN */}
                    {adminMenu === 'token' && role === 'admin' && (
                        <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-sm border border-slate-100 text-center animate-fade-in max-w-4xl mx-auto relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Power size={32} /></div>
                                <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Pusat Kendali Ujian</h2>
                                <p className="text-slate-500 mb-8 max-w-xl mx-auto font-medium text-sm leading-relaxed">Aktifkan sesi ujian secara terpusat. Tentukan <strong>Blueprint Kognitif</strong> agar sistem mengacak proporsi soal berdasarkan level kesulitannya.</p>

                                <form onSubmit={generateNewToken} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mx-auto text-left shadow-sm">
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Pilih Mata Pelajaran</label>
                                        <select className="w-full p-3.5 border border-slate-200 focus:border-rose-400 rounded-xl outline-none font-semibold text-slate-700 bg-white shadow-sm text-sm transition-all" value={examBlueprint.subjectId} onChange={(e) => setExamBlueprint({ ...examBlueprint, subjectId: e.target.value })} required><option value="">-- Sentuh untuk Memilih --</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class}) - Oleh: {teachers.find(t => t.id === s.teacherId)?.name}</option>)}</select>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 mb-6 shadow-sm">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                                            <h4 className="font-bold text-slate-800 text-sm">Cetak Biru (Blueprint) Soal</h4>
                                            <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${parseInt(examBlueprint.lots) + parseInt(examBlueprint.mots) + parseInt(examBlueprint.hots) === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>Total: {parseInt(examBlueprint.lots) + parseInt(examBlueprint.mots) + parseInt(examBlueprint.hots)}%</div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Jumlah Soal Ditampilkan</label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" min="1" value={examBlueprint.total} onChange={e => setExamBlueprint({ ...examBlueprint, total: e.target.value })} className="w-24 p-2.5 border border-slate-200 rounded-lg text-center font-bold text-sm outline-none focus:border-indigo-400" />
                                                <span className="text-xs font-semibold text-slate-500">Soal (diacak dari Bank Soal)</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">LOTS</label><div className="flex items-center gap-1"><input type="number" min="0" max="100" value={examBlueprint.lots} onChange={e => setExamBlueprint({ ...examBlueprint, lots: e.target.value })} className="w-full p-2 border border-transparent bg-white rounded-lg text-center font-bold text-base outline-none focus:border-emerald-400" /><span className="font-bold text-slate-400 text-xs">%</span></div></div>
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">MOTS</label><div className="flex items-center gap-1"><input type="number" min="0" max="100" value={examBlueprint.mots} onChange={e => setExamBlueprint({ ...examBlueprint, mots: e.target.value })} className="w-full p-2 border border-transparent bg-white rounded-lg text-center font-bold text-base outline-none focus:border-amber-400" /><span className="font-bold text-slate-400 text-xs">%</span></div></div>
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">HOTS</label><div className="flex items-center gap-1"><input type="number" min="0" max="100" value={examBlueprint.hots} onChange={e => setExamBlueprint({ ...examBlueprint, hots: e.target.value })} className="w-full p-2 border border-transparent bg-white rounded-lg text-center font-bold text-base outline-none focus:border-rose-400" /><span className="font-bold text-slate-400 text-xs">%</span></div></div>
                                        </div>
                                    </div>
                                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 mb-6 text-xs flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-rose-600" />
                                            <span className="font-semibold text-rose-900">Semester Pelaksanaan:</span>
                                        </div>
                                        <span className="font-bold text-rose-700 bg-white px-3 py-1 rounded-lg border border-rose-200">
                                            Semester {examBlueprint.semester || activeSemester} ({examBlueprint.academicYear || activeAcademicYear})
                                        </span>
                                    </div>
                                    <button type="submit" className="w-full bg-rose-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-rose-700 transition-all flex items-center justify-center gap-2"><Power size={18} /> LUNCURKAN UJIAN</button>
                                </form>

                                {activeExams.length > 0 && (
                                    <div className="mt-12 text-left">
                                        <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2"><div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></div> Sesi Ujian Aktif (LIVE)</h3>
                                        <div className={`grid gap-5 ${activeExams.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                                            {activeExams.map(exam => {
                                                const sub = subjects.find(s => s.id === exam.subjectId);
                                                return (
                                                    <div key={exam.token} className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm relative overflow-hidden flex flex-col">
                                                        <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-bold tracking-wider px-3 py-1 rounded-bl-xl">LIVE NOW</div>
                                                        <h4 className="text-lg font-bold text-slate-800 mb-0.5 mt-1">{sub?.name}</h4>
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Kelas {sub?.class}</p>
                                                            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
                                                                Sem. {exam.semester || activeSemester} ({exam.academicYear || activeAcademicYear})
                                                            </span>
                                                        </div>

                                                        <div className="bg-rose-50 p-4 rounded-xl text-center mb-5 border border-rose-100">
                                                            <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mb-1">Token Akses</p>
                                                            <p className="text-3xl font-black font-mono text-rose-600 tracking-widest">{exam.token}</p>
                                                        </div>

                                                        <div className="bg-slate-50 rounded-xl border border-slate-100 mb-5 overflow-hidden flex-1 flex flex-col">
                                                            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider flex justify-between items-center">
                                                                <span>Peserta Ujian</span>
                                                                <span className="bg-white px-2.5 py-1 rounded-md shadow-sm border border-slate-200 text-slate-700">{students.filter(st => st.class === sub?.class).length} Siswa</span>
                                                            </div>
                                                            <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 flex-1">
                                                                {students.filter(st => st.class === sub?.class).map(st => {
                                                                    const ls = liveStatus[st.id] || { status: 'Offline' };
                                                                    const hasFinished = results.some(r => r.studentName === st.name && r.subject === sub?.name && r.token === exam.token);
                                                                    const displayStatus = hasFinished ? 'Selesai' : ls.status;
                                                                    return (
                                                                        <div key={st.id} className="flex justify-between items-center p-3 text-sm border-b border-slate-100 last:border-0 hover:bg-white transition-colors rounded-lg">
                                                                            <div className="flex items-center gap-2.5">
                                                                                <span className="font-bold text-slate-700">{st.name}</span>
                                                                                {ls.cheat && !hasFinished && <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.6)]" title="Indikasi Mencontek / Keluar Tab"></div>}
                                                                            </div>
                                                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${displayStatus === 'Selesai' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                                                displayStatus === 'Mencontek' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                                                                    displayStatus === 'Mengerjakan' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                                                        'bg-slate-200 text-slate-500 border border-slate-300'
                                                                                }`}>{displayStatus}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => stopExam(exam.token)} className="mt-auto w-full bg-white border border-slate-200 text-slate-600 py-2 rounded-lg font-semibold hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors text-xs">Akhiri Sesi Ini</button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ADMINISTRASI CETAK (ADMIN ONLY) */}
                    {adminMenu === 'documents' && role === 'admin' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-fade-in space-y-6 max-w-4xl mx-auto">
                            <div className="text-center mb-6 border-b border-slate-100 pb-6">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3"><ClipboardList size={28} /></div>
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Administrasi Pelaksanaan</h2>
                                <p className="text-slate-500 font-medium mt-1 text-sm">Pusat cetak Daftar Hadir & Berita Acara Ujian</p>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Pilih Kelas</label><select className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm" value={printForm.class} onChange={(e) => setPrintForm({ ...printForm, class: e.target.value })}><option value="">-- Kelas --</option>{classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Pilih Mata Pelajaran</label><select className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm" value={printForm.subject} onChange={(e) => setPrintForm({ ...printForm, subject: e.target.value })}><option value="">-- Mapel --</option>{subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nama Kegiatan (Kustom)</label><input type="text" className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm" value={printForm.activityName} onChange={(e) => setPrintForm({ ...printForm, activityName: e.target.value })} /></div>
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Tanggal Pelaksanaan</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={18} /><input type="date" className="w-full pl-10 p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm" value={printForm.date} onChange={(e) => setPrintForm({ ...printForm, date: e.target.value })} /></div></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nama Pengawas Ruang</label><input type="text" placeholder="Masukkan nama pengawas" className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm" value={printForm.pengawas} onChange={(e) => setPrintForm({ ...printForm, pengawas: e.target.value })} /></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Jam Mulai</label><input type="time" className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm" value={printForm.waktuMulai} onChange={(e) => setPrintForm({ ...printForm, waktuMulai: e.target.value })} /></div>
                                        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Jam Selesai</label><input type="time" className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm" value={printForm.waktuSelesai} onChange={(e) => setPrintForm({ ...printForm, waktuSelesai: e.target.value })} /></div>
                                    </div>
                                </div>
                                <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-4">
                                    <p className="text-xs font-bold text-indigo-600 border-b border-slate-100 pb-2">Isian Berita Acara (Isi sebelum cetak)</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Seharusnya (Jml)</label><input type="number" className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm" value={printForm.seharusnya} onChange={(e) => setPrintForm({ ...printForm, seharusnya: e.target.value })} /></div>
                                        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Hadir</label><input type="number" className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm" value={printForm.hadir} onChange={(e) => setPrintForm({ ...printForm, hadir: e.target.value })} /></div>
                                        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Tdk Hadir</label><input type="number" className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm" value={printForm.tidakHadir} onChange={(e) => setPrintForm({ ...printForm, tidakHadir: e.target.value })} /></div>
                                    </div>
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Catatan Selama Pelaksanaan</label><input type="text" placeholder="Misal: Ujian berjalan lancar tanpa kendala..." className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm" value={printForm.catatan} onChange={(e) => setPrintForm({ ...printForm, catatan: e.target.value })} /></div>
                                </div>

                                <div className="pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <button onClick={() => handleOpenPrintPreview('attendance')} className="bg-indigo-600 text-white p-4 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 hover:bg-indigo-700 shadow-sm transition-all"><ClipboardList size={24} /> Cetak Daftar Hadir</button>
                                    <button onClick={() => handleOpenPrintPreview('report')} className="bg-emerald-600 text-white p-4 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 hover:bg-emerald-700 shadow-sm transition-all"><FileText size={24} /> Cetak Berita Acara</button>
                                    <button onClick={() => handleOpenPrintPreview('kartu_login')} className="bg-fuchsia-600 text-white p-4 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 hover:bg-fuchsia-700 shadow-sm transition-all"><User size={24} /> Cetak Kartu Login</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PENGATURAN SEKOLAH (ADMIN ONLY) */}
                    {adminMenu === 'school' && role === 'admin' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 max-w-3xl mx-auto animate-fade-in"><div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-5"><div className="bg-slate-100 p-3.5 rounded-xl text-slate-600 shadow-sm"><Settings size={28} /></div><div><h3 className="font-bold text-2xl text-slate-800 tracking-tight">Pengaturan Sistem</h3><p className="text-slate-500 font-medium text-sm mt-0.5">Identitas Institusi & Akun Admin</p></div></div><form onSubmit={handleSaveSchool} className="space-y-6">

                            {/* BRANDING LOGO — hanya info, tidak bisa diubah */}
                            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                <div className="shrink-0 text-center">
                                    <label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">Logo Aplikasi (Branding)</label>
                                    <div className="w-24 h-24 border-2 border-indigo-200 rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-sm">
                                        <img src={EQUEST_LOGO} className="w-full h-full object-contain p-2" alt="e-Quest" />
                                    </div>
                                </div>
                                <div className="flex-1 w-full">
                                    <p className="text-xs font-bold text-indigo-700 mb-1">Logo e-Quest (Tetap)</p>
                                    <p className="text-[11px] text-indigo-500 font-medium leading-relaxed">Logo branding e-Quest digunakan pada tampilan aplikasi, sidebar, dan halaman login. Logo ini tidak dapat diubah dan merupakan identitas resmi platform.</p>
                                </div>
                            </div>

                            {/* SCHOOL LOGO — untuk dokumen cetak */}
                            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <div className="shrink-0 text-center">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Logo Sekolah (Cetak)</label>
                                    <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-sm">
                                        {(tempSchoolLogo || schoolData.schoolLogo) ? <img src={tempSchoolLogo || schoolData.schoolLogo} className="w-full h-full object-contain p-2" alt="Logo Sekolah" /> : <School size={32} className="text-slate-300" />}
                                    </div>
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Upload Logo Sekolah</label>
                                    <input type="file" accept="image/*" onChange={handleSchoolLogoUpload} className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white shadow-sm font-medium text-slate-700 text-sm" />
                                    <p className="text-[10px] text-slate-400 mt-2 font-semibold">Digunakan pada Kop Surat, Daftar Hadir, dan Berita Acara. Format: PNG/JPG, Maks 2MB.</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider border-b border-slate-200 pb-1">Informasi Instansi</label>
                                <div><input name="dinasPendidikan" defaultValue={schoolData.dinasPendidikan} placeholder="Dinas Pendidikan (Kop Surat)" className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none text-sm" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><input name="name" defaultValue={schoolData.name} placeholder="Nama Sekolah" className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none text-sm" /></div>
                                    <div><input name="kabupaten" defaultValue={schoolData.kabupaten} placeholder="Nama Kabupaten/Kota" className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none text-sm" /></div>
                                </div>
                                <div><input name="address" defaultValue={schoolData.address} placeholder="Alamat Sekolah Lengkap" className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-medium text-slate-800 outline-none text-sm" /></div>

                                {/* Semester & Tahun Pelajaran */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                                            <Calendar size={14} className="text-indigo-600" />
                                            Semester Pelaksanaan Ujian
                                        </label>
                                        <select
                                            name="semester"
                                            defaultValue={activeSemester}
                                            className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-bold text-indigo-700 outline-none text-sm"
                                        >
                                            <option value="Ganjil">Semester Ganjil</option>
                                            <option value="Genap">Semester Genap</option>
                                        </select>
                                        <p className="text-[10px] text-slate-500 font-medium mt-1">Soal ujian siswa akan otomatis difilter sesuai semester ini.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tahun Pelajaran</label>
                                        <input
                                            name="academicYear"
                                            defaultValue={activeAcademicYear}
                                            placeholder="Contoh: 2025/2026"
                                            className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none text-sm"
                                        />
                                        <p className="text-[10px] text-slate-500 font-medium mt-1">Format tahun ajaran (misal: 2025/2026).</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4"><label className="block text-[10px] font-bold text-amber-500 uppercase tracking-wider border-b border-slate-200 pb-1">Data Kepala Sekolah</label><div><input name="kepsekName" defaultValue={schoolData.kepsekName} placeholder="Nama Kepala Sekolah beserta Gelar" className="w-full p-3.5 border border-slate-200 focus:border-amber-400 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none text-sm" /></div><div><input name="kepsekNip" defaultValue={schoolData.kepsekNip} placeholder="NIP Kepala Sekolah" className="w-full p-3.5 border border-slate-200 focus:border-amber-400 rounded-xl bg-slate-50 font-medium text-slate-800 outline-none text-sm" /></div></div><div className="space-y-4 pt-4"><label className="block text-[10px] font-bold text-rose-500 uppercase tracking-wider border-b border-slate-200 pb-1">Kredensial Admin Utama</label><div><input name="adminName" defaultValue={schoolData.adminName} placeholder="Nama Lengkap Admin" className="w-full p-3.5 border border-slate-200 focus:border-rose-400 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none text-sm" /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><input name="adminUsername" defaultValue={schoolData.adminUsername} placeholder="Username Akses" className="w-full p-3.5 border border-slate-200 focus:border-rose-400 rounded-xl bg-slate-50 font-mono font-bold text-indigo-600 outline-none text-sm" /></div><div><input name="adminPassword" type="password" defaultValue={schoolData.adminPassword} placeholder="Password Baru" className="w-full p-3.5 border border-slate-200 focus:border-rose-400 rounded-xl bg-slate-50 font-mono font-medium text-slate-500 outline-none text-sm" /></div></div></div>
                            <div className="space-y-4 pt-4"><label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider border-b border-slate-200 pb-1">Pengaturan Ujian</label><div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Jumlah Opsi Pilihan Ganda</label><select name="optionCount" defaultValue={schoolData.optionCount || 5} className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-medium text-slate-600 outline-none text-sm"><option value="4">4 Opsi (A, B, C, D)</option><option value="5">5 Opsi (A, B, C, D, E)</option></select></div><p className="text-[10px] text-slate-500 font-medium mt-1">Menentukan jumlah opsi jawaban maksimal pada pembuatan soal.</p></div>
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                                    <label className="block text-[10px] font-bold text-fuchsia-500 uppercase tracking-wider">Integrasi AI Generator (Gemini)</label>
                                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Sparkles size={11} /> Auto Deteksi Model Versi
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">API Key Google Gemini</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            id="geminiApiKeySettingInput"
                                            name="apiKey"
                                            type="password"
                                            defaultValue={schoolData.apiKey}
                                            placeholder="Masukkan API Key Google AI Studio..."
                                            className="flex-1 p-3.5 border border-slate-200 focus:border-fuchsia-400 rounded-xl bg-slate-50 font-mono font-medium text-slate-700 outline-none text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const val = document.getElementById('geminiApiKeySettingInput')?.value;
                                                handleDetectAiModels(val);
                                            }}
                                            disabled={isCheckingAiKey}
                                            className="px-4 py-3.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all shrink-0 disabled:opacity-50"
                                        >
                                            {isCheckingAiKey ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                            Deteksi & Muat Model Otomatis
                                        </button>
                                    </div>
                                    {aiKeyStatus && (
                                        <div className={`mt-2 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${aiKeyStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : aiKeyStatus.type === 'loading' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                            {aiKeyStatus.type === 'success' ? <CheckCircle size={15} /> : aiKeyStatus.type === 'loading' ? <Loader2 size={15} className="animate-spin" /> : <AlertCircle size={15} />}
                                            <span>{aiKeyStatus.message}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-xs font-semibold text-slate-600">Pilih Versi / Mode Model AI</label>
                                        <span className="text-[10px] text-slate-400 font-medium">Disesuaikan otomatis dari API Key Anda</span>
                                    </div>
                                    <select
                                        name="aiModel"
                                        value={schoolData.aiModel || "gemini-1.5-flash"}
                                        onChange={e => setSchoolData(p => ({ ...p, aiModel: e.target.value }))}
                                        className="w-full p-3.5 border border-slate-200 focus:border-fuchsia-400 rounded-xl bg-slate-50 font-mono font-medium text-slate-700 outline-none text-sm"
                                    >
                                        {availableAiModels && availableAiModels.length > 0 ? (
                                            availableAiModels.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} ({m.id}) {m.isFlash ? '⚡ Cepat & Ringan' : m.isPro ? '🧠 Analisis Tinggi' : ''}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Generasi Terbaru - Direkomendasikan)</option>
                                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Sangat Cepat & Stabil)</option>
                                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Kemampuan Analisis Tinggi)</option>
                                                <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                                            </>
                                        )}
                                    </select>
                                    <p className="text-[10px] text-slate-500 font-medium mt-1.5 leading-relaxed">
                                        Versi model otomatis tersinkronisasi dengan model resmi yang aktif pada API Key yang Anda masukkan. Anda dapat bebas memilih versi model yang sesuai.
                                    </p>
                                </div>
                            </div>
                            <button className="w-full bg-slate-800 text-white p-4 rounded-xl font-bold text-sm hover:bg-slate-900 shadow-md mt-6 transition-colors">SIMPAN PENGATURAN</button>
                        </form></div>
                    )}

                </div>
            </main>

            {/* MOBILE 3-BUTTON BOTTOM DOCK (KHUSUS LOGIN GURU / ADMIN) */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 py-2 px-6 shadow-[0_-6px_25px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between max-w-sm mx-auto relative">
                    
                    {/* TOMBOL KIRI (MENU CEPAT PRIORITAS: BANK SOAL) */}
                    <button
                        onClick={() => setAdminMenu('questions')}
                        className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all cursor-pointer ${adminMenu === 'questions' ? 'text-indigo-600 font-extrabold bg-indigo-50/80' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <FileText size={20} className={adminMenu === 'questions' ? 'text-indigo-600' : 'text-slate-500'} />
                        <span className="text-[10px] mt-1 font-semibold">Bank Soal</span>
                    </button>

                    {/* TOMBOL TENGAH (PROMINENT FLOATING BUTTON UNTUK MEMUNCULKAN SEMUA MENU) */}
                    <div className="relative -top-4 flex flex-col items-center">
                        <button
                            onClick={() => setMobileAdminDrawerOpen(true)}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/35 border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                            aria-label="Buka Semua Menu"
                        >
                            <Grid size={24} className="text-white group-hover:rotate-45 transition-transform" />
                        </button>
                        <span className="text-[10px] font-extrabold text-indigo-700 tracking-tight mt-0.5">
                            Semua Menu
                        </span>
                    </div>

                    {/* TOMBOL KANAN (MENU CEPAT PRIORITAS GURU/ADMIN) */}
                    {role === 'admin' ? (
                        <button
                            onClick={() => setAdminMenu('token')}
                            className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all cursor-pointer ${adminMenu === 'token' ? 'text-rose-600 font-extrabold bg-rose-50/80' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <div className="relative">
                                <MonitorPlay size={20} className={adminMenu === 'token' ? 'text-rose-600' : 'text-slate-500'} />
                                {activeExams.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] mt-1 font-semibold">Pusat Ujian</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setAdminMenu('analysis')}
                            className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all cursor-pointer ${adminMenu === 'analysis' ? 'text-indigo-600 font-extrabold bg-indigo-50/80' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <BarChart2 size={20} className={adminMenu === 'analysis' ? 'text-indigo-600' : 'text-slate-500'} />
                            <span className="text-[10px] mt-1 font-semibold">Analisis Nilai</span>
                        </button>
                    )}

                </div>
            </div>

            {/* MOBILE FULL NAVIGATION DRAWER (DIBUKA DARI TOMBOL TENGAH) */}
            <AnimatePresence>
                {mobileAdminDrawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileAdminDrawerOpen(false)}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 md:hidden"
                        />

                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-[2.5rem] border-t border-slate-200/90 shadow-2xl p-6 md:hidden max-h-[88vh] overflow-y-auto no-scrollbar flex flex-col"
                        >
                            {/* Drawer Grabber Handle */}
                            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4 shrink-0" />

                            {/* Header Profil Edukator */}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center p-1 shadow-xs">
                                        <img src={EQUEST_LOGO} alt="e-Quest" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-sm text-slate-800 leading-tight">{currentUser.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            {role === 'admin' ? 'Administrator Sekolah' : (currentUser?.teacherType === 'guru_kelas' ? `Wali ${currentUser?.assignedClass || ''}` : `Guru Mapel: ${currentUser?.subjectName || ''}`)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMobileAdminDrawerOpen(false)}
                                    className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Grid Semua Menu Lengkap */}
                            <div className="space-y-4 flex-1">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Menu Utama</p>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <button
                                            onClick={() => { setAdminMenu('dashboard'); setMobileAdminDrawerOpen(false); }}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${adminMenu === 'dashboard' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-slate-50/70 border-slate-200/80 text-slate-700 font-medium hover:bg-slate-100'}`}
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                                                <LayoutDashboard size={18} />
                                            </div>
                                            <span className="text-xs">Dashboard</span>
                                        </button>

                                        <button
                                            onClick={() => { setAdminMenu('questions'); setMobileAdminDrawerOpen(false); }}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${adminMenu === 'questions' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-slate-50/70 border-slate-200/80 text-slate-700 font-medium hover:bg-slate-100'}`}
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                                                <FileText size={18} />
                                            </div>
                                            <span className="text-xs">Bank Soal</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Akademik & Kelas</p>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {role === 'admin' && (
                                            <button
                                                onClick={() => { setAdminMenu('teachers'); setMobileAdminDrawerOpen(false); }}
                                                className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${adminMenu === 'teachers' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-slate-50/70 border-slate-200/80 text-slate-700 font-medium hover:bg-slate-100'}`}
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                                                    <UserCog size={18} />
                                                </div>
                                                <span className="text-xs">Data Guru</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => { setAdminMenu('classes'); setMobileAdminDrawerOpen(false); }}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${adminMenu === 'classes' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-slate-50/70 border-slate-200/80 text-slate-700 font-medium hover:bg-slate-100'}`}
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                                                <Layers size={18} />
                                            </div>
                                            <span className="text-xs">{role === 'admin' ? 'Data Kelas' : 'Kelas Diampu'}</span>
                                        </button>

                                        <button
                                            onClick={() => { setAdminMenu('students'); setMobileAdminDrawerOpen(false); }}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${adminMenu === 'students' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-slate-50/70 border-slate-200/80 text-slate-700 font-medium hover:bg-slate-100'}`}
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                                                <Users size={18} />
                                            </div>
                                            <span className="text-xs">{role === 'admin' ? 'Data Murid' : 'Murid Binaan'}</span>
                                        </button>

                                        <button
                                            onClick={() => { setAdminMenu('subjects'); setMobileAdminDrawerOpen(false); }}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${adminMenu === 'subjects' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-slate-50/70 border-slate-200/80 text-slate-700 font-medium hover:bg-slate-100'}`}
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                                                <BookOpen size={18} />
                                            </div>
                                            <span className="text-xs">Mata Pelajaran</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Evaluasi & Laporan</p>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {role === 'admin' && (
                                            <button
                                                onClick={() => { setAdminMenu('token'); setMobileAdminDrawerOpen(false); }}
                                                className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${adminMenu === 'token' ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold' : 'bg-slate-50/70 border-slate-200/80 text-slate-700 font-medium hover:bg-slate-100'}`}
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-rose-600 shrink-0">
                                                    <MonitorPlay size={18} />
                                                </div>
                                                <span className="text-xs">Pusat Ujian</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => { setAdminMenu('analysis'); setMobileAdminDrawerOpen(false); }}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${adminMenu === 'analysis' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-slate-50/70 border-slate-200/80 text-slate-700 font-medium hover:bg-slate-100'}`}
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                                                <BarChart2 size={18} />
                                            </div>
                                            <span className="text-xs">Analisis Nilai</span>
                                        </button>

                                        {role === 'admin' && (
                                            <button
                                                onClick={() => { setAdminMenu('documents'); setMobileAdminDrawerOpen(false); }}
                                                className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${adminMenu === 'documents' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-slate-50/70 border-slate-200/80 text-slate-700 font-medium hover:bg-slate-100'}`}
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                                                    <ClipboardList size={18} />
                                                </div>
                                                <span className="text-xs">Administrasi</span>
                                            </button>
                                        )}

                                        {role === 'admin' && (
                                            <button
                                                onClick={() => { setAdminMenu('school'); setMobileAdminDrawerOpen(false); }}
                                                className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${adminMenu === 'school' ? 'bg-slate-800 border-slate-900 text-white font-bold' : 'bg-slate-50/70 border-slate-200/80 text-slate-700 font-medium hover:bg-slate-100'}`}
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-slate-700 shrink-0">
                                                    <Settings size={18} />
                                                </div>
                                                <span className="text-xs">Pengaturan</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Action Pintar AI & Logout */}
                                <div className="pt-3 border-t border-slate-100 space-y-2">
                                    <button
                                        onClick={() => { setAiWizardOpen(true); setMobileAdminDrawerOpen(false); }}
                                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-between cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2"><Sparkles size={16} className="text-fuchsia-300" /> Buka AI Soal Wizard</span>
                                        <ChevronRight size={16} />
                                    </button>

                                    <button
                                        onClick={() => { setMobileAdminDrawerOpen(false); setRole(null); }}
                                        className="w-full py-2.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <LogOut size={16} />
                                        <span>Keluar Aplikasi</span>
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* EDITOR MODALS (CRUD) */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 sm:p-8 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-6 md:p-8 flex flex-col max-h-[95vh] shadow-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4"><h3 className="font-bold text-2xl text-slate-800">Editor Database</h3><button onClick={() => setModalOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors"><X size={18} /></button></div>
                        <div className="overflow-y-auto pr-2 custom-scrollbar no-scrollbar pb-6">
                            <form onSubmit={handleSave} className="space-y-5">

                                {/* TEACHER FORM */}
                                {modalType === 'teacher' && (
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap & Gelar</label>
                                            <input name="name" defaultValue={editingItem?.name} placeholder="Contoh: Budi Santoso, S.Pd" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-800 text-sm" required />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Username Akses</label>
                                                <input name="username" defaultValue={editingItem?.username} placeholder="Username unik tanpa spasi" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-bold font-mono text-indigo-600 text-sm" required />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                                                <input name="password" defaultValue={editingItem?.password} placeholder="Buat sandi akses" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-medium font-mono text-slate-600 text-sm" required />
                                            </div>
                                        </div>

                                        {/* TIPE PENUGASAN GURU */}
                                        <div className="space-y-2 pt-2 border-t border-slate-100">
                                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                                <UserCog size={15} className="text-indigo-600" /> Tipe Penugasan & Wewenang Akun
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setTeacherFormType('guru_kelas')}
                                                    className={`p-4 rounded-2xl border text-left transition-all relative ${teacherFormType === 'guru_kelas'
                                                            ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <div className={`p-1.5 rounded-lg ${teacherFormType === 'guru_kelas' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                            <School size={16} />
                                                        </div>
                                                        <span className="font-bold text-sm text-slate-800">Guru Kelas (Wali)</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-relaxed">
                                                        Mengampu 1 rombel/kelas penuh. Berhak membuat soal untuk <strong>seluruh mata pelajaran</strong> di kelas tersebut.
                                                    </p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setTeacherFormType('guru_mapel')}
                                                    className={`p-4 rounded-2xl border text-left transition-all relative ${teacherFormType === 'guru_mapel'
                                                            ? 'border-fuchsia-500 bg-fuchsia-50/50 shadow-xs ring-2 ring-fuchsia-500/20'
                                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <div className={`p-1.5 rounded-lg ${teacherFormType === 'guru_mapel' ? 'bg-fuchsia-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                            <BookOpen size={16} />
                                                        </div>
                                                        <span className="font-bold text-sm text-slate-800">Guru Mapel (Multi-Kelas)</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-relaxed">
                                                        Mengampu bidang studi khusus lintas banyak kelas. Berhak membuat soal untuk mapelnya di <strong>multi-kelas</strong>.
                                                    </p>
                                                </button>
                                            </div>
                                        </div>

                                        {/* FORM GURU KELAS */}
                                        {teacherFormType === 'guru_kelas' && (
                                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3 animate-fade-in">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider ml-1 flex items-center gap-1">
                                                        <School size={14} className="text-indigo-600" /> Pilih Kelas Binaan (Wali Kelas)
                                                    </label>
                                                    <select
                                                        name="assignedClass"
                                                        value={teacherAssignedClass}
                                                        onChange={e => setTeacherAssignedClass(e.target.value)}
                                                        className="w-full p-3 border border-indigo-200 rounded-xl bg-white outline-none focus:border-indigo-500 font-semibold text-slate-800 text-sm shadow-xs"
                                                    >
                                                        {classes.map(c => (
                                                            <option key={c.id} value={c.name}>
                                                                {c.name} (Tingkat {c.level})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="text-xs text-indigo-800 bg-white/80 p-3 rounded-xl border border-indigo-100 leading-relaxed">
                                                    ✨ <strong>Hak Akses Guru Kelas:</strong> Guru ini otomatis memiliki akses ke kelas <strong>{teacherAssignedClass || classes[0]?.name}</strong>, dapat melihat muridnya, dan berwenang membuat soal untuk <strong>seluruh mata pelajaran</strong> yang diajarkan pada kelas tersebut.
                                                </div>
                                            </div>
                                        )}

                                        {/* FORM GURU MAPEL */}
                                        {teacherFormType === 'guru_mapel' && (
                                            <div className="p-4 bg-fuchsia-50/50 rounded-2xl border border-fuchsia-100 space-y-4 animate-fade-in">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-fuchsia-900 uppercase tracking-wider ml-1 flex items-center gap-1">
                                                        <BookOpen size={14} className="text-fuchsia-600" /> Mata Pelajaran yang Diampu
                                                    </label>
                                                    <input
                                                        name="subjectName"
                                                        value={teacherSubjectName}
                                                        onChange={e => setTeacherSubjectName(e.target.value)}
                                                        placeholder="Contoh: Matematika / Pendidikan Jasmani / Bahasa Inggris"
                                                        className="w-full p-3 border border-fuchsia-200 rounded-xl bg-white outline-none focus:border-fuchsia-500 font-semibold text-slate-800 text-sm shadow-xs"
                                                        required={teacherFormType === 'guru_mapel'}
                                                    />
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {['Matematika', 'Pendidikan Jasmani', 'Bahasa Inggris', 'Pendidikan Agama', 'Ilmu Pengetahuan Alam', 'Seni Budaya'].map(subj => (
                                                            <button
                                                                type="button"
                                                                key={subj}
                                                                onClick={() => setTeacherSubjectName(subj)}
                                                                className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all ${teacherSubjectName === subj
                                                                        ? 'bg-fuchsia-600 text-white shadow-xs'
                                                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-fuchsia-300'
                                                                    }`}
                                                            >
                                                                {subj}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-bold text-fuchsia-900 uppercase tracking-wider ml-1 flex items-center gap-1">
                                                            <Layers size={14} className="text-fuchsia-600" /> Pilih Kelas yang Diajar (Multi-Kelas)
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setTeacherSelectedClasses(classes.map(c => c.name))}
                                                                className="text-[10px] font-bold text-fuchsia-600 hover:underline"
                                                            >
                                                                Pilih Semua
                                                            </button>
                                                            <span className="text-slate-300">•</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setTeacherSelectedClasses([])}
                                                                className="text-[10px] font-bold text-slate-400 hover:underline"
                                                            >
                                                                Kosongkan
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {classes.map(c => {
                                                            const isChecked = teacherSelectedClasses.includes(c.name);
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={c.id}
                                                                    onClick={() => {
                                                                        if (isChecked) {
                                                                            setTeacherSelectedClasses(teacherSelectedClasses.filter(cls => cls !== c.name));
                                                                        } else {
                                                                            setTeacherSelectedClasses([...teacherSelectedClasses, c.name]);
                                                                        }
                                                                    }}
                                                                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${isChecked
                                                                            ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-xs'
                                                                            : 'bg-white text-slate-700 border-slate-200 hover:border-fuchsia-200'
                                                                        }`}
                                                                >
                                                                    <span>{c.name}</span>
                                                                    {isChecked && <Check size={14} className="shrink-0" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <p className="text-[11px] text-fuchsia-700 font-medium">
                                                        Terpilih: <strong>{teacherSelectedClasses.length} Kelas</strong> ({teacherSelectedClasses.join(', ') || 'Belum ada kelas dipilih'})
                                                    </p>
                                                </div>

                                                <div className="text-xs text-fuchsia-800 bg-white/80 p-3 rounded-xl border border-fuchsia-100 leading-relaxed">
                                                    ✨ <strong>Hak Akses Guru Mapel:</strong> Guru ini dapat membuat dan mengelola bank soal untuk mata pelajaran <strong>{teacherSubjectName || '(Mapel)'}</strong> pada seluruh kelas yang dicentang secara mandiri (multi-kelas).
                                                </div>
                                            </div>
                                        )}

                                        {/* API KEY GEMINI GURU */}
                                        <div className="space-y-1.5 pt-3 border-t border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                                    <Key size={14} className="text-amber-500" /> API Key Gemini (Opsional Guru)
                                                </label>
                                                <span className="text-[10px] text-slate-400">Untuk AI Generator Pribadi</span>
                                            </div>
                                            <input
                                                name="apiKey"
                                                type="password"
                                                defaultValue={editingItem?.apiKey || ''}
                                                placeholder="AIzaSy... (Kosongkan jika menggunakan API Key Sekolah)"
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-mono text-slate-700 text-xs"
                                            />
                                            <p className="text-[11px] text-slate-400 ml-1 leading-relaxed">
                                                Jika diisi, guru ini dapat men-generate soal dengan kuota API Google miliknya sendiri tanpa mengurangi kuota sekolah.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* STUDENT FORM */}
                                {modalType === 'student' && (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap</label><input name="name" defaultValue={editingItem?.name} placeholder="Sesuai Akta Kelahiran" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-800 text-sm" required /></div>
                                        <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nomor Induk Siswa (NIS)</label><input name="nis" defaultValue={editingItem?.nis} placeholder="NIS juga digunakan sebagai Username" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-bold font-mono text-indigo-600 text-sm" required /></div>
                                        <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Rombongan Belajar (Kelas)</label>
                                            <select name="class" defaultValue={editingItem?.class || (role === 'guru' && currentUser?.assignedClass ? currentUser.assignedClass : classes[0]?.name)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-700 text-sm">
                                                {getMyClasses().map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password Ujian</label><input name="password" defaultValue={editingItem?.password || '123'} placeholder="Gunakan password standar untuk siswa" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-medium font-mono text-slate-600 text-sm" required /></div>
                                    </div>
                                )}

                                {/* CLASS FORM */}
                                {modalType === 'class' && (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Ruang Kelas</label><input name="name" defaultValue={editingItem?.name} placeholder="Contoh: Kelas 6A / XII IPA 1" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-800 text-sm" required /></div>
                                        <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tingkat Jenjang Pendidikan</label><select name="level" defaultValue={editingItem?.level || '1'} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-700 text-sm">
                                            <optgroup label="SD / MI">
                                                {[1, 2, 3, 4, 5, 6].map(l => <option value={l} key={l}>Tingkat {l}</option>)}
                                            </optgroup>
                                            <optgroup label="SMP / MTs">
                                                {[7, 8, 9].map(l => <option value={l} key={l}>Tingkat {l}</option>)}
                                            </optgroup>
                                            <optgroup label="SMA / SMK / MA">
                                                {[10, 11, 12].map(l => <option value={l} key={l}>Tingkat {l}</option>)}
                                            </optgroup>
                                            <optgroup label="Lainnya">
                                                <option value="TK">TK / PAUD</option>
                                                <option value="UMUM">Umum</option>
                                            </optgroup>
                                        </select></div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tahun Pelajaran</label>
                                            <input
                                                name="academicYear"
                                                defaultValue={editingItem?.academicYear || activeAcademicYear}
                                                placeholder="Contoh: 2025/2026"
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-800 text-sm"
                                                required
                                            />
                                            <p className="text-[11px] text-slate-400 ml-1">Tahun pelajaran memudahkan pengarsipan dan riwayat kelas di tahun-tahun ajaran sebelumnya.</p>
                                        </div>
                                    </div>
                                )}

                                {/* SUBJECT FORM */}
                                {modalType === 'subject' && (
                                    <div className="space-y-5">
                                        {!editingItem && (
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 block mb-1.5">Pilihan Cepat Nama Mapel</label>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {['Pendidikan Agama', 'PPKn', 'Bahasa Indonesia', 'Matematika', 'IPAS', 'PJOK', 'Bahasa Inggris', 'Seni Budaya'].map(subj => (
                                                        <button
                                                            type="button"
                                                            key={subj}
                                                            onClick={() => {
                                                                const nameInput = document.querySelector('input[name="name"]');
                                                                const codeInput = document.querySelector('input[name="code"]');
                                                                if (nameInput) nameInput.value = subj;
                                                                if (codeInput) codeInput.value = subj.substring(0, 3).toUpperCase();
                                                            }}
                                                            className="text-[10px] font-semibold px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-700 transition-colors border border-slate-200"
                                                        >
                                                            {subj}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Mata Pelajaran</label>
                                            <input
                                                name="name"
                                                defaultValue={editingItem?.name || (role === 'guru' && currentUser?.teacherType === 'guru_mapel' ? currentUser.subjectName : '')}
                                                placeholder="Contoh: Matematika / Bahasa Indonesia"
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-800 text-sm"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Kode Referensi</label>
                                                <input
                                                    name="code"
                                                    defaultValue={editingItem?.code || ''}
                                                    placeholder="Contoh: MTK / BIND"
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-bold font-mono text-indigo-600 text-sm"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tahun Pelajaran</label>
                                                <input
                                                    name="academicYear"
                                                    defaultValue={editingItem?.academicYear || subjectAcademicYear || activeAcademicYear}
                                                    placeholder="Contoh: 2025/2026"
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-800 text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Class Scope Selector */}
                                        {!editingItem ? (
                                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                                    <Layers size={15} className="text-indigo-600" /> Terapkan ke Kelas Mana Saja?
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSubjectClassScope('all')}
                                                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${subjectClassScope === 'all'
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                                : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                                                            }`}
                                                    >
                                                        🌟 Semua Kelas Sekaligus
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSubjectClassScope('custom')}
                                                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${subjectClassScope === 'custom'
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                                : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                                                            }`}
                                                    >
                                                        🎯 Pilih Beberapa Kelas
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSubjectClassScope('single')}
                                                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${subjectClassScope === 'single'
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                                : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                                                            }`}
                                                    >
                                                        📌 Satu Kelas Spesifik
                                                    </button>
                                                </div>

                                                {subjectClassScope === 'all' && (
                                                    <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                                                        ✨ <strong>Otomatisasi Multi-Kelas:</strong> Mapel ini akan otomatis dibuatkan untuk seluruh rombel belajar (<strong>{getMyClasses().length} kelas</strong>) dengan kode terpisah otomatis per kelas (misal: <code>MTK-Kelas1A</code>, <code>MTK-Kelas1B</code>). Bank soal dan ujian tetap terisolasi rapi per kelas tanpa perlu input berulang kali!
                                                    </div>
                                                )}

                                                {subjectClassScope === 'custom' && (
                                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                                        <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                                                            <span>Pilih Kelas Target:</span>
                                                            <div className="flex gap-2">
                                                                <button type="button" onClick={() => setSubjectTargetClasses(getMyClasses().map(c => c.name))} className="text-indigo-600 hover:underline">Pilih Semua</button>
                                                                <span>•</span>
                                                                <button type="button" onClick={() => setSubjectTargetClasses([])} className="text-slate-400 hover:underline">Kosongkan</button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                                            {getMyClasses().map(c => {
                                                                const isChecked = subjectTargetClasses.includes(c.name);
                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        key={c.id}
                                                                        onClick={() => {
                                                                            if (isChecked) setSubjectTargetClasses(subjectTargetClasses.filter(x => x !== c.name));
                                                                            else setSubjectTargetClasses([...subjectTargetClasses, c.name]);
                                                                        }}
                                                                        className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all ${isChecked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-200'
                                                                            }`}
                                                                    >
                                                                        <span>{c.name}</span>
                                                                        {isChecked && <Check size={12} />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {subjectClassScope === 'single' && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Pilih Kelas</label>
                                                        <select
                                                            name="class"
                                                            defaultValue={getMyClasses()[0]?.name}
                                                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-700 text-sm"
                                                        >
                                                            {getMyClasses().map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Kelas Target</label>
                                                <select
                                                    name="class"
                                                    defaultValue={editingItem?.class || getMyClasses()[0]?.name}
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-700 text-sm"
                                                >
                                                    {getMyClasses().map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        {role === 'admin' ? (
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Guru Pengampu Mata Pelajaran</label>
                                                <select name="teacherId" defaultValue={editingItem?.teacherId || teachers[0]?.id} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-700 text-sm">
                                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.teacherType === 'guru_mapel' ? `Mapel: ${t.subjectName || '-'}` : `Wali: ${t.assignedClass || '-'}`})</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <input type="hidden" name="teacherId" value={currentUser?.id} />
                                        )}
                                    </div>
                                )}

                                {/* KOMPLEKSITAS FORM SOAL BARU */}
                                {modalType === 'question' && (
                                    <div className="space-y-6">
                                        <input type="hidden" name="subjectId" value={editingItem?.subjectId || selectedSubjectForQuestions?.id} />

                                        {/* Semester & Tahun Pelajaran */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1 block">Semester Soal</label>
                                                <select name="semester" defaultValue={editingItem?.semester || activeSemester} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-sm outline-none focus:border-indigo-400">
                                                    <option value="Ganjil">Semester Ganjil</option>
                                                    <option value="Genap">Semester Genap</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1 block">Tahun Pelajaran</label>
                                                <input name="academicYear" defaultValue={editingItem?.academicYear || activeAcademicYear} placeholder="Contoh: 2025/2026" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-sm outline-none focus:border-indigo-400" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1 block">Tipe Soal</label>
                                                <select name="type" value={questionFormType} onChange={e => setQuestionFormType(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-sm outline-none focus:border-indigo-400">
                                                    <option value="single">Pilihan Ganda</option>
                                                    <option value="multiple">Pilihan Ganda Kompleks</option>
                                                    <option value="boolean">Benar / Salah</option>
                                                    <option value="matching">Menjodohkan</option>
                                                    <option value="short">Isian Singkat</option>
                                                    <option value="essay">Uraian / Esai</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1 block">Level Kognitif</label>
                                                <select name="difficulty" defaultValue={editingItem?.difficulty || "MOTS"} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-sm outline-none focus:border-indigo-400">
                                                    <option value="LOTS">LOTS (C1-C2)</option>
                                                    <option value="MOTS">MOTS (C3)</option>
                                                    <option value="HOTS">HOTS (C4-C6)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1 block">Bobot Poin</label>
                                                <input name="weight" type="number" defaultValue={editingItem?.weight || 10} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold text-indigo-600 text-base outline-none focus:border-indigo-400 text-center" required />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1 block">Indikator Kisi-kisi (Opsional)</label>
                                            <input name="indicator" defaultValue={editingItem?.indicator} placeholder="Siswa dapat..." className="w-full p-3 border border-yellow-200 rounded-xl bg-yellow-50 outline-none focus:border-yellow-400 text-sm font-medium text-slate-700" />
                                        </div>

                                        {/* KONTROL CENTANG & PILIH STIMULUS */}
                                        <div className="p-4 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-slate-50 rounded-2xl border border-indigo-200 shadow-2xs">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={questionUseStimulus}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setQuestionUseStimulus(checked);
                                                            if (checked && !questionStimulusId) {
                                                                const available = stimuli.filter(s => !s.subjectId || s.subjectId === (editingItem?.subjectId || selectedSubjectForQuestions?.id));
                                                                if (available.length > 0) {
                                                                    setQuestionStimulusId(String(available[0].id));
                                                                }
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                                                        <BookOpen size={16} className="text-indigo-600" />
                                                        Gunakan Stimulus untuk Soal Ini
                                                    </span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => openModal('stimulus', { subjectId: editingItem?.subjectId || selectedSubjectForQuestions?.id })}
                                                    className="text-xs bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 font-bold px-3 py-1.5 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors shrink-0"
                                                >
                                                    <Plus size={14} /> Buat Stimulus Baru
                                                </button>
                                            </div>

                                            {questionUseStimulus && (
                                                <div className="mt-3.5 pt-3 border-t border-indigo-100 space-y-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1.5">Pilih Stimulus yang Ingin Ditautkan</label>
                                                        <select
                                                            value={questionStimulusId}
                                                            onChange={(e) => setQuestionStimulusId(e.target.value)}
                                                            className="w-full p-2.5 border border-indigo-200 rounded-xl bg-white font-semibold text-sm outline-none focus:border-indigo-500 text-slate-700 cursor-pointer shadow-2xs"
                                                        >
                                                            <option value="">-- Pilih Stimulus --</option>
                                                            {stimuli.map(stim => (
                                                                <option key={stim.id} value={stim.id}>
                                                                    [{stim.type === 'text' ? 'Teks' : stim.type === 'table' ? 'Tabel' : stim.type === 'image' ? 'Gambar' : 'Gabungan'}] {stim.title}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Pratinjau Cepat Stimulus Terpilih */}
                                                    {(() => {
                                                        const selectedStim = stimuli.find(s => String(s.id) === String(questionStimulusId));
                                                        if (!selectedStim) return null;
                                                        return (
                                                            <div className="p-3 bg-white/90 rounded-xl border border-indigo-100 text-xs">
                                                                <div className="flex items-center justify-between font-bold text-indigo-800 mb-1">
                                                                    <span className="truncate max-w-[280px]">Pratinjau: {selectedStim.title}</span>
                                                                    <span className="text-[10px] uppercase bg-indigo-50 px-2 py-0.5 rounded text-indigo-600 shrink-0">{selectedStim.type}</span>
                                                                </div>
                                                                {selectedStim.imageUrl && <img src={selectedStim.imageUrl} alt="preview" className="max-h-24 object-contain rounded my-1 border border-slate-200" />}
                                                                {selectedStim.content && <p className="text-slate-600 line-clamp-2 italic">{selectedStim.content}</p>}
                                                                {selectedStim.tableData && selectedStim.tableData.length > 0 && (
                                                                    <p className="text-slate-500 font-mono text-[10px] mt-1">📊 Tabel: {selectedStim.tableData.length} baris data</p>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-2">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block ml-1">Pertanyaan Utama</label>
                                                <div className="flex gap-2">
                                                    <label className="cursor-pointer text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-emerald-100 transition-all">
                                                        <ImageIcon size={12} /> Upload Gambar
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleQuestionImageUpload} />
                                                    </label>
                                                    <button type="button" onClick={handleGenerateVisual} className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-indigo-100 transition-all"><Wand2 size={12} /> Generate Visual AI</button>
                                                </div>
                                            </div>
                                            <input type="hidden" name="image" value={editingItem?.image || ''} />
                                            {editingItem?.image && <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 max-w-[200px]"><img src={editingItem.image} alt="Preview" className="w-full h-auto object-cover" /></div>}
                                            <textarea name="text" defaultValue={editingItem?.text} placeholder="Ketik narasi kasus atau pertanyaan secara lengkap di sini..." rows={4} className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 focus:bg-white font-medium text-slate-800 text-sm leading-relaxed transition-colors" required />
                                        </div>

                                        {/* RENDER DYNAMIC FIELDS BASED ON TYPE */}
                                        <div className="border border-slate-200 p-5 rounded-2xl bg-slate-50">
                                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Settings size={14} /> Kunci Jawaban & Opsi</p>

                                            {(questionFormType === 'single' || questionFormType === 'multiple') && (
                                                <div className="space-y-3">
                                                    {Array.from({ length: schoolData.optionCount || 5 }).map((_, i) => String.fromCharCode(65 + i)).map((l, i) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <span className="font-bold text-slate-400 w-5 text-center text-sm">{l}.</span>
                                                            <input name={`opt${l}`} defaultValue={editingItem?.options?.[i]} placeholder={`Teks Pilihan ${l}`} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 text-sm font-medium text-slate-700 bg-white" />
                                                        </div>
                                                    ))}
                                                    <div className="mt-6 pt-5 border-t border-slate-200">
                                                        <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-2 ml-1">Kunci Jawaban Tepat</label>
                                                        <input name="correct" defaultValue={editingItem?.correct} placeholder={questionFormType === 'single' ? "Ketik index (0 = A, 1 = B, dst)" : "Ketik index pisahkan koma (0,2)"} className="w-full p-3 border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-emerald-700 bg-emerald-50 text-center text-base tracking-widest" required />
                                                    </div>
                                                </div>
                                            )}

                                            {questionFormType === 'boolean' && (
                                                <div className="space-y-3">
                                                    <p className="text-xs text-slate-500 font-medium mb-2">Pilih validasi yang benar untuk pernyataan (stimulus) di atas.</p>
                                                    <select name="correct" defaultValue={editingItem?.correct || "0"} className="w-full p-3 border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-emerald-700 bg-emerald-50 text-center text-sm cursor-pointer">
                                                        <option value="0">Pernyataan Bernilai BENAR</option>
                                                        <option value="1">Pernyataan Bernilai SALAH</option>
                                                    </select>
                                                </div>
                                            )}

                                            {questionFormType === 'matching' && (
                                                <div className="space-y-3">
                                                    <p className="text-xs text-slate-500 font-medium mb-2">Format: `Pertanyaan | Pasangan Jawaban`. Setiap baris adalah 1 pasang.</p>
                                                    <div className="bg-slate-800 p-3 rounded-lg mb-3 text-[11px] font-mono text-emerald-400">Contoh Format:<br />Ibukota Indonesia | Jakarta<br />Ibukota Jepang | Tokyo</div>
                                                    <textarea name="correct" defaultValue={editingItem?.correct || "Pertanyaan Kiri | Jawaban Kanan"} rows={5} className="w-full p-4 border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-mono text-sm bg-white leading-relaxed font-medium text-slate-700" required />
                                                </div>
                                            )}

                                            {questionFormType === 'short' && (
                                                <div className="space-y-3">
                                                    <p className="text-xs text-slate-500 font-medium mb-2">Sistem akan melakukan koreksi otomatis menggunakan metode *case-insensitive*.</p>
                                                    <input name="correct" defaultValue={editingItem?.correct} placeholder="Ketik kata kunci jawaban yang tepat..." className="w-full p-3 border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-emerald-700 bg-white text-base" required />
                                                    <p className="text-[10px] font-medium text-slate-400 mt-1.5 ml-1">Tips: Gunakan koma jika ada lebih dari 1 variasi jawaban benar (Contoh: Ir Soekarno, Soekarno).</p>
                                                </div>
                                            )}

                                            {questionFormType === 'essay' && (
                                                <div className="space-y-3">
                                                    <p className="text-xs text-slate-500 font-medium mb-2">Tuliskan rubrik penilaian / kata kunci / referensi jawaban bagi pengoreksi.</p>
                                                    <textarea name="correct" defaultValue={editingItem?.correct} placeholder="Ekspektasi jawaban siswa..." rows={4} className="w-full p-4 border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 text-sm font-medium text-slate-700 bg-white leading-relaxed" required />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* MODAL FORM: STIMULUS (TEKS / TABEL / GAMBAR / GABUNGAN) */}
                                {modalType === 'stimulus' && (
                                    <div className="space-y-5">
                                        <input type="hidden" name="subjectId" value={editingItem?.subjectId || selectedSubjectForQuestions?.id || ''} />

                                        {/* Judul Stimulus */}
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1 block">Judul Stimulus</label>
                                            <input
                                                name="title"
                                                defaultValue={editingItem?.title || ''}
                                                placeholder="Contoh: Wacana Ekosistem Pesisir / Tabel Data Pengamatan"
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-sm outline-none focus:border-indigo-400"
                                                required
                                            />
                                        </div>

                                        {/* Tipe Stimulus Switcher */}
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1 block">Bentuk / Tipe Stimulus</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {[
                                                    { id: 'text', label: 'Teks / Wacana', icon: FileText, desc: 'Artikel, cerita, narasi' },
                                                    { id: 'table', label: 'Tabel Data', icon: Table, desc: 'Baris & kolom data' },
                                                    { id: 'image', label: 'Gambar / Infografis', icon: ImageIcon, desc: 'Foto, diagram, grafik' },
                                                    { id: 'combined', label: 'Gabungan', icon: Layers, desc: 'Teks + Tabel/Gambar' }
                                                ].map(item => {
                                                    const Icon = item.icon;
                                                    const isSelected = stimulusType === item.id;
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => setStimulusType(item.id)}
                                                            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                                        >
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Icon size={16} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                                                                <span className={`text-xs font-bold ${isSelected ? 'text-indigo-800' : 'text-slate-700'}`}>{item.label}</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 leading-tight">{item.desc}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <input type="hidden" name="type" value={stimulusType} />
                                        </div>

                                        {/* Input Gambar (jika gambar atau gabungan) */}
                                        {(stimulusType === 'image' || stimulusType === 'combined') && (
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                                        <ImageIcon size={14} className="text-indigo-600" /> URL atau Upload Gambar
                                                    </label>
                                                    <label className="cursor-pointer text-[10px] bg-white text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-indigo-50">
                                                        <Upload size={12} /> Pilih Berkas
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = (re) => setStimulusPreviewImage(re.target.result);
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                                <input
                                                    name="imageUrl"
                                                    value={stimulusPreviewImage}
                                                    onChange={(e) => setStimulusPreviewImage(e.target.value)}
                                                    placeholder="https://... atau upload berkas gambar di atas"
                                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-xs outline-none focus:border-indigo-400 text-slate-700"
                                                />
                                                {stimulusPreviewImage && (
                                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white p-2 max-w-sm mx-auto">
                                                        <img src={stimulusPreviewImage} alt="Pratinjau Stimulus" className="max-h-48 object-contain rounded-lg mx-auto" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setStimulusPreviewImage('')}
                                                            className="absolute top-3 right-3 bg-rose-500 text-white rounded-full p-1 shadow hover:bg-rose-600"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Input Tabel (jika tabel atau gabungan) */}
                                        {(stimulusType === 'table' || stimulusType === 'combined') && (
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                                        <Table size={14} className="text-indigo-600" /> Data Tabel (Format: Garis Batas `|` atau Tab)
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setStimulusTableRaw("Hari Ke | Kondisi Terang (cm) | Kondisi Gelap (cm)\nHari 1 | 0.5 | 0.9\nHari 2 | 1.2 | 2.5\nHari 3 | 2.5 | 5.1\nHari 4 | 3.7 | 7.8\nHari 5 | 5.2 | 10.4");
                                                        }}
                                                        className="text-[10px] bg-white text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-indigo-50 cursor-pointer"
                                                    >
                                                        <Sparkles size={12} /> Contoh Data
                                                    </button>
                                                </div>
                                                <textarea
                                                    name="tableDataRaw"
                                                    value={stimulusTableRaw}
                                                    onChange={(e) => setStimulusTableRaw(e.target.value)}
                                                    rows={5}
                                                    placeholder="Baris 1 (Header): No | Nama Kolom 1 | Nama Kolom 2&#10;Baris 2 (Data): 1 | Nilai A | Nilai B&#10;Baris 3 (Data): 2 | Nilai C | Nilai D"
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-white font-mono text-xs outline-none focus:border-indigo-400 text-slate-700"
                                                />

                                                {/* Live Table Preview */}
                                                {stimulusTableRaw.trim() && (
                                                    <div className="mt-2">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pratinjau Tabel:</p>
                                                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                                            <table className="w-full text-left text-xs border-collapse">
                                                                {(() => {
                                                                    const rows = stimulusTableRaw.trim().split('\n').filter(Boolean).map(r => r.includes('|') ? r.split('|').map(c => c.trim()) : r.split('\t').map(c => c.trim()));
                                                                    if (rows.length === 0) return null;
                                                                    return (
                                                                        <>
                                                                            <thead className="bg-indigo-600 text-white font-semibold">
                                                                                <tr>{rows[0].map((c, idx) => <th key={idx} className="p-2 border-b border-indigo-700">{c}</th>)}</tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-100">
                                                                                {rows.slice(1).map((r, rIdx) => (
                                                                                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                                                        {r.map((c, cIdx) => <td key={cIdx} className="p-2 text-slate-700">{c}</td>)}
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Isi Teks / Wacana Stimulus */}
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1 block">
                                                {stimulusType === 'table' ? 'Pengantar / Deskripsi Tabel' : stimulusType === 'image' ? 'Keterangan Gambar / Narasi' : 'Isi Teks / Wacana Stimulus'}
                                            </label>
                                            <textarea
                                                name="content"
                                                defaultValue={editingItem?.content || ''}
                                                rows={4}
                                                placeholder={stimulusType === 'table' ? "Tuliskan pengantar atau deskripsi pengamatan tabel di sini..." : "Ketik naskah bacaan, wacana sains, kutipan literasi secara lengkap di sini..."}
                                                className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50 font-medium text-sm outline-none focus:border-indigo-400 focus:bg-white text-slate-800 leading-relaxed transition-colors"
                                            />
                                        </div>

                                        {/* Sumber / Sitasi */}
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1 block">Sumber / Sitasi (Opsional)</label>
                                            <input
                                                name="source"
                                                defaultValue={editingItem?.source || ''}
                                                placeholder="Contoh: Buku IPA Tematik Kelas 6, Kemdikbud / Hasil Eksperimen Lab"
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-medium text-xs outline-none focus:border-indigo-400"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* VERIFY FORM */}
                                {modalType === 'verify' && editingItem && (
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <p className="text-xs font-bold text-slate-500 uppercase">Siswa: <span className="text-indigo-600">{editingItem.studentName}</span></p>
                                            <p className="text-xs font-bold text-slate-500 uppercase mt-1">Mapel: <span className="text-indigo-600">{editingItem.subject}</span></p>
                                        </div>
                                        <div className="space-y-6">
                                            {questions.filter(q => subjects.find(s => s.name === editingItem.subject)?.id === q.subjectId).map((q, i) => {
                                                const formatAnswer = (type, ans, options) => {
                                                    if (ans === undefined || ans === null || ans === '') return 'Tidak dijawab';
                                                    if (type === 'single') {
                                                        const idx = parseInt(ans);
                                                        return !isNaN(idx) && options && options[idx] ? `${String.fromCharCode(65 + idx)}. ${options[idx]}` : ans;
                                                    }
                                                    if (type === 'multiple') {
                                                        const indices = String(ans).split(',');
                                                        return indices.map(i => {
                                                            const idx = parseInt(i);
                                                            return !isNaN(idx) && options && options[idx] ? `${String.fromCharCode(65 + idx)}. ${options[idx]}` : i;
                                                        }).join(' | ');
                                                    }
                                                    if (type === 'boolean') {
                                                        return String(ans) === "0" ? "Pernyataan BENAR" : "Pernyataan SALAH";
                                                    }
                                                    if (type === 'matching') {
                                                        try {
                                                            const parsed = typeof ans === 'string' ? JSON.parse(ans) : ans;
                                                            return Object.entries(parsed).map(([k, v]) => `${k} -> ${v}`).join('\n');
                                                        } catch (e) {
                                                            return String(ans);
                                                        }
                                                    }
                                                    return String(ans);
                                                };

                                                return (
                                                    <div key={q.id} className="p-4 border border-slate-200 rounded-xl space-y-3">
                                                        <p className="font-semibold text-slate-800 text-sm whitespace-pre-wrap">{q.text}</p>
                                                        <div className="bg-slate-50 p-3 rounded-lg text-sm">
                                                            <p className="font-bold text-slate-600 mb-1">Kunci Jawaban Benar:</p>
                                                            <p className="text-slate-800 whitespace-pre-wrap">{formatAnswer(q.type, q.correct, q.options)}</p>
                                                        </div>
                                                        <div className="bg-indigo-50 p-3 rounded-lg text-sm border border-indigo-100">
                                                            <p className="font-bold text-indigo-700 mb-1">Jawaban Siswa:</p>
                                                            <p className="text-indigo-900 font-medium whitespace-pre-wrap">
                                                                {editingItem.rawAnswersMap?.[q.id] !== undefined ?
                                                                    formatAnswer(q.type, editingItem.rawAnswersMap[q.id], q.options)
                                                                    : <span className="text-slate-400 italic">Tidak dijawab</span>}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Poin Didapat (Max: {q.weight || 10})</label>
                                                            <input type="number" name={`score_${q.id}`} defaultValue={editingItem.earnedScores?.[q.id] || 0} max={q.weight || 10} min="0" className="w-20 p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-bold text-center text-indigo-600 text-sm bg-white" />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                <button className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors mt-6">SIMPAN DATA</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PREVIEW DETAIL STIMULUS */}
            {activeStimulusModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold"><BookOpen size={20} /></span>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{activeStimulusModal.title}</h3>
                                    <p className="text-[11px] text-slate-400 uppercase font-semibold">
                                        Tipe: {activeStimulusModal.type} {activeStimulusModal.source ? `• Sumber: ${activeStimulusModal.source}` : ''}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setActiveStimulusModal(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"><X size={20} /></button>
                        </div>

                        {/* Gambar */}
                        {activeStimulusModal.imageUrl && (
                            <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 p-1 bg-white">
                                <img src={activeStimulusModal.imageUrl} alt={activeStimulusModal.title} className="w-full max-h-80 object-contain rounded-lg mx-auto" />
                            </div>
                        )}

                        {/* Tabel Data */}
                        {activeStimulusModal.tableData && activeStimulusModal.tableData.length > 0 && (
                            <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                    {activeStimulusModal.tableData[0] && (
                                        <thead className="bg-indigo-600 text-white font-semibold">
                                            <tr>
                                                {activeStimulusModal.tableData[0].map((th, thIdx) => (
                                                    <th key={thIdx} className="p-2.5 sm:p-3 border-b border-indigo-700">{th}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                    )}
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {activeStimulusModal.tableData.slice(1).map((row, rIdx) => (
                                            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                {row.map((cell, cIdx) => (
                                                    <td key={cIdx} className="p-2.5 sm:p-3">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Teks / Narasi */}
                        {activeStimulusModal.content && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                                {activeStimulusModal.content}
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-xs text-slate-400">
                                Digunakan pada <strong className="text-indigo-600 font-bold">{questions.filter(q => q.stimulusId === activeStimulusModal.id).length}</strong> butir soal
                            </span>
                            <button
                                onClick={() => setActiveStimulusModal(null)}
                                className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}