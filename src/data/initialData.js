export const INITIAL_SCHOOL_DATA = {
    name: "SD Negeri 2 Palapi",
    address: "Jl. Pendidikan Cerdas No. 1, Jakarta Selatan",
    semester: "Ganjil",
    academicYear: "2025/2026",
    term: "Ganjil 2025/2026",
    adminName: "Bapak Guru Admin, S.Kom",
    adminUsername: "admin",
    adminPassword: "123",
    logo: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhkZZ6nl3Pq7mFou917u9D1yJnyd4AmsDSQI4VyCjaktVQOk6Yj0teuLBiiyBeiyyKhhbBRC5SJW9Ml6QZZ5vlH-ZlR1lrrKO6auMpiFZrs_DC-VINjninMxAh57pj7yVza53Z2qgyUKiGw8RWviLJ8_Cvl_DamdXJG_OVk_CYc8iwVa4BReULUElQxinWK/s16000/logo%20e-quest.png",
    apiKey: "",
    aiModel: "gemini-1.5-flash",
    optionCount: 5
};

export const INITIAL_TEACHERS = [
    { 
        id: 101, 
        name: "Budi Santoso, S.Pd", 
        username: "guru1", 
        password: "123",
        teacherType: "guru_mapel",
        subjectName: "Matematika",
        assignedClasses: ["Kelas 6A", "Kelas 6B"]
    },
    { 
        id: 102, 
        name: "Siti Aminah, M.Pd", 
        username: "guru2", 
        password: "123",
        teacherType: "guru_kelas",
        assignedClass: "Kelas 6A",
        assignedClasses: ["Kelas 6A"],
        subjectName: ""
    }
];

export const INITIAL_CLASSES = [
    { id: 1, name: "Kelas 6A", level: "6", academicYear: "2025/2026" },
    { id: 2, name: "Kelas 6B", level: "6", academicYear: "2025/2026" },
    { id: 3, name: "Kelas 5A", level: "5", academicYear: "2025/2026" },
    { id: 4, name: "Kelas 5A (Arsip)", level: "5", academicYear: "2024/2025" },
];

export const INITIAL_SUBJECTS = [
    { id: 1, name: "Matematika", code: "MTK-6A", class: "Kelas 6A", academicYear: "2025/2026", teacherId: 101, questionCount: 40 },
    { id: 2, name: "Ilmu Pengetahuan Alam", code: "IPA-6A", class: "Kelas 6A", academicYear: "2025/2026", teacherId: 102, questionCount: 35 },
    { id: 3, name: "Pendidikan Jasmani", code: "PJOK-5A", class: "Kelas 5A", academicYear: "2025/2026", teacherId: 101, questionCount: 20 },
    { id: 4, name: "Matematika", code: "MTK-6B", class: "Kelas 6B", academicYear: "2025/2026", teacherId: 101, questionCount: 15 },
    { id: 5, name: "Matematika", code: "MTK-5A-24", class: "Kelas 5A (Arsip)", academicYear: "2024/2025", teacherId: 101, questionCount: 25 },
];

export const INITIAL_STUDENTS = [
    { id: 1, nis: '12345', name: 'Ahmad Dahlan', class: 'XII MIPA 1', password: '123' },
    { id: 2, nis: '12346', name: 'Budi Santoso', class: 'XII MIPA 1', password: '123' },
    { id: 3, nis: '12347', name: 'Citra Kirana', class: 'XII MIPA 1', password: '123' },
    { id: 4, nis: '12348', name: 'Dewi Sartika', class: 'XII IPS 1', password: '123' },
    { id: 5, nis: '12349', name: 'Eko Patrio', class: 'XII IPS 1', password: '123' },
];

