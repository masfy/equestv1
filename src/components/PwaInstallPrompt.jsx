import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle, Share, X, WifiOff, Sparkles } from 'lucide-react';

export default function PwaInstallPrompt({ variant = 'card' }) {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        // Cek apakah sudah berjalan dalam mode standalone (PWA terinstall)
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || window.navigator.standalone === true;
        setIsStandalone(checkStandalone);

        // Cek apakah perangkat iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setInstallPrompt(null);
        };

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleInstallClick = async () => {
        if (installPrompt) {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstalled(true);
                setInstallPrompt(null);
            }
        } else if (isIOS) {
            setShowIOSGuide(true);
        } else {
            alert("Untuk menginstall aplikasi CBTku:\n1. Buka menu browser (titik 3 di kanan atas)\n2. Pilih 'Tambahkan ke Layar Utama' atau 'Install Aplikasi'.");
        }
    };

    // Jika sudah di dalam mode PWA Standalone
    if (isStandalone) {
        return (
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shadow-xs">
                <Sparkles size={13} className="text-emerald-500 animate-pulse" />
                <span>Mode Aplikasi PWA Standalone Aktif</span>
            </div>
        );
    }

    if (variant === 'button') {
        return (
            <>
                <button
                    onClick={handleInstallClick}
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                >
                    <Download size={14} />
                    <span>Install Aplikasi di HP</span>
                </button>

                {/* Modal Panduan iOS */}
                {showIOSGuide && (
                    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                        <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in relative border border-slate-100">
                            <button onClick={() => setShowIOSGuide(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={18} /></button>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <Smartphone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Pasang di iPhone / iPad</h3>
                                    <p className="text-[11px] text-slate-400">Petunjuk instalasi cepat Safari</p>
                                </div>
                            </div>
                            <ol className="text-xs text-slate-600 space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-indigo-600">1.</span>
                                    <span>Ketuk tombol <strong>Bagikan / Share</strong> (<Share size={13} className="inline text-blue-600" />) di bilah bawah browser Safari.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-indigo-600">2.</span>
                                    <span>Gulir ke bawah lalu pilih menu <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-indigo-600">3.</span>
                                    <span>Buka aplikasi dari Layar Utama untuk ujian bebas hambatan & layar penuh.</span>
                                </li>
                            </ol>
                            <button onClick={() => setShowIOSGuide(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
                                Mengerti
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // Default variant: Card banner
    return (
        <>
            <div className="w-full bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-purple-500/10 border border-indigo-200/60 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/30">
                        <Smartphone size={20} />
                    </div>
                    <div className="text-left">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800">Pasang Aplikasi CBTku</span>
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded">PWA</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                            Layar penuh tanpa bilah URL, lebih fokus & anti gangguan.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleInstallClick}
                    type="button"
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all shrink-0 flex items-center gap-1.5"
                >
                    <Download size={13} />
                    <span>Install</span>
                </button>
            </div>

            {/* Modal Panduan iOS */}
            {showIOSGuide && (
                <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in relative border border-slate-100">
                        <button onClick={() => setShowIOSGuide(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={18} /></button>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <Smartphone size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Pasang di iPhone / iPad</h3>
                                <p className="text-[11px] text-slate-400">Petunjuk instalasi cepat Safari</p>
                            </div>
                        </div>
                        <ol className="text-xs text-slate-600 space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-indigo-600">1.</span>
                                <span>Ketuk tombol <strong>Bagikan / Share</strong> (<Share size={13} className="inline text-blue-600" />) di bilah navigasi Safari.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-indigo-600">2.</span>
                                <span>Pilih opsi <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-indigo-600">3.</span>
                                <span>Aplikasi CBTku akan muncul di homescreen siap dipakai ujian secara layar penuh.</span>
                            </li>
                        </ol>
                        <button onClick={() => setShowIOSGuide(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
                            Mengerti
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
