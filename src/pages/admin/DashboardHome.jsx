import React, { useState, useEffect } from 'react';
import { Users, BookOpen, CheckCircle, School } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { QUOTES } from '../../data/initialData';

const DashboardHome = ({ schoolData, stats, activeExam, subjects, questions }) => {
    const [quote, setQuote] = useState("");

    useEffect(() => {
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Selamat Datang, {schoolData.adminName}</h2>
                    <div className="mt-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                        <p className="italic text-white/90 text-sm">"{quote}"</p>
                        <p className="text-xs text-white/70 mt-2 font-bold uppercase tracking-wider">Quote of the Day</p>
                    </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Total Kelas */}
                <Card className="flex items-center gap-4 p-6 border-l-4 border-l-purple-500 hover:scale-105 transition-transform duration-300 cursor-pointer shadow-md hover:shadow-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="bg-purple-100 p-4 rounded-xl text-purple-600">
                        <School size={32} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-bold uppercase">Total Kelas</div>
                        <div className="text-3xl font-bold text-gray-800">{stats.classes}</div>
                    </div>
                </Card>

                {/* 2. Total Murid */}
                <Card className="flex items-center gap-4 p-6 border-l-4 border-l-blue-500 hover:scale-105 transition-transform duration-300 cursor-pointer shadow-md hover:shadow-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
                        <Users size={32} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-bold uppercase">Total Murid</div>
                        <div className="text-3xl font-bold text-gray-800">{stats.students}</div>
                    </div>
                </Card>

                {/* 3. Total Mapel */}
                <Card className="flex items-center gap-4 p-6 border-l-4 border-l-orange-500 hover:scale-105 transition-transform duration-300 cursor-pointer shadow-md hover:shadow-xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <div className="bg-orange-100 p-4 rounded-xl text-orange-600">
                        <BookOpen size={32} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-bold uppercase">Total Mapel</div>
                        <div className="text-3xl font-bold text-gray-800">{stats.subjects}</div>
                    </div>
                </Card>

                {/* 4. Ujian Aktif */}
                <Card className="flex items-center gap-4 p-6 border-l-4 border-l-green-500 hover:scale-105 transition-transform duration-300 cursor-pointer shadow-md hover:shadow-xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <div className="bg-green-100 p-4 rounded-xl text-green-600">
                        <CheckCircle size={32} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-bold uppercase">Ujian Aktif</div>
                        <div className="text-lg font-bold text-green-600">{activeExam ? "ONLINE" : "OFFLINE"}</div>
                    </div>
                </Card>
            </div>
            {/* Question Bank Stats Chart */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-gray-800">Statistik Bank Soal</h3>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top 5 Mapel</div>
                </div>

                <div className="space-y-4">
                    {subjects && subjects.length > 0 ? (
                        (() => {
                            // Calculate counts per subject
                            const subjectCounts = subjects.map(s => {
                                const count = questions ? questions.filter(q => q.subjectId == s.id).length : 0;
                                return { name: s.name, count, code: s.code };
                            });

                            // Sort by count descending and take top 5
                            const topSubjects = subjectCounts.sort((a, b) => b.count - a.count).slice(0, 5);
                            const maxCount = Math.max(...topSubjects.map(s => s.count), 1); // Avoid division by zero

                            return topSubjects.map((s, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">{s.name}</span>
                                        <span className="font-bold text-gray-900">{s.count} Soal</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${(s.count / maxCount) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ));
                        })()
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">Belum ada data mata pelajaran.</div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default DashboardHome;
