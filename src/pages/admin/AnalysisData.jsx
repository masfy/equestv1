import React, { useState } from 'react';
import { Filter, Printer, Download, BookOpen } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const AnalysisData = ({ results, classes, subjects, schoolData }) => {
    const [filterClass, setFilterClass] = useState('');
    const [filterSubject, setFilterSubject] = useState('');

    const filteredResults = results.filter(res => {
        const resultClass = res.studentClass || res.class;
        const matchClass = filterClass ? resultClass === filterClass : true;
        const matchSubject = filterSubject ? res.subject === filterSubject : true;
        return matchClass && matchSubject;
    });

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        const headers = ["Rank,Nama,Kelas,Mata Pelajaran,Waktu,Nilai,Status"];
        const rows = filteredResults.sort((a, b) => b.score - a.score).map((res, idx) => {
            const status = res.score >= 75 ? "LULUS" : "REMEDIAL";
            return `${idx + 1},"${res.studentName}","${res.studentClass || res.class || '-'}","${res.subject}",${res.submittedAt},${res.score},${status}`;
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Nilai_Ujian.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert("Data nilai berhasil diunduh!");
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h3 className="font-bold text-xl text-gray-800">Laporan Hasil Ujian</h3>
                <p className="text-gray-500 text-sm">Filter data untuk mencetak laporan spesifik</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex gap-3 flex-1">
                    <div className="relative flex-1">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            className="w-full pl-10 p-2.5 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-100"
                            value={filterClass}
                            onChange={e => setFilterClass(e.target.value)}
                        >
                            <option value="">Semua Kelas</option>
                            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="relative flex-1">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            className="w-full pl-10 p-2.5 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-100"
                            value={filterSubject}
                            onChange={e => setFilterSubject(e.target.value)}
                        >
                            <option value="">Semua Mapel</option>
                            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handlePrint} className="gap-2">
                        <Printer size={16} /> Cetak
                    </Button>
                    <Button onClick={handleExportExcel} className="gap-2 bg-green-600 hover:bg-green-700 shadow-green-200">
                        <Download size={16} /> Excel
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-0 shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b">
                            <tr>
                                <th className="p-4 w-16 text-center">No</th>
                                <th className="p-4">Nama Murid</th>
                                <th className="p-4">Kelas</th>
                                <th className="p-4">Mata Pelajaran</th>
                                <th className="p-4 text-center">Nilai</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredResults.length > 0 ? (
                                filteredResults.sort((a, b) => b.score - a.score).map((res, i) => (
                                    <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-center text-gray-500 font-bold">{i + 1}</td>
                                        <td className="p-4 font-medium text-gray-900">{res.studentName}</td>
                                        <td className="p-4 text-gray-500">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{res.studentClass || res.class || '-'}</span>
                                        </td>
                                        <td className="p-4 text-gray-500">{res.subject}</td>
                                        <td className="p-4 text-center font-bold text-lg">{res.score.toFixed(0)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${res.score >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {res.score >= 75 ? 'LULUS' : 'REMEDIAL'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400">
                                        Tidak ada data nilai ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Signature Section (Print Only) */}
            <div className="hidden print:flex justify-between mt-12 px-8">
                <div className="text-center">
                    <p className="mb-20">Mengetahui,<br />Kepala Sekolah</p>
                    <p className="font-bold underline">{schoolData?.principalName || '.........................'}</p>
                    <p>NIP. {schoolData?.principalNip || '.........................'}</p>
                </div>
                <div className="text-center">
                    <p className="mb-20">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />Pengawas Ruang</p>
                    <p className="font-bold underline">{schoolData?.teacherName || '.........................'}</p>
                    <p>NIP. {schoolData?.teacherNip || '.........................'}</p>
                </div>
            </div>
        </div>
    );
};

export default AnalysisData;
