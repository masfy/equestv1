import React from 'react';
import { FileText, Printer, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const DocumentsData = ({ activeExam, schoolData, students }) => {

    const printDocument = (title, content) => {
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; padding: 40px; }
                        .header { text-align: center; border-bottom: 3px double black; padding-bottom: 10px; margin-bottom: 20px; }
                        .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; }
                        .header h2 { margin: 5px 0; font-size: 16px; }
                        .header p { margin: 0; font-size: 12px; }
                        .title { text-align: center; font-weight: bold; text-decoration: underline; margin: 20px 0; font-size: 16px; text-transform: uppercase; }
                        .content { font-size: 14px; line-height: 1.6; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid black; padding: 8px; text-align: left; font-size: 12px; }
                        .footer { margin-top: 50px; display: flex; justify-content: space-between; }
                        .signature { text-align: center; width: 200px; }
                        .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; margin-bottom: 5px; }
                        .signature .nip { margin-top: 0; font-weight: normal; text-decoration: none; }
                        @media print {
                            @page { margin: 2cm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${schoolData.name}</h1>
                        <p>${schoolData.address}</p>
                    </div>
                    ${content}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    const handlePrintBeritaAcara = () => {
        if (!activeExam) return alert("Harap aktifkan ujian terlebih dahulu!");

        const content = `
            <div class="title">BERITA ACARA PELAKSANAAN UJIAN</div>
            <div class="content">
                <p>Pada hari ini <strong>${new Date().toLocaleDateString('id-ID', { weekday: 'long' })}</strong> tanggal <strong>${new Date().toLocaleDateString('id-ID')}</strong>, telah dilaksanakan ujian sekolah berbasis komputer (CBT) dengan rincian sebagai berikut:</p>
                <table>
                    <tr><td width="200">Mata Pelajaran</td><td>: <strong>${activeExam.subjectName}</strong></td></tr>
                    <tr><td>Kelas</td><td>: <strong>${activeExam.subjectClass || '-'}</strong></td></tr>
                    <tr><td>Waktu Mulai</td><td>: ${new Date(activeExam.startTime).toLocaleString('id-ID')}</td></tr>
                    <tr><td>Waktu Selesai</td><td>: ${new Date(activeExam.endTime).toLocaleString('id-ID')}</td></tr>
                    <tr><td>Jumlah Peserta Terdaftar</td><td>: ${students.length} Siswa</td></tr>
                    <tr><td>Jumlah Peserta Hadir</td><td>: .................... Siswa</td></tr>
                    <tr><td>Jumlah Peserta Tidak Hadir</td><td>: .................... Siswa</td></tr>
                </table>
                <p>Demikian berita acara ini dibuat dengan sesungguhnya untuk dapat dipergunakan sebagaimana mestinya.</p>
                
                <div class="footer">
                    <div class="signature">
                        Pengawas Ruang
                        <p class="name">${schoolData.teacherName}</p>
                        <p class="nip">NIP. ${schoolData.teacherNip}</p>
                    </div>
                    <div class="signature">
                        Kepala Sekolah
                        <p class="name">${schoolData.principalName}</p>
                        <p class="nip">NIP. ${schoolData.principalNip}</p>
                    </div>
                </div>
            </div>
        `;
        printDocument("Berita Acara", content);
    };

    const handlePrintDaftarHadir = () => {
        if (!activeExam) return alert("Harap aktifkan ujian terlebih dahulu!");

        const rows = students.map((s, i) => `
            <tr>
                <td style="text-align:center">${i + 1}</td>
                <td>${s.nis}</td>
                <td>${s.name}</td>
                <td>${s.class}</td>
                <td></td>
            </tr>
        `).join('');

        const content = `
            <div class="title">DAFTAR HADIR PESERTA UJIAN</div>
            <div class="content">
                <table>
                    <tr><td width="150">Mata Pelajaran</td><td>: <strong>${activeExam.subjectName}</strong></td></tr>
                    <tr><td>Kelas</td><td>: <strong>${activeExam.subjectClass || '-'}</strong></td></tr>
                    <tr><td>Hari/Tanggal</td><td>: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                </table>
                <table>
                    <thead>
                        <tr>
                            <th width="40" style="text-align:center">No</th>
                            <th width="100">NIS</th>
                            <th>Nama Peserta</th>
                            <th width="80">Kelas</th>
                            <th width="100">Tanda Tangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <div class="footer">
                    <div class="signature" style="margin-left: auto;">
                        Pengawas Ruang
                        <p class="name">${schoolData.teacherName}</p>
                        <p class="nip">NIP. ${schoolData.teacherNip}</p>
                    </div>
                </div>
            </div>
        `;
        printDocument("Daftar Hadir", content);
    };

    const handlePrintTataTertib = () => {
        const content = `
            <div class="title">TATA TERTIB PENGAWAS & PESERTA UJIAN</div>
            <div class="content">
                <h3>A. TATA TERTIB PESERTA UJIAN</h3>
                <ol>
                    <li>Peserta ujian wajib hadir di lokasi ujian 15 menit sebelum ujian dimulai.</li>
                    <li>Peserta ujian <strong>wajib membawa perangkat ujian sendiri (HP/Laptop)</strong>.</li>
                    <li>Peserta wajib memastikan baterai perangkat terisi penuh dan memiliki kuota internet yang cukup (jika tidak menggunakan WiFi sekolah).</li>
                    <li>Peserta disarankan mengaktifkan mode "Jangan Ganggu" (Do Not Disturb) pada HP untuk menghindari notifikasi yang dapat mengganggu ujian.</li>
                    <li>Peserta ujian menempati tempat duduk yang telah ditentukan sesuai dengan nomor peserta.</li>
                    <li>Peserta ujian mengisi Daftar Hadir yang disediakan oleh Pengawas.</li>
                    <li>Peserta ujian login ke aplikasi ujian menggunakan Username dan Password yang tertera pada Kartu Peserta.</li>
                    <li>Peserta ujian mulai mengerjakan soal setelah mendapat instruksi dari Pengawas atau tombol "Mulai" telah aktif.</li>
                    <li>Selama ujian berlangsung, peserta dilarang:
                        <ul>
                            <li><strong>Membuka aplikasi lain</strong> selain aplikasi ujian (Browser, WhatsApp, Game, dll).</li>
                            <li>Menanyakan jawaban soal kepada siapapun.</li>
                            <li>Bekerjasama dengan peserta lain.</li>
                            <li>Memberi atau menerima bantuan dalam menjawab soal.</li>
                            <li>Memperlihatkan pekerjaan sendiri kepada peserta lain atau melihat pekerjaan peserta lain.</li>
                            <li>Menggantikan atau digantikan oleh orang lain.</li>
                        </ul>
                    </li>
                    <li>Peserta yang telah selesai mengerjakan soal sebelum waktu ujian berakhir, diperbolehkan meninggalkan ruangan dengan tertib setelah mendapat izin dari Pengawas.</li>
                    <li>Apabila terjadi gangguan teknis (HP mati, sinyal hilang, dsb), peserta segera melapor kepada Pengawas.</li>
                </ol>

                <h3>B. TATA TERTIB PENGAWAS RUANG</h3>
                <ol>
                    <li>Pengawas ruang harus hadir di lokasi ujian 30 menit sebelum ujian dimulai.</li>
                    <li>Pengawas ruang menerima bahan ujian berupa Daftar Hadir dan Berita Acara Ujian.</li>
                    <li>Pengawas ruang memeriksa kesiapan ruang ujian dan perangkat komputer/laptop.</li>
                    <li>Pengawas ruang mempersilakan peserta memasuki ruang ujian dan menempati tempat duduk sesuai nomor urut.</li>
                    <li>Pengawas ruang membacakan Tata Tertib Peserta Ujian sebelum ujian dimulai.</li>
                    <li>Pengawas ruang memimpin doa sebelum ujian dimulai.</li>
                    <li>Pengawas ruang mengedarkan Daftar Hadir untuk ditandatangani oleh peserta.</li>
                    <li>Selama ujian berlangsung, Pengawas ruang wajib menjaga ketertiban dan ketenangan suasana ruang ujian.</li>
                    <li>Pengawas ruang dilarang memberi bantuan kepada peserta dalam menjawab soal ujian.</li>
                    <li>Setelah waktu ujian selesai, Pengawas ruang memastikan seluruh peserta telah melakukan "Logout" atau "Selesai".</li>
                </ol>
            </div>
            <div class="footer">
                <div class="signature" style="margin-left: auto;">
                    Kepala Sekolah
                    <p class="name">${schoolData.principalName}</p>
                    <p class="nip">NIP. ${schoolData.principalNip}</p>
                </div>
            </div>
        `;
        printDocument("Tata Tertib", content);
    };

    const handlePrintKartuLogin = () => {
        const cards = students.map(s => `
            <div style="border: 1px solid black; padding: 10px; width: 45%; float: left; margin: 5px; page-break-inside: avoid; height: 180px;">
                <div style="border-bottom: 1px solid black; padding-bottom: 5px; margin-bottom: 10px; text-align: center;">
                    <strong style="font-size: 14px;">KARTU LOGIN PESERTA</strong><br/>
                    <span style="font-size: 10px;">${schoolData.name}</span>
                </div>
                <table style="width: 100%; margin: 0; border: none;">
                    <tr><td style="border: none; padding: 2px; width: 60px;">Nama</td><td style="border: none; padding: 2px;">: <strong>${s.name}</strong></td></tr>
                    <tr><td style="border: none; padding: 2px;">Kelas</td><td style="border: none; padding: 2px;">: ${s.class}</td></tr>
                    <tr><td style="border: none; padding: 2px;">Username</td><td style="border: none; padding: 2px;">: <strong>${s.nis}</strong></td></tr>
                    <tr><td style="border: none; padding: 2px;">Password</td><td style="border: none; padding: 2px;">: <strong>${s.password}</strong></td></tr>
                </table>
                <div style="margin-top: 10px; text-align: center; font-size: 10px; font-style: italic;">
                    *Harap kartu ini dibawa saat ujian berlangsung.
                </div>
            </div>
        `).join('');

        const content = `
            <div class="content" style="overflow: hidden;">
                ${cards}
            </div>
        `;
        printDocument("Kartu Login", content);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Administrasi</h2>
                    <p className="text-gray-500">Cetak dokumen kelengkapan ujian sesuai sesi aktif.</p>
                </div>
            </div>

            {!activeExam && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-xl flex items-center gap-3 text-yellow-800 mb-6">
                    <AlertCircle size={24} />
                    <div>
                        <p className="font-bold">Tidak ada ujian yang aktif!</p>
                        <p className="text-sm">Dokumen spesifik (Berita Acara, Daftar Hadir) memerlukan sesi aktif. Tata Tertib & Kartu Login dapat dicetak kapan saja.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 hover:shadow-lg transition-all group cursor-pointer border-l-4 border-l-indigo-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <FileText size={24} />
                        </div>
                        <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">PDF</span>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">Berita Acara</h3>
                    <p className="text-sm text-gray-400 mb-6">Dokumen laporan pelaksanaan ujian.</p>
                    <Button onClick={handlePrintBeritaAcara} className="w-full gap-2 text-xs" disabled={!activeExam}>
                        <Printer size={14} /> Cetak Dokumen
                    </Button>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-all group cursor-pointer border-l-4 border-l-indigo-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <FileText size={24} />
                        </div>
                        <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">PDF</span>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">Daftar Hadir</h3>
                    <p className="text-sm text-gray-400 mb-6">List presensi peserta ujian.</p>
                    <Button onClick={handlePrintDaftarHadir} className="w-full gap-2 text-xs" disabled={!activeExam}>
                        <Printer size={14} /> Cetak Dokumen
                    </Button>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-all group cursor-pointer border-l-4 border-l-indigo-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <FileText size={24} />
                        </div>
                        <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">PDF</span>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">Tata Tertib</h3>
                    <p className="text-sm text-gray-400 mb-6">Peraturan untuk pengawas & peserta.</p>
                    <Button onClick={handlePrintTataTertib} className="w-full gap-2 text-xs">
                        <Printer size={14} /> Cetak Dokumen
                    </Button>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-all group cursor-pointer border-l-4 border-l-green-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-green-50 p-3 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <FileText size={24} />
                        </div>
                        <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">PDF</span>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1 group-hover:text-green-600 transition-colors">Kartu Login</h3>
                    <p className="text-sm text-gray-400 mb-6">Kartu akun untuk semua siswa.</p>
                    <Button onClick={handlePrintKartuLogin} className="w-full gap-2 text-xs bg-green-600 hover:bg-green-700 shadow-green-200">
                        <Printer size={14} /> Cetak Semua Kartu
                    </Button>
                </Card>
            </div>
        </div>
    );
};

export default DocumentsData;
