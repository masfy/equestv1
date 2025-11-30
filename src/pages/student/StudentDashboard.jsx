import React, { useState, useEffect } from 'react';
import { Key, User, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import TiltCard from '../../components/layout/TiltCard';
import { api } from '../../services/api';

const StudentDashboard = ({ user, activeExam, onStartExam, onLogout, onRefresh }) => {
    const [step, setStep] = useState('token'); // 'token' | 'biodata'
    const [tokenInput, setTokenInput] = useState('');
    const [error, setError] = useState('');
    const [validating, setValidating] = useState(false);

    // Refresh data on mount to ensure we have the latest token
    useEffect(() => {
        if (onRefresh) onRefresh();
    }, []);

    // Send LOGIN status when reaching biodata step (which means token is correct)
    useEffect(() => {
        if (step === 'biodata' && activeExam) {
            api.updateStudentStatus(activeExam.token, user.nis, user.name, 'LOGIN');
        }
    }, [step, activeExam, user]);

    // Cheating Detection (Placeholder for now, mainly handled in ExamRunner)
    useEffect(() => {
        if (step !== 'biodata') return;
    }, [step]);

    const handleTokenSubmit = async (e) => {
        e.preventDefault();
        setValidating(true);
        setError('');

        let currentExam = activeExam;
        let inputClean = tokenInput.toUpperCase().trim();
        let activeTokenClean = currentExam?.token ? currentExam.token.toString().toUpperCase().trim() : '';

        // 1. Try local validation first
        if (inputClean === activeTokenClean) {
            setValidating(false);
            setStep('biodata');
            return;
        }

        // 2. If failed, try refreshing data from server
        if (onRefresh) {
            console.log("Token mismatch, refreshing data...");
            const newData = await onRefresh();
            if (newData && newData.activeExam) {
                currentExam = newData.activeExam;
                activeTokenClean = currentExam.token ? currentExam.token.toString().toUpperCase().trim() : '';
            }
        }

        if (!currentExam) {
            setError('Tidak ada ujian yang aktif saat ini.');
            setValidating(false);
            return;
        }

        if (inputClean === activeTokenClean) {
            setStep('biodata');
            setError('');
        } else {
            setError(`Token salah! (Input: ${inputClean}, Expected: ${activeTokenClean})`);
        }
        setValidating(false);
    };

    const handleStart = () => {
        // Send WORKING status
        if (activeExam) {
            api.updateStudentStatus(activeExam.token, user.nis, user.name, 'WORKING');
        }
        onStartExam();
    };

    if (step === 'token') {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
                <TiltCard className="max-w-md min-h-[400px] flex-col">
                    <div className="bg-indigo-600 p-8 text-white text-center">
                        <h2 className="text-2xl font-bold mb-2">Token Ujian</h2>
                        <p className="text-indigo-100">Masukkan token yang diberikan pengawas.</p>
                    </div>
                    <div className="p-8 flex-1 flex flex-col justify-center bg-white">
                        <form onSubmit={handleTokenSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                                    Token Ujian
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        value={tokenInput}
                                        onChange={e => setTokenInput(e.target.value.toUpperCase())}
                                        placeholder="Masukan Token..."
                                        className="w-full pl-12 pr-4 py-4 text-2xl font-mono font-bold tracking-widest text-center border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all uppercase"
                                        maxLength={6}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-sm font-medium animate-fade-in">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={validating}
                                className="w-full py-4 text-lg rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {validating ? 'Memeriksa...' : 'LANJUTKAN'}
                            </Button>

                            <button
                                type="button"
                                onClick={onLogout}
                                className="w-full text-gray-400 text-sm hover:text-gray-600 font-medium"
                            >
                                Batal & Keluar
                            </button>
                        </form>
                    </div>
                </TiltCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            <TiltCard className="max-w-2xl min-h-[500px] flex-col md:flex-row">
                <div className="md:w-1/3 bg-indigo-600 p-8 text-white flex flex-col justify-center items-center text-center">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <User size={48} />
                    </div>
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <p className="text-indigo-200 text-sm mt-1">{user.class}</p>
                    <div className="mt-8 bg-indigo-800/50 p-4 rounded-xl w-full">
                        <div className="text-xs text-indigo-300 uppercase font-bold mb-1">Mata Pelajaran</div>
                        <div className="font-bold text-lg">{activeExam?.subjectName || '-'}</div>
                    </div>
                </div>
                <div className="md:w-2/3 p-8 bg-white flex flex-col">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Konfirmasi Data Peserta</h3>

                    <div className="space-y-4 flex-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><User size={12} /> NIS</div>
                                <div className="font-mono font-bold text-gray-800">{user.nis}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><BookOpen size={12} /> Kode Soal</div>
                                <div className="font-mono font-bold text-gray-800">{activeExam?.subjectId || '-'}</div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex gap-3 items-start">
                            <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                            <div className="text-sm text-yellow-800">
                                <p className="font-bold mb-1">Perhatian!</p>
                                <p>Pastikan data diri Anda sudah benar. Tombol "MULAI" akan mengaktifkan timer ujian dan tidak dapat dibatalkan.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <Button variant="secondary" onClick={() => setStep('token')} className="flex-1">
                            Kembali
                        </Button>
                        <Button onClick={handleStart} className="flex-1 bg-green-600 hover:bg-green-700 shadow-green-200">
                            MULAI UJIAN
                        </Button>
                    </div>
                </div>
            </TiltCard>
        </div>
    );
};

export default StudentDashboard;
