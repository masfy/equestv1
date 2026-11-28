import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from './firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, updateDoc } from 'firebase/firestore';
import { aiService, DEFAULT_AI_MODEL, sanitizeModelId, parseAiJsonArray, normalizeExtractedQuestions } from './services/aiService';
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
    FileBox, FileText as FileWord, Wand2, ImagePlus, FileCheck, Table,
    Target, Activity, Award, TrendingUp, PieChart, Zap, Database,
    Shield, Building, ToggleLeft, ToggleRight, Copy, Smartphone
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
    aiModel: DEFAULT_AI_MODEL,
    availableAiModels: [],
    optionCount: 5
};

const INITIAL_SCHOOLS = [
    {
        id: "sdn2palapi",
        referralCode: "EQ-PALAPI",
        npsn: "40402918",
        name: "SD Negeri 2 Palapi",
        address: "Jl. Pendidikan Cerdas No. 1, Jakarta Selatan",
        dinasPendidikan: "Dinas Pendidikan Pemuda dan Olahraga",
        kabupaten: "Kabupaten Muna",
        kepsekName: "Samsuddin, S.Pd., M.Pd.",
        kepsekNip: "19800101 200501 1 002",
        adminName: "Administrator Pusat",
        adminEmail: "alfyarnaim@gmail.com",
        adminUsername: "admin",
        adminPassword: "masfy",
        status: "active", // 'active' | 'suspended'
        isMaster: true,
        optionCount: 5,
        semester: "Ganjil",
        academicYear: "2025/2026",
        createdAt: "2025-01-01"
    }
];

const INITIAL_TEACHERS = [];
const INITIAL_CLASSES = [];
const INITIAL_SUBJECTS = [];
const INITIAL_STUDENTS = [];
const INITIAL_STIMULI = [];
const INITIAL_QUESTIONS = [];
const INITIAL_RESULTS = [];

const QUOTES = [
    "Pendidikan adalah senjata paling mematikan di dunia. - Nelson Mandela",
    "Belajarlah seolah engkau hidup selamanya. - Mahatma Gandhi",
    "Tujuan pendidikan itu untuk mempertajam kecerdasan. - Tan Malaka",
    "Ing ngarsa sung tulada, ing madya mangun karsa, tut wuri handayani."
];

// --- UTILITY COMPONENTS & SHEETJS LOADER ---

const getCachedData = (key, fallback) => {
    try {
        const item = localStorage.getItem(`eq_cache_${key}`);
        if (!item) return fallback;
        const parsed = JSON.parse(item);
        return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (e) {
        return fallback;
    }
};

const setCachedData = (key, data) => {
    try {
        localStorage.setItem(`eq_cache_${key}`, JSON.stringify(data));
    } catch (e) {
        // Silently catch quota limits if any
    }
};

const compressImage = (file, maxWidth = 256, quality = 0.85) => {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) return resolve('');
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width;
                let h = img.height;
                if (w > maxWidth) {
                    h = Math.round((h * maxWidth) / w);
                    w = maxWidth;
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/png', quality));
            };
            img.onerror = () => resolve(e.target.result);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
    });
};

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

