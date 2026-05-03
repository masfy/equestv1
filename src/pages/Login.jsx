import React, { useState } from 'react';
import { GraduationCap, UserCog, User, Lock, ChevronRight, BadgeCheck } from 'lucide-react';
import { INITIAL_SCHOOL_DATA } from '../data/initialData';

const Login = ({ onLogin }) => {
    const [loginTab, setLoginTab] = useState('student'); // 'student' or 'admin'
    const [formData, setFormData] = useState({ username: '', password: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(loginTab, formData);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-slate-900 relative overflow-hidden flex flex-col justify-center items-center p-4 sm:p-8 font-sans no-scrollbar">

            {/* Elegant Architectural Background */}
            <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute left-0 right-0 top-[-10%] -z-10 m-auto h-[400px] w-[400px] rounded-full bg-blue-600 opacity-20 blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-[440px] bg-white rounded-[1.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-200 p-8 sm:p-10 z-10 flex flex-col relative overflow-hidden">
                {/* Subtle top line for premium feel */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800"></div>

                <div className="flex justify-center mb-6 mt-2">
                    <div className="w-20 h-20 bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center">
                        <img src={INITIAL_SCHOOL_DATA.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">e-QUEST {INITIAL_SCHOOL_DATA.name}</h1>
                    <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">
                        Smart Assessment System)
                    </p>
                </div>

                <div className="flex p-1 bg-slate-100 rounded-lg mb-8 w-full border border-slate-200/60 shadow-inner">
                    <button onClick={() => setLoginTab('student')} className={`flex-1 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${loginTab === 'student' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}> <GraduationCap size={16} /> Peserta </button>
                    <button onClick={() => setLoginTab('admin')} className={`flex-1 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${loginTab === 'admin' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}> <UserCog size={16} /> Edukator </button>
                </div>

                {loginTab === 'student' ? (
                    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in w-full">
                        <div className="space-y-1.5 text-left">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Nomor Induk Siswa</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input name="username" value={formData.username} onChange={handleChange} required placeholder="Masukkan NIS" className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-slate-800 font-semibold placeholder-slate-400 text-sm shadow-sm" />
                            </div>
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Kata Sandi</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-slate-800 font-semibold placeholder-slate-400 text-sm shadow-sm" />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all mt-6 text-sm flex justify-center items-center gap-2 uppercase tracking-widest">Akses Ujian <ChevronRight size={16} /></button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in w-full">
                        <div className="space-y-1.5 text-left">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Username Pengawas</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors" size={18} />
                                <input name="username" value={formData.username} onChange={handleChange} required placeholder="Masukkan username" className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition-all text-slate-800 font-semibold placeholder-slate-400 text-sm shadow-sm" />
                            </div>
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Kata Sandi</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors" size={18} />
                                <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition-all text-slate-800 font-semibold placeholder-slate-400 text-sm shadow-sm" />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all mt-6 text-sm flex justify-center items-center gap-2 uppercase tracking-widest">Masuk Panel <ChevronRight size={16} /></button>
                    </form>
                )}
            </div>
            <div className="w-full text-center mt-8 text-[10px] font-bold tracking-widest uppercase text-slate-400 z-10 opacity-70">
                e-Quest Premium CBT &copy; {new Date().getFullYear()} • Secure Access<br>By Mas Alfy | SD Negeri 2 Palapi</br>
            </div>
        </div>
    );
};

export default Login;