export const INITIAL_STIMULI = [
    {
        id: 1,
        title: "Wacana: Hutan Mangrove Pelindung Pesisir",
        type: "text",
        content: "Hutan mangrove atau hutan bakau merupakan ekosistem khas di daerah muara sungai dan pantai berlumpur. Sistem perakaran bakau yang kokoh terbukti mampu meredam energi gelombang ombak hingga 66%, mencegah abrasi tanah pantai, dan menjadi tempat pemijahan (nursery ground) bagi berbagai jenis udang dan ikan karang muda.",
        imageUrl: "",
        tableData: [],
        source: "Modul Literasi Sains SD",
        subjectId: 2,
        createdAt: "2026-11-20T08:00:00Z"
    },
    {
        id: 2,
        title: "Tabel Data: Percobaan Kecepatan Tumbuh Kecambah",
        type: "table",
        content: "Sekelompok siswa kelas 6 melakukan uji coba perkecambahan biji kacang hijau selama 5 hari dengan variasi intensitas cahaya matahari. Berikut adalah tabel catatan pengamatan tinggi batang (cm):",
        imageUrl: "",
        tableData: [
            ["Hari Ke-", "Kondisi Terang (cm)", "Kondisi Redup (cm)", "Kondisi Gelap (cm)"],
            ["Hari 1", "0.4", "0.6", "0.9"],
            ["Hari 2", "1.1", "1.8", "2.5"],
            ["Hari 3", "2.3", "3.6", "5.1"],
            ["Hari 4", "3.7", "5.4", "7.8"],
            ["Hari 5", "5.2", "7.1", "10.4"]
        ],
        source: "Buku Praktikum Sains Tematik",
        subjectId: 1,
        createdAt: "2026-11-20T08:30:00Z"
    },
    {
        id: 3,
        title: "Infografis: Siklus Metamorfosis Kupu-Kupu",
        type: "image",
        content: "Perhatikan bagan daur hidup metamorfosis sempurna berikut untuk menjawab soal nomor di bawah ini:",
        imageUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&q=80&w=700",
        tableData: [],
        source: "Ensiklopedia Biologi Nusantara",
        subjectId: 2,
        createdAt: "2026-11-20T09:00:00Z"
    }
];

export const INITIAL_QUESTIONS = [
    {
        id: 1,
        type: 'single',
        text: "Kesanggupan tubuh untuk melakukan aktivitas tanpa mengalami kelelahan yang berarti disebut ....",
        options: ["Biomekanika", "Fisiologis", "Kebugaran jasmani", "Unsur jasmani", "Fleksibilitas"],
        correct: 2,
        semester: "Ganjil",
        academicYear: "2025/2026"
    },
    ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 4,
        type: 'single',
        text: `Soal simulasi nomor ${i + 4} untuk menguji tampilan scroll pada frame soal.`,
        options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D", "Pilihan E"],
        correct: 0,
        semester: "Ganjil",
        academicYear: "2025/2026"
    }))
];

export const INITIAL_RESULTS = [
    { id: 1, studentName: 'Ahmad Dahlan', class: 'XII MIPA 1', subject: 'Pendidikan Jasmani', score: 85, submittedAt: '10:15', semester: "Ganjil", academicYear: "2025/2026" },
    { id: 2, studentName: 'Budi Santoso', class: 'XII MIPA 1', subject: 'Pendidikan Jasmani', score: 60, submittedAt: '10:20', semester: "Ganjil", academicYear: "2025/2026" },
    { id: 3, studentName: 'Citra Kirana', class: 'XII MIPA 1', subject: 'Matematika Wajib', score: 92, submittedAt: '09:55', semester: "Ganjil", academicYear: "2025/2026" },
    { id: 4, studentName: 'Dewi Sartika', class: 'XII IPS 1', subject: 'Bahasa Indonesia', score: 45, submittedAt: '10:30', semester: "Ganjil", academicYear: "2025/2026" },
];

export const QUOTES = [
    "Pendidikan adalah senjata paling mematikan di dunia.",
    "Belajarlah seolah engkau hidup selamanya.",
    "Tujuan pendidikan itu untuk mempertajam kecerdasan."
];
