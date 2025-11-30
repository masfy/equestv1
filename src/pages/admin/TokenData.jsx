import React, { useState } from 'react';
import { Key, RefreshCw, Power, CheckCircle, AlertCircle, Calendar, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../services/api';

const TokenData = ({ activeExam, subjects, students, onToggleExam, onRegenerateToken }) => {
    // Local state for form
    const [selectedSubject, setSelectedSubject] = useState(activeExam?.subjectId || '');
    const [startTime, setStartTime] = useState(activeExam?.startTime || '');
    const [endTime, setEndTime] = useState(activeExam?.endTime || '');

    const handleActivate = () => {
        if (!selectedSubject || !startTime || !endTime) {
            alert("Mohon lengkapi mata pelajaran dan waktu ujian!");
            return;
        }
        const subject = subjects.find(s => s.id.toString() === selectedSubject.toString());
        onToggleExam({
            subjectId: subject.id,
            subjectName: subject.name,
            subjectClass: subject.class,
            startTime,
            endTime
        });
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-800">Jadwal & Token Ujian</h2>
                <p className="text-gray-500">Atur jadwal ujian dan kelola token akses.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* STATUS CARD */}
                <Card className={`border-t-4 ${activeExam?.status === 'ACTIVE' ? 'border-t-green-500' : 'border-t-red-500'} shadow-xl h-full`}>
                    <CardHeader className="text-center pb-2">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${activeExam?.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {activeExam?.status === 'ACTIVE' ? <CheckCircle size={32} /> : <Power size={32} />}
                        </div>
                        <CardTitle className="text-xl">
                            Status: <span className={activeExam?.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>
                                {activeExam?.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 text-center">
                        {activeExam?.status === 'ACTIVE' ? (
                            <>
                                <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-300 space-y-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Token Ujian</p>
                                    <div className="text-5xl font-black text-gray-800 tracking-widest font-mono select-all">
                                        {activeExam.token}
                                    </div>
                                    <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                                        <RefreshCw size={10} className="animate-spin" /> Auto-refresh
                                    </p>
                                </div>
                                <div className="text-left space-y-2 text-sm bg-blue-50 p-4 rounded-xl text-blue-800">
                                    <div className="flex justify-between">
                                        <span className="text-blue-500">Mapel:</span>
                                        <span className="font-bold">{activeExam.subjectName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-500">Kelas:</span>
                                        <span className="font-bold">{activeExam.subjectClass || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-500">Mulai:</span>
                                        <span className="font-bold">{new Date(activeExam.startTime).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-500">Selesai:</span>
                                        <span className="font-bold">{new Date(activeExam.endTime).toLocaleString()}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-red-50 p-6 rounded-xl flex flex-col items-center gap-2 text-red-800">
                                <AlertCircle size={24} />
                                <p className="font-medium text-sm">Ujian belum diaktifkan.</p>
                            </div>
                        )}

                        {activeExam?.status === 'ACTIVE' && (
                            <Button
                                onClick={onRegenerateToken}
                                variant="secondary"
                                className="w-full gap-2"
                            >
                                <RefreshCw size={16} /> Generate Token Baru
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* SETTINGS CARD */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Pengaturan Sesi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2">Mata Pelajaran</label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                disabled={activeExam?.status === 'ACTIVE'}
                                className="w-full p-3 border-2 border-transparent bg-gray-50 rounded-xl outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50"
                            >
                                <option value="">-- Pilih Mapel --</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2">Waktu Mulai</label>
                            <Input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                disabled={activeExam?.status === 'ACTIVE'}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2">Waktu Selesai</label>
                            <Input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                disabled={activeExam?.status === 'ACTIVE'}
                            />
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={activeExam?.status === 'ACTIVE' ? () => onToggleExam(null) : handleActivate}
                                className={`w-full py-4 text-lg ${activeExam?.status === 'ACTIVE'
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                    }`}
                            >
                                {activeExam?.status === 'ACTIVE' ? 'Hentikan Sesi Ujian' : 'Aktifkan Sesi Ujian'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* MONITORING SECTION */}
            {activeExam?.status === 'ACTIVE' && (
                <MonitoringSection
                    token={activeExam.token}
                    students={students}
                    targetClass={activeExam.subjectClass}
                />
            )}
        </div>
    );
};

// Sub-component for Monitoring to keep main component clean
const MonitoringSection = ({ token, students, targetClass }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Poll every 10 seconds
    React.useEffect(() => {
        const fetchSessions = async () => {
            try {
                const data = await api.getExamSessions(token);
                setSessions(data);
                setLastUpdate(new Date());
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch sessions", error);
            }
        };

        fetchSessions(); // Initial fetch
        const interval = setInterval(fetchSessions, 10000); // Poll every 10s

        return () => clearInterval(interval);
    }, [token]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'LOGIN': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">Sedang Login</span>;
            case 'WORKING': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">Mengerjakan</span>;
            case 'FINISHED': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Selesai</span>;
            case 'VIOLATION': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">PELANGGARAN</span>;
            default: return <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs font-bold">Belum Login</span>;
        }
    };

    // Filter students by class and merge with session data
    const classStudents = students.filter(s => s.class === targetClass);

    const monitoringData = classStudents.map(student => {
        const session = sessions.find(s => s.nis.toString() === student.nis.toString());
        return {
            ...student,
            status: session ? session.status : 'NOT_LOGGED_IN',
            lastUpdate: session ? session.timestamp : null
        };
    });

    return (
        <Card className="border-t-4 border-t-indigo-500 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Monitor Peserta Ujian ({targetClass})</CardTitle>
                    <p className="text-sm text-gray-500">Data diperbarui setiap 10 detik. Terakhir: {lastUpdate.toLocaleTimeString()}</p>
                </div>
                {loading && <RefreshCw size={20} className="animate-spin text-indigo-500" />}
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b">
                            <tr>
                                <th className="p-4 w-16 text-center">No</th>
                                <th className="p-4">NIS</th>
                                <th className="p-4">Nama Peserta</th>
                                <th className="p-4 text-center">Waktu Update</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {monitoringData.length > 0 ? (
                                monitoringData.map((s, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="p-4 text-center text-gray-500 font-bold">{i + 1}</td>
                                        <td className="p-4 font-mono text-sm">{s.nis}</td>
                                        <td className="p-4 font-medium">{s.name}</td>
                                        <td className="p-4 text-center text-xs text-gray-400">
                                            {s.lastUpdate ? new Date(s.lastUpdate).toLocaleTimeString() : '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(s.status)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">
                                        Tidak ada siswa di kelas ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default TokenData;
