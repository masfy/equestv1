import React, { useState } from 'react';
import { GraduationCap, UserCog, BadgeCheck } from 'lucide-react';
import TiltCard from '../components/layout/TiltCard';
import TiltLogo from '../components/layout/TiltLogo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { INITIAL_SCHOOL_DATA } from '../data/initialData';

const Login = ({ onLogin }) => {
    const [activeTab, setActiveTab] = useState('student'); // 'student' or 'admin'
    const [formData, setFormData] = useState({ username: '', password: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(activeTab, formData);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col p-4 font-sans relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-300/30 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-300/30 rounded-full blur-3xl" />

            <div className="flex-1 flex items-center justify-center z-10">
                <TiltCard>
                    {/* Left Side - Branding */}
                    <div className="md:w-1/2 bg-indigo-600 p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
                        <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-yellow-300 rounded-full blur-3xl opacity-30"></div>
                        <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-pink-300 rounded-full blur-3xl opacity-30"></div>

                        <TiltLogo logoUrl={INITIAL_SCHOOL_DATA.logo} />

                        <h1 className="text-2xl font-bold text-white mb-2 relative z-10">
                            {INITIAL_SCHOOL_DATA.name}
                        </h1>
                        <p className="text-indigo-100 font-medium relative z-10">
                            Computer Based Test (CBT)
                        </p>
                    </div>

                    {/* Right Side - Form */}
                    <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Selamat Datang</h2>
                        <p className="text-gray-400 mb-8 text-sm">
                            Silakan masuk untuk memulai sesi ujian.
                        </p>

                        {/* Tab Switcher */}
                        <div className="flex bg-indigo-50 p-1.5 rounded-2xl mb-8">
                            <button
                                onClick={() => setActiveTab('student')}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'student'
                                        ? 'bg-white shadow-sm text-indigo-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <GraduationCap size={18} /> MURID
                            </button>
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'admin'
                                        ? 'bg-white shadow-sm text-indigo-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <UserCog size={18} /> GURU
                            </button>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                            <Input
                                label={activeTab === 'student' ? 'NIS / Username' : 'Username Guru'}
                                name="username"
                                placeholder={activeTab === 'student' ? 'Contoh: 12345' : 'admin'}
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />

                            <Button
                                type="submit"
                                className="w-full py-4 rounded-2xl text-base shadow-lg mt-4"
                                variant={activeTab === 'student' ? 'primary' : 'primary'} // Can differentiate if needed
                            >
                                {activeTab === 'student' ? 'MASUK UJIAN' : 'AKSES DASHBOARD'}
                            </Button>
                        </form>
                    </div>
                </TiltCard>
            </div>

            {/* Footer */}
            <div className="text-center text-xs flex items-center justify-center gap-1.5 py-4 shrink-0 z-40 text-gray-500">
                <span>&copy; {new Date().getFullYear()} | CBT System by Mas Alfy</span>
                <BadgeCheck className="w-4 h-4 text-blue-500" />
            </div>
        </div>
    );
};

export default Login;
