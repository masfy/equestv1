export const INITIAL_SCHOOL_DATA = {
    name: "SMA PGRI 268 JAKARTA",
    address: "Jl. Contoh No. 123, Jakarta",
    term: "Ganjil 2025/2026",
    adminName: "Bapak Guru Admin, S.Kom",
    adminUsername: "admin",
    adminPassword: "123",
    logo: "https://cdn-icons-png.flaticon.com/512/2995/2995459.png"
};

export const INITIAL_CLASSES = [
    { id: 1, name: "X MIPA 1", level: "10" },
    { id: 2, name: "X IPS 1", level: "10" },
    { id: 3, name: "XI MIPA 1", level: "11" },
    { id: 4, name: "XI IPS 1", level: "11" },
    { id: 5, name: "XII MIPA 1", level: "12" },
    { id: 6, name: "XII IPS 1", level: "12" },
];

export const INITIAL_SUBJECTS = [
    { id: 1, name: "Pendidikan Jasmani", code: "PJOK-12", class: "XII MIPA 1", questionCount: 40 },
    { id: 2, name: "Matematika Wajib", code: "MTK-W-12", class: "XII MIPA 1", questionCount: 35 },
    { id: 3, name: "Bahasa Indonesia", code: "BIND-11", class: "XI IPS 1", questionCount: 50 },
    { id: 4, name: "Biologi Peminatan", code: "BIO-P-10", class: "X MIPA 1", questionCount: 0 },
];

export const INITIAL_STUDENTS = [
    { id: 1, nis: '12345', name: 'Ahmad Dahlan', class: 'XII MIPA 1', password: '123' },
    { id: 2, nis: '12346', name: 'Budi Santoso', class: 'XII MIPA 1', password: '123' },
    { id: 3, nis: '12347', name: 'Citra Kirana', class: 'XII MIPA 1', password: '123' },
    { id: 4, nis: '12348', name: 'Dewi Sartika', class: 'XII IPS 1', password: '123' },
    { id: 5, nis: '12349', name: 'Eko Patrio', class: 'XII IPS 1', password: '123' },
];

export const INITIAL_QUESTIONS = [
    {
        id: 1,
        type: 'single',
        text: "Kesanggupan tubuh untuk melakukan aktivitas tanpa mengalami kelelahan yang berarti disebut ....",
        options: ["Biomekanika", "Fisiologis", "Kebugaran jasmani", "Unsur jasmani", "Fleksibilitas"],
        correct: 2
    },
    ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 4,
        type: 'single',
        text: `Soal simulasi nomor ${i + 4} untuk menguji tampilan scroll pada frame soal.`,
        options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D", "Pilihan E"],
        correct: 0
    }))
];

export const INITIAL_RESULTS = [
    { id: 1, studentName: 'Ahmad Dahlan', class: 'XII MIPA 1', subject: 'Pendidikan Jasmani', score: 85, submittedAt: '10:15' },
    { id: 2, studentName: 'Budi Santoso', class: 'XII MIPA 1', subject: 'Pendidikan Jasmani', score: 60, submittedAt: '10:20' },
    { id: 3, studentName: 'Citra Kirana', class: 'XII MIPA 1', subject: 'Matematika Wajib', score: 92, submittedAt: '09:55' },
    { id: 4, studentName: 'Dewi Sartika', class: 'XII IPS 1', subject: 'Bahasa Indonesia', score: 45, submittedAt: '10:30' },
];

export const QUOTES = [
    "Pendidikan adalah senjata paling mematikan di dunia.",
    "Belajarlah seolah engkau hidup selamanya.",
    "Tujuan pendidikan itu untuk mempertajam kecerdasan."
];