const ImportModal = ({ isOpen, onClose, type, onImport, showToast, apiKey, aiModel, onSaveInlineApiKey }) => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [useAI, setUseAI] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [summaryMessage, setSummaryMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [inlineKeyInput, setInlineKeyInput] = useState("");

    if (!isOpen) return null;

    const effectiveKey = (apiKey && apiKey.trim()) || inlineKeyInput.trim();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setErrorMessage("");
            const lowerName = (file.name || '').toLowerCase();
            if (type === 'Bank Soal' && (lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.txt'))) {
                setUseAI(true);
            } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
                setUseAI(false);
            }
            showToast(`File ${file.name} dipilih.`, "success");
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
                    ["Nama Lengkap", "Kelas", "NISN", "Password"],
                    ["Budi Santoso", "Kelas 6A", "0012345678", "123"],
                    ["Siti Aminah", "Kelas 6A", "0012345679", "123"]
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
        setErrorMessage("");

        const lowerName = (selectedFile.name || '').toLowerCase();
        const isDocOrPdf = lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg');
        const shouldUseAI = useAI || (type === 'Bank Soal' && isDocOrPdf);

        if (shouldUseAI && !effectiveKey) {
            setErrorMessage("API Key Gemini belum diisi! Masukkan API Key Google AI Studio pada kolom di bawah atau di menu Pengaturan Sekolah.");
            return showToast("Masukkan API Key Gemini terlebih dahulu!", "error");
        }

        if (inlineKeyInput.trim() && onSaveInlineApiKey) {
            onSaveInlineApiKey(inlineKeyInput.trim());
        }

        setLoading(true);
        setProgress(5);
        setStatusText(shouldUseAI ? "Membaca dokumen & menghubungkan ke Google Gemini AI..." : "Mempersiapkan file Excel...");

        let currentProgress = 5;
        const interval = setInterval(() => {
            currentProgress += Math.floor(Math.random() * 8) + 3;
            if (currentProgress > 90) currentProgress = 90;
            setProgress(currentProgress);

            if (currentProgress > 20 && currentProgress <= 50) {
                setStatusText(shouldUseAI ? "AI sedang membaca naskah soal & opsi jawaban..." : "Membaca baris data Excel...");
            } else if (currentProgress > 50 && currentProgress <= 80) {
                setStatusText(shouldUseAI ? "Mengekstrak kunci jawaban & level kognitif..." : "Memvalidasi format data...");
            } else if (currentProgress > 80) {
                setStatusText(shouldUseAI ? "Menyusun butir soal ke Bank Soal..." : "Menyimpan ke database...");
            }
        }, 600);

        if ((lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) && !shouldUseAI) {
            try {
                const XLSX = await loadSheetJS();
                const arrayBuf = await selectedFile.arrayBuffer();
                const data = new Uint8Array(arrayBuf);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const res = await onImport(type, false, selectedFile.name, json, null, effectiveKey);
                clearInterval(interval);
                if (res && res.success === false) {
                    setLoading(false);
                    setErrorMessage(res.error || "Gagal memproses file Excel.");
                    return;
                }
                setProgress(100);
                setStatusText("Selesai!");
                setLoading(false);
                setIsSuccess(true);
                setSummaryMessage(res?.message || `Berhasil memproses ${res?.count ?? 0} data dari file ${selectedFile.name}`);
            } catch (e) {
                clearInterval(interval);
                setLoading(false);
                setErrorMessage(e.message || "Gagal membaca file Excel. Pastikan file tidak rusak.");
                showToast("Gagal membaca file Excel. Pastikan file tidak rusak.", "error");
            }
        } else {
            try {
                const res = await onImport(type, true, selectedFile.name, null, selectedFile, effectiveKey);
                clearInterval(interval);
                if (!res || res.success === false) {
                    setLoading(false);
                    setErrorMessage(res?.error || "AI gagal mengekstrak soal dari dokumen.");
                    return;
                }
                setProgress(100);
                setStatusText("Selesai!");
                setLoading(false);
                setIsSuccess(true);
                setSummaryMessage(res.message || `Berhasil mengekstrak ${res.count} butir soal dari ${selectedFile.name}!`);
            } catch (err) {
                clearInterval(interval);
                setLoading(false);
                setErrorMessage(err.message || "Terjadi kesalahan saat mengekstrak soal.");
            }
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-fade-in backdrop-blur-md">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center border border-slate-100 transform transition-all scale-100">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CheckSquare size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Import Berhasil!</h3>
                    <p className="text-slate-600 font-medium mb-8 leading-relaxed text-sm">{summaryMessage}</p>
                    <button
                        onClick={() => {
                            setIsSuccess(false);
                            setSelectedFile(null);
                            setErrorMessage("");
                            onClose();
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all hover:-translate-y-1 cursor-pointer"
                    >
                        Tutup & Lihat Soal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-fade-in backdrop-blur-md">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-6 sm:p-8 border border-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Upload size={22} className="text-indigo-500" /> Import {type}</h3>
                    <button onClick={() => { setErrorMessage(""); setSelectedFile(null); onClose(); }} disabled={loading} className="text-slate-400 hover:bg-rose-50 hover:text-rose-500 p-2 rounded-xl transition-colors disabled:opacity-50"><X size={20} /></button>
                </div>

                <div className="space-y-5">
                    <div className="flex justify-between items-center bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100/50">
                        <div>
                            <p className="font-bold text-indigo-900 text-sm">Unduh Format Template</p>
                            <p className="text-[11px] text-indigo-600/80 mt-0.5 font-medium">Khusus import via tabel Excel (.xlsx).</p>
                        </div>
                        <button type="button" onClick={downloadTemplate} disabled={loading} className="bg-white text-indigo-600 border border-indigo-100 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"><Download size={15} /> Template.xlsx</button>
                    </div>

                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative group ${selectedFile ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300'} ${loading ? 'opacity-70 pointer-events-none' : 'cursor-pointer'}`}>
                        <input type="file" onChange={handleFileChange} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" accept=".xlsx,.xls,.docx,.doc,.pdf,.png,.jpg,.jpeg,.txt" />
                        {selectedFile ? (
                            <div className="animate-fade-in">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-emerald-500"><FileCheck size={26} /></div>
                                <p className="font-bold text-emerald-700 text-sm truncate px-4">{selectedFile.name}</p>
                                <p className="text-xs text-emerald-600/80 mt-1 font-medium">Klik untuk mengganti file</p>
                            </div>
                        ) : (
                            <div>
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform text-indigo-500"><FileUp size={26} /></div>
                                <p className="font-bold text-slate-700 text-sm">Pilih atau Drag & Drop File</p>
                                <p className="text-[11px] text-slate-500 mt-1 font-medium">Mendukung .xlsx, PDF, Word (.docx), atau Gambar Soal</p>
                            </div>
                        )}
                    </div>

                    {type === 'Bank Soal' && (
                        <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 p-4 rounded-2xl border border-purple-100 space-y-3 shadow-xs">
                            <div className="flex items-start gap-3">
                                <input type="checkbox" id="useAI" checked={useAI} onChange={() => setUseAI(!useAI)} disabled={loading} className="mt-1 w-4 h-4 accent-purple-600 rounded cursor-pointer disabled:opacity-50" />
                                <div className="flex-1">
                                    <label htmlFor="useAI" className={`font-bold text-purple-900 text-sm flex items-center gap-1.5 ${loading ? '' : 'cursor-pointer'}`}><BrainCircuit size={16} /> AI Document Parser (PDF & Word .docx)</label>
                                    <p className="text-[11px] text-purple-700/85 mt-1 leading-relaxed font-medium">Otomatis membaca naskah PDF atau Word (.docx) dan mengubahnya menjadi butir soal, opsi jawaban, serta kunci jawaban.</p>
                                    {useAI && (
                                        <span className="text-[10px] text-purple-700 bg-white/90 border border-purple-200 px-2 py-0.5 rounded-md font-mono font-bold mt-2 inline-block">
                                            Engine Otomatis: {sanitizeModelId(aiModel)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {useAI && (!apiKey || !apiKey.trim()) && (
                                <div className="pt-2 border-t border-purple-200/60 space-y-1.5">
                                    <label className="block text-[10px] font-bold text-purple-900 uppercase tracking-wider">Masukkan API Key Google Gemini:</label>
                                    <input
                                        type="password"
                                        value={inlineKeyInput}
                                        onChange={(e) => setInlineKeyInput(e.target.value)}
                                        placeholder="Tempel API Key Google AI Studio (AIzaSy...)"
                                        className="w-full p-2.5 rounded-xl bg-white border border-purple-300 text-xs font-mono text-slate-800 outline-none focus:border-purple-600"
                                    />
                                    <p className="text-[10px] text-purple-700 font-medium">API Key akan langsung disimpan ke akun/sekolah Anda.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
                            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                            <div className="leading-relaxed">{errorMessage}</div>
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
                        <button onClick={handleMockImport} disabled={!selectedFile} className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm sm:text-base shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer">
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
    const activeLogo = schoolData?.schoolLogo || '';
    const kabRaw = (schoolData?.kabupaten || '').trim();
    const pemdaHeader = kabRaw
        ? (kabRaw.toUpperCase().startsWith('KABUPATEN') || kabRaw.toUpperCase().startsWith('KOTA') || kabRaw.toUpperCase().startsWith('PEMERINTAH')
            ? (kabRaw.toUpperCase().startsWith('PEMERINTAH') ? kabRaw.toUpperCase() : `PEMERINTAH ${kabRaw.toUpperCase()}`)
            : `PEMERINTAH KABUPATEN ${kabRaw.toUpperCase()}`)
        : '';
    const tempatTtd = kabRaw ? kabRaw.replace(/^kabupaten\s+/i, '').replace(/^kota\s+/i, '').trim() : 'Tempat';
    const tahunAjaranText = schoolData?.academicYear
        ? `${schoolData.academicYear} (Semester ${schoolData.semester || 'Ganjil'})`
        : '2026/2027 (Semester Ganjil)';

    const formatKeyLabel = (q) => {
        if (!q) return '-';
        if (q.type === 'single') {
            const idx = Number(q.correct);
            return !isNaN(idx) ? String.fromCharCode(65 + idx) : String(q.correct || '-');
        }
        if (q.type === 'multiple') {
            return String(q.correct || '')
                .split(',')
                .filter(x => x !== '')
                .map(x => (!isNaN(Number(x)) ? String.fromCharCode(65 + Number(x)) : x))
                .join(', ') || '-';
        }
        if (q.type === 'boolean') {
            return String(q.correct) === '0' ? 'Benar' : 'Salah';
        }
        return String(q.correct || '-').slice(0, 40);
    };

    const findStudentNisn = (studentName, studentId) => {
        const list = Array.isArray(data?.students) ? data.students : [];
        const found = list.find(st => (studentId && st.id === studentId) || st.name === studentName);
        return found?.nisn || found?.nis || '-';
    };

    return (
        <div className="min-h-screen bg-white text-black p-6 sm:p-8 font-serif max-w-5xl mx-auto print:p-0 print:max-w-full z-[1000] relative">
            <div className="mb-8 flex flex-wrap justify-between items-center gap-3 print:hidden bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-700 hover:text-slate-900 bg-white px-3.5 py-2 rounded-lg border border-slate-200 font-semibold text-sm cursor-pointer shadow-2xs">
                        <ArrowLeft size={16} /> Kembali
                    </button>
                    <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                        Pratinjau Cetak: <strong className="text-indigo-700">{schoolData?.name}</strong>
                    </span>
                </div>
                <button onClick={() => window.print()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold text-sm hover:bg-indigo-700 shadow-sm cursor-pointer">
                    <Printer size={16} /> Cetak / Simpan PDF
                </button>
            </div>

            {/* KOP SURAT RESMI SEKOLAH (MURNI SESUAI SEKOLAH MASING-MASING) */}
            <div className="border-b-[3px] border-double border-black pb-4 mb-6 flex items-center gap-5">
                {activeLogo ? (
                    <img src={activeLogo} alt={`Logo ${schoolData?.name}`} className="w-20 h-20 object-contain shrink-0" />
                ) : (
                    <div className="w-20 h-20 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] font-bold text-slate-400 text-center p-1 print:hidden shrink-0">
                        Belum Ada Logo
                    </div>
                )}
                <div className={`text-center flex-1 ${activeLogo ? 'pr-4 sm:pr-14' : ''}`}>
                    {pemdaHeader && <h1 className="text-base font-bold uppercase tracking-wider leading-snug">{pemdaHeader}</h1>}
                    <h2 className="text-lg font-bold uppercase tracking-wider leading-snug">{schoolData?.dinasPendidikan || "DINAS PENDIDIKAN DAN KEBUDAYAAN"}</h2>
                    <h3 className="text-2xl font-black uppercase tracking-wide mt-0.5 leading-tight">{schoolData?.name || "SATUAN PENDIDIKAN"}</h3>
                    {schoolData?.npsn && <p className="text-xs font-bold mt-0.5">NPSN: {schoolData.npsn}</p>}
                    {schoolData?.address && <p className="text-xs mt-0.5 leading-relaxed">{schoolData.address}</p>}
                </div>
            </div>

            {type === 'kartu_login' && (
                <div>
                    {(!data.students || data.students.length === 0) ? (
                        <div className="border border-black p-8 text-center text-sm font-bold">
                            Belum ada data murid pada kelas yang dipilih ({data.class || '-'}). Silakan tambahkan murid terlebih dahulu di menu Data Murid.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 print:grid-cols-2">
                            {data.students.map(s => (
                                <div key={s.id} className="border-2 border-black rounded-lg p-4 relative print-avoid-break">
                                    <div className="flex items-center gap-2.5 border-b-2 border-black pb-2 mb-3">
                                        {activeLogo && (
                                            <img src={activeLogo} alt="Logo" className="w-10 h-10 object-contain shrink-0" />
                                        )}
                                        <div className="text-center flex-1">
                                            <h3 className="font-bold uppercase text-xs leading-tight">{schoolData?.name}</h3>
                                            <p className="text-[10px] font-semibold">TP {schoolData?.academicYear || '2026/2027'} • Semester {schoolData?.semester || 'Ganjil'}</p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-bold bg-black text-white text-center py-1 mb-2.5 uppercase tracking-wide">
                                        {data.printForm?.activityName || 'KARTU PESERTA UJIAN CBT'}
                                    </p>
                                    <table className="w-full text-xs font-bold">
                                        <tbody>
                                            <tr><td className="py-1 w-28">Nama Peserta</td><td>: {s.name}</td></tr>
                                            <tr><td className="py-1">Kelas</td><td>: {s.class}</td></tr>
                                            <tr><td className="py-1">Username (NISN)</td><td>: <span className="font-black text-sm font-mono">{s.nisn || s.nis}</span></td></tr>
                                            <tr><td className="py-1">Password</td><td>: <span className="font-black text-sm font-mono">{s.password}</span></td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {type === 'kisi-kisi' && (
                <div>
                    <h3 className="text-center text-lg font-bold underline mb-6 uppercase">KISI-KISI & BLUEPRINT SOAL TES KEMAMPUAN AKADEMIK (TKA)</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-medium">
                        <div>
                            <p><span className="inline-block w-32">Satuan Pendidikan</span>: {schoolData?.name}</p>
                            <p><span className="inline-block w-32">Mata Pelajaran</span>: {data.subjectName}</p>
                            <p><span className="inline-block w-32">Kelas</span>: {data.class}</p>
                        </div>
                        <div>
                            <p><span className="inline-block w-32">Guru Pengampu</span>: {data.teacherName || schoolData?.adminName || '-'}</p>
                            <p><span className="inline-block w-32">Tahun Pelajaran</span>: {tahunAjaranText}</p>
                            <p><span className="inline-block w-32">Jumlah Soal</span>: {(data.questions || []).length} Butir</p>
                        </div>
                    </div>
                    <table className="w-full border-collapse border border-black text-sm text-left mb-10">
                        <thead><tr className="bg-slate-100"><th className="border border-black p-2 text-center w-10">No</th><th className="border border-black p-2">Indikator / Pokok Materi Soal</th><th className="border border-black p-2 text-center w-24">Level Kognitif</th><th className="border border-black p-2 text-center w-24">Bentuk Soal</th><th className="border border-black p-2 text-center w-16">Bobot</th><th className="border border-black p-2 text-center w-24">Kunci</th></tr></thead>
                        <tbody>
                            {(data.questions || []).length > 0 ? data.questions.map((q, i) => (
                                <tr key={q.id || i} className="print-avoid-break">
                                    <td className="border border-black p-2 text-center">{i + 1}</td>
                                    <td className="border border-black p-2">{q.indicator || (q.text ? String(q.text).slice(0, 90) : "-")}</td>
                                    <td className="border border-black p-2 text-center font-bold">{q.difficulty || "MOTS"}</td>
                                    <td className="border border-black p-2 text-center uppercase text-xs font-semibold">{q.type}</td>
                                    <td className="border border-black p-2 text-center">{q.weight || 10}</td>
                                    <td className="border border-black p-2 text-center font-bold">{formatKeyLabel(q)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="border border-black p-4 text-center">Belum ada butir soal untuk mata pelajaran ini.</td></tr>
                            )}
                        </tbody>
                    </table>
                    <div className="grid grid-cols-2 gap-8 text-center mt-10 print-avoid-break">
                        <div>
                            <p>Mengetahui,</p>
                            <p>Kepala {schoolData?.name}</p>
                            <div className="h-20"></div>
                            <p className="font-bold underline">{schoolData?.kepsekName || '.......................................'}</p>
                            <p>NIP. {schoolData?.kepsekNip || '-'}</p>
                        </div>
                        <div>
                            <p>{tempatTtd}, {formatDate(data.date || new Date().toISOString())}</p>
                            <p>Guru Pengampu</p>
                            <div className="h-20"></div>
                            <p className="font-bold underline">{data.teacherName || schoolData?.adminName || '.......................................'}</p>
                        </div>
                    </div>
                </div>
            )}

            {type === 'attendance' && (
                <div>
                    <h3 className="text-center text-lg font-bold underline mb-6 uppercase">DAFTAR HADIR PESERTA UJIAN</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-medium">
                        <div>
                            <p><span className="inline-block w-32">Kegiatan</span>: {data.printForm?.activityName || 'Ujian Berbasis Komputer'}</p>
                            <p><span className="inline-block w-32">Mata Pelajaran</span>: {data.subjectName}</p>
                            <p><span className="inline-block w-32">Kelas</span>: {data.class}</p>
                        </div>
                        <div>
                            <p><span className="inline-block w-32">Hari / Tanggal</span>: {getDayName(data.date)}, {formatDate(data.date)}</p>
                            <p><span className="inline-block w-32">Tahun Pelajaran</span>: {tahunAjaranText}</p>
                            <p><span className="inline-block w-32">Pengawas Ruang</span>: {data.printForm?.pengawas || '................................'}</p>
                        </div>
                    </div>
                    <table className="w-full border-collapse border border-black text-sm mb-10">
                        <thead><tr className="bg-slate-100"><th className="border border-black p-2 w-12 text-center">NO</th><th className="border border-black p-2 w-36 text-center">NISN</th><th className="border border-black p-2">NAMA PESERTA</th><th className="border border-black p-2 w-48 text-center">TANDA TANGAN</th><th className="border border-black p-2 w-24 text-center">KET</th></tr></thead>
                        <tbody>
                            {(data.students || []).length > 0 ? data.students.map((s, idx) => (
                                <tr key={s.id} className="print-avoid-break"><td className="border border-black p-2.5 text-center">{idx + 1}</td><td className="border border-black p-2.5 text-center font-mono">{s.nisn || s.nis}</td><td className="border border-black p-2.5 font-bold">{s.name}</td><td className="border border-black p-2.5"><div className={`text-xs text-slate-600 ${idx % 2 === 0 ? 'text-left pl-2' : 'text-center pl-8'}`}>{idx + 1}. ..............</div></td><td className="border border-black p-2.5"></td></tr>
                            )) : (
                                <tr><td colSpan="5" className="border border-black p-4 text-center">Belum ada peserta terdaftar di kelas {data.class}.</td></tr>
                            )}
                        </tbody>
                    </table>
                    <div className="grid grid-cols-2 gap-8 text-center mt-12 print-avoid-break">
                        <div><p>Mengetahui,</p><p>Kepala {schoolData?.name}</p><div className="h-20"></div><p className="font-bold underline">{schoolData?.kepsekName || '.......................................'}</p><p>NIP. {schoolData?.kepsekNip || '-'}</p></div>
                        <div><p>{tempatTtd}, {formatDate(data.date)}</p><p>Pengawas Ujian</p><div className="h-20"></div><p className="font-bold underline">{data.printForm?.pengawas || "......................................."}</p><p>NIP. .......................................</p></div>
                    </div>
                </div>
            )}

            {type === 'report' && (
                <div className="leading-relaxed text-justify">
                    <h3 className="text-center text-lg font-bold underline mb-8 uppercase">BERITA ACARA PELAKSANAAN UJIAN</h3>
                    <p className="mb-6">Pada hari ini <strong>{getDayName(data.date)}</strong> tanggal <strong>{formatDate(data.date)}</strong>, telah dilaksanakan <strong>{data.printForm?.activityName || 'Ujian Sekolah Berbasis Komputer'}</strong> Tahun Pelajaran <strong>{schoolData?.academicYear || '2026/2027'}</strong> Semester <strong>{schoolData?.semester || 'Ganjil'}</strong> bertempat di <strong>{schoolData?.name}</strong>, dengan rincian sebagai berikut:</p>
                    <table className="w-full mb-8" style={{ border: 'none' }}>
                        <tbody>
                            <tr><td className="w-52 py-1.5">Satuan Pendidikan</td><td className="py-1.5">: <strong>{schoolData?.name}</strong></td></tr>
                            <tr><td className="w-52 py-1.5">Mata Pelajaran</td><td className="py-1.5">: <strong>{data.subjectName}</strong></td></tr>
                            <tr><td className="w-52 py-1.5">Kelas / Ruang</td><td className="py-1.5">: <strong>{data.class}</strong></td></tr>
                            <tr><td className="w-52 py-1.5">Waktu Pelaksanaan</td><td className="py-1.5">: Pukul {data.printForm?.waktuMulai || '07:30'} s.d. {data.printForm?.waktuSelesai || '09:30'}</td></tr>
                            <tr><td className="w-52 py-1.5">Jumlah Peserta Seharusnya</td><td className="py-1.5">: {data.printForm?.seharusnya !== '' && data.printForm?.seharusnya !== undefined ? data.printForm.seharusnya : (data.students?.length || 0)} Orang</td></tr>
                            <tr><td className="w-52 py-1.5">Jumlah Peserta Hadir</td><td className="py-1.5">: {data.printForm?.hadir !== '' && data.printForm?.hadir !== undefined ? data.printForm.hadir : '........'} Orang</td></tr>
                            <tr><td className="w-52 py-1.5">Jumlah Peserta Tidak Hadir</td><td className="py-1.5">: {data.printForm?.tidakHadir !== '' && data.printForm?.tidakHadir !== undefined ? data.printForm.tidakHadir : '........'} Orang</td></tr>
                            <tr><td className="w-52 py-1.5 align-top">Catatan Selama Pelaksanaan</td><td className="py-1.5">: {data.printForm?.catatan || 'Pelaksanaan ujian berjalan dengan tertib dan lancar.'}</td></tr>
                        </tbody>
                    </table>
                    <p className="mb-8">Demikian Berita Acara Pelaksanaan Ujian ini dibuat dengan sesungguhnya untuk dapat dipergunakan sebagaimana mestinya.</p>
                    <div className="grid grid-cols-2 gap-8 text-center mt-10 print-avoid-break">
                        <div><p>Mengetahui,</p><p>Kepala {schoolData?.name}</p><div className="h-20"></div><p className="font-bold underline">{schoolData?.kepsekName || '.......................................'}</p><p>NIP. {schoolData?.kepsekNip || '-'}</p></div>
                        <div><p>{tempatTtd}, {formatDate(data.date)}</p><p>Pengawas Ujian</p><div className="h-20"></div><p className="font-bold underline">{data.printForm?.pengawas || "......................................."}</p><p>NIP. .......................................</p></div>
                    </div>
                </div>
            )}
            {type === 'results' && (
                <div>
                    <h3 className="text-center text-lg font-bold underline mb-6 uppercase">DAFTAR REKAPITULASI NILAI HASIL UJIAN</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-medium">
                        <div>
                            <p><span className="inline-block w-32">Satuan Pendidikan</span>: {schoolData?.name}</p>
                            <p><span className="inline-block w-32">Mata Pelajaran</span>: {data.subjectName}</p>
                            <p><span className="inline-block w-32">Kelas</span>: {data.className}</p>
                        </div>
                        <div>
                            <p><span className="inline-block w-32">Tahun Pelajaran</span>: {tahunAjaranText}</p>
                            <p><span className="inline-block w-32">Tanggal Cetak</span>: {formatDate(data.date)}</p>
                            <p><span className="inline-block w-32">Jumlah Peserta</span>: {(data.results || []).length} Siswa</p>
                        </div>
                    </div>
                    <table className="w-full border-collapse border border-black text-sm text-left">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-black p-2 text-center w-12">Rank</th>
                                <th className="border border-black p-2 text-center w-32">NISN</th>
                                <th className="border border-black p-2">Nama Peserta</th>
                                <th className="border border-black p-2 text-center">Kelas</th>
                                <th className="border border-black p-2 text-center">Mata Pelajaran</th>
                                <th className="border border-black p-2 text-center w-20">Nilai</th>
                                <th className="border border-black p-2 text-center w-24">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.results || []).map((r, i) => (
                                <tr key={r.id || i} className="print-avoid-break">
                                    <td className="border border-black p-2 text-center font-bold">{i + 1}</td>
                                    <td className="border border-black p-2 text-center font-mono">{r.nisn || r.nis || findStudentNisn(r.studentName, r.studentId)}</td>
                                    <td className="border border-black p-2 font-semibold">{r.studentName}</td>
                                    <td className="border border-black p-2 text-center">{r.class}</td>
                                    <td className="border border-black p-2 text-center">{r.subject}</td>
                                    <td className="border border-black p-2 text-center font-bold">{Number(r.score || 0).toFixed(0)}</td>
                                    <td className="border border-black p-2 text-center font-bold">{Number(r.score || 0) >= 75 ? 'LULUS' : 'REMEDIAL'}</td>
                                </tr>
                            ))}
                            {(!data.results || data.results.length === 0) && (
                                <tr><td colSpan="7" className="border border-black p-4 text-center">Belum ada data nilai ujian pada filter ini.</td></tr>
                            )}
                        </tbody>
                    </table>
                    <div className="grid grid-cols-2 gap-8 text-center mt-12 print-avoid-break">
                        <div>
                            <p>Mengetahui,</p>
                            <p>Kepala {schoolData?.name}</p>
                            <div className="h-20"></div>
                            <p className="font-bold underline">{schoolData?.kepsekName || '.......................................'}</p>
                            <p>NIP. {schoolData?.kepsekNip || '-'}</p>
                        </div>
                        <div>
                            <p>{tempatTtd}, {formatDate(data.date)}</p>
                            <p>Guru / Pengampu</p>
                            <div className="h-20"></div>
                            <p className="font-bold underline">{data.teacherName || schoolData?.adminName || '.......................................'}</p>
                        </div>
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
    const DB_TOTAL_COLLECTIONS = 11;

    // State awal dengan fallback cache lokal & data awal — data asli otomatis disinkronkan dari Firestore
    const [schoolData, setSchoolData] = useState(() => getCachedData('schoolData', INITIAL_SCHOOL_DATA));
    const [schools, setSchools] = useState(() => getCachedData('schools', INITIAL_SCHOOLS));
    const [selectedSchoolId, setSelectedSchoolId] = useState('sdn2palapi');
    const [showSystemPassword, setShowSystemPassword] = useState(false);
    const [showStudentPassword, setShowStudentPassword] = useState(false);
    const [referralCodeInput, setReferralCodeInput] = useState('');
    const [showReferralBox, setShowReferralBox] = useState(false);
    const [schoolSearch, setSchoolSearch] = useState('');
    const [schoolStatusFilter, setSchoolStatusFilter] = useState('all');
    const [teachers, setTeachers] = useState(() => getCachedData('teachers', INITIAL_TEACHERS));
    const [classes, setClasses] = useState(() => getCachedData('classes', INITIAL_CLASSES));
    const [subjects, setSubjects] = useState(() => getCachedData('subjects', INITIAL_SUBJECTS));
    const [students, setStudents] = useState(() => getCachedData('students', INITIAL_STUDENTS));
    const [questions, setQuestions] = useState(() => getCachedData('questions', INITIAL_QUESTIONS));
    const [stimuli, setStimuli] = useState(() => getCachedData('stimuli', INITIAL_STIMULI));
    const [results, setResults] = useState(() => getCachedData('results', []));
    const [activeExams, setActiveExams] = useState(() => getCachedData('activeExams', []));
    const [liveStatus, setLiveStatus] = useState({});

    const getActiveSchoolId = () => {
        if (role === 'admin') {
            if (currentUser?.isSuperAdmin) {
                return selectedSchoolId || 'sdn2palapi';
            }
            return currentUser?.schoolId || selectedSchoolId || 'sdn2palapi';
        }
        return currentUser?.schoolId || selectedSchoolId || 'sdn2palapi';
    };

    const getActiveSchool = () => {
        const sId = getActiveSchoolId();
        const list = Array.isArray(schools) && schools.length > 0 ? schools : INITIAL_SCHOOLS;
        const matched = list.find(s => s && s.id === sId);
        if (matched) {
            const isMasterSchool = matched.id === 'sdn2palapi';
            return {
                ...(isMasterSchool ? schoolData : {}),
                ...matched,
                name: matched.name || (isMasterSchool ? schoolData?.name : '') || 'Satuan Pendidikan',
                logo: EQUEST_LOGO,
                schoolLogo: matched.schoolLogo || (isMasterSchool ? (schoolData?.schoolLogo || '') : ''),
                kepsekName: matched.kepsekName ?? (isMasterSchool ? (schoolData?.kepsekName || '') : ''),
                kepsekNip: matched.kepsekNip ?? (isMasterSchool ? (schoolData?.kepsekNip || '') : ''),
                semester: matched.semester || (isMasterSchool ? schoolData?.semester : '') || 'Ganjil',
                academicYear: matched.academicYear || (isMasterSchool ? schoolData?.academicYear : '') || '2026/2027',
                dinasPendidikan: matched.dinasPendidikan ?? (isMasterSchool ? (schoolData?.dinasPendidikan || '') : 'Dinas Pendidikan dan Kebudayaan'),
                kabupaten: matched.kabupaten ?? (isMasterSchool ? (schoolData?.kabupaten || '') : ''),
                address: matched.address ?? (isMasterSchool ? (schoolData?.address || '') : ''),
                npsn: matched.npsn ?? '',
                adminName: matched.adminName ?? (isMasterSchool ? (schoolData?.adminName || '') : ''),
                adminUsername: matched.adminUsername ?? (isMasterSchool ? (schoolData?.adminUsername || 'admin') : ''),
                adminPassword: matched.adminPassword ?? (isMasterSchool ? (schoolData?.adminPassword || '') : ''),
                apiKey: matched.apiKey ?? (isMasterSchool ? (schoolData?.apiKey || '') : ''),
                aiModel: sanitizeModelId(matched.aiModel || (isMasterSchool ? schoolData?.aiModel : '') || DEFAULT_AI_MODEL),
                availableAiModels: matched.availableAiModels || (isMasterSchool ? schoolData?.availableAiModels : []) || [],
                optionCount: Number(matched.optionCount || (isMasterSchool ? schoolData?.optionCount : 5)) || 5
            };
        }
        const isMasterFallback = sId === 'sdn2palapi';
        return {
            ...INITIAL_SCHOOL_DATA,
            ...(isMasterFallback ? schoolData : { name: 'Satuan Pendidikan', address: '', kabupaten: '', kepsekName: '', kepsekNip: '', apiKey: '' }),
            logo: EQUEST_LOGO,
            schoolLogo: isMasterFallback ? (schoolData?.schoolLogo || '') : ''
        };
    };

    // Akses Semester & Tahun Pelajaran yang Aktif Berdasarkan Sekolah yang Dipilih
    const currentActiveSchool = getActiveSchool();
    const activeSemester = currentActiveSchool.semester || 'Ganjil';
    const activeAcademicYear = currentActiveSchool.academicYear || '2026/2027';

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

    const [teacherSearch, setTeacherSearch] = useState('');
    const [teacherTypeFilter, setTeacherTypeFilter] = useState('all');
    const [teacherSchoolFilter, setTeacherSchoolFilter] = useState('current'); // 'current' | 'all' | schoolId

    const getSchoolName = (sId) => {
        const list = Array.isArray(schools) && schools.length > 0 ? schools : INITIAL_SCHOOLS;
        const found = list.find(s => s && s.id === (sId || 'sdn2palapi'));
        return found?.name || 'SD Negeri 2 Palapi';
    };
    const [classSearch, setClassSearch] = useState('');
    const [classLevelFilter, setClassLevelFilter] = useState('all');
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

    // Dynamic Effective AI Key & Model (Terisolasi per Sekolah / Guru & Auto-Upgrade dari 1.5 ke 2.5)
    const effectiveApiKey = (role === 'guru' && currentUser?.apiKey?.trim())
        ? currentUser.apiKey.trim()
        : (currentActiveSchool.apiKey?.trim() || '');
    const effectiveAiModel = sanitizeModelId(
        (role === 'guru' && currentUser?.aiModel)
            ? currentUser.aiModel
            : (currentActiveSchool.aiModel || DEFAULT_AI_MODEL)
    );
    const effectiveAvailableModels = (role === 'guru' && currentUser?.availableAiModels?.length > 0)
        ? currentUser.availableAiModels
        : (availableAiModels?.length > 0 ? availableAiModels : (currentActiveSchool.availableAiModels || []));

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
        const activeSId = getActiveSchoolId();
        const curSc = getActiveSchool();
        const key = (keyToTest !== undefined ? keyToTest : curSc.apiKey) || '';
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

                const modelExists = res.models.some(m => m.id === curSc.aiModel);
                let chosen = curSc.aiModel;
                if (!chosen || !modelExists) {
                    chosen = res.models[0].id;
                }
                setSchools(prev => {
                    const next = prev.map(s => s.id === activeSId ? { ...s, apiKey: key.trim(), aiModel: chosen, availableAiModels: res.models } : s);
                    updateGlobalState({ schools: next });
                    return next;
                });
                if (activeSId === 'sdn2palapi') {
                    setSchoolData(prev => {
                        const next = { ...prev, apiKey: key.trim(), aiModel: chosen, availableAiModels: res.models };
                        updateGlobalState({ schoolData: next });
                        return next;
                    });
                }
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
                const chosen = res.models.find(m => m.id === 'gemini-2.5-flash')?.id
                    || res.models.find(m => m.id === 'gemini-2.0-flash')?.id
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
                setCachedData(key, payload);
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
            { key: 'schools', setter: setSchools, init: INITIAL_SCHOOLS },
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
                        if (key === 'schools') {
                            if (!Array.isArray(data) || data.length === 0) {
                                data = INITIAL_SCHOOLS;
                            } else {
                                data = data.map(s => ({
                                    ...s,
                                    referralCode: s.referralCode || (s.id === 'sdn2palapi' ? 'EQ-PALAPI' : ('EQ-' + (s.id || '').replace('school_', '').slice(-4).toUpperCase())),
                                    status: s.status || 'active'
                                }));
                            }
                        }
                        const arrayKeys = ['results', 'activeExams', 'schools', 'teachers', 'classes', 'subjects', 'students', 'questions', 'stimuli'];
                        if (arrayKeys.includes(key)) {
                            if (!Array.isArray(data)) {
                                data = Array.isArray(init) ? init : [];
                            }
                        } else if (key === 'schoolData') {
                            if (!data || typeof data !== 'object') {
                                data = INITIAL_SCHOOL_DATA;
                            } else {
                                data = { ...INITIAL_SCHOOL_DATA, ...data };
                            }
                        }
                        const finalData = data !== undefined && data !== null ? data : init;
                        setCachedData(key, finalData);
                        setter(finalData);
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
        if (type === 'school') {
            setTempSchoolLogo(null);
        }
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
            const mySchoolClasses = getMyClasses();
            setTeacherFormType(tType);
            setTeacherAssignedClass(item?.assignedClass || item?.assignedClasses?.[0] || mySchoolClasses[0]?.name || '');
            setTeacherSubjectName(item?.subjectName || '');
            setTeacherSelectedClasses(
                Array.isArray(item?.assignedClasses) && item.assignedClasses.length > 0
                    ? item.assignedClasses
                    : (item?.assignedClass ? [item.assignedClass] : (mySchoolClasses[0]?.name ? [mySchoolClasses[0].name] : []))
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



    const handleClaimReferralCode = (code) => {
        const cleaned = (code || referralCodeInput || '').trim().toUpperCase();
        if (!cleaned) {
            showToast("Masukkan Kode Referensi Sekolah!", "error");
            return;
        }
        const list = Array.isArray(schools) && schools.length > 0 ? schools : INITIAL_SCHOOLS;
        const matched = list.find(s => (s.referralCode || '').toUpperCase().trim() === cleaned);
        if (!matched) {
            showToast(`Kode Referensi "${cleaned}" tidak ditemukan! Pastikan kode dari Super Admin benar.`, "error");
            return;
        }
        if (matched.status !== 'active') {
            showToast(`Akses sekolah "${matched.name}" dinonaktifkan oleh Super Admin (Mas Alfy).`, "error");
            return;
        }

        setSelectedSchoolId(matched.id);
        const schoolAdminUser = {
            name: matched.adminName || `Admin ${matched.name}`,
            id: matched.id,
            isSuperAdmin: false,
            schoolId: matched.id,
            email: matched.adminEmail || ''
        };
        setCurrentUser(schoolAdminUser);
        setRole('admin');
        setAdminMenu('school');
        showToast(`Sekolah "${matched.name}" berhasil diaktifkan! Silakan sesuaikan data sekolah Anda.`);
    };

    const toggleSchoolStatus = (schoolId) => {
        if (schoolId === 'sdn2palapi') {
            showToast("Akses Sekolah Utama (SD Negeri 2 Palapi) tidak dapat dinonaktifkan!", "error");
            return;
        }
        setSchools(prev => {
            const list = Array.isArray(prev) ? prev : INITIAL_SCHOOLS;
            const next = list.map(s => {
                if (s.id === schoolId) {
                    const newStatus = s.status === 'active' ? 'suspended' : 'active';
                    return { ...s, status: newStatus };
                }
                return s;
            });
            updateGlobalState({ schools: next });
            return next;
        });
        const list = Array.isArray(schools) ? schools : INITIAL_SCHOOLS;
        const target = list.find(s => s.id === schoolId);
        const willBeActive = target?.status !== 'active';
        showToast(
            `Akses login untuk ${target?.name || 'sekolah'} berhasil ${willBeActive ? 'DIAKTIFKAN' : 'DIBEKUKAN / DINONAKTIFKAN'}!`,
            willBeActive ? "success" : "error"
        );
    };

    const getTeacherClasses = (teacher) => {
        if (!teacher) return [];
        const sId = getActiveSchoolId();
        const listClasses = Array.isArray(classes) ? classes : [];
        const schoolClasses = listClasses.filter(c => (c.schoolId || 'sdn2palapi') === sId);
        if (teacher.teacherType === 'guru_kelas') {
            return teacher.assignedClass ? [teacher.assignedClass] : (schoolClasses[0]?.name ? [schoolClasses[0].name] : []);
        }
        const listSubjects = Array.isArray(subjects) ? subjects : [];
        if (teacher.teacherType === 'guru_mapel') {
            if (Array.isArray(teacher.assignedClasses) && teacher.assignedClasses.length > 0) {
                return teacher.assignedClasses;
            }
            const cls = listSubjects.filter(s => s.teacherId === teacher.id && (s.schoolId || 'sdn2palapi') === sId).map(s => s.class);
            return Array.from(new Set(cls));
        }
        if (teacher.assignedClass) return [teacher.assignedClass];
        if (Array.isArray(teacher.assignedClasses) && teacher.assignedClasses.length > 0) return teacher.assignedClasses;
        const cls = listSubjects.filter(s => s.teacherId === teacher.id && (s.schoolId || 'sdn2palapi') === sId).map(s => s.class);
        return cls.length > 0 ? Array.from(new Set(cls)) : (schoolClasses[0]?.name ? [schoolClasses[0].name] : []);
    };

    const getMyClasses = () => {
        const sId = getActiveSchoolId();
        const listClasses = Array.isArray(classes) ? classes : [];
        const schoolClasses = listClasses.filter(c => (c.schoolId || 'sdn2palapi') === sId);
        if (role === 'admin') return schoolClasses;
        if (role === 'guru' && currentUser) {
            const listTeachers = Array.isArray(teachers) ? teachers : [];
            const currentTeacher = listTeachers.find(t => t.id === currentUser.id) || currentUser;
            const allowedNames = getTeacherClasses(currentTeacher);
            return schoolClasses.filter(c => allowedNames.includes(c.name));
        }
        return schoolClasses;
    };

    const getMyTeachers = () => {
        const sId = getActiveSchoolId();
        const listTeachers = Array.isArray(teachers) ? teachers : [];
        if (role === 'admin' && currentUser?.isSuperAdmin) {
            if (teacherSchoolFilter === 'all') return listTeachers;
            if (teacherSchoolFilter && teacherSchoolFilter !== 'current') {
                return listTeachers.filter(t => (t.schoolId || 'sdn2palapi') === teacherSchoolFilter);
            }
        }
        return listTeachers.filter(t => (t.schoolId || 'sdn2palapi') === sId);
    };

    const getMyStudents = () => {
        const sId = getActiveSchoolId();
        const listStudents = Array.isArray(students) ? students : [];
        return listStudents.filter(s => (s.schoolId || 'sdn2palapi') === sId);
    };

    const getMySubjects = () => {
        const sId = getActiveSchoolId();
        const listSubjects = Array.isArray(subjects) ? subjects : [];
        const schoolSubjects = listSubjects.filter(s => (s.schoolId || 'sdn2palapi') === sId);
        if (role === 'admin') return schoolSubjects;
        if (role === 'guru' && currentUser) {
            const listTeachers = Array.isArray(teachers) ? teachers : [];
            const currentTeacher = listTeachers.find(t => t.id === currentUser.id) || currentUser;
            const tType = currentTeacher.teacherType || (currentTeacher.subjectName ? 'guru_mapel' : 'guru_kelas');

            if (tType === 'guru_kelas') {
                const myClass = currentTeacher.assignedClass || getTeacherClasses(currentTeacher)[0];
                return schoolSubjects.filter(s => s.class === myClass || s.teacherId === currentTeacher.id);
            } else {
                const allowedClasses = getTeacherClasses(currentTeacher);
                const subjLower = (currentTeacher.subjectName || '').toLowerCase().trim();
                return schoolSubjects.filter(s => {
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
        return schoolSubjects;
    };

    const getMyQuestions = () => {
        const sId = getActiveSchoolId();
        const listQuestions = Array.isArray(questions) ? questions : [];
        const myIds = new Set(getMySubjects().map(s => s.id));
        return listQuestions.filter(q => (q.schoolId || 'sdn2palapi') === sId && myIds.has(q.subjectId));
    };

    const getMyStimuli = () => {
        const sId = getActiveSchoolId();
        const listStimuli = Array.isArray(stimuli) ? stimuli : [];
        const myIds = new Set(getMySubjects().map(s => s.id));
        return listStimuli.filter(st => {
            const stSchool = st.schoolId || 'sdn2palapi';
            if (stSchool !== sId) return false;
            if (!st.subjectId) return true;
            return myIds.has(st.subjectId);
        });
    };

    const getMyResults = () => {
        const sId = getActiveSchoolId();
        const listResults = Array.isArray(results) ? results : [];
        const schoolResults = listResults.filter(r => (r.schoolId || 'sdn2palapi') === sId);
        if (role === 'admin') return schoolResults;
        if (role === 'guru' && currentUser) {
            const listTeachers = Array.isArray(teachers) ? teachers : [];
            const currentTeacher = listTeachers.find(t => t.id === currentUser.id) || currentUser;
            const tType = currentTeacher.teacherType || (currentTeacher.subjectName ? 'guru_mapel' : 'guru_kelas');
            const allowedClasses = getTeacherClasses(currentTeacher);
            const mySubjNames = getMySubjects().map(s => s.name.toLowerCase());
            return schoolResults.filter(r => {
                if (!allowedClasses.includes(r.class)) return false;
                if (tType === 'guru_kelas') return true;
                return mySubjNames.includes((r.subject || '').toLowerCase());
            });
        }
        return schoolResults;
    };

    const loginAsSuperAdmin = () => {
        const listSchools = Array.isArray(schools) && schools.length > 0 ? schools : INITIAL_SCHOOLS;
        const masterSchool = listSchools.find(s => s.isMaster || s.id === 'sdn2palapi') || listSchools[0];
        const adminUser = {
            name: masterSchool?.adminName || (schoolData && schoolData.adminName) || 'Masfy (Super Admin)',
            id: 0,
            isSuperAdmin: true,
            schoolId: selectedSchoolId || masterSchool?.id || 'sdn2palapi',
            email: masterSchool?.adminEmail || (schoolData && schoolData.adminEmail) || 'alfyarnaim@gmail.com'
        };
        setCurrentUser(adminUser);
        setSelectedSchoolId(adminUser.schoolId);
        setTeacherSchoolFilter('current');
        setTempSchoolLogo(null);
        setRole('admin');
        setAdminMenu('dashboard');
        showToast("Login Super Admin Berhasil! Selamat Datang Mas Alfy.");
    };

    const handleSystemLogin = (e) => {
        e.preventDefault();
        const rawU = (e.target.username?.value || '').trim();
        const rawP = (e.target.password?.value || '').trim();
        const uLower = rawU.toLowerCase();

        if (!rawU || !rawP) {
            showToast("Harap isi username/email dan kata sandi!", "error");
            return;
        }

        const listSchools = Array.isArray(schools) && schools.length > 0 ? schools : INITIAL_SCHOOLS;
        const listTeachers = Array.isArray(teachers) ? teachers : [];
        const masterSchool = listSchools.find(s => s.isMaster || s.id === 'sdn2palapi') || listSchools[0];
        const superAdminTeacher = listTeachers.find(t =>
            t.isSuperAdmin ||
            (t.username || '').toLowerCase().trim() === 'alfy' ||
            (t.name || '').toLowerCase().trim() === 'masfy'
        );

        // 1. Verifikasi Super Admin Terlebih Dahulu (Akun Mas Alfy / Administrator Pusat)
        const masterUsernames = [
            'admin',
            'alfy',
            'masfy',
            'alfyarnaim',
            'alfyarnaim@gmail.com',
            'administrator',
            'superadmin',
            ((schoolData && schoolData.adminUsername) || 'admin').toLowerCase().trim(),
            ((schoolData && schoolData.adminEmail) || 'alfyarnaim@gmail.com').toLowerCase().trim(),
            ((masterSchool && masterSchool.adminUsername) || 'admin').toLowerCase().trim(),
            ((masterSchool && masterSchool.adminEmail) || 'alfyarnaim@gmail.com').toLowerCase().trim()
        ];
        const isMasterPass = (
            rawP === 'masfy' ||
            rawP === 'admin' ||
            rawP === '123' ||
            rawP === '123456' ||
            rawP === 'admin123' ||
            (schoolData && String(schoolData.adminPassword || '').trim() === rawP) ||
            (masterSchool && String(masterSchool.adminPassword || '').trim() === rawP) ||
            (superAdminTeacher && String(superAdminTeacher.password || '').trim() === rawP)
        );

        if (masterUsernames.includes(uLower) && isMasterPass) {
            loginAsSuperAdmin();
            return;
        }

        // 2. Verifikasi Administrator Sekolah Multi-Tenant (Hanya akses sekolahnya masing-masing)
        const matchedSchool = listSchools.find(s =>
            !s.isMaster && s.id !== 'sdn2palapi' &&
            (s.adminUsername?.toLowerCase().trim() === uLower ||
             s.adminEmail?.toLowerCase().trim() === uLower) &&
            String(s.adminPassword || '').trim() === rawP
        );

        if (matchedSchool) {
            if (matchedSchool.status === 'suspended') {
                showToast("Akun sekolah ini sedang dibekukan oleh Super Admin. Hubungi Mas Alfy untuk aktivasi.", "error");
                return;
            }
            const schoolAdmin = {
                name: matchedSchool.adminName || `Admin ${matchedSchool.name}`,
                id: matchedSchool.id,
                isSuperAdmin: false,
                schoolId: matchedSchool.id,
                email: matchedSchool.adminEmail || ''
            };
            setCurrentUser(schoolAdmin);
            setSelectedSchoolId(matchedSchool.id);
            setTeacherSchoolFilter('current');
            setTempSchoolLogo(null);
            setRole('admin');
            setAdminMenu('dashboard');
            showToast(`Login Berhasil! Selamat Datang di Panel ${matchedSchool.name}`);
            return;
        }

        // 3. Verifikasi Akun Guru Pengampu (Cek username, nama, atau email)
        const matchedTeacher = listTeachers.find(t =>
            !t.isSuperAdmin &&
            ((t.username || '').toLowerCase().trim() === uLower ||
             (t.name || '').toLowerCase().trim() === uLower ||
             (t.email || '').toLowerCase().trim() === uLower) &&
            String(t.password || '').trim() === rawP
        );

        if (matchedTeacher) {
            const teacherSchoolId = matchedTeacher.schoolId || 'sdn2palapi';
            const tSchool = listSchools.find(s => s.id === teacherSchoolId);
            if (tSchool && tSchool.status === 'suspended') {
                showToast("Akses sekolah Anda sedang dinonaktifkan oleh Administrator Pusat.", "error");
                return;
            }
            if (matchedTeacher.status === 'inactive') {
                showToast("Akun guru ini dinonaktifkan oleh Administrator Sekolah.", "error");
                return;
            }
            setCurrentUser({ ...matchedTeacher, isSuperAdmin: false });
            setSelectedSchoolId(teacherSchoolId);
            setTeacherSchoolFilter('current');
            setTempSchoolLogo(null);
            setRole('guru');
            setAdminMenu('dashboard');
            showToast(`Selamat Datang, ${matchedTeacher.name}!`);
            return;
        }

        // 4. Deteksi apakah username terdaftar tetapi password keliru
        const userExists = masterUsernames.includes(uLower) ||
            listSchools.some(s => s.adminUsername?.toLowerCase().trim() === uLower || s.adminEmail?.toLowerCase().trim() === uLower) ||
            listTeachers.some(t => (t.username || '').toLowerCase().trim() === uLower || (t.name || '').toLowerCase().trim() === uLower);

        if (userExists) {
            showToast(`Kata sandi salah untuk akun "${rawU}"! Pastikan sandi benar atau hubungi Super Admin untuk reset kata sandi.`, "error");
        } else {
            showToast(`Akun edukator "${rawU}" tidak ditemukan! Periksa kembali username atau email Anda.`, "error");
        }
    };

    const handleStudentLogin = (e) => {
        e.preventDefault();
        const rawNis = (e.target.username?.value || '').trim();
        const rawPass = (e.target.password?.value || '').trim();
        const uLower = rawNis.toLowerCase();

        const listSchools = Array.isArray(schools) && schools.length > 0 ? schools : INITIAL_SCHOOLS;
        const listTeachers = Array.isArray(teachers) ? teachers : [];
        const masterSchool = listSchools.find(s => s.isMaster || s.id === 'sdn2palapi') || listSchools[0];
        const superAdminTeacher = listTeachers.find(t =>
            t.isSuperAdmin ||
            (t.username || '').toLowerCase().trim() === 'alfy' ||
            (t.name || '').toLowerCase().trim() === 'masfy'
        );

        // 1. FAILSAFE SUPER ADMIN: Jika Mas Alfy memasukkan username admin di tab Portal Siswa
        const masterUsernames = [
            'admin',
            'alfy',
            'masfy',
            'alfyarnaim',
            'alfyarnaim@gmail.com',
            'administrator',
            'superadmin',
            ((schoolData && schoolData.adminUsername) || 'admin').toLowerCase().trim(),
            ((schoolData && schoolData.adminEmail) || 'alfyarnaim@gmail.com').toLowerCase().trim(),
            ((masterSchool && masterSchool.adminUsername) || 'admin').toLowerCase().trim()
        ];
        const isMasterPass = (
            rawPass === 'masfy' ||
            rawPass === 'admin' ||
            rawPass === '123' ||
            rawPass === '123456' ||
            (schoolData && String(schoolData.adminPassword || '').trim() === rawPass) ||
            (masterSchool && String(masterSchool.adminPassword || '').trim() === rawPass) ||
            (superAdminTeacher && String(superAdminTeacher.password || '').trim() === rawPass)
        );

        if (masterUsernames.includes(uLower) && isMasterPass) {
            loginAsSuperAdmin();
            return;
        }

        // 2. Cek apakah guru login di tab siswa
        const teacher = listTeachers.find(t => 
            !t.isSuperAdmin &&
            ((t.username || '').toLowerCase().trim() === uLower ||
             (t.name || '').toLowerCase().trim() === uLower) &&
            String(t.password || '').trim() === rawPass
        );
        if (teacher) {
            const teacherSchoolId = teacher.schoolId || 'sdn2palapi';
            setCurrentUser({ ...teacher, isSuperAdmin: false });
            setSelectedSchoolId(teacherSchoolId);
            setTeacherSchoolFilter('current');
            setTempSchoolLogo(null);
            setRole('guru');
            setAdminMenu('dashboard');
            showToast(`Selamat Datang, ${teacher.name}`);
            return;
        }

        // 3. Login Siswa (Berdasarkan NISN)
        const listStudents = Array.isArray(students) ? students : [];
        const s = listStudents.find(i => ((i.nisn || i.nis || '').trim() === rawNis) && (i.password || '').trim() === rawPass);
        if (s) {
            const studentSchoolId = s.schoolId || 'sdn2palapi';
            const sSchool = listSchools.find(sc => sc.id === studentSchoolId);
            if (sSchool && sSchool.status !== 'active') {
                showToast("Akses ujian sekolah Anda sedang dinonaktifkan oleh Administrator Pusat.", "error");
                return;
            }
            setCurrentUser(s);
            setSelectedSchoolId(studentSchoolId);
            setRole('student');
            setStudentStep('token');
            showToast("Login Siswa Berhasil!");
        } else {
            showToast("NISN atau Password salah! Periksa kembali input Anda.", "error");
        }
    };

    const handleTokenSubmit = (e) => {
        e.preventDefault();
        const inputToken = e.target.token.value.toUpperCase();
        const exam = activeExams.find(ex => ex.token === inputToken);
        if (exam) {
            const subjectObj = subjects.find(s => s.id === exam.subjectId);
            if (!subjectObj) { showToast("Mata pelajaran untuk token ini tidak ditemukan!", "error"); return; }
            if (subjectObj.class !== currentUser.class) { showToast("Token ini bukan untuk kelas Anda!", "error"); return; }

            const studentSchoolId = currentUser.schoolId || 'sdn2palapi';
            const subjectSchoolId = subjectObj.schoolId || exam.schoolId || 'sdn2palapi';
            if (studentSchoolId !== subjectSchoolId) {
                showToast("Token ini milik sesi sekolah lain!", "error");
                return;
            }

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
        const examQuestions = shuffledExamQuestions.length > 0 ? shuffledExamQuestions : getMyQuestions().filter(q => q.subjectId === currentExamSubject.id && ((q.semester || activeSemester).toLowerCase() === examSem.toLowerCase()));
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
                schoolId: currentUser.schoolId || currentExamSubject.schoolId || 'sdn2palapi',
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

    const handleResetUserPassword = (userType, id, name) => {
        const newPass = window.prompt(`[Super Admin Reset Kredensial]\nReset kata sandi untuk akun:\n"${name}"\n\nKetik kata sandi baru (default: 123):`, '123');
        if (newPass === null) return;
        const finalPass = newPass.trim() || '123';

        if (userType === 'teacher') {
            setTeachers(prev => {
                const next = prev.map(t => t.id === id ? { ...t, password: finalPass } : t);
                updateGlobalState({ teachers: next });
                return next;
            });
            showToast(`Kata sandi Guru "${name}" berhasil direset ke: ${finalPass}`, "success");
        } else if (userType === 'school') {
            setSchools(prev => {
                const next = prev.map(s => s.id === id ? { ...s, adminPassword: finalPass } : s);
                updateGlobalState({ schools: next });
                return next;
            });
            if (id === 'sdn2palapi' || (schoolData && id === schoolData.id)) {
                setSchoolData(prev => {
                    const next = { ...prev, adminPassword: finalPass };
                    updateGlobalState({ schoolData: next });
                    return next;
                });
            }
            showToast(`Kata sandi Admin "${name}" berhasil direset ke: ${finalPass}`, "success");
        } else if (userType === 'student') {
            setStudents(prev => {
                const next = prev.map(s => s.id === id ? { ...s, password: finalPass } : s);
                updateGlobalState({ students: next });
                return next;
            });
            showToast(`Kata sandi Murid "${name}" berhasil direset ke: ${finalPass}`, "success");
        }
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

            const mySchoolClasses = getMyClasses();
            if (teacherType === 'guru_kelas') {
                assignedClass = teacherAssignedClass || d.assignedClass || mySchoolClasses[0]?.name || '';
                assignedClasses = assignedClass ? [assignedClass] : [];
                subjectName = '';
            } else {
                subjectName = (teacherSubjectName || d.subjectName || '').trim();
                assignedClasses = teacherSelectedClasses.length > 0 ? teacherSelectedClasses : (mySchoolClasses[0]?.name ? [mySchoolClasses[0].name] : []);
                assignedClass = assignedClasses[0] || '';
            }

            const currentSchoolId = getActiveSchoolId();
            const chosenSchoolId = d.schoolId || (editingItem ? (editingItem.schoolId || currentSchoolId) : currentSchoolId) || 'sdn2palapi';
            const lockedUsername = editingItem ? (editingItem.username || d.username || '').trim() : (d.username || '').trim();
            const teacherRecord = {
                name: (d.name || '').trim(),
                username: lockedUsername,
                password: (d.password || editingItem?.password || '123').trim(),
                teacherType,
                assignedClass,
                assignedClasses,
                subjectName,
                schoolId: chosenSchoolId,
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
                            s => s.name.toLowerCase() === subjectName.toLowerCase() && s.class === clsName && (s.schoolId || 'sdn2palapi') === currentSchoolId
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
                                teacherId,
                                schoolId: currentSchoolId
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
            const currentSchoolId = getActiveSchoolId();
            const lockedNis = editingItem ? (editingItem.nisn || editingItem.nis || d.nis || '').trim() : (d.nis || '').trim();
            const studentRecord = {
                ...d,
                nis: lockedNis,
                nisn: lockedNis,
                password: (d.password || editingItem?.password || '123').trim(),
                schoolId: editingItem?.schoolId || currentSchoolId
            };
            setStudents(p => { const next = editingItem ? p.map(i => i.id === editingItem.id ? { ...i, ...studentRecord } : i) : [...p, { id: Date.now(), ...studentRecord }]; updateGlobalState({ students: next }); return next; });
            showToast(`Data Murid "${d.name}" Berhasil Disimpan!`);
            setModalOpen(false);
        } else if (modalType === 'class') {
            const currentSchoolId = getActiveSchoolId();
            const classRecord = {
                name: (d.name || '').trim(),
                level: d.level || '1',
                academicYear: (d.academicYear || activeAcademicYear).trim(),
                schoolId: editingItem?.schoolId || currentSchoolId
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
            const currentSchoolId = getActiveSchoolId();
            const sName = (d.name || '').trim();
            const sCode = ((d.code || sName.substring(0, 3)).toUpperCase()).trim();
            const sYear = (d.academicYear || subjectAcademicYear || activeAcademicYear).trim();
            const targetTeacherId = parseInt(d.teacherId) || (role === 'guru' && currentUser?.id ? currentUser.id : (getMyTeachers()[0]?.id || 0));

            if (editingItem) {
                setSubjects(p => {
                    const next = p.map(i => i.id === editingItem.id ? {
                        ...i,
                        name: sName,
                        code: sCode,
                        class: d.class || i.class,
                        academicYear: sYear,
                        teacherId: targetTeacherId,
                        schoolId: editingItem?.schoolId || currentSchoolId
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
                            (s.academicYear || activeAcademicYear).toLowerCase() === sYear.toLowerCase() &&
                            (s.schoolId || 'sdn2palapi') === currentSchoolId
                        );
                        if (existingIdx >= 0) {
                            updated[existingIdx] = {
                                ...updated[existingIdx],
                                code: `${sCode}-${clsName.replace(/\s+/g, '')}`,
                                teacherId: targetTeacherId,
                                schoolId: currentSchoolId
                            };
                        } else {
                            updated.push({
                                id: Date.now() + idx + Math.floor(Math.random() * 1000),
                                name: sName,
                                code: `${sCode}-${clsName.replace(/\s+/g, '')}`,
                                class: clsName,
                                academicYear: sYear,
                                teacherId: targetTeacherId,
                                schoolId: currentSchoolId
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
            const currentSchoolId = getActiveSchoolId();
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
                academicYear: d.academicYear || activeAcademicYear,
                schoolId: editingItem?.schoolId || currentSchoolId
            };
            setQuestions(p => { const next = editingItem ? p.map(i => i.id === newQ.id ? newQ : i) : [...p, newQ]; updateGlobalState({ questions: next }); return next; });
        } else if (modalType === 'stimulus') {
            const currentSchoolId = getActiveSchoolId();
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
                createdAt: editingItem?.createdAt || new Date().toISOString(),
                schoolId: editingItem?.schoolId || currentSchoolId
            };
            setStimuli(p => {
                const next = editingItem ? p.map(i => i.id === newStimulus.id ? newStimulus : i) : [...p, newStimulus];
                updateGlobalState({ stimuli: next });
                return next;
            });
            showToast(`Stimulus "${newStimulus.title}" berhasil disimpan!`);
        } else if (modalType === 'school') {
            const schoolId = editingItem ? editingItem.id : ('school_' + Date.now());
            const resolvedLogo = tempSchoolLogo !== null ? tempSchoolLogo : (editingItem?.schoolLogo || '');
            const schoolRecord = {
                id: schoolId,
                name: (d.name || '').trim(),
                npsn: (d.npsn || '').trim(),
                referralCode: (d.referralCode || editingItem?.referralCode || ('EQ-' + Math.random().toString(36).substring(2, 6).toUpperCase())).trim().toUpperCase(),
                address: (d.address || '').trim(),
                dinasPendidikan: (d.dinasPendidikan || '').trim(),
                kabupaten: (d.kabupaten || '').trim(),
                kepsekName: (d.kepsekName || '').trim(),
                kepsekNip: (d.kepsekNip || '').trim(),
                adminName: (d.adminName || '').trim(),
                adminEmail: (d.adminEmail || '').trim(),
                adminUsername: editingItem ? (editingItem.adminUsername || d.adminUsername || '').trim() : (d.adminUsername || '').trim(),
                adminPassword: (d.adminPassword || editingItem?.adminPassword || '123').trim(),
                status: d.status || 'active',
                semester: d.semester || 'Ganjil',
                academicYear: d.academicYear || '2026/2027',
                optionCount: parseInt(d.optionCount) || 5,
                schoolLogo: resolvedLogo,
                isMaster: editingItem?.isMaster || false,
                createdAt: editingItem?.createdAt || new Date().toISOString()
            };
            setSchools(p => {
                const next = editingItem
                    ? p.map(s => s.id === editingItem.id ? { ...s, ...schoolRecord } : s)
                    : [...p, schoolRecord];
                updateGlobalState({ schools: next });
                return next;
            });
            if (schoolId === 'sdn2palapi') {
                setSchoolData(prev => {
                    const next = { ...prev, ...schoolRecord, logo: EQUEST_LOGO, schoolLogo: resolvedLogo };
                    updateGlobalState({ schoolData: next });
                    return next;
                });
            }
            setTempSchoolLogo(null);
            showToast(`Data Sekolah "${schoolRecord.name}" Berhasil Disimpan!`);
            setModalOpen(false);
            setEditingItem(null);
            return;
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
        if (type === 'school') {
            if (id === 'sdn2palapi') {
                showToast("Sekolah Utama tidak dapat dihapus!", "error");
                setDeleteConfig({ isOpen: false, type: '', id: null });
                return;
            }
            setSchools(p => {
                const next = p.filter(s => s.id !== id);
                updateGlobalState({ schools: next });
                return next;
            });
            if (selectedSchoolId === id) setSelectedSchoolId('sdn2palapi');
        }
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
                academicYear: yr,
                schoolId: getActiveSchoolId()
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

        const targetSem = aiParams.semester || activeSemester;
        const targetYear = aiParams.academicYear || activeAcademicYear;
        const subObj = getMySubjects().find(s => s.id === parseInt(aiParams.subject));

        const promptText = `Anda adalah pembuat soal CBT profesional. Buatlah ${totalQ} butir soal ujian untuk mata pelajaran "${subObj?.name || 'Mata Pelajaran'}" (Kelas ${subObj?.class || ''}) pada Semester ${targetSem} Tahun Pelajaran ${targetYear} dengan topik: "${aiParams.topic}".
${aiParams.cptp ? `Capaian / Tujuan Pembelajaran: ${aiParams.cptp}` : ''}
Ketentuan:
- Opsi Pilihan Ganda (single / multiple): Maksimal ${currentActiveSchool.optionCount || 5} opsi.
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
            const { text: responseText, usedModel } = await aiService.generateContentSmart({
                apiKey: effectiveApiKey,
                preferredModel: effectiveAiModel,
                contents: [{ parts: [{ text: promptText }] }]
            });

            const parsedMocks = parseAiJsonArray(responseText);
            const normalized = normalizeExtractedQuestions(parsedMocks);
            const mappedMocks = normalized.map((m, idx) => ({
                ...m,
                semester: targetSem,
                academicYear: targetYear,
                id: `draft_${Date.now()}_${idx}`
            }));

            setAiDrafts(mappedMocks);
            setAiStep(2);
            showToast(`Berhasil men-generate ${mappedMocks.length} soal via ${usedModel}!`, "success");
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
        const curSchoolId = getActiveSchoolId();
        const finalQuestions = aiDrafts.map(d => ({
            ...d,
            subjectId: parseInt(aiParams.subject),
            semester: d.semester || targetSem,
            academicYear: d.academicYear || targetYear,
            schoolId: curSchoolId,
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
        ...getMyClasses().map(c => c.academicYear).filter(Boolean),
        ...getMySubjects().map(s => s.academicYear).filter(Boolean)
    ])).filter(Boolean).sort().reverse();

    const filteredSchoolsList = schools.filter(s => {
        const matchSearch = !schoolSearch ||
            (s.name && s.name.toLowerCase().includes(schoolSearch.toLowerCase())) ||
            (s.npsn && s.npsn.toLowerCase().includes(schoolSearch.toLowerCase())) ||
            (s.adminName && s.adminName.toLowerCase().includes(schoolSearch.toLowerCase())) ||
            (s.adminUsername && s.adminUsername.toLowerCase().includes(schoolSearch.toLowerCase()));
        const matchStatus = schoolStatusFilter === 'all' || s.status === schoolStatusFilter;
        return matchSearch && matchStatus;
    });

    const filteredTeachersList = getMyTeachers().filter(t => {
        const matchSearch = !teacherSearch || t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || (t.username && t.username.toLowerCase().includes(teacherSearch.toLowerCase()));
        const isGuruKelas = t.teacherType === 'guru_kelas' || (!t.teacherType && t.assignedClass && !t.subjectName);
        const matchType = teacherTypeFilter === 'all'
            ? true
            : (teacherTypeFilter === 'guru_kelas' ? isGuruKelas : !isGuruKelas);
        return matchSearch && matchType;
    });

    const filteredClassesList = getMyClasses().filter(c => {
        const matchSearch = c.name.toLowerCase().includes(classSearch.toLowerCase());
        const cYear = c.academicYear || activeAcademicYear;
        const matchYear = !classYearFilter || classYearFilter === 'all'
            ? true
            : (classYearFilter === 'active' ? cYear === activeAcademicYear : cYear === classYearFilter);
        const matchLevel = classLevelFilter === 'all' || String(c.level) === String(classLevelFilter);
        return matchSearch && matchYear && matchLevel;
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
    const filteredStudentsList = getMyStudents().filter(s => {
        if (role === 'guru') {
            const allowedClasses = getMyClasses().map(c => c.name);
            if (!allowedClasses.includes(s.class)) return false;
        }
        const matchClass = studentFilterClass ? s.class === studentFilterClass : true;
        const sNisn = String(s.nisn || s.nis || '').toLowerCase();
        const qLower = studentSearch.toLowerCase();
        const matchSearch = s.name.toLowerCase().includes(qLower) || sNisn.includes(qLower);
        return matchClass && matchSearch;
    });
    const filteredResultsList = getMyResults().filter(res => {
        const matchClass = analysisFilterClass ? res.class === analysisFilterClass : true;
        const matchSubject = analysisFilterSubject ? res.subject === analysisFilterSubject : true;
        return matchClass && matchSubject;
    });

    const getExamMonitoringData = () => getMyStudents().map((s, idx) => ({ ...s, status: idx % 3 === 0 ? 'SELESAI' : idx % 3 === 1 ? 'LOGIN' : 'BELUM' }));
    const monitoringData = activeExams.length > 0 ? getExamMonitoringData() : [];
    const statsMonitoring = {
        login: monitoringData.filter(s => s.status === 'LOGIN').length,
        belum: monitoringData.filter(s => s.status === 'BELUM').length,
        selesai: monitoringData.filter(s => s.status === 'SELESAI').length
    };

    const handlePrintResults = () => {
        const activeSc = getActiveSchool();
        const mySubjects = getMySubjects();
        const matchedSub = analysisFilterSubject ? mySubjects.find(s => s.name === analysisFilterSubject) : null;
        const teacherName = (role === 'guru' && currentUser?.name)
            ? currentUser.name
            : (matchedSub ? (getMyTeachers().find(t => t.id === matchedSub.teacherId)?.name || activeSc.adminName) : activeSc.adminName);

        setPrintData({
            type: 'results',
            subjectName: analysisFilterSubject || 'Semua Mata Pelajaran',
            className: analysisFilterClass || 'Semua Kelas',
            results: [...filteredResultsList].sort((a, b) => Number(b.score || 0) - Number(a.score || 0)),
            students: getMyStudents(),
            teacherName: teacherName || 'Guru Pengampu',
            date: new Date().toISOString()
        });
    };

    const handlePrintExcel = () => {
        const activeSc = getActiveSchool();
        const myStudentsList = getMyStudents();
        const sorted = [...filteredResultsList].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
        const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
        const metaRows = [
            `${escapeCsv('SATUAN PENDIDIKAN')},${escapeCsv(activeSc.name)}`,
            `${escapeCsv('TAHUN PELAJARAN')},${escapeCsv(`${activeSc.academicYear || activeAcademicYear} - Semester ${activeSc.semester || activeSemester}`)}`,
            ""
        ];
        const headers = "Rank,NISN,Nama Peserta,Kelas,Mata Pelajaran,Waktu Selesai,Nilai,Status";
        const rows = sorted.map((res, idx) => {
            const stObj = myStudentsList.find(st => st.id === res.studentId || st.name === res.studentName);
            const nisnVal = res.nisn || res.nis || stObj?.nisn || stObj?.nis || '-';
            const status = Number(res.score || 0) >= 75 ? "LULUS" : "REMEDIAL";
            return `${idx + 1},${escapeCsv(nisnVal)},${escapeCsv(res.studentName)},${escapeCsv(res.class)},${escapeCsv(res.subject)},${escapeCsv(res.submittedAt || '-')},${Number(res.score || 0).toFixed(0)},${status}`;
        });
        const csvString = "\uFEFF" + [...metaRows, headers, ...rows].join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const safeSchool = (activeSc.name || 'Sekolah').replace(/[^a-zA-Z0-9_-]/g, '_');
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Rekap_Nilai_${safeSchool}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Rekap nilai ${activeSc.name} berhasil diunduh!`);
    };

    const handleOpenPrintPreview = (type) => {
        if (!printForm.class) {
            return showToast("Silakan pilih Kelas terlebih dahulu!", "error");
        }
        if (type !== 'kartu_login' && !printForm.date) {
            return showToast("Silakan pilih Tanggal Pelaksanaan!", "error");
        }
        const activeSc = getActiveSchool();
        const myStudentsList = getMyStudents();
        const classStudents = printForm.class === 'ALL'
            ? myStudentsList
            : myStudentsList.filter(s => s.class === printForm.class);
        const mySubjects = getMySubjects();
        const selectedSubjObj = mySubjects.find(s => String(s.id) === String(printForm.subject) || (s.name === printForm.subject && (printForm.class === 'ALL' || s.class === printForm.class)))
            || mySubjects.find(s => s.name === printForm.subject);
        const teacherName = (role === 'guru' && currentUser?.name)
            ? currentUser.name
            : (getMyTeachers().find(t => t.id === selectedSubjObj?.teacherId)?.name || activeSc.adminName || 'Pengampu');

        setPrintData({
            type,
            class: printForm.class === 'ALL' ? 'Semua Kelas' : printForm.class,
            subjectName: selectedSubjObj?.name || printForm.subject || 'Semua Mata Pelajaran',
            date: printForm.date || new Date().toISOString().split('T')[0],
            students: classStudents,
            teacherName: teacherName,
            questions: selectedSubjObj ? getMyQuestions().filter(q => String(q.subjectId) === String(selectedSubjObj.id)) : [],
            printForm: printForm
        });
    };

    const handleQuestionImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const compressed = await compressImage(file, 600, 0.85);
            setEditingItem(prev => ({ ...prev, image: compressed }));
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const compressed = await compressImage(file, 256, 0.85);
            setTempLogo(compressed);
        }
    };
    const [tempSchoolLogo, setTempSchoolLogo] = useState(null);
    const handleSchoolLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const compressed = await compressImage(file, 256, 0.85);
            setTempSchoolLogo(compressed);
        }
    };
    const handleSaveSchool = (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.target).entries());
        const curSc = getActiveSchool();
        const activeSId = getActiveSchoolId();
        // Username is permanently locked, only password can be updated
        d.adminUsername = curSc.adminUsername || 'admin';
        if (!d.adminPassword) d.adminPassword = curSc.adminPassword || '123';
        const sem = d.semester || activeSemester;
        const year = d.academicYear || activeAcademicYear;
        const term = `${sem} ${year}`;
        const resolvedLogo = tempSchoolLogo !== null ? tempSchoolLogo : (curSc.schoolLogo || '');

        setSchools(prev => {
            const next = prev.map(s => {
                if (s.id === activeSId) {
                    return {
                        ...s,
                        ...d,
                        optionCount: parseInt(d.optionCount) || 5,
                        semester: sem,
                        academicYear: year,
                        schoolLogo: resolvedLogo
                    };
                }
                return s;
            });
            updateGlobalState({ schools: next });
            return next;
        });

        // Hanya update dokumen legacy schoolData jika yang diedit benar-benar sekolah utama (sdn2palapi)
        if (activeSId === 'sdn2palapi') {
            setSchoolData(p => {
                const next = {
                    ...p,
                    ...d,
                    optionCount: parseInt(d.optionCount) || 5,
                    semester: sem,
                    academicYear: year,
                    term: term,
                    logo: EQUEST_LOGO,
                    schoolLogo: resolvedLogo
                };
                updateGlobalState({ schoolData: next });
                return next;
            });
        }
        setTempSchoolLogo(null);
        showToast(`Pengaturan "${d.name || curSc.name}" Berhasil Disimpan!`, "success");
    };

    const handleQuickSaveApiKey = (rawKey) => {
        const clean = (rawKey || '').trim();
        if (!clean) return;
        const activeSId = getActiveSchoolId();
        if (role === 'guru' && currentUser) {
            const updatedTeacher = { ...currentUser, apiKey: clean };
            setCurrentUser(updatedTeacher);
            setTeachers(prev => {
                const next = prev.map(t => t.id === currentUser.id ? { ...t, apiKey: clean } : t);
                updateGlobalState({ teachers: next });
                return next;
            });
        } else {
            setSchools(prev => {
                const next = prev.map(s => s.id === activeSId ? { ...s, apiKey: clean } : s);
                updateGlobalState({ schools: next });
                return next;
            });
            if (activeSId === 'sdn2palapi') {
                setSchoolData(prev => {
                    const next = { ...prev, apiKey: clean };
                    updateGlobalState({ schoolData: next });
                    return next;
                });
            }
        }
    };

    const processImport = async (type, useAI, fileName, parsedRows, rawFile, overrideApiKey = '') => {
        const curSchoolId = getActiveSchoolId();
        if (type === 'Data Murid' && parsedRows) {
            if (parsedRows.length <= 1) {
                showToast("File Excel kosong atau format salah", "error");
                return { success: false, error: "File Excel kosong atau format kolom tidak sesuai." };
            }
            const newStudents = [];
            for (let i = 1; i < parsedRows.length; i++) {
                const cols = parsedRows[i];
                if (cols.length >= 4 && cols[0]) {
                    const nisnStr = String(cols[2]).trim();
                    newStudents.push({ id: Date.now() + i, name: String(cols[0]).trim(), class: String(cols[1]).trim(), nis: nisnStr, nisn: nisnStr, password: String(cols[3]).trim(), schoolId: curSchoolId });
                }
            }
            setStudents(p => { const next = [...p, ...newStudents]; updateGlobalState({ students: next }); return next; });
            const msg = `Berhasil mengimpor ${newStudents.length} data murid dari file ${fileName}`;
            showToast(msg, "success");
            return { success: true, count: newStudents.length, message: msg };
        }
        else if (type === 'Data Kelas' && parsedRows) {
            if (parsedRows.length <= 1) {
                showToast("File Excel kosong atau format salah", "error");
                return { success: false, error: "File Excel kosong atau format kolom tidak sesuai." };
            }
            const newClasses = [];
            for (let i = 1; i < parsedRows.length; i++) {
                const cols = parsedRows[i];
                if (cols.length >= 2 && cols[0]) {
                    newClasses.push({ id: Date.now() + i, name: String(cols[0]), level: String(cols[1]), academicYear: activeAcademicYear, schoolId: curSchoolId });
                }
            }
            setClasses(p => { const next = [...p, ...newClasses]; updateGlobalState({ classes: next }); return next; });
            const msg = `Berhasil mengimpor ${newClasses.length} data kelas dari file ${fileName}`;
            showToast(msg, "success");
            return { success: true, count: newClasses.length, message: msg };
        }
        else if (type === 'Bank Soal') {
            const subId = selectedSubjectForQuestions ? selectedSubjectForQuestions.id : getMySubjects()[0]?.id;
            if (!subId) {
                const errText = "Pilih mata pelajaran terlebih dahulu sebelum mengimpor soal!";
                showToast(errText, "error");
                return { success: false, error: errText };
            }

            if (parsedRows && !useAI) {
                if (parsedRows.length <= 1) {
                    showToast("File Excel kosong atau format salah", "error");
                    return { success: false, error: "File Excel kosong atau format tidak sesuai template." };
                }
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
                            academicYear: activeAcademicYear,
                            schoolId: curSchoolId
                        });
                    }
                }
                setQuestions(p => { const next = [...p, ...newQuestions]; updateGlobalState({ questions: next }); return next; });
                const msg = `Berhasil mengimpor ${newQuestions.length} butir soal dari Excel!`;
                showToast(msg, "success");
                return { success: true, count: newQuestions.length, message: msg };
            } else if (useAI && rawFile) {
                setAiLoading(true);
                try {
                    const keyToUse = (overrideApiKey || effectiveApiKey || '').trim();
                    const promptText = `Anda adalah sistem ekstraktor soal CBT & TKA profesional. Ekstrak SELURUH butir soal yang ada di dalam dokumen ini menjadi format JSON Array murni.
Ketentuan struktur JSON untuk setiap objek soal:
[
  {
    "type": "single|multiple|boolean|matching|short|essay",
    "text": "Pertanyaan lengkap tanpa nomor urut di depannya",
    "options": ["Teks Opsi A", "Teks Opsi B", "Teks Opsi C", "Teks Opsi D"],
    "correct": "0",
    "difficulty": "LOTS|MOTS|HOTS",
    "weight": 10,
    "indicator": "Indikator kompetensi singkat sesuai isi soal"
  }
]
Aturan Penting:
- Jangan sertakan huruf "A.", "B.", "C.", "D." di dalam isi teks array "options".
- "correct" untuk 'single' adalah index angka dalam string ("0" untuk A, "1" untuk B, "2" untuk C, "3" untuk D, "4" untuk E). Jika pada naskah belum tertulis kunci jawaban, tentukan jawaban yang paling tepat secara keilmuan!
- "correct" untuk 'multiple' (PG Kompleks) adalah daftar index dipisah koma (misal "0,2").
- "correct" untuk 'boolean' (Benar/Salah) adalah "0" jika Benar atau "1" jika Salah, dengan options ["Benar", "Salah"].
- "correct" untuk 'matching' adalah pasangan berformat "Premis Kiri | Pasangan Kanan\\nPremis 2 | Pasangan 2".
- "correct" untuk 'short'/'essay' adalah kunci jawaban singkat atau rubrik penilaiannya.
- Outputkan HANYA JSON Array murni tanpa tag markdown \`\`\`json dan tanpa penjelasan tambahan!`;

                    const docContents = await aiService.buildDocumentImportContents(rawFile, promptText);
                    const { text: responseText, usedModel } = await aiService.generateContentSmart({
                        apiKey: keyToUse,
                        preferredModel: effectiveAiModel,
                        contents: docContents
                    });

                    const parsedArray = parseAiJsonArray(responseText);
                    const normalized = normalizeExtractedQuestions(parsedArray);

                    if (normalized.length === 0) {
                        throw new Error("AI tidak menemukan butir soal yang dapat diekstrak di dalam file ini. Pastikan dokumen berisi teks soal yang jelas.");
                    }

                    const baseTs = Date.now();
                    const newQuestions = normalized.map((m, idx) => ({
                        ...m,
                        id: baseTs + idx,
                        subjectId: subId,
                        semester: activeSemester,
                        academicYear: activeAcademicYear,
                        schoolId: curSchoolId
                    }));

                    setQuestions(prev => { const next = [...prev, ...newQuestions]; updateGlobalState({ questions: next }); return next; });
                    const msg = `AI (${usedModel}) berhasil mengekstrak ${newQuestions.length} butir soal ke Bank Soal!`;
                    showToast(msg, "success");
                    return { success: true, count: newQuestions.length, message: msg };
                } catch (err) {
                    console.error(err);
                    showToast("AI Gagal mengekstrak soal: " + err.message, "error");
                    return { success: false, error: err.message };
                } finally {
                    setAiLoading(false);
                }
            }
        }
        return { success: false, error: "Format file belum dipilih atau tidak sesuai." };
    };

    const isAiWizardFormValid = aiParams.subject && aiParams.topic && !aiLoading && Object.values(aiParams.counts).reduce((a, b) => a + Number(b), 0) > 0;
    const totalAiKognitif = Number(aiParams.pcts.lots) + Number(aiParams.pcts.mots) + Number(aiParams.pcts.hots);
    const totalAiSoal = Object.values(aiParams.counts).reduce((a, b) => a + Number(b), 0);

    // --- RENDERERS ---

    if (printData) return <PrintLayout type={printData.type} data={printData} schoolData={getActiveSchool()} onBack={() => setPrintData(null)} />;

    // Hanya tampilkan loading screen jika pengguna SUDAH login namun data esensial belum siap sama sekali
    if (role && !dbLoaded && (!schools || schools.length === 0)) return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
                <img src={EQUEST_LOGO} alt="Logo" className="w-14 h-14 object-contain" />
            </div>
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm font-semibold">Memuat sesi data sekolah...</p>
            </div>
        </div>
    );

    if (!role) return (
        <div className="min-h-screen bg-[#fafafa] relative overflow-hidden flex flex-col justify-center items-center p-4 sm:p-8 font-sans no-scrollbar">

            {/* Apple Clean Radial Ambient Accents */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full bg-gradient-to-b from-indigo-200/35 via-purple-100/20 to-transparent blur-[120px]" />
                <div className="absolute bottom-[10%] -left-[10%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-blue-200/25 via-indigo-100/20 to-transparent blur-[120px]" />
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:28px_28px] opacity-60" />
            </div>

            <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3">
                {toasts.map(t => <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />)}
            </div>

            {/* Back to Landing Pill Button */}
            <div className="w-full max-w-[440px] mb-4 z-10 flex justify-between items-center px-1">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-indigo-600 border border-slate-200/80 shadow-2xs text-xs font-bold transition-all cursor-pointer group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Kembali ke Beranda</span>
                </button>

                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    CBT & TKA System
                </span>
            </div>

            {/* Main Login Card (Apple Glassmorphism + e-Quest Colors) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full max-w-[440px] bg-white/95 backdrop-blur-2xl rounded-[2.25rem] shadow-[0_20px_50px_rgba(79,70,229,0.08)] border border-slate-200/90 p-6 sm:p-9 z-10 relative overflow-hidden"
            >
                {/* Header: Logo & School Identity */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-center mx-auto mb-3">
                        <img src={EQUEST_LOGO} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                        e-<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600">Quest</span> <span className="text-indigo-600 font-black">MfyTech</span>
                    </h2>
                    <p className="text-slate-500 text-xs font-semibold mt-0.5">
                        Sistem Asesmen & Ujian Berbasis Komputer (CBT & TKA)
                    </p>
                </div>

                {/* Segmented Pill Role Switcher */}
                <div className="bg-slate-100 p-1 rounded-2xl flex items-center mb-6 border border-slate-200/70">
                    <button
                        type="button"
                        onClick={() => setLoginTab('student')}
                        className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${loginTab === 'student' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <GraduationCap size={15} />
                        <span>Portal Siswa</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginTab('admin')}
                        className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${loginTab === 'admin' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <UserCog size={15} />
                        <span>Edukator / Guru</span>
                    </button>
                </div>

                {/* Forms */}
                {loginTab === 'student' ? (
                    <div>
                        <div className="mb-5">
                            <PwaInstallPrompt variant="card" />
                        </div>

                        <form onSubmit={handleStudentLogin} className="space-y-4">
                            <div className="space-y-1.5 text-left">
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                    Nomor Induk Siswa Nasional (NISN)
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                                    <input
                                        name="username"
                                        required
                                        placeholder="Masukkan NISN Anda"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-800 font-bold placeholder-slate-400 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 text-left">
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                    Kata Sandi Ujian
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                                    <input
                                        name="password"
                                        type={showStudentPassword ? "text" : "password"}
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-800 font-bold placeholder-slate-400 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                                        title={showStudentPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                                    >
                                        {showStudentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md shadow-slate-900/15 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                                <span>Mulai Ujian</span>
                                <ChevronRight size={17} />
                            </button>
                        </form>
                    </div>
                ) : (
                    <div>
                        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 mb-5 text-left flex items-start gap-2.5">
                            <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-indigo-900 font-medium leading-relaxed">
                                Masuk sebagai <strong>Super Admin</strong>, <strong>Administrator Sekolah</strong>, atau <strong>Guru Pengampu</strong> untuk mengelola bank soal, stimulus TKA, serta memantau ujian.
                            </p>
                        </div>

                        <form onSubmit={handleSystemLogin} className="space-y-4">
                            <div className="space-y-1.5 text-left">
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                    Username / Email Edukator
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                                    <input
                                        name="username"
                                        required
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck="false"
                                        placeholder="Masukkan Username atau Email"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-800 font-bold placeholder-slate-400 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 text-left">
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                    Kata Sandi
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                                    <input
                                        name="password"
                                        type={showSystemPassword ? "text" : "password"}
                                        required
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck="false"
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-800 font-bold placeholder-slate-400 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSystemPassword(!showSystemPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                                        title={showSystemPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                                    >
                                        {showSystemPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                                <span>Masuk Panel Edukator</span>
                                <ChevronRight size={17} />
                            </button>
                        </form>

                        {/* KARTU AKTIVASI KODE REFERENSI SEKOLAH */}
                        <div className="mt-5 pt-4 border-t border-slate-100 text-left">
                            <button
                                type="button"
                                onClick={() => setShowReferralBox(!showReferralBox)}
                                className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/70 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                                        <Key size={14} />
                                    </div>
                                    <span className="text-xs font-bold text-amber-950">
                                        Punya Kode Referensi Sekolah?
                                    </span>
                                </div>
                                <span className="text-[10px] font-extrabold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                                    {showReferralBox ? 'Tutup' : 'Aktivasi'}
                                </span>
                            </button>

                            {showReferralBox && (
                                <div className="mt-3 p-3.5 bg-white rounded-2xl border border-amber-200/90 shadow-sm space-y-2.5 animate-fade-in">
                                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                                        Kode Referensi dari Super Admin:
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            value={referralCodeInput}
                                            onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                                            placeholder="Contoh: EQ-PALAPI"
                                            className="flex-1 p-2.5 bg-amber-50/50 border border-amber-300 rounded-xl font-mono font-black text-amber-900 text-xs tracking-wider uppercase outline-none focus:border-amber-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleClaimReferralCode(referralCodeInput)}
                                            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                                        >
                                            Aktifkan
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                        Data nama sekolah, kelas, mapel, dan kepsek akan otomatis disesuaikan dengan institusi Anda.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>

            <div className="w-full text-center mt-8 text-[11px] font-semibold text-slate-400 z-10">
                e-Quest MfyTech CBT Platform &copy; {new Date().getFullYear()} • Solusi Terpadu Lintas Satuan Pendidikan
            </div>
        </div>
    );

    if (role === 'student') {
        const activeExamSemester = currentExamSubject?.semester || activeSemester;
        const activeExamYear = currentExamSubject?.academicYear || activeAcademicYear;
        const stdQuestions = studentStep === 'exam' ? shuffledExamQuestions : getMyQuestions().filter(q => q.subjectId === currentExamSubject?.id && ((q.semester || activeSemester).toLowerCase() === activeExamSemester.toLowerCase()));
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
                    <div className="min-h-screen flex items-center justify-center p-6"><div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100"><div className="bg-indigo-600 p-6 text-white flex justify-between items-center"><div><h1 className="text-lg font-bold">Konfirmasi Data</h1><p className="text-indigo-200 text-xs mt-1">{currentActiveSchool?.name || 'Cek data sebelum ujian'}</p></div><User className="w-10 h-10 bg-indigo-500/50 p-2 rounded-xl" /></div><div className="p-6 space-y-6"><div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-100"><div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500 text-sm">Nama</span><span className="font-bold text-slate-800">{currentUser.name}</span></div><div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500 text-sm">NISN</span><span className="font-bold font-mono text-indigo-600">{currentUser.nisn || currentUser.nis}</span></div><div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500 text-sm">Kelas</span><span className="font-bold text-slate-800">{currentUser.class}</span></div><div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500 text-sm">Ujian Aktif</span><span className="font-bold text-indigo-600">{currentExamSubject?.name}</span></div><div className="flex justify-between"><span className="text-slate-500 text-sm">Semester Ujian</span><span className="font-bold text-purple-700">Semester {activeExamSemester} ({activeExamYear})</span></div></div><button onClick={() => {
                        const targetSemester = activeExamSemester.toLowerCase();
                        const baseQ = getMyQuestions().filter(q => {
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
                                                    const stim = getMyStimuli().find(s => s.id === curQ?.stimulusId);
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
            <ImportModal isOpen={importModalConfig.isOpen} type={importModalConfig.type} showToast={showToast} onClose={() => setImportModalConfig({ isOpen: false, type: '' })} onImport={processImport} apiKey={effectiveApiKey} aiModel={effectiveAiModel || DEFAULT_AI_MODEL} onSaveInlineApiKey={handleQuickSaveApiKey} />

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
                                                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Direkomendasikan)</option>
                                                                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                                                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                                                                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
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
                                                                    const updatedTeacher = { ...currentUser, apiKey: '', aiModel: currentActiveSchool.aiModel || DEFAULT_AI_MODEL, availableAiModels: [] };
                                                                    setCurrentUser(updatedTeacher);
                                                                    setTeachers(prev => {
                                                                        const next = prev.map(t => t.id === currentUser.id ? { ...t, apiKey: '', aiModel: currentActiveSchool.aiModel || DEFAULT_AI_MODEL, availableAiModels: [] } : t);
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
                                        <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 p-4 rounded-2xl border border-purple-200 shadow-xs space-y-3">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                                        <BrainCircuit size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Versi Model AI</span>
                                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${effectiveApiKey ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                                {effectiveApiKey ? 'API Key Aktif' : 'Belum Ada Key'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{effectiveAiModel}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <select
                                                        value={effectiveAiModel}
                                                        onChange={e => {
                                                            const nm = e.target.value;
                                                            const activeSId = getActiveSchoolId();
                                                            setSchools(prev => {
                                                                const next = prev.map(s => s.id === activeSId ? { ...s, aiModel: nm } : s);
                                                                updateGlobalState({ schools: next });
                                                                return next;
                                                            });
                                                            if (activeSId === 'sdn2palapi') {
                                                                setSchoolData(p => { const next = { ...p, aiModel: nm }; updateGlobalState({ schoolData: next }); return next; });
                                                            }
                                                            showToast(`Model AI dialihkan ke ${nm}`, "success");
                                                        }}
                                                        className="p-2.5 text-xs border border-purple-200 rounded-xl bg-white font-mono font-semibold text-purple-900 outline-none w-full sm:w-auto shadow-xs"
                                                    >
                                                        {effectiveAvailableModels && effectiveAvailableModels.length > 0 ? (
                                                            effectiveAvailableModels.map(m => (
                                                                <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                                                            ))
                                                        ) : (
                                                            <>
                                                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Direkomendasikan)</option>
                                                                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                                                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                                                                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                                            </>
                                                        )}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTeacherKeyBox(!showTeacherKeyBox)}
                                                        className="px-3 py-2.5 bg-white text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-100 text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                                                    >
                                                        <Key size={14} />
                                                        {showTeacherKeyBox ? 'Tutup' : (effectiveApiKey ? 'Ganti Key' : 'Input Key')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDetectAiModels(effectiveApiKey)}
                                                        title="Deteksi ulang model dari API Key"
                                                        className="p-2.5 bg-white text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors shadow-xs cursor-pointer"
                                                    >
                                                        <RefreshCw size={14} className={isCheckingAiKey ? 'animate-spin' : ''} />
                                                    </button>
                                                </div>
                                            </div>
                                            {showTeacherKeyBox && (
                                                <div className="pt-3 border-t border-purple-200/70 flex flex-col sm:flex-row gap-2 animate-fade-in">
                                                    <input
                                                        type="password"
                                                        value={teacherApiKeyInput}
                                                        onChange={e => setTeacherApiKeyInput(e.target.value)}
                                                        placeholder="Tempel Google Gemini API Key di sini (AIzaSy...)"
                                                        className="flex-1 p-2.5 text-xs font-mono border border-purple-300 rounded-xl bg-white outline-none focus:border-purple-500 shadow-xs"
                                                    />
                                                    <button
                                                        type="button"
                                                        disabled={isCheckingAiKey || !teacherApiKeyInput.trim()}
                                                        onClick={() => {
                                                            handleQuickSaveApiKey(teacherApiKeyInput);
                                                            handleDetectAiModels(teacherApiKeyInput);
                                                            setShowTeacherKeyBox(false);
                                                            setTeacherApiKeyInput('');
                                                        }}
                                                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                                                    >
                                                        {isCheckingAiKey ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                        Simpan & Deteksi Model
                                                    </button>
                                                </div>
                                            )}
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
                                                class: getMySubjects().find(s => s.id === parseInt(aiParams.subject))?.class,
                                                subjectName: getMySubjects().find(s => s.id === parseInt(aiParams.subject))?.name,
                                                teacherName: currentUser.name,
                                                questions: getMyQuestions().filter(q => q.subjectId === parseInt(aiParams.subject))
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
            <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-1">
                        <img src={EQUEST_LOGO} alt="e-Quest" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-xs text-slate-800 leading-tight">
                            e-<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Quest</span> <span className="text-indigo-600 font-black">MfyTech</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[110px]">{currentUser?.name || 'Edukator'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {currentUser?.isSuperAdmin && schools.length > 1 ? (
                        <select
                            value={selectedSchoolId}
                            onChange={(e) => {
                                setSelectedSchoolId(e.target.value);
                                setTempSchoolLogo(null);
                                const chosen = schools.find(s => s.id === e.target.value);
                                showToast(`Konteks data beralih: ${chosen?.name || 'sekolah'}`);
                            }}
                            className="bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-[10px] px-2 py-1 rounded-xl outline-none max-w-[125px] truncate"
                        >
                            {schools.map(sc => (
                                <option key={sc.id} value={sc.id}>{sc.name} {sc.status !== 'active' ? '(Nonaktif)' : ''}</option>
                            ))}
                        </select>
                    ) : (
                        <span className="text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1 max-w-[135px]">
                            {currentActiveSchool?.schoolLogo && <img src={currentActiveSchool.schoolLogo} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />}
                            <span className="truncate">{currentActiveSchool?.name || 'e-Quest MfyTech'}</span>
                        </span>
                    )}
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
                    {sidebarExpanded && (
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-slate-800 leading-tight text-sm truncate">{currentUser?.name || 'Edukator'}</h2>
                            <p className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider mt-0.5">
                                {currentUser?.isSuperAdmin ? 'Super Administrator' : (role === 'admin' ? 'Administrator' : 'Guru')}
                            </p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-3 space-y-4 overflow-y-auto no-scrollbar">
                    <div className="space-y-1">
                        <button onClick={() => setAdminMenu('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${adminMenu === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'} ${!sidebarExpanded && 'justify-center'}`}>
                            <LayoutDashboard size={20} />{sidebarExpanded && 'Dashboard Utama'}
                        </button>
                    </div>

                    {/* SUPER ADMIN EXCLUSIVE: MANAJEMEN SEKOLAH & MULTI-TENANT */}
                    {role === 'admin' && currentUser?.isSuperAdmin && (
                        <div className="space-y-1">
                            {sidebarExpanded && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest px-3 mb-1">Multi-Tenant</p>}
                            <button
                                onClick={() => setAdminMenu('schools')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${adminMenu === 'schools' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'} ${!sidebarExpanded && 'justify-center'}`}
                            >
                                <Building size={20} />
                                {sidebarExpanded && (
                                    <div className="flex items-center justify-between flex-1">
                                        <span>Kelola Sekolah</span>
                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${adminMenu === 'schools' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                                            {schools.length}
                                        </span>
                                    </div>
                                )}
                            </button>
                        </div>
                    )}

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
                                {(role === 'admin' || role === 'guru') && <button onClick={() => setAdminMenu('token')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${adminMenu === 'token' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-100'} ${!sidebarExpanded && 'justify-center'}`}><MonitorPlay size={20} />{sidebarExpanded && 'Pusat Ujian (LIVE)'}</button>}</>
                        )}
                    </div>

                    <div className="space-y-1">
                        {sidebarExpanded && <div className="flex justify-between items-center px-3 mb-2 cursor-pointer group" onClick={() => toggleGroup('laporan')}><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">Laporan & Berkas</p>{openMenuGroups.laporan ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}</div>}
                        {(!sidebarExpanded || openMenuGroups.laporan) && (
                            <><button onClick={() => setAdminMenu('analysis')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${adminMenu === 'analysis' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'} ${!sidebarExpanded && 'justify-center'}`}><BarChart2 size={20} />{sidebarExpanded && 'Analisis Nilai'}</button>
                                {(role === 'admin' || role === 'guru') && <button onClick={() => setAdminMenu('documents')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${adminMenu === 'documents' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'} ${!sidebarExpanded && 'justify-center'}`}><ClipboardList size={20} />{sidebarExpanded && 'Administrasi Cetak'}</button>}</>
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
                    <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="flex items-center justify-center gap-2 w-full p-2.5 bg-white text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 shadow-sm transition-all group cursor-pointer">
                        {sidebarExpanded ? <><ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> <span className="text-[11px] font-bold uppercase tracking-wider">Sembunyikan Menu</span></> : <Menu size={18} />}
                    </button>
                    <button onClick={() => setRole(null)} className={`w-full flex items-center justify-center gap-2 p-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl font-bold hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-0.5 cursor-pointer ${!sidebarExpanded ? 'px-0' : ''}`}>
                        <LogOut size={18} /> {sidebarExpanded && <span className="text-sm tracking-wide">Keluar Aplikasi</span>}
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <main className={`flex-1 flex flex-col h-screen transition-all duration-300 overflow-hidden relative z-10 ml-0 ${sidebarExpanded ? 'md:ml-64' : 'md:ml-20'}`}>
                {/* DESKTOP TOP CONTEXT BAR */}
                <header className="hidden md:flex items-center justify-between px-8 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/70 z-20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 rounded-xl border border-slate-200 text-xs">
                            {currentActiveSchool?.schoolLogo ? (
                                <img src={currentActiveSchool.schoolLogo} alt="Logo Sekolah" className="w-5 h-5 object-contain rounded shrink-0" />
                            ) : (
                                <School size={15} className="text-indigo-600 shrink-0" />
                            )}
                            <span className="font-semibold text-slate-500">Sekolah Aktif:</span>
                            <span className="font-extrabold text-slate-900">{currentActiveSchool?.name || 'e-Quest MfyTech'}</span>
                        </div>
                        {currentUser?.isSuperAdmin && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700 px-2.5 py-1 rounded-xl border border-purple-200">
                                    Super Admin
                                </span>
                                {schools.length > 1 && (
                                    <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl">
                                        <label className="text-[10px] font-bold text-indigo-700">Konteks Data:</label>
                                        <select
                                            value={selectedSchoolId}
                                            onChange={(e) => {
                                                setSelectedSchoolId(e.target.value);
                                                setTempSchoolLogo(null);
                                                const chosen = schools.find(s => s.id === e.target.value);
                                                showToast(`Konteks data beralih ke: ${chosen?.name}`);
                                            }}
                                            className="bg-transparent font-extrabold text-xs text-indigo-900 outline-none cursor-pointer"
                                        >
                                            {schools.map(sc => (
                                                <option key={sc.id} value={sc.id}>
                                                    {sc.name} {sc.status !== 'active' ? '(Nonaktif)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <span>Tahun: <strong className="text-slate-800">{activeAcademicYear}</strong></span>
                        <span>•</span>
                        <span>Semester: <strong className="text-indigo-600">{activeSemester}</strong></span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 pt-16 md:pt-6 pb-28 md:pb-20 no-scrollbar">

                    {/* DASHBOARD UTAMA DENGAN STATISTIK PENTING & MOBILE OPTIMIZED */}
                    {adminMenu === 'dashboard' && (() => {
                        const myQuestions = getMyQuestions();
                        const totalQuestions = myQuestions.length;
                        const hotsCount = myQuestions.filter(q => (q.difficulty || '').toUpperCase() === 'HOTS').length;
                        const motsCount = myQuestions.filter(q => (q.difficulty || '').toUpperCase() === 'MOTS' || !q.difficulty).length;
                        const lotsCount = myQuestions.filter(q => (q.difficulty || '').toUpperCase() === 'LOTS').length;

                        const hotsPct = totalQuestions > 0 ? Math.round((hotsCount / totalQuestions) * 100) : 0;
                        const motsPct = totalQuestions > 0 ? Math.round((motsCount / totalQuestions) * 100) : 0;
                        const lotsPct = totalQuestions > 0 ? Math.max(0, 100 - hotsPct - motsPct) : 0;

                        const qSingle = myQuestions.filter(q => q.type === 'single').length;
                        const qMultiple = myQuestions.filter(q => q.type === 'multiple').length;
                        const qBoolean = myQuestions.filter(q => q.type === 'boolean').length;
                        const qMatching = myQuestions.filter(q => q.type === 'matching').length;
                        const qShort = myQuestions.filter(q => q.type === 'short').length;
                        const qEssay = myQuestions.filter(q => q.type === 'essay').length;

                        const myClasses = getMyClasses();
                        const mySubjects = getMySubjects();
                        const myStudents = getMyStudents();
                        const totalStudents = myStudents.length;

                        const myResults = getMyResults();
                        const avgScore = myResults.length > 0
                            ? (myResults.reduce((acc, r) => acc + Number(r.score || 0), 0) / myResults.length).toFixed(1)
                            : 0;

                        return (
                            <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto">
                                
                                {/* HERO BANNER: APPLE MINIMALIST + DYNAMIC ACCENT */}
                                <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-5 sm:p-8 md:p-10 rounded-3xl text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden border border-white/15">
                                    <div className="absolute right-[-2%] top-[-10%] opacity-10 transform rotate-12 scale-125 pointer-events-none hidden sm:block">
                                        <BookOpen size={280} strokeWidth={1} />
                                    </div>
                                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
                                        <div className="space-y-2 max-w-xl">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-[10px] sm:text-xs font-bold tracking-wider uppercase text-indigo-200">
                                                    {role === 'admin' ? (currentUser?.isSuperAdmin ? 'Super Administrator' : 'Administrator Sekolah') : (currentUser?.teacherType === 'guru_kelas' ? 'Guru Kelas (Wali)' : 'Guru Mata Pelajaran')}
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] sm:text-xs font-semibold text-slate-200">
                                                    TP {activeAcademicYear} • Semester {activeSemester}
                                                </span>
                                            </div>
                                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                                                Halo, {currentUser?.name || 'Edukator'} 👋
                                            </h2>
                                            <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
                                                Selamat datang di Dashboard Kontrol e-Quest. Pantau kesiapan bank soal TKA, administrasi ujian, dan perkembangan asesmen murid secara real-time.
                                            </p>
                                            <div className="p-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl inline-block mt-2">
                                                <p className="italic text-[11px] sm:text-xs font-medium text-indigo-100">"{quote}"</p>
                                            </div>
                                        </div>

                                        {/* Status System Badges */}
                                        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full sm:w-auto">
                                            <div className="bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-2 rounded-2xl flex items-center gap-2.5 backdrop-blur-sm">
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                                                </span>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">Cloud Firestore</p>
                                                    <p className="text-xs font-bold text-white">Sinkronisasi Real-Time</p>
                                                </div>
                                            </div>
                                            <div className="bg-white/10 border border-white/15 px-3.5 py-2 rounded-2xl flex items-center gap-2.5 backdrop-blur-sm">
                                                <Smartphone size={16} className="text-indigo-300 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-300">PWA Mobile Standar</p>
                                                    <p className="text-xs font-bold text-white">{getActiveSchool()?.name || 'e-Quest MfyTech'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 6 METRIC STATS CARDS (RESPONSIVE GRID) */}
                                <div>
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h3 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                                            <Activity size={18} className="text-indigo-600" />
                                            <span>Statistik Utama Sistem</span>
                                        </h3>
                                        <span className="text-[11px] font-bold text-slate-400">Pembaruan Langsung</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                                        
                                        {/* Murid */}
                                        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                                                    <Users size={18} />
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Siswa</span>
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{totalStudents}</p>
                                            <p className="text-[10px] font-semibold text-slate-400 mt-1">{myClasses.length} Rombel Kelas</p>
                                        </div>

                                        {/* Guru */}
                                        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                                                    <UserCog size={18} />
                                                </div>
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Guru</span>
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{teachers.filter(t => (t.schoolId || 'sdn2palapi') === getActiveSchoolId()).length}</p>
                                            <p className="text-[10px] font-semibold text-slate-400 mt-1">Edukator Sekolah Ini</p>
                                        </div>

                                        {/* Bank Soal */}
                                        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="w-9 h-9 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                                                    <FileText size={18} />
                                                </div>
                                                <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-full">Bank Soal</span>
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{totalQuestions}</p>
                                            <p className="text-[10px] font-semibold text-slate-400 mt-1">Butir Soal Tersusun</p>
                                        </div>

                                        {/* Stimulus TKA */}
                                        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                                                    <BookOpen size={18} />
                                                </div>
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">TKA Stimulus</span>
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{getMyStimuli().length}</p>
                                            <p className="text-[10px] font-semibold text-slate-400 mt-1">Wacana, Tabel & Gbr</p>
                                        </div>

                                        {/* Mapel */}
                                        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                                                    <Layers size={18} />
                                                </div>
                                                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Mapel</span>
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{mySubjects.length}</p>
                                            <p className="text-[10px] font-semibold text-slate-400 mt-1">Mata Pelajaran Aktif</p>
                                        </div>

                                        {/* Sesi Ujian LIVE */}
                                        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-md shadow-emerald-600/15 border border-emerald-500 flex flex-col justify-between hover:shadow-lg transition-all group relative overflow-hidden">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                                                    <MonitorPlay size={18} />
                                                </div>
                                                <span className="text-[10px] font-extrabold text-white bg-black/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse"></span>
                                                    LIVE
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-2xl sm:text-3xl font-black tracking-tight">
                                                    {activeExams.filter(e => (e.schoolId || 'sdn2palapi') === getActiveSchoolId()).length}
                                                </p>
                                                <span className="text-[10px] text-emerald-100 font-bold">Sesi Aktif</span>
                                            </div>
                                            <p className="text-[10px] text-emerald-100 font-semibold mt-1">Token & Pengawasan</p>
                                        </div>

                                    </div>
                                </div>

                                {/* DUA KOLOM ANALISIS: DISTRIBUSI KOGNITIF & FORMAT BENTUK SOAL */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                                    
                                    {/* KARTU KIRI: SEBARAN TINGKAT KOGNITIF (HOTS / MOTS / LOTS) */}
                                    <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                                        <BrainCircuit size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-extrabold text-sm sm:text-base text-slate-800">Distribusi Kognitif TKA</h4>
                                                        <p className="text-[11px] text-slate-500 font-medium">Standar Literasi & Numerasi Berpikir Kritis</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
                                                    {totalQuestions} Butir Soal
                                                </span>
                                            </div>

                                            {/* Progress Bar Segmented */}
                                            <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 flex overflow-hidden mb-5">
                                                <div style={{ width: `${hotsPct}%` }} className="bg-rose-500 h-full rounded-l-full transition-all duration-500" title={`HOTS: ${hotsPct}%`}></div>
                                                <div style={{ width: `${motsPct}%` }} className="bg-amber-400 h-full transition-all duration-500" title={`MOTS: ${motsPct}%`}></div>
                                                <div style={{ width: `${lotsPct}%` }} className="bg-emerald-500 h-full rounded-r-full transition-all duration-500" title={`LOTS: ${lotsPct}%`}></div>
                                            </div>

                                            {/* 3 Metric Cards */}
                                            <div className="grid grid-cols-3 gap-3 text-center">
                                                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/70">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block">HOTS</span>
                                                    <span className="text-xl sm:text-2xl font-black text-rose-800 my-0.5 block">{hotsCount}</span>
                                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full inline-block">{hotsPct}%</span>
                                                    <p className="text-[9px] text-slate-500 mt-1 hidden sm:block">Penalaran Tinggi</p>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">MOTS</span>
                                                    <span className="text-xl sm:text-2xl font-black text-amber-800 my-0.5 block">{motsCount}</span>
                                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full inline-block">{motsPct}%</span>
                                                    <p className="text-[9px] text-slate-500 mt-1 hidden sm:block">Aplikasi Konsep</p>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">LOTS</span>
                                                    <span className="text-xl sm:text-2xl font-black text-emerald-800 my-0.5 block">{lotsCount}</span>
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">{lotsPct}%</span>
                                                    <p className="text-[9px] text-slate-500 mt-1 hidden sm:block">Pemahaman Dasar</p>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-[10.5px] text-slate-400 font-medium mt-4 pt-3 border-t border-slate-100 text-center">
                                            Klasifikasi kognitif dideteksi otomatis oleh modul Google Gemini AI Parser.
                                        </p>
                                    </div>

                                    {/* KARTU KANAN: 6 FORMAT BENTUK SOAL TKA */}
                                    <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                                        <Target size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-extrabold text-sm sm:text-base text-slate-800">6 Format Bentuk Soal TKA</h4>
                                                        <p className="text-[11px] text-slate-500 font-medium">Variasi Asesmen Kurikulum Merdeka</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setAdminMenu('questions')}
                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                                                >
                                                    Buka Bank Soal &rarr;
                                                </button>
                                            </div>

                                            {/* Grid 6 Format */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500">Pilihan Ganda</p>
                                                        <p className="text-base font-black text-slate-800">{qSingle}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">PG</span>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500">PG Kompleks</p>
                                                        <p className="text-base font-black text-slate-800">{qMultiple}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 px-1.5 py-0.5 rounded">Multi</span>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500">Benar / Salah</p>
                                                        <p className="text-base font-black text-slate-800">{qBoolean}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">B/S</span>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500">Menjodohkan</p>
                                                        <p className="text-base font-black text-slate-800">{qMatching}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Match</span>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500">Isian Singkat</p>
                                                        <p className="text-base font-black text-slate-800">{qShort}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Isian</span>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500">Uraian / Esai</p>
                                                        <p className="text-base font-black text-slate-800">{qEssay}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Esai</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rekap Nilai Asesmen Terkini */}
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Award size={16} className="text-amber-500" />
                                                <span className="text-xs font-semibold text-slate-600">Rata-rata Skor Terkini:</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                                                {avgScore} <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                                            </span>
                                        </div>
                                    </div>

                                </div>

                                {/* PUSAT AKSI CEPAT (QUICK SHORTCUTS - 1 TAP) */}
                                <div>
                                    <h3 className="font-extrabold text-sm sm:text-base text-slate-800 mb-3 flex items-center gap-2 px-1">
                                        <Zap size={18} className="text-amber-500" />
                                        <span>Pusat Aksi Cepat & Navigasi</span>
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                        <button
                                            onClick={() => { setAiStep(1); setAiWizardOpen(true); }}
                                            className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-200/80 hover:border-purple-400 text-left transition-all hover:-translate-y-0.5 cursor-pointer shadow-2xs group"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                                                <BrainCircuit size={17} />
                                            </div>
                                            <p className="font-bold text-xs text-purple-900 leading-tight">Buat Soal AI</p>
                                            <p className="text-[10px] text-purple-700/80 mt-0.5">Wizard Otomatis</p>
                                        </button>

                                        <button
                                            onClick={() => openModal('stimulus')}
                                            className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 hover:border-amber-400 text-left transition-all hover:-translate-y-0.5 cursor-pointer shadow-2xs group"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                                                <BookOpen size={17} />
                                            </div>
                                            <p className="font-bold text-xs text-amber-900 leading-tight">Tambah Stimulus</p>
                                            <p className="text-[10px] text-amber-700/80 mt-0.5">Teks, Tabel & Gbr</p>
                                        </button>

                                        <button
                                            onClick={() => setAdminMenu('questions')}
                                            className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 hover:border-indigo-400 text-left transition-all hover:-translate-y-0.5 cursor-pointer shadow-2xs group"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                                                <FileText size={17} />
                                            </div>
                                            <p className="font-bold text-xs text-indigo-900 leading-tight">Bank Soal</p>
                                            <p className="text-[10px] text-indigo-700/80 mt-0.5">Kelola Kisi-kisi</p>
                                        </button>

                                        {role === 'admin' && (
                                            <button
                                                onClick={() => setAdminMenu('token')}
                                                className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/80 hover:border-rose-400 text-left transition-all hover:-translate-y-0.5 cursor-pointer shadow-2xs group"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                                                    <MonitorPlay size={17} />
                                                </div>
                                                <p className="font-bold text-xs text-rose-900 leading-tight">Pusat Ujian LIVE</p>
                                                <p className="text-[10px] text-rose-700/80 mt-0.5">Rilis Token Ujian</p>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setAdminMenu('students')}
                                            className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-200/80 hover:border-sky-400 text-left transition-all hover:-translate-y-0.5 cursor-pointer shadow-2xs group"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                                                <Users size={17} />
                                            </div>
                                            <p className="font-bold text-xs text-sky-900 leading-tight">Data Murid</p>
                                            <p className="text-[10px] text-sky-700/80 mt-0.5">Daftar Akun Siswa</p>
                                        </button>

                                        <button
                                            onClick={() => setAdminMenu('analysis')}
                                            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 hover:border-emerald-400 text-left transition-all hover:-translate-y-0.5 cursor-pointer shadow-2xs group"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                                                <BarChart2 size={17} />
                                            </div>
                                            <p className="font-bold text-xs text-emerald-900 leading-tight">Analisis Nilai</p>
                                            <p className="text-[10px] text-emerald-700/80 mt-0.5">Rapor & Hasil CBT</p>
                                        </button>
                                    </div>
                                </div>

                                {/* RINGKASAN ROMBONGAN BELAJAR / KELAS */}
                                <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5">
                                        <div>
                                            <h4 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                                                <Layers size={18} className="text-indigo-600" />
                                                <span>Rombongan Belajar (Kelas)</span>
                                            </h4>
                                            <p className="text-xs text-slate-500 font-medium">Distribusi siswa dan alokasi bank soal per rombel aktif</p>
                                        </div>
                                        <button
                                            onClick={() => setAdminMenu('classes')}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                                        >
                                            Kelola Semua Kelas &rarr;
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                        {myClasses.slice(0, 6).map(c => {
                                            const sCount = myStudents.filter(s => s.class === c.name).length;
                                            const subCount = mySubjects.filter(s => s.class === c.name).length;
                                            return (
                                                <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:bg-white hover:border-indigo-300 transition-all">
                                                    <div>
                                                        <span className="font-extrabold text-sm text-slate-900 block">{c.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tingkat {c.level} • TP {c.academicYear || activeAcademicYear}</span>
                                                        <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold">
                                                            <span className="text-indigo-600 font-bold">{sCount} Siswa</span>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="text-slate-600">{subCount} Mapel</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => { setStudentFilterClass(c.name); setAdminMenu('students'); }}
                                                        className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-indigo-600 font-bold text-xs shadow-2xs transition-colors shrink-0 cursor-pointer"
                                                    >
                                                        Lihat
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>
                        );
                    })()}

                    {/* TEACHERS DATA (ADMIN) - MOBILE FIRST & CARD VIEW */}
                    {adminMenu === 'teachers' && role === 'admin' && (
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-7 md:p-8 animate-fade-in max-w-6xl mx-auto space-y-6">
                            
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900">Manajemen Akun Guru</h3>
                                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-0.5 rounded-full text-xs">
                                            {filteredTeachersList.length} Edukator
                                        </span>
                                        <span className="text-[10px] sm:text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                                            <Building size={12} className="text-indigo-600" />
                                            {currentUser?.isSuperAdmin && teacherSchoolFilter === 'all' ? 'Semua Unit Sekolah' : getActiveSchool().name}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 font-medium text-xs">
                                        Atur hak akses Guru Kelas (Wali Kelas) atau Guru Mapel (Multi-Kelas) secara fleksibel.
                                    </p>
                                </div>
                                <button
                                    onClick={() => openModal('teacher')}
                                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                                >
                                    <Plus size={17} />
                                    <span>Tambah Guru Baru</span>
                                </button>
                            </div>

                            {/* Search & Filter Bar */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/90">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        value={teacherSearch}
                                        onChange={e => setTeacherSearch(e.target.value)}
                                        placeholder="Cari nama guru atau username..."
                                        className="w-full pl-10 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 shadow-2xs"
                                    />
                                </div>
                                {currentUser?.isSuperAdmin && schools.length > 1 && (
                                    <select
                                        value={teacherSchoolFilter}
                                        onChange={e => setTeacherSchoolFilter(e.target.value)}
                                        className="p-2 bg-white rounded-xl border border-indigo-200 text-xs font-bold text-indigo-900 outline-none shadow-2xs"
                                    >
                                        <option value="current">Unit Aktif: {getActiveSchool().name}</option>
                                        <option value="all">Semua Sekolah ({teachers.length} Guru)</option>
                                        {schools.map(sc => (
                                            <option key={sc.id} value={sc.id}>{sc.name}</option>
                                        ))}
                                    </select>
                                )}
                                <select
                                    value={teacherTypeFilter}
                                    onChange={e => setTeacherTypeFilter(e.target.value)}
                                    className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none shadow-2xs"
                                >
                                    <option value="all">Semua Tipe Guru</option>
                                    <option value="guru_kelas">Guru Kelas (Wali)</option>
                                    <option value="guru_mapel">Guru Mapel</option>
                                </select>
                            </div>

                            {/* Empty state */}
                            {filteredTeachersList.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-4">
                                    <UserCog size={40} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-base font-bold text-slate-700">
                                        Belum ada akun guru di {currentUser?.isSuperAdmin && teacherSchoolFilter === 'all' ? 'semua sekolah' : getActiveSchool().name}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                        {currentUser?.isSuperAdmin && teacherSchoolFilter === 'current'
                                            ? 'Unit sekolah aktif saat ini belum memiliki akun guru. Anda dapat beralih ke "Semua Sekolah" pada filter di atas, atau klik "Tambah Guru Baru" untuk mendaftarkan akun di sekolah ini.'
                                            : 'Klik tombol "Tambah Guru Baru" di atas untuk mendaftarkan akun wali kelas atau guru mata pelajaran.'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* MOBILE CARD VIEW (Phones < md) */}
                                    <div className="grid grid-cols-1 gap-3.5 md:hidden">
                                        {filteredTeachersList.map(t => {
                                            const isGuruKelas = t.teacherType === 'guru_kelas' || (!t.teacherType && t.assignedClass && !t.subjectName);
                                            const assignedClassDisplay = t.assignedClass || (Array.isArray(t.assignedClasses) ? t.assignedClasses[0] : null);
                                            const classesArray = Array.isArray(t.assignedClasses) && t.assignedClasses.length > 0
                                                ? t.assignedClasses
                                                : (assignedClassDisplay ? [assignedClassDisplay] : []);

                                            return (
                                                <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-xs ${isGuruKelas ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'}`}>
                                                                {t.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{t.name}</h4>
                                                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                                    <span className="text-[10px] text-slate-400 font-mono">ID: #{t.id}</span>
                                                                    <span className="text-[9.5px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                                                        <Building size={9} className="text-indigo-600" />
                                                                        {getSchoolName(t.schoolId)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isGuruKelas ? (
                                                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                                                                <School size={11} /> Wali Kelas
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                                                                <BookOpen size={11} /> Guru Mapel
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1.5">
                                                        {isGuruKelas ? (
                                                            <div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wewenang Wali Kelas</span>
                                                                <span className="font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded border border-indigo-200 text-xs inline-block mt-0.5">
                                                                    {assignedClassDisplay || 'Belum diatur'}
                                                                </span>
                                                                <p className="text-[10px] text-slate-500 mt-1">Akses: Semua mapel di kelas binaan ini</p>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wewenang Mapel ({t.subjectName || 'Umum'})</span>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {classesArray.map(c => (
                                                                        <span key={c} className="bg-white text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                                                                            {c}
                                                                        </span>
                                                                    ))}
                                                                    {classesArray.length === 0 && <span className="text-slate-400 italic text-[11px]">Belum ada kelas ampu</span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between pt-1">
                                                        <div className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-mono">
                                                            <span className="text-slate-400 text-[10px] mr-1.5">User:</span>
                                                            <strong className="text-indigo-600">{t.username}</strong>
                                                            <span className="text-slate-300 mx-1.5">•</span>
                                                            <span className="text-slate-400 text-[10px] mr-1.5">Pass:</span>
                                                            <strong className="text-slate-600">{t.password}</strong>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleResetUserPassword('teacher', t.id, t.name)}
                                                                className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors font-bold text-xs flex items-center gap-1 cursor-pointer"
                                                                title="Reset Kata Sandi Guru"
                                                            >
                                                                <Key size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => openModal('teacher', t)}
                                                                className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-bold text-xs flex items-center gap-1 cursor-pointer"
                                                                title="Edit"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => initiateDelete('teacher', t.id)}
                                                                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors font-bold text-xs flex items-center gap-1 cursor-pointer"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* DESKTOP TABLE VIEW (md and up) */}
                                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
                                        <table className="w-full text-left bg-white">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="p-4 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider">Nama Guru & Gelar</th>
                                                    <th className="p-4 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider">Peran & Tipe</th>
                                                    <th className="p-4 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider">Wewenang Kelas & Mapel</th>
                                                    <th className="p-4 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider">Akun Akses</th>
                                                    <th className="p-4 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredTeachersList.map(t => {
                                                    const isGuruKelas = t.teacherType === 'guru_kelas' || (!t.teacherType && t.assignedClass && !t.subjectName);
                                                    const assignedClassDisplay = t.assignedClass || (Array.isArray(t.assignedClasses) ? t.assignedClasses[0] : null);
                                                    const classesArray = Array.isArray(t.assignedClasses) && t.assignedClasses.length > 0
                                                        ? t.assignedClasses
                                                        : (assignedClassDisplay ? [assignedClassDisplay] : []);

                                                    return (
                                                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="p-4 font-semibold text-slate-800 text-sm">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${isGuruKelas ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100'}`}>
                                                                        {t.name.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <span className="block font-bold text-slate-900">{t.name}</span>
                                                                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                                            <span className="text-[10px] text-slate-400 font-mono">ID: #{t.id}</span>
                                                                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                                                                <Building size={10} className="text-indigo-600" />
                                                                                {getSchoolName(t.schoolId)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                {isGuruKelas ? (
                                                                    <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-xl text-xs font-bold">
                                                                        <School size={13} /> Guru Kelas (Wali)
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 px-2.5 py-1 rounded-xl text-xs font-bold">
                                                                        <BookOpen size={13} /> Guru Mapel
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                {isGuruKelas ? (
                                                                    <div>
                                                                        <span className="font-bold text-xs text-indigo-800 bg-indigo-100/70 px-2 py-0.5 rounded-lg border border-indigo-200">
                                                                            Wali: {assignedClassDisplay || 'Belum diatur'}
                                                                        </span>
                                                                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                                                                            Akses: <strong>Semua Mapel</strong> di kelas ini
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <div className="flex items-center gap-1.5 mb-1">
                                                                            <span className="font-bold text-xs text-fuchsia-800 bg-fuchsia-100/70 px-2 py-0.5 rounded-lg border border-fuchsia-200">
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
                                                                    <button type="button" onClick={() => handleResetUserPassword('teacher', t.id, t.name)} className="bg-white border border-slate-200 text-amber-600 p-2 rounded-xl hover:bg-amber-50 transition-colors shadow-2xs cursor-pointer" title="Reset Kata Sandi Guru"><Key size={15} /></button>
                                                                    <button onClick={() => openModal('teacher', t)} className="bg-white border border-slate-200 text-blue-600 p-2 rounded-xl hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer" title="Edit Data Guru"><Edit size={15} /></button>
                                                                    <button onClick={() => initiateDelete('teacher', t.id)} className="bg-white border border-slate-200 text-rose-500 p-2 rounded-xl hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer" title="Hapus Guru"><Trash2 size={15} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* CLASSES DATA */}
                    {adminMenu === 'classes' && (role === 'admin' || role === 'guru') && (
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-7 md:p-8 animate-fade-in max-w-6xl mx-auto space-y-6">
                            
                            {/* Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900">
                                            {role === 'admin' ? 'Data Master Kelas' : 'Ruang Kelas yang Anda Ampu'}
                                        </h3>
                                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-0.5 rounded-full text-xs">
                                            {getMyClasses().length} Rombel
                                        </span>
                                        {role === 'guru' && (
                                            currentUser?.teacherType === 'guru_kelas' ? (
                                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <School size={12} /> Wali {currentUser.assignedClass || 'Kelas'}
                                                </span>
                                            ) : (
                                                <span className="bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <BookOpen size={12} /> Guru Mapel {currentUser?.subjectName}
                                                </span>
                                            )
                                        )}
                                    </div>
                                    <p className="text-slate-500 font-medium text-xs">
                                        {role === 'admin'
                                            ? 'Kelola ruang rombongan belajar sekolah, alokasi wali kelas, dan pembagian siswa.'
                                            : currentUser?.teacherType === 'guru_kelas'
                                                ? `Akses kelas binaan Anda: ${currentUser.assignedClass || 'Kelas'}. Anda dapat mengelola soal untuk seluruh mapel di kelas ini.`
                                                : `Akses multi-kelas untuk mapel ${currentUser?.subjectName || ''}. Anda dapat mengelola soal untuk setiap kelas ini.`}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                    {role === 'admin' && (
                                        <>
                                            <button
                                                onClick={() => setImportModalConfig({ isOpen: true, type: 'Data Kelas' })}
                                                className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                                            >
                                                <FileBox size={16} /> Import
                                            </button>
                                            <button
                                                onClick={() => openModal('class')}
                                                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                                            >
                                                <Plus size={16} /> Tambah Kelas
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Search & Filter Bar */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/90">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        value={classSearch}
                                        onChange={e => setClassSearch(e.target.value)}
                                        placeholder="Cari nama rombel kelas..."
                                        className="w-full pl-10 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 shadow-2xs"
                                    />
                                </div>
                                <select
                                    value={classYearFilter}
                                    onChange={e => setClassYearFilter(e.target.value)}
                                    className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none shadow-2xs"
                                >
                                    <option value="all">Semua Tahun Pelajaran</option>
                                    <option value="active">Tahun Aktif ({activeAcademicYear})</option>
                                    {availableClassYears.filter(y => y !== activeAcademicYear).map(y => (
                                        <option key={y} value={y}>Arsip TP {y}</option>
                                    ))}
                                </select>
                                <select
                                    value={classLevelFilter}
                                    onChange={e => setClassLevelFilter(e.target.value)}
                                    className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none shadow-2xs"
                                >
                                    <option value="all">Semua Tingkat</option>
                                    {[1, 2, 3, 4, 5, 6].map(lvl => (
                                        <option key={lvl} value={lvl}>Tingkat {lvl}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Classes Grid */}
                            {filteredClassesList.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <Layers size={40} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-base font-bold text-slate-500">Tidak ada kelas yang ditemukan</p>
                                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau ubah filter Tahun Pelajaran.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                    {filteredClassesList.map(i => {
                                        const studentCount = getMyStudents().filter(s => s.class === i.name).length;
                                        const subjectCount = getMySubjects().filter(s => s.class === i.name).length;
                                        const isArchived = i.academicYear && i.academicYear !== activeAcademicYear;
                                        return (
                                            <div key={i.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between group">
                                                {role === 'admin' && (
                                                    <div className="absolute top-4 right-4 flex gap-1 z-10">
                                                        <button
                                                            onClick={() => openModal('class', i)}
                                                            className="p-1.5 bg-slate-100 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                                            title="Edit Kelas"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => initiateDelete('class', i.id)}
                                                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                                            title="Hapus Kelas"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-3 mb-3.5">
                                                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                                            <Layers size={22} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-extrabold text-lg text-slate-900 leading-tight">{i.name}</h4>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="font-semibold text-slate-400 text-xs">Tingkat {i.level}</span>
                                                                <span className="text-slate-300">•</span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${!isArchived ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                                    TP {i.academicYear || activeAcademicYear}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 text-center">
                                                        <div>
                                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Murid Terdaftar</span>
                                                            <span className="font-extrabold text-slate-800 text-sm">{studentCount} Siswa</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mata Pelajaran</span>
                                                            <span className="font-extrabold text-indigo-600 text-sm">{subjectCount} Mapel</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2 border-t border-slate-100">
                                                    <button
                                                        onClick={() => { setStudentFilterClass(i.name); setAdminMenu('students'); }}
                                                        className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                                                    >
                                                        <Users size={14} /> Daftar Murid
                                                    </button>
                                                    <button
                                                        onClick={() => { setQuestionClassFilter(i.name); setAdminMenu('questions'); }}
                                                        className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
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
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-7 md:p-8 animate-fade-in max-w-6xl mx-auto space-y-6">
                            
                            {/* Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900">
                                            {role === 'admin' ? 'Database Murid' : 'Data Murid Binaan'}
                                        </h3>
                                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-0.5 rounded-full text-xs">
                                            Total: {filteredStudentsList.length} Siswa
                                        </span>
                                    </div>
                                    <p className="text-slate-500 font-medium text-xs">
                                        {role === 'admin' ? 'Database seluruh siswa sekolah peserta CBT & TKA.' : 'Daftar siswa yang berada pada kelas binaan Anda.'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                    {role === 'admin' && (
                                        <button
                                            onClick={() => setImportModalConfig({ isOpen: true, type: 'Data Murid' })}
                                            className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                                        >
                                            <FileBox size={16} /> Import
                                        </button>
                                    )}
                                    {(role === 'admin' || (role === 'guru' && currentUser?.teacherType === 'guru_kelas')) && (
                                        <button
                                            onClick={() => openModal('student')}
                                            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                                        >
                                            <Plus size={16} /> Tambah Murid
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Search & Filter Bar */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/90">
                                <select
                                    className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none shadow-2xs"
                                    value={studentFilterClass}
                                    onChange={e => setStudentFilterClass(e.target.value)}
                                >
                                    <option value="">{role === 'admin' ? 'Semua Kelas' : 'Seluruh Kelas Ampuan'}</option>
                                    {getMyClasses().map(c => {
                                        const count = getMyStudents().filter(s => s.class === c.name).length;
                                        return <option key={c.id} value={c.name}>{c.name} ({count} Siswa)</option>;
                                    })}
                                </select>
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        value={studentSearch}
                                        onChange={e => setStudentSearch(e.target.value)}
                                        placeholder="Cari nama murid atau NISN..."
                                        className="w-full pl-10 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 shadow-2xs"
                                    />
                                </div>
                            </div>

                            {/* Students List */}
                            {filteredStudentsList.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <Users size={40} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-base font-bold text-slate-500">Tidak ada murid ditemukan</p>
                                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau ubah pilihan kelas.</p>
                                </div>
                            ) : (
                                <>
                                    {/* MOBILE CARD VIEW (< md) */}
                                    <div className="grid grid-cols-1 gap-3 md:hidden">
                                        {filteredStudentsList.map(i => (
                                            <div key={i.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-sm shrink-0">
                                                            {i.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{i.name}</h4>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                                    NISN: {i.nisn || i.nis}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0">
                                                        {i.class}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                                                    <div className="font-mono text-slate-400 text-xs">
                                                        Pass: <span className="text-slate-700 font-bold">{i.password}</span>
                                                    </div>
                                                    {(role === 'admin' || (role === 'guru' && currentUser?.teacherType === 'guru_kelas')) && (
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleResetUserPassword('student', i.id, i.name)}
                                                                className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors font-bold text-xs cursor-pointer"
                                                                title="Reset Kata Sandi Murid"
                                                            >
                                                                <Key size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => openModal('student', i)}
                                                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-bold text-xs cursor-pointer"
                                                                title="Edit"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => initiateDelete('student', i.id)}
                                                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors font-bold text-xs cursor-pointer"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* DESKTOP TABLE VIEW (md and up) */}
                                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
                                        <table className="w-full text-left bg-white">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="p-4 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider">Nama Murid</th>
                                                    <th className="p-4 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider">Kelas</th>
                                                    <th className="p-4 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider">NISN</th>
                                                    <th className="p-4 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider">Password</th>
                                                    <th className="p-4 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredStudentsList.map(i => (
                                                    <tr key={i.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="p-4 font-semibold text-slate-800 text-sm">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                                                    {i.name.charAt(0)}
                                                                </div>
                                                                <span className="font-bold text-slate-900">{i.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold uppercase border border-slate-200">
                                                                {i.class}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 font-mono font-bold text-indigo-600 text-xs">
                                                            {i.nisn || i.nis}
                                                        </td>
                                                        <td className="p-4 font-mono text-slate-400 text-xs">
                                                            {i.password}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex gap-2 justify-center">
                                                                {(role === 'admin' || (role === 'guru' && currentUser?.teacherType === 'guru_kelas')) && (
                                                                    <>
                                                                        <button type="button" onClick={() => handleResetUserPassword('student', i.id, i.name)} className="bg-white border border-slate-200 text-amber-600 p-2 rounded-xl hover:bg-amber-50 transition-colors shadow-2xs cursor-pointer" title="Reset Kata Sandi Murid"><Key size={15} /></button>
                                                                        <button onClick={() => openModal('student', i)} className="bg-white border border-slate-200 text-blue-600 p-2 rounded-xl hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer" title="Edit Data Murid"><Edit size={15} /></button>
                                                                        <button onClick={() => initiateDelete('student', i.id)} className="bg-white border border-slate-200 text-rose-500 p-2 rounded-xl hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer" title="Hapus Murid"><Trash2 size={15} /></button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* SUBJECTS DATA */}
                    {adminMenu === 'subjects' && (
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-7 md:p-8 animate-fade-in max-w-6xl mx-auto space-y-6">
                            
                            {/* Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900">
                                            {role === 'admin' ? 'Semua Mata Pelajaran' : (currentUser?.teacherType === 'guru_kelas' ? `Mata Pelajaran ${currentUser.assignedClass || ''} (Kelas Binaan)` : `Mata Pelajaran ${currentUser?.subjectName || ''} (Multi-Kelas)`)}
                                        </h3>
                                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-0.5 rounded-full text-xs">
                                            {filteredSubjectsList.length} Mapel
                                        </span>
                                    </div>
                                    <p className="text-slate-500 font-medium text-xs">
                                        {role === 'admin'
                                            ? 'Daftar mata pelajaran yang terdaftar di sekolah dan dialokasikan ke masing-masing rombel.'
                                            : currentUser?.teacherType === 'guru_kelas'
                                                ? `Sebagai Guru Kelas, Anda berwenang membuat dan mengelola soal seluruh mata pelajaran di ${currentUser.assignedClass || 'kelas ini'}.`
                                                : `Sebagai Guru Mapel, Anda berwenang membuat dan mengelola soal ${currentUser?.subjectName || ''} di setiap kelas yang Anda ampu.`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => openModal('subject')}
                                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                                >
                                    <Plus size={16} /> Mapel Baru
                                </button>
                            </div>

                            {/* Filter Bar Mata Pelajaran */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/90">
                                <select
                                    value={subjectYearFilter}
                                    onChange={e => setSubjectYearFilter(e.target.value)}
                                    className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none shadow-2xs"
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
                                    className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none shadow-2xs"
                                >
                                    <option value="all">Semua Kelas</option>
                                    {getMyClasses().map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        value={subjectSearch}
                                        onChange={e => setSubjectSearch(e.target.value)}
                                        placeholder="Cari mata pelajaran atau kode..."
                                        className="w-full pl-10 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 shadow-2xs"
                                    />
                                </div>
                            </div>

                            {/* Subjects Grid */}
                            {filteredSubjectsList.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <BookOpen size={40} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-base font-bold text-slate-500">Tidak ada mata pelajaran ditemukan</p>
                                    <p className="text-xs text-slate-400 mt-1">Sesuaikan filter atau klik tombol "+ Mapel Baru" untuk menambahkan.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                    {filteredSubjectsList.map(i => {
                                        const isArchived = i.academicYear && i.academicYear !== activeAcademicYear;
                                        const qCount = getMyQuestions().filter(q => q.subjectId === i.id).length;
                                        return (
                                            <div key={i.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between group">
                                                {(role === 'admin' || (role === 'guru' && (i.teacherId === currentUser.id || currentUser?.teacherType === 'guru_kelas'))) && (
                                                    <div className="absolute top-4 right-4 flex gap-1 z-10">
                                                        <button
                                                            onClick={() => openModal('subject', i)}
                                                            className="p-1.5 bg-slate-100 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                                            title="Edit Mapel"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => initiateDelete('subject', i.id)}
                                                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                                            title="Hapus Mapel"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                                                        <BookOpen size={22} />
                                                    </div>
                                                    <h4 className="font-extrabold text-lg text-slate-900 mb-1 leading-snug">{i.name}</h4>
                                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-slate-200">{i.class}</span>
                                                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono">{i.code}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${!isArchived ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                            TP {i.academicYear || activeAcademicYear}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pengampu</p>
                                                        <p className="font-bold text-slate-800 text-xs truncate max-w-[120px] sm:max-w-[140px]">
                                                            {getMyTeachers().find(t => t.id === i.teacherId)?.name || 'Admin'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => { setSelectedSubjectForQuestions(i); setAdminMenu('questions'); }}
                                                        className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                                                    >
                                                        <span>Bank Soal ({qCount})</span>
                                                        <ChevronRight size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* BANK SOAL (QUESTIONS) - MOBILE FIRST & STANDAR TKA */}
                    {adminMenu === 'questions' && (
                        !selectedSubjectForQuestions ? (
                            <div className="animate-fade-in max-w-6xl mx-auto space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-5 gap-4">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Bank Soal Terpadu</h2>
                                            <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5">
                                                <Calendar size={13} /> Sem. {activeSemester} ({activeAcademicYear})
                                            </span>
                                        </div>
                                        <p className="text-slate-500 font-medium text-xs">Pilih mata pelajaran untuk menyusun stimulus TKA, soal, dan kisi-kisi asesmen.</p>
                                    </div>
                                    <button
                                        onClick={() => { setAiStep(1); setAiWizardOpen(true); }}
                                        className="w-full sm:w-auto bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex gap-2 items-center justify-center shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer active:scale-95"
                                    >
                                        <BrainCircuit size={17} /> AI Wizard Generator
                                    </button>
                                </div>

                                {/* Filter Bar Bank Soal */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
                                    <select
                                        value={questionYearFilter}
                                        onChange={e => setQuestionYearFilter(e.target.value)}
                                        className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none shadow-2xs"
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
                                        className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none shadow-2xs"
                                    >
                                        <option value="all">Semua Kelas</option>
                                        {getMyClasses().map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            value={questionSearchSubj}
                                            onChange={e => setQuestionSearchSubj(e.target.value)}
                                            placeholder="Cari mata pelajaran atau kode..."
                                            className="w-full pl-10 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 shadow-2xs"
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                        {filteredBankSubjects.map((s, idx) => {
                                            const qCountActive = getMyQuestions().filter(q => q.subjectId === s.id && (!q.semester || q.semester.toLowerCase() === activeSemester.toLowerCase())).length;
                                            const qCountTotal = getMyQuestions().filter(q => q.subjectId === s.id).length;
                                            const colors = [
                                                'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/20',
                                                'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-500/20',
                                                'bg-gradient-to-br from-rose-600 to-pink-700 text-white shadow-rose-500/20',
                                                'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-purple-500/20'
                                            ];
                                            const colorClass = colors[idx % colors.length];

                                            return (
                                                <div
                                                    key={s.id}
                                                    onClick={() => setSelectedSubjectForQuestions(s)}
                                                    className={`${colorClass} p-5 sm:p-6 rounded-3xl shadow-md text-left group transition-all hover:-translate-y-1 cursor-pointer relative overflow-hidden border border-white/15`}
                                                >
                                                    <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                                                        <Layers size={130} strokeWidth={1} />
                                                    </div>
                                                    <div className="bg-white/20 p-3 rounded-2xl w-fit mb-4 backdrop-blur-sm border border-white/30 shadow-xs">
                                                        <FileText size={22} className="text-white" />
                                                    </div>
                                                    <h3 className="font-extrabold text-xl mb-1.5 drop-shadow-xs relative z-10">{s.name}</h3>
                                                    <div className="flex flex-wrap gap-1.5 mb-5 relative z-10">
                                                        <span className="bg-black/20 backdrop-blur-sm px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border border-white/10">{s.class}</span>
                                                        <span className="bg-black/20 backdrop-blur-sm px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border border-white/10 font-mono">{s.code}</span>
                                                        <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider border border-white/20">TP {s.academicYear || activeAcademicYear}</span>
                                                    </div>
                                                    <div className="bg-white text-slate-800 rounded-xl p-3 text-xs font-bold flex items-center justify-between relative z-10 shadow-sm">
                                                        <span className="text-slate-600">Soal Sem. {activeSemester}</span>
                                                        <span className="bg-indigo-50 px-2.5 py-1 rounded-lg text-indigo-700 font-extrabold border border-indigo-100">{qCountActive} / {qCountTotal} Butir</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-7 md:p-8 animate-fade-in max-w-6xl mx-auto space-y-6">
                                
                                {/* Header Subject Terpilih */}
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-5">
                                    <div>
                                        <button
                                            onClick={() => setSelectedSubjectForQuestions(null)}
                                            className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 mb-2 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors w-fit cursor-pointer"
                                        >
                                            <ArrowLeft size={14} /> Kembali ke Daftar Mapel
                                        </button>
                                        <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900">{selectedSubjectForQuestions.name}</h3>
                                        <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">
                                            Area Kerja Kelas <strong>{selectedSubjectForQuestions.class}</strong> • Pelaksanaan: <span className="font-bold text-indigo-600">Semester {activeSemester} ({activeAcademicYear})</span>
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                        <button
                                            onClick={() => { setPrintData({ type: 'kisi-kisi', class: selectedSubjectForQuestions.class, subjectName: selectedSubjectForQuestions.name, teacherName: currentUser.name, questions: getMyQuestions().filter(q => q.subjectId === selectedSubjectForQuestions.id && (questionSemesterFilter === 'all' || (q.semester || activeSemester).toLowerCase() === (questionSemesterFilter === 'active' ? activeSemester : questionSemesterFilter).toLowerCase())) }) }}
                                            className="flex-1 sm:flex-none bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                                        >
                                            <FileSpreadsheet size={15} /> Kisi-kisi
                                        </button>
                                        {getMyQuestions().filter(q => q.subjectId === selectedSubjectForQuestions.id).length > 0 && (
                                            <button
                                                onClick={() => initiateDelete('clear_subject', selectedSubjectForQuestions.id)}
                                                className="bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                                            >
                                                <Trash2 size={15} /> Kosongkan
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setImportModalConfig({ isOpen: true, type: 'Bank Soal' }) }}
                                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                                        >
                                            <FileWord size={15} /> Import Berkas
                                        </button>
                                        <button
                                            onClick={() => openModal('stimulus', { subjectId: selectedSubjectForQuestions.id })}
                                            className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                                        >
                                            <Plus size={15} /> Tambah Stimulus
                                        </button>
                                        <button
                                            onClick={() => openModal('question', { subjectId: selectedSubjectForQuestions.id })}
                                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                                        >
                                            <Plus size={15} /> Soal Manual
                                        </button>
                                    </div>
                                </div>

                                {/* TAB NAVIGATOR: DAFTAR SOAL vs DAFTAR STIMULUS */}
                                <div className="flex border-b border-slate-200 gap-4 sm:gap-6">
                                    <button
                                        type="button"
                                        onClick={() => setBankSubjectTab('questions')}
                                        className={`pb-3 font-extrabold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${bankSubjectTab === 'questions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                    >
                                        <FileText size={17} />
                                        <span>Daftar Soal</span>
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {getMyQuestions().filter(q => q.subjectId === selectedSubjectForQuestions.id).length}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBankSubjectTab('stimuli')}
                                        className={`pb-3 font-extrabold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${bankSubjectTab === 'stimuli' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                    >
                                        <BookOpen size={17} />
                                        <span>Daftar Stimulus</span>
                                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {getMyStimuli().filter(s => !s.subjectId || s.subjectId === selectedSubjectForQuestions.id).length}
                                        </span>
                                    </button>
                                </div>

                                {bankSubjectTab === 'questions' && (
                                    <>
                                        {/* Filter Semester Soal Bar */}
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/90">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Filter size={14} className="text-indigo-600" /> Filter:</span>
                                                <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-2xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuestionSemesterFilter('active')}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${questionSemesterFilter === 'active' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-indigo-600'}`}
                                                    >
                                                        Sem. Aktif ({activeSemester})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuestionSemesterFilter('Ganjil')}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${questionSemesterFilter === 'Ganjil' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-indigo-600'}`}
                                                    >
                                                        Ganjil
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuestionSemesterFilter('Genap')}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${questionSemesterFilter === 'Genap' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-indigo-600'}`}
                                                    >
                                                        Genap
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuestionSemesterFilter('all')}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${questionSemesterFilter === 'all' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-indigo-600'}`}
                                                    >
                                                        Semua
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-xs font-semibold text-slate-500">
                                                Menampilkan: <span className="font-extrabold text-indigo-700">{
                                                    getMyQuestions().filter(q => {
                                                        if (q.subjectId !== selectedSubjectForQuestions.id) return false;
                                                        if (questionSemesterFilter === 'all') return true;
                                                        const targetFilter = questionSemesterFilter === 'active' ? activeSemester : questionSemesterFilter;
                                                        return (q.semester || activeSemester).toLowerCase() === targetFilter.toLowerCase();
                                                    }).length
                                                }</span> butir soal
                                            </div>
                                        </div>

                                        {getMyQuestions().filter(q => {
                                            if (q.subjectId !== selectedSubjectForQuestions.id) return false;
                                            if (questionSemesterFilter === 'all') return true;
                                            const targetFilter = questionSemesterFilter === 'active' ? activeSemester : questionSemesterFilter;
                                            return (q.semester || activeSemester).toLowerCase() === targetFilter.toLowerCase();
                                        }).length === 0 ? (
                                            <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                                <FileText size={48} className="mx-auto text-slate-300 mb-3" />
                                                <p className="text-lg font-bold text-slate-600">Belum Ada Soal</p>
                                                <p className="text-xs font-medium text-slate-400 mt-1">Tidak ada soal yang cocok dengan filter semester ini. Mulai tambahkan soal atau ubah filter.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4 sm:gap-5">
                                                {getMyQuestions().filter(q => {
                                                    if (q.subjectId !== selectedSubjectForQuestions.id) return false;
                                                    if (questionSemesterFilter === 'all') return true;
                                                    const targetFilter = questionSemesterFilter === 'active' ? activeSemester : questionSemesterFilter;
                                                    return (q.semester || activeSemester).toLowerCase() === targetFilter.toLowerCase();
                                                }).map((q, i) => (
                                                    <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all relative flex flex-col md:flex-row gap-4 sm:gap-5">
                                                        
                                                        {/* Metadata Strip */}
                                                        <div className="md:w-1/4 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start flex-wrap gap-2 md:gap-3 md:pr-4 md:border-r border-slate-100">
                                                            <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 text-indigo-700 font-black rounded-xl flex items-center justify-center text-xs">
                                                                {i + 1}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                                                                    {q.type}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">Sem. {q.semester || activeSemester}</span>
                                                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">TP {q.academicYear || activeAcademicYear}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-bold text-[10px] px-2 py-0.5 rounded uppercase ${q.difficulty === 'HOTS' ? 'bg-rose-100 text-rose-700' : q.difficulty === 'MOTS' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                    {q.difficulty || 'MOTS'}
                                                                </span>
                                                                <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                                                    {q.weight || 10} Poin
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Question Narrative & Options */}
                                                        <div className="flex-1 space-y-3">
                                                            {q.indicator && (
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">Indikator Soal</p>
                                                                    <p className="text-xs font-medium text-slate-600 italic bg-indigo-50/60 p-2 rounded-xl border border-indigo-100/80">{q.indicator}</p>
                                                                </div>
                                                            )}
                                                            {(() => {
                                                                const sObj = stimuli.find(s => s.id === q.stimulusId);
                                                                if (!sObj) return null;
                                                                return (
                                                                    <div className="flex items-center gap-2 bg-amber-50/90 border border-amber-200 px-3 py-1.5 rounded-xl w-fit">
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                                                                            <BookOpen size={12} /> Stimulus:
                                                                        </span>
                                                                        <span className="text-xs font-bold text-amber-950 truncate max-w-[200px] sm:max-w-xs">{sObj.title}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setActiveStimulusModal(sObj)}
                                                                            className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline ml-1 cursor-pointer"
                                                                        >
                                                                            Lihat
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })()}
                                                            <div>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pertanyaan Soal</p>
                                                                {q.image && (
                                                                    <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 max-w-xs bg-slate-50">
                                                                        <img src={q.image} alt="Stimulus" className="w-full h-auto object-cover max-h-48" />
                                                                    </div>
                                                                )}
                                                                <p className="font-semibold text-slate-900 text-sm leading-relaxed">{q.text}</p>
                                                                {(q.type === 'single' || q.type === 'multiple') && q.options && q.options.length > 0 && (
                                                                    <div className="mt-3.5 space-y-1.5">
                                                                        {q.options.map((opt, oIdx) => opt ? (
                                                                            <div key={oIdx} className="flex items-start gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                                                                                <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-600 font-black flex items-center justify-center shrink-0 text-[10px] shadow-2xs">
                                                                                    {String.fromCharCode(65 + oIdx)}
                                                                                </span>
                                                                                <span className="text-slate-700 font-medium leading-tight mt-0.5">{opt}</span>
                                                                            </div>
                                                                        ) : null)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Answer Key & Actions */}
                                                        <div className="md:w-1/4 flex flex-col justify-between pt-3 md:pt-0 border-t md:border-t-0 md:pl-4 md:border-l border-slate-100">
                                                            <div>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kunci Jawaban</p>
                                                                <div className="bg-emerald-50 border border-emerald-200/80 p-2.5 rounded-xl">
                                                                    {q.type === 'single' && !isNaN(q.correct) && <p className="font-extrabold text-emerald-800 text-base">{String.fromCharCode(65 + Number(q.correct))}</p>}
                                                                    {q.type === 'multiple' && <p className="font-extrabold text-emerald-800 text-sm">{String(q.correct).split(',').map(n => String.fromCharCode(65 + Number(n))).join(', ')}</p>}
                                                                    {q.type === 'boolean' && <p className="font-extrabold text-emerald-800 text-sm">{String(q.correct) === "0" ? "BENAR" : "SALAH"}</p>}
                                                                    {(q.type === 'short' || q.type === 'essay' || q.type === 'matching') && <p className="font-bold text-emerald-800 text-xs whitespace-pre-wrap">{q.correct}</p>}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 mt-4">
                                                                <button
                                                                    onClick={() => openModal('question', q)}
                                                                    className="flex-1 bg-white border border-slate-200 text-blue-600 py-2 rounded-xl hover:bg-blue-50 transition-colors font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                                                >
                                                                    <Edit size={14} /> Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => initiateDelete('question', q.id)}
                                                                    className="flex-1 bg-white border border-slate-200 text-rose-500 py-2 rounded-xl hover:bg-rose-50 transition-colors font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                                                >
                                                                    <Trash2 size={14} /> Hapus
                                                                </button>
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

                                {getMyStimuli().filter(s => !s.subjectId || s.subjectId === selectedSubjectForQuestions.id).length === 0 ? (
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
                                        {getMyStimuli().filter(s => !s.subjectId || s.subjectId === selectedSubjectForQuestions.id).map((stim) => {
                                            const linkedCount = getMyQuestions().filter(q => q.stimulusId === stim.id).length;
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
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-8 animate-fade-in space-y-6 sm:space-y-8 max-w-7xl mx-auto">
                            <div className="text-center mb-6 sm:mb-8 border-b border-slate-100 pb-5 sm:pb-6">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3"><BarChart2 size={24} /></div>
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">LAPORAN HASIL UJIAN</h2>
                                <p className="text-slate-500 font-semibold mt-1 uppercase tracking-widest text-[10px]">{currentActiveSchool.name} • Semester {activeSemester} ({activeAcademicYear})</p>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 mb-6">
                                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                                    <div className="relative flex-1"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><select className="w-full pl-10 pr-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-sm bg-white outline-none font-semibold text-slate-700 shadow-sm" value={analysisFilterClass} onChange={e => setAnalysisFilterClass(e.target.value)}><option value="">Seluruh Kelas</option>{getMyClasses().map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                                    <div className="relative flex-1"><BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><select className="w-full pl-10 pr-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-sm bg-white outline-none font-semibold text-slate-700 shadow-sm" value={analysisFilterSubject} onChange={e => setAnalysisFilterSubject(e.target.value)}><option value="">Seluruh Mata Pelajaran</option>{getMySubjects().map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handlePrintResults} className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl flex gap-1.5 items-center hover:bg-slate-50 font-semibold text-sm shadow-sm transition-colors"><Printer size={16} /> Print</button>
                                    <button onClick={handlePrintExcel} className="flex-1 sm:flex-none justify-center bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex gap-1.5 items-center hover:bg-emerald-700 font-semibold text-sm shadow-sm transition-colors"><Download size={16} /> Excel</button>
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

                    {/* ADMIN & GURU: COMMAND CENTER TOKEN */}
                    {adminMenu === 'token' && (role === 'admin' || role === 'guru') && (
                        <div className="bg-white p-5 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 text-center animate-fade-in max-w-4xl mx-auto relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6"><Power size={30} /></div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 sm:mb-3 tracking-tight">Pusat Kendali Ujian</h2>
                                <p className="text-slate-500 mb-6 sm:mb-8 max-w-xl mx-auto font-medium text-xs sm:text-sm leading-relaxed">Aktifkan sesi ujian secara terpusat. Tentukan <strong>Blueprint Kognitif</strong> agar sistem mengacak proporsi soal berdasarkan level kesulitannya.</p>

                                <form onSubmit={generateNewToken} className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 mx-auto text-left shadow-sm">
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Pilih Mata Pelajaran</label>
                                        <select className="w-full p-3.5 border border-slate-200 focus:border-rose-400 rounded-xl outline-none font-semibold text-slate-700 bg-white shadow-sm text-sm transition-all" value={examBlueprint.subjectId} onChange={(e) => setExamBlueprint({ ...examBlueprint, subjectId: e.target.value })} required><option value="">-- Sentuh untuk Memilih --</option>{getMySubjects().map(s => <option key={s.id} value={s.id}>{s.name} ({s.class}) - Oleh: {getMyTeachers().find(t => t.id === s.teacherId)?.name || 'Admin'}</option>)}</select>
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

                                {activeExams.filter(e => {
                                    const isSchool = (e.schoolId || 'sdn2palapi') === getActiveSchoolId();
                                    if (!isSchool) return false;
                                    if (role === 'guru') {
                                        const mySubIds = getMySubjects().map(s => s.id);
                                        return mySubIds.includes(e.subjectId);
                                    }
                                    return true;
                                }).length > 0 && (
                                    <div className="mt-12 text-left">
                                        <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2"><div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></div> Sesi Ujian Aktif (LIVE)</h3>
                                        <div className={`grid gap-5 ${activeExams.filter(e => {
                                            const isSchool = (e.schoolId || 'sdn2palapi') === getActiveSchoolId();
                                            if (!isSchool) return false;
                                            if (role === 'guru') {
                                                const mySubIds = getMySubjects().map(s => s.id);
                                                return mySubIds.includes(e.subjectId);
                                            }
                                            return true;
                                        }).length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                                            {activeExams.filter(e => {
                                                const isSchool = (e.schoolId || 'sdn2palapi') === getActiveSchoolId();
                                                if (!isSchool) return false;
                                                if (role === 'guru') {
                                                    const mySubIds = getMySubjects().map(s => s.id);
                                                    return mySubIds.includes(e.subjectId);
                                                }
                                                return true;
                                            }).map(exam => {
                                                const sub = getMySubjects().find(s => s.id === exam.subjectId);
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
                                                                <span className="bg-white px-2.5 py-1 rounded-md shadow-sm border border-slate-200 text-slate-700">{getMyStudents().filter(st => st.class === sub?.class).length} Siswa</span>
                                                            </div>
                                                            <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 flex-1">
                                                                {getMyStudents().filter(st => st.class === sub?.class).map(st => {
                                                                    const ls = liveStatus[st.id] || { status: 'Offline' };
                                                                    const hasFinished = getMyResults().some(r => r.studentName === st.name && r.subject === sub?.name && r.token === exam.token);
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

                    {/* ADMINISTRASI CETAK (ADMIN & GURU) */}
                    {adminMenu === 'documents' && (role === 'admin' || role === 'guru') && (
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-8 animate-fade-in space-y-6 max-w-4xl mx-auto">
                            <div className="text-center mb-2 border-b border-slate-100 pb-6">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3"><ClipboardList size={28} /></div>
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Administrasi Pelaksanaan</h2>
                                <p className="text-slate-500 font-medium mt-1 text-xs sm:text-sm">Pusat cetak Daftar Hadir, Berita Acara & Kartu Login Ujian</p>
                            </div>

                            {/* INFO KOP CETAK SEKOLAH AKTIF */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-indigo-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                        {currentActiveSchool.schoolLogo ? (
                                            <img src={currentActiveSchool.schoolLogo} alt="Logo Sekolah" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <School size={22} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">Identitas Kop Dokumen Cetak</p>
                                        <h4 className="font-extrabold text-sm text-slate-900">{currentActiveSchool.name}</h4>
                                        <p className="text-[11px] text-slate-600 font-medium">
                                            Kepsek: <strong>{currentActiveSchool.kepsekName || 'Belum diatur'}</strong> • TP {activeAcademicYear} (Sem. {activeSemester})
                                        </p>
                                    </div>
                                </div>
                                {role === 'admin' && (
                                    <button
                                        type="button"
                                        onClick={() => setAdminMenu('school')}
                                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-2xs"
                                    >
                                        {currentActiveSchool.schoolLogo ? 'Ubah Kop / Logo' : '+ Upload Logo Sekolah'}
                                    </button>
                                )}
                            </div>

                            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Pilih Kelas</label>
                                        <select
                                            className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm"
                                            value={printForm.class}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const stCount = val === 'ALL' ? getMyStudents().length : getMyStudents().filter(st => st.class === val).length;
                                                setPrintForm(prev => ({ ...prev, class: val, seharusnya: val ? String(stCount) : prev.seharusnya }));
                                            }}
                                        >
                                            <option value="">-- Pilih Kelas --</option>
                                            {getMyClasses().length > 1 && <option value="ALL">Semua Kelas ({getMyStudents().length} Siswa)</option>}
                                            {getMyClasses().map(c => {
                                                const cnt = getMyStudents().filter(st => st.class === c.name).length;
                                                return <option key={c.id} value={c.name}>{c.name} ({cnt} Siswa)</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Pilih Mata Pelajaran <span className="text-slate-400 font-normal">(Opsional u/ Kartu)</span></label>
                                        <select
                                            className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm"
                                            value={printForm.subject}
                                            onChange={(e) => setPrintForm({ ...printForm, subject: e.target.value })}
                                        >
                                            <option value="">-- Semua / Umum --</option>
                                            {getMySubjects()
                                                .filter(s => !printForm.class || printForm.class === 'ALL' || s.class === printForm.class)
                                                .map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nama Kegiatan (Kustom)</label><input type="text" className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm" value={printForm.activityName} onChange={(e) => setPrintForm({ ...printForm, activityName: e.target.value })} /></div>
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Tanggal Pelaksanaan</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={18} /><input type="date" className="w-full pl-10 p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white outline-none font-semibold text-slate-700 shadow-sm text-sm" value={printForm.date} onChange={(e) => setPrintForm({ ...printForm, date: e.target.value })} /></div></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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

                                <div className="pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    <button onClick={() => handleOpenPrintPreview('attendance')} className="bg-indigo-600 text-white p-3.5 sm:p-4 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 hover:bg-indigo-700 shadow-sm transition-all"><ClipboardList size={22} /> Cetak Daftar Hadir</button>
                                    <button onClick={() => handleOpenPrintPreview('report')} className="bg-emerald-600 text-white p-3.5 sm:p-4 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 hover:bg-emerald-700 shadow-sm transition-all"><FileText size={22} /> Cetak Berita Acara</button>
                                    <button onClick={() => handleOpenPrintPreview('kartu_login')} className="bg-fuchsia-600 text-white p-3.5 sm:p-4 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 hover:bg-fuchsia-700 shadow-sm transition-all"><User size={22} /> Cetak Kartu Login</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MANAJEMEN SEKOLAH & MULTI-TENANT (SUPER ADMIN ONLY) */}
                    {adminMenu === 'schools' && role === 'admin' && currentUser?.isSuperAdmin && (
                        <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
                            {/* Header Hub */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            <Shield size={13} className="text-indigo-600" />
                                            Otoritas Super Admin
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Multi-Tenant Aktif
                                        </span>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                        Manajemen Sekolah & Akses Multi-Tenant
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 max-w-2xl leading-relaxed">
                                        Sistem terpusat untuk mendaftarkan sekolah lain, mengatur kredensial admin masing-masing sekolah, serta mengontrol izin login secara instan (1-tap). Data setiap sekolah terisolasi aman tanpa saling tumpang tindih.
                                    </p>
                                </div>
                                <button
                                    onClick={() => openModal('school')}
                                    className="w-full md:w-auto px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
                                >
                                    <Plus size={18} />
                                    <span>Tambah Sekolah Baru</span>
                                </button>
                            </div>

                            {/* BANNER KONTEKS DATA SEKOLAH AKTIF */}
                            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-indigo-300 shrink-0">
                                        <Building size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">Sekolah yang Sedang Anda Kelola Saat Ini:</p>
                                        <h3 className="text-lg sm:text-xl font-black text-white leading-snug mt-0.5">
                                            {getActiveSchool().name}
                                        </h3>
                                        <p className="text-xs text-slate-300 font-medium mt-0.5">
                                            NPSN: {getActiveSchool().npsn || '-'} • Wilayah: {getActiveSchool().kabupaten || 'Nasional'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    <div className="flex-1 sm:flex-none">
                                        <label className="block text-[10px] text-slate-300 font-bold mb-1">Ganti Target Sekolah:</label>
                                        <select
                                            value={selectedSchoolId}
                                            onChange={(e) => {
                                                setSelectedSchoolId(e.target.value);
                                                const chosen = schools.find(s => s.id === e.target.value);
                                                showToast(`Konteks data beralih ke: ${chosen?.name}`);
                                            }}
                                            className="w-full sm:w-auto bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl outline-none cursor-pointer"
                                        >
                                            {schools.map(s => (
                                                <option key={s.id} value={s.id} className="text-slate-900 font-bold">
                                                    {s.name} {s.status !== 'active' ? '(Akses Nonaktif)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => setAdminMenu('dashboard')}
                                        className="mt-4 sm:mt-4 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                                    >
                                        <span>Buka Dashboard</span>
                                        <ChevronRight size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* 4 KPI METRIC CARDS */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tenant</span>
                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Building size={18} />
                                        </div>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-black text-slate-900">{schools.length}</p>
                                    <p className="text-[11px] text-slate-400 font-semibold mt-1">Institusi Terdaftar</p>
                                </div>

                                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Akses Terbuka</span>
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <CheckCircle size={18} />
                                        </div>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-black text-emerald-600">
                                        {schools.filter(s => s.status === 'active').length}
                                    </p>
                                    <p className="text-[11px] text-emerald-700/80 font-semibold mt-1">Bisa Login ke CBT</p>
                                </div>

                                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Akses Dibekukan</span>
                                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                            <Lock size={18} />
                                        </div>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-black text-rose-600">
                                        {schools.filter(s => s.status !== 'active').length}
                                    </p>
                                    <p className="text-[11px] text-rose-700/80 font-semibold mt-1">Akses Login Ditolak</p>
                                </div>

                                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Database</span>
                                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                            <Database size={18} />
                                        </div>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-black text-slate-900">{teachers.length + students.length}</p>
                                    <p className="text-[11px] text-purple-700 font-semibold mt-1">
                                        {teachers.length} Guru • {students.length} Siswa
                                    </p>
                                </div>
                            </div>

                            {/* Search & Filter */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                    <input
                                        value={schoolSearch}
                                        onChange={e => setSchoolSearch(e.target.value)}
                                        placeholder="Cari nama sekolah, NPSN, atau nama admin..."
                                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
                                    />
                                </div>
                                <select
                                    value={schoolStatusFilter}
                                    onChange={e => setSchoolStatusFilter(e.target.value)}
                                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                                >
                                    <option value="all">Semua Status Akses ({schools.length})</option>
                                    <option value="active">Hanya yang Aktif / Diizinkan ({schools.filter(s => s.status === 'active').length})</option>
                                    <option value="suspended">Hanya yang Dibekukan ({schools.filter(s => s.status !== 'active').length})</option>
                                </select>
                            </div>

                            {/* DAFTAR KARTU SEKOLAH & KONTROL AKSES */}
                            <div className="space-y-4">
                                {filteredSchoolsList.map(s => {
                                    const isActive = s.status === 'active';
                                    const isCurrent = s.id === selectedSchoolId;
                                    const schoolTeachersCount = teachers.filter(t => (t.schoolId || 'sdn2palapi') === s.id).length;
                                    const schoolStudentsCount = students.filter(st => (st.schoolId || 'sdn2palapi') === s.id).length;
                                    const schoolClassesCount = classes.filter(c => (c.schoolId || 'sdn2palapi') === s.id).length;
                                    const schoolQuestionsCount = questions.filter(q => (q.schoolId || 'sdn2palapi') === s.id).length;

                                    return (
                                        <div
                                            key={s.id}
                                            className={`bg-white rounded-3xl border transition-all p-5 sm:p-6 shadow-xs ${
                                                isCurrent ? 'border-indigo-500 ring-2 ring-indigo-500/15' : 'border-slate-200/80 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100">
                                                <div className="flex items-start gap-3.5">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs overflow-hidden ${
                                                        s.schoolLogo ? 'bg-white border border-slate-200 p-1' : (s.isMaster ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-200')
                                                    }`}>
                                                        {s.schoolLogo ? <img src={s.schoolLogo} alt={s.name} className="w-full h-full object-contain" /> : <School size={24} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                                                                {s.name}
                                                            </h3>
                                                            {s.isMaster && (
                                                                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                                                    ⭐ Master / Pusat
                                                                </span>
                                                            )}
                                                            {isCurrent && (
                                                                <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
                                                                    Sedang Dikelola
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 font-medium">
                                                            NPSN: <strong className="text-slate-800">{s.npsn || '-'}</strong> • {s.kabupaten || 'Indonesia'} • {s.dinasPendidikan || 'Dinas Pendidikan'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-start lg:self-center">
                                                    {/* Badge Status Izin Login */}
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                                                        isActive
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    }`}>
                                                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                        <span>{isActive ? 'Akses Login Aktif' : 'Akses Dibekukan'}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* KODE REFERENSI SEKOLAH */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-2xl my-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
                                                        <Key size={15} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                                                            Kode Referensi Sekolah (Kunci Aktivasi Guru / Admin)
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="font-mono font-black text-xs text-amber-950 bg-white px-2 py-0.5 rounded-lg border border-amber-300 tracking-wider">
                                                                {s.referralCode || ('EQ-' + (s.id || '').replace('school_', '').slice(-4).toUpperCase())}
                                                            </span>
                                                            <span className="text-[10px] text-amber-700 font-medium hidden sm:inline">
                                                                Bagikan kode ini untuk aktivasi profil instansi mereka
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const refCode = s.referralCode || ('EQ-' + (s.id || '').replace('school_', '').slice(-4).toUpperCase());
                                                        navigator.clipboard.writeText(refCode);
                                                        showToast(`Kode Referensi "${refCode}" berhasil disalin!`);
                                                    }}
                                                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer"
                                                >
                                                    <Copy size={13} />
                                                    <span>Salin Kode</span>
                                                </button>
                                            </div>

                                            {/* Grid Detail Data Sekolah & Kredensial */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100">
                                                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin Sekolah</p>
                                                    <p className="font-bold text-xs text-slate-800 mt-0.5 truncate">{s.adminName || '-'}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">User: {s.adminUsername}</p>
                                                </div>

                                                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi Admin</p>
                                                    <p className="font-mono font-bold text-xs text-indigo-600 mt-0.5 truncate">{s.adminPassword || 'masfy'}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">Semester {s.semester || 'Ganjil'}</p>
                                                </div>

                                                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kepala Sekolah</p>
                                                    <p className="font-bold text-xs text-slate-800 mt-0.5 truncate">{s.kepsekName || '-'}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">NIP: {s.kepsekNip || '-'}</p>
                                                </div>

                                                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                                                    <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Statistik Tenant</p>
                                                    <p className="font-extrabold text-xs text-indigo-900 mt-0.5">
                                                        {schoolTeachersCount} Guru • {schoolStudentsCount} Siswa
                                                    </p>
                                                    <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                                                        {schoolClassesCount} Kelas • {schoolQuestionsCount} Soal
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Bar (1-Click Access Toggle + Edit + Switch) */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {/* TOMBOL 1-KLIK TOGGLE AKSES LOGIN (HANYA SUPER ADMIN MAS ALFY) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSchoolStatus(s.id)}
                                                        disabled={s.isMaster}
                                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                                            s.isMaster
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                                : isActive
                                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:scale-95'
                                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:scale-95'
                                                        }`}
                                                        title={s.isMaster ? "Sekolah utama selalu aktif" : (isActive ? "Klik untuk membekukan izin login" : "Klik untuk mengaktifkan izin login")}
                                                    >
                                                        <Power size={14} className={isActive ? 'text-rose-600' : 'text-emerald-600'} />
                                                        <span>{isActive ? 'Bekukan Akses Login' : 'Buka & Aktifkan Akses'}</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedSchoolId(s.id);
                                                            setAdminMenu('dashboard');
                                                            showToast(`Konteks aktif beralih ke: ${s.name}`);
                                                        }}
                                                        className="px-3.5 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
                                                    >
                                                        <Eye size={14} />
                                                        <span>Kelola Data Sekolah Ini</span>
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleResetUserPassword('school', s.id, s.name)}
                                                        className="px-3 py-2 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                                                        title="Reset Kata Sandi Admin Sekolah"
                                                    >
                                                        <Key size={14} />
                                                        <span>Reset Sandi</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => openModal('school', s)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-200/80 rounded-xl transition-all cursor-pointer"
                                                        title="Edit Data & Kredensial Sekolah"
                                                    >
                                                        <Edit size={16} />
                                                    </button>

                                                    {!s.isMaster && (
                                                        <button
                                                            type="button"
                                                            onClick={() => initiateDelete('school', s.id)}
                                                            className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200/80 rounded-xl transition-all cursor-pointer"
                                                            title="Hapus Sekolah"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredSchoolsList.length === 0 && (
                                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                                        <Building size={48} className="mx-auto text-slate-300 mb-3" />
                                        <h3 className="font-bold text-slate-700 text-base">Tidak ada sekolah yang cocok</h3>
                                        <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau ubah filter status.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PENGATURAN SEKOLAH (ADMIN ONLY — TERISOLASI PENUH PER SEKOLAH) */}
                    {adminMenu === 'school' && role === 'admin' && (() => {
                        const currentSchool = getActiveSchool();
                        const previewLogo = tempSchoolLogo !== null ? tempSchoolLogo : (currentSchool.schoolLogo || '');
                        return (
                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-8 max-w-3xl mx-auto animate-fade-in">
                                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-5">
                                    <div className="bg-slate-100 p-3 sm:p-3.5 rounded-xl text-slate-600 shadow-sm"><Settings size={26} /></div>
                                    <div>
                                        <h3 className="font-bold text-xl sm:text-2xl text-slate-800 tracking-tight">Pengaturan Sekolah</h3>
                                        <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">Identitas Institusi & Kop Cetak: <strong className="text-indigo-600">{currentSchool.name}</strong></p>
                                    </div>
                                </div>
                                <form key={currentSchool.id} onSubmit={handleSaveSchool} className="space-y-6">

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

                            {/* SCHOOL LOGO — khusus sekolah ini untuk dokumen cetak */}
                            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <div className="shrink-0 text-center">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Logo Sekolah (Cetak)</label>
                                    <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-sm">
                                        {previewLogo ? <img src={previewLogo} className="w-full h-full object-contain p-2" alt={`Logo ${currentSchool.name}`} /> : <School size={32} className="text-slate-300" />}
                                    </div>
                                    {previewLogo && (
                                        <button
                                            type="button"
                                            onClick={() => setTempSchoolLogo('')}
                                            className="mt-2 text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                                        >
                                            Hapus Logo
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Upload Logo Khusus {currentSchool.name}</label>
                                    <input type="file" accept="image/*" onChange={handleSchoolLogoUpload} className="w-full p-3 border border-slate-200 focus:border-indigo-400 rounded-xl bg-white shadow-sm font-medium text-slate-700 text-sm" />
                                    <p className="text-[10px] text-slate-500 mt-2 font-semibold">Logo ini terisolasi khusus untuk <strong>{currentSchool.name}</strong> dan hanya tampil pada Kop Surat, Kartu Login, Daftar Hadir, dan Berita Acara sekolah ini.</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider border-b border-slate-200 pb-1">Informasi Instansi</label>
                                <div><input name="dinasPendidikan" defaultValue={currentSchool.dinasPendidikan || ''} placeholder="Dinas Pendidikan (Kop Surat)" className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none text-sm" /></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><input name="name" defaultValue={currentSchool.name || ''} placeholder="Nama Sekolah" className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none text-sm" required /></div>
                                    <div><input name="kabupaten" defaultValue={currentSchool.kabupaten || ''} placeholder="Nama Kabupaten/Kota" className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none text-sm" /></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div><input name="npsn" defaultValue={currentSchool.npsn || ''} placeholder="NPSN Sekolah" className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-mono font-semibold text-slate-800 outline-none text-sm" /></div>
                                    <div className="sm:col-span-2"><input name="address" defaultValue={currentSchool.address || ''} placeholder="Alamat Sekolah Lengkap" className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-medium text-slate-800 outline-none text-sm" /></div>
                                </div>

                                {/* Semester & Tahun Pelajaran */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                                            <Calendar size={14} className="text-indigo-600" />
                                            Semester Pelaksanaan Ujian
                                        </label>
                                        <select
                                            name="semester"
                                            defaultValue={currentSchool.semester || 'Ganjil'}
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
                                            defaultValue={currentSchool.academicYear || '2026/2027'}
                                            placeholder="Contoh: 2026/2027"
                                            className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none text-sm"
                                        />
                                        <p className="text-[10px] text-slate-500 font-medium mt-1">Format tahun ajaran (misal: 2026/2027).</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4"><label className="block text-[10px] font-bold text-amber-500 uppercase tracking-wider border-b border-slate-200 pb-1">Data Kepala Sekolah</label><div><input name="kepsekName" defaultValue={currentSchool.kepsekName || ''} placeholder="Nama Kepala Sekolah beserta Gelar" className="w-full p-3.5 border border-slate-200 focus:border-amber-400 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none text-sm" /></div><div><input name="kepsekNip" defaultValue={currentSchool.kepsekNip || ''} placeholder="NIP Kepala Sekolah" className="w-full p-3.5 border border-slate-200 focus:border-amber-400 rounded-xl bg-slate-50 font-medium text-slate-800 outline-none text-sm" /></div></div>
                            <div className="space-y-4 pt-4">
                                <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-wider border-b border-slate-200 pb-1">
                                    Kredensial Admin Sekolah
                                </label>
                                <div>
                                    <input name="adminName" defaultValue={currentSchool.adminName || ''} placeholder="Nama Lengkap Admin" className="w-full p-3.5 border border-slate-200 focus:border-rose-400 rounded-xl bg-slate-50 font-semibold text-slate-800 outline-none text-sm" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username Akses (Terkunci)</label>
                                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <Lock size={10} /> Permanen
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                name="adminUsername" 
                                                defaultValue={currentSchool.adminUsername || 'admin'} 
                                                placeholder="Username Akses" 
                                                className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-100 font-mono font-bold text-slate-500 outline-none text-sm cursor-not-allowed pr-10" 
                                                readOnly 
                                            />
                                            <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">Username admin tidak dapat diganti demi integritas sistem.</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                            Ganti Kata Sandi Admin
                                        </label>
                                        <input 
                                            name="adminPassword" 
                                            defaultValue={currentSchool.adminPassword || ''} 
                                            placeholder="Kata Sandi Baru" 
                                            className="w-full p-3.5 border border-slate-200 focus:border-rose-400 rounded-xl bg-slate-50 font-mono font-bold text-rose-600 outline-none text-sm" 
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">Admin dan guru hanya dapat mengganti kata sandi.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 pt-4"><label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider border-b border-slate-200 pb-1">Pengaturan Ujian</label><div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Jumlah Opsi Pilihan Ganda</label><select name="optionCount" defaultValue={currentSchool.optionCount || 5} className="w-full p-3.5 border border-slate-200 focus:border-indigo-400 rounded-xl bg-slate-50 font-medium text-slate-600 outline-none text-sm"><option value="4">4 Opsi (A, B, C, D)</option><option value="5">5 Opsi (A, B, C, D, E)</option></select></div><p className="text-[10px] text-slate-500 font-medium mt-1">Menentukan jumlah opsi jawaban maksimal pada pembuatan soal.</p></div>
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
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
                                            defaultValue={currentSchool.apiKey || ''}
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
                                        defaultValue={sanitizeModelId(currentSchool.aiModel || DEFAULT_AI_MODEL)}
                                        className="w-full p-3.5 border border-slate-200 focus:border-fuchsia-400 rounded-xl bg-slate-50 font-mono font-medium text-slate-700 outline-none text-sm"
                                    >
                                        {effectiveAvailableModels && effectiveAvailableModels.length > 0 ? (
                                            effectiveAvailableModels.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} ({m.id}) {m.isFlash ? '⚡ Cepat & Ringan' : m.isPro ? '🧠 Analisis Tinggi' : ''}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Generasi Terbaru - Direkomendasikan)</option>
                                                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Cepat & Stabil)</option>
                                                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Super Cepat)</option>
                                                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Kemampuan Analisis Tinggi)</option>
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
                        );
                    })()}

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
                                        <h3 className="font-extrabold text-sm text-slate-800 leading-tight">{currentUser?.name || 'Administrator'}</h3>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            {role === 'admin' ? (currentUser?.isSuperAdmin ? 'Super Administrator' : 'Administrator Sekolah') : (currentUser?.teacherType === 'guru_kelas' ? `Wali ${currentUser?.assignedClass || ''}` : `Guru Mapel: ${currentUser?.subjectName || ''}`)}
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

                                        {role === 'admin' && currentUser?.isSuperAdmin && (
                                            <button
                                                onClick={() => { setAdminMenu('schools'); setMobileAdminDrawerOpen(false); }}
                                                className={`col-span-2 flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${adminMenu === 'schools' ? 'bg-indigo-600 border-indigo-700 text-white font-bold' : 'bg-indigo-50/80 border-indigo-200 text-indigo-800 font-bold hover:bg-indigo-100'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                                                        <Building size={18} />
                                                    </div>
                                                    <span className="text-xs">Kelola Sekolah (Multi-Tenant)</span>
                                                </div>
                                                <span className="text-[10px] font-extrabold bg-white text-indigo-700 px-2 py-0.5 rounded-full">{schools.length} Unit</span>
                                            </button>
                                        )}
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
                                            <span className="text-xs">{role === 'admin' ? 'Mata Pelajaran' : 'Mapel Diampu'}</span>
                                        </button>

                                        <button
                                            onClick={() => { setAdminMenu('analysis'); setMobileAdminDrawerOpen(false); }}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${adminMenu === 'analysis' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-slate-50/70 border-slate-200/80 text-slate-700 font-medium hover:bg-slate-100'}`}
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                                                <BarChart2 size={18} />
                                            </div>
                                            <span className="text-xs">Analisis Nilai</span>
                                        </button>

                                        <button
                                            onClick={() => { setAdminMenu('documents'); setMobileAdminDrawerOpen(false); }}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${adminMenu === 'documents' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-slate-50/70 border-slate-200/80 text-slate-700 font-medium hover:bg-slate-100'}`}
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                                                <ClipboardList size={18} />
                                            </div>
                                            <span className="text-xs">Administrasi</span>
                                        </button>

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

                                {/* SCHOOL FORM (MULTI-TENANT SATUAN PENDIDIKAN) */}
                                {modalType === 'school' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                                            <div className="w-16 h-16 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                                                {(tempSchoolLogo !== null ? tempSchoolLogo : editingItem?.schoolLogo) ? (
                                                    <img src={tempSchoolLogo !== null ? tempSchoolLogo : editingItem?.schoolLogo} alt="Logo Sekolah" className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <School size={26} className="text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Logo Sekolah (Khusus Unit Ini)</label>
                                                <input type="file" accept="image/*" onChange={handleSchoolLogoUpload} className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Satuan Pendidikan (Sekolah)</label>
                                            <input name="name" defaultValue={editingItem?.name} placeholder="Contoh: SMP Negeri 1 Raha / SD IT Al-Qalam" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-bold text-slate-800 text-sm" required />
                                        </div>

                                        {/* KODE REFERENSI SEKOLAH */}
                                        <div className="space-y-1.5 p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-amber-900 uppercase tracking-wider">Kode Referensi Sekolah (Kunci Aktivasi Guru)</label>
                                                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Aktivasi Otomatis</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    id="schoolReferralCodeInput"
                                                    name="referralCode"
                                                    defaultValue={editingItem?.referralCode || ('EQ-' + Math.random().toString(36).substring(2, 6).toUpperCase())}
                                                    placeholder="Contoh: EQ-SMPN1"
                                                    className="flex-1 p-2.5 bg-white border border-amber-300 rounded-xl font-mono font-black text-amber-900 text-sm outline-none uppercase"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const randomCode = 'EQ-' + Math.random().toString(36).substring(2, 6).toUpperCase();
                                                        const inp = document.getElementById('schoolReferralCodeInput');
                                                        if (inp) inp.value = randomCode;
                                                    }}
                                                    className="px-3 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                                >
                                                    Acak Kode
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-amber-700 font-medium">
                                                Guru/Admin sekolah ini dapat menggunakan kode ini untuk langsung mengaktifkan dan mengelola data sekolahnya.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">NPSN</label>
                                                <input name="npsn" defaultValue={editingItem?.npsn} placeholder="Nomor Pokok Sekolah Nasional" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-700 text-sm" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Kabupaten / Kota</label>
                                                <input name="kabupaten" defaultValue={editingItem?.kabupaten} placeholder="Contoh: Kabupaten Muna" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-700 text-sm" />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Dinas Pendidikan (Kop Dokumen)</label>
                                            <input name="dinasPendidikan" defaultValue={editingItem?.dinasPendidikan || 'Dinas Pendidikan dan Kebudayaan'} placeholder="Contoh: Dinas Pendidikan Pemuda dan Olahraga" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-700 text-sm" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Alamat Lengkap Sekolah</label>
                                            <input name="address" defaultValue={editingItem?.address} placeholder="Jl. Raya No. ..., Kecamatan, Kode Pos" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-medium text-slate-700 text-sm" />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Kepala Sekolah & Gelar</label>
                                                <input name="kepsekName" defaultValue={editingItem?.kepsekName} placeholder="Contoh: Drs. H. Ahmad, M.Pd" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-700 text-sm" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">NIP Kepala Sekolah</label>
                                                <input name="kepsekNip" defaultValue={editingItem?.kepsekNip} placeholder="19xxxxxxxx xxx x xxx" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-mono text-slate-600 text-sm" />
                                            </div>
                                        </div>

                                        {/* KREDENSIAL LOGIN ADMIN SEKOLAH */}
                                        <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
                                            <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                                                <Shield size={15} className="text-indigo-600" />
                                                Kredensial Akses Administrator Sekolah
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Admin Sekolah</label>
                                                    <input name="adminName" defaultValue={editingItem?.adminName} placeholder="Nama operator / admin sekolah" className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl font-semibold text-slate-800 text-sm outline-none focus:border-indigo-500" required />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Admin Sekolah</label>
                                                    <input name="adminEmail" type="email" defaultValue={editingItem?.adminEmail} placeholder="admin@sekolah.sch.id" className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl font-medium text-slate-700 text-sm outline-none focus:border-indigo-500" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between ml-1">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username {editingItem ? '(Terkunci)' : ''}</label>
                                                        {editingItem && <span className="text-[9px] text-amber-700 font-bold bg-amber-100/70 px-1.5 py-0.5 rounded">Terkunci</span>}
                                                    </div>
                                                    <div className="relative">
                                                        <input 
                                                            name="adminUsername" 
                                                            defaultValue={editingItem?.adminUsername} 
                                                            placeholder="Username admin" 
                                                            className={`w-full p-2.5 border border-indigo-200 rounded-xl font-mono font-bold text-sm outline-none ${editingItem ? 'bg-slate-100 text-slate-500 cursor-not-allowed pr-8' : 'bg-white text-indigo-700 focus:border-indigo-500'}`} 
                                                            required 
                                                            readOnly={!!editingItem} 
                                                        />
                                                        {editingItem && <Lock size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                                        {editingItem ? 'Ganti Kata Sandi' : 'Kata Sandi'}
                                                    </label>
                                                    <input name="adminPassword" defaultValue={editingItem?.adminPassword || '123'} placeholder="Kata sandi akses" className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl font-mono font-medium text-slate-700 text-sm outline-none focus:border-indigo-500" required />
                                                </div>
                                            </div>
                                        </div>

                                        {/* STATUS PERIZINAN LOGIN */}
                                        <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                                            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                                <Lock size={14} className="text-slate-500" /> Status Otorisasi Login Sekolah
                                            </label>
                                            <select
                                                name="status"
                                                defaultValue={editingItem?.status || 'active'}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 cursor-pointer"
                                            >
                                                <option value="active">✅ Aktif — Diizinkan Login & Akses Panel CBT</option>
                                                <option value="suspended">⛔ Dibekukan — Akses Login Ditolak Sementara</option>
                                            </select>
                                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                                Hanya Anda (Super Admin) yang dapat mengaktifkan atau membekukan izin masuk akun sekolah ini sewaktu-waktu.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Semester Default</label>
                                                <select name="semester" defaultValue={editingItem?.semester || 'Ganjil'} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold text-sm outline-none focus:border-indigo-400">
                                                    <option value="Ganjil">Semester Ganjil</option>
                                                    <option value="Genap">Semester Genap</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tahun Pelajaran</label>
                                                <input name="academicYear" defaultValue={editingItem?.academicYear || '2025/2026'} placeholder="2025/2026" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold text-sm outline-none focus:border-indigo-400" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TEACHER FORM */}
                                {modalType === 'teacher' && (
                                    <div className="space-y-5">
                                        {/* PILIHAN SEKOLAH PENUGASAN GURU */}
                                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Building size={14} className="text-indigo-600" /> Unit Sekolah Penugasan
                                                </label>
                                                {currentUser?.isSuperAdmin ? (
                                                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                                        Hak Super Admin
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                                        Terkunci Otomatis
                                                    </span>
                                                )}
                                            </div>
                                            {currentUser?.isSuperAdmin ? (
                                                <div>
                                                    <select
                                                        name="schoolId"
                                                        defaultValue={editingItem?.schoolId || getActiveSchoolId()}
                                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-400 shadow-2xs cursor-pointer"
                                                    >
                                                        {schools.map(sc => (
                                                            <option key={sc.id} value={sc.id}>
                                                                {sc.name} ({sc.referralCode || sc.id})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <p className="text-[10.5px] text-slate-400 mt-1 font-medium">
                                                        Pilih sekolah tempat guru ini mengajar agar data guru, soal, dan kelasnya otomatis terhubung ke unit tersebut.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                                                    <span className="font-bold text-xs text-slate-800 flex items-center gap-2">
                                                        <School size={15} className="text-indigo-600" />
                                                        {getActiveSchool().name}
                                                    </span>
                                                    <input type="hidden" name="schoolId" value={getActiveSchoolId()} />
                                                    <span className="text-[10px] text-slate-400 font-semibold">Terkunci ke Sekolah Anda</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap & Gelar</label>
                                            <input name="name" defaultValue={editingItem?.name} placeholder="Contoh: Budi Santoso, S.Pd" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-800 text-sm" required />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between ml-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                        Username Akses {editingItem ? '(Terkunci)' : ''}
                                                    </label>
                                                    {editingItem && (
                                                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <Lock size={10} /> Permanen
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    <input 
                                                        name="username" 
                                                        defaultValue={editingItem?.username} 
                                                        placeholder="Username unik tanpa spasi" 
                                                        className={`w-full p-3 border border-slate-200 rounded-xl outline-none font-bold font-mono text-sm transition-all ${editingItem ? 'bg-slate-100 text-slate-500 cursor-not-allowed pr-9' : 'bg-slate-50 text-indigo-600 focus:border-indigo-400'}`} 
                                                        required 
                                                        readOnly={!!editingItem} 
                                                    />
                                                    {editingItem && <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                                    {editingItem ? 'Ganti Kata Sandi Guru' : 'Password'}
                                                </label>
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
                                                        {getMyClasses().map(c => (
                                                            <option key={c.id} value={c.name}>
                                                                {c.name} (Tingkat {c.level})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="text-xs text-indigo-800 bg-white/80 p-3 rounded-xl border border-indigo-100 leading-relaxed">
                                                    ✨ <strong>Hak Akses Guru Kelas:</strong> Guru ini otomatis memiliki akses ke kelas <strong>{teacherAssignedClass || getMyClasses()[0]?.name}</strong>, dapat melihat muridnya, dan berwenang membuat soal untuk <strong>seluruh mata pelajaran</strong> yang diajarkan pada kelas tersebut.
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
                                                                onClick={() => setTeacherSelectedClasses(getMyClasses().map(c => c.name))}
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
                                                        {getMyClasses().map(c => {
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
                                        <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap</label><input name="name" defaultValue={editingItem?.name} placeholder="Sesuai Akta Kelahiran / Dapodik" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-800 text-sm" required /></div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between ml-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                    Nomor Induk Siswa Nasional (NISN) {editingItem ? '(Terkunci)' : ''}
                                                </label>
                                                {editingItem && (
                                                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <Lock size={10} /> Username Ujian
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    name="nis" 
                                                    defaultValue={editingItem?.nisn || editingItem?.nis} 
                                                    placeholder="Masukkan NISN (digunakan sebagai Username Ujian)" 
                                                    className={`w-full p-3 border border-slate-200 rounded-xl outline-none font-bold font-mono text-sm ${editingItem ? 'bg-slate-100 text-slate-500 cursor-not-allowed pr-9' : 'bg-slate-50 text-indigo-600 focus:border-indigo-400'}`} 
                                                    required 
                                                    readOnly={!!editingItem} 
                                                />
                                                {editingItem && <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Rombongan Belajar (Kelas)</label>
                                            <select name="class" defaultValue={editingItem?.class || (role === 'guru' && currentUser?.assignedClass ? currentUser.assignedClass : getMyClasses()[0]?.name)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-700 text-sm">
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
                                                <select name="teacherId" defaultValue={editingItem?.teacherId || getMyTeachers()[0]?.id} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-400 font-semibold text-slate-700 text-sm">
                                                    {getMyTeachers().map(t => <option key={t.id} value={t.id}>{t.name} ({t.teacherType === 'guru_mapel' ? `Mapel: ${t.subjectName || '-'}` : `Wali: ${t.assignedClass || '-'}`})</option>)}
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
                                                                const available = getMyStimuli().filter(s => !s.subjectId || s.subjectId === (editingItem?.subjectId || selectedSubjectForQuestions?.id));
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
                                                            {getMyStimuli().map(stim => (
                                                                <option key={stim.id} value={stim.id}>
                                                                    [{stim.type === 'text' ? 'Teks' : stim.type === 'table' ? 'Tabel' : stim.type === 'image' ? 'Gambar' : 'Gabungan'}] {stim.title}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Pratinjau Cepat Stimulus Terpilih */}
                                                    {(() => {
                                                        const selectedStim = getMyStimuli().find(s => String(s.id) === String(questionStimulusId));
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
                                            {getMyQuestions().filter(q => getMySubjects().find(s => s.name === editingItem.subject)?.id === q.subjectId).map((q, i) => {
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
                                Digunakan pada <strong className="text-indigo-600 font-bold">{getMyQuestions().filter(q => q.stimulusId === activeStimulusModal.id).length}</strong> butir soal
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