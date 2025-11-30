import React, { useState, useEffect } from 'react';
import {
  User, Key, ChevronRight, CheckCircle, LogOut,
  LayoutDashboard, Lock, BadgeCheck, CheckSquare,
  X, AlertCircle, Menu, ChevronLeft
} from 'lucide-react';

// Pages & Components
import StudentDashboard from './pages/student/StudentDashboard';
import ExamRunner from './pages/student/ExamRunner';
import TiltCard from './components/layout/TiltCard';
import AdminSidebar from './components/layout/AdminSidebar';

// Admin Pages
import DashboardHome from './pages/admin/DashboardHome';
import SchoolData from './pages/admin/SchoolData';
import ClassesData from './pages/admin/ClassesData';
import StudentsData from './pages/admin/StudentsData';
import SubjectsData from './pages/admin/SubjectsData';
import QuestionBank from './pages/admin/QuestionBank';
import TokenData from './pages/admin/TokenData';
import AnalysisData from './pages/admin/AnalysisData';
import DocumentsData from './pages/admin/DocumentsData';

import { api } from './services/api';

// --- INITIAL DATA ---
const INITIAL_SCHOOL_DATA = {
  name: "SD Negeri 2 Palapi",
  address: "Jl. Contoh No. 123, Jakarta",
  term: "Ganjil 2025/2026",
  principalName: "Drs. H. Kepala Sekolah, M.Pd",
  principalNip: "19700101 199501 1 001",
  teacherName: "Mas Alfy, S.Kom",
  teacherNip: "19900101 201501 1 002",
  adminUsername: "admin",
  adminPassword: "123",
  logo: "https://cdn-icons-png.flaticon.com/512/2995/2995459.png"
};

const QUOTES = [
  "Pendidikan adalah senjata paling mematikan di dunia.",
  "Belajarlah seolah engkau hidup selamanya.",
  "Tujuan pendidikan itu untuk mempertajam kecerdasan."
];

// --- UTILITY COMPONENTS ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgClass = type === 'success' ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-100 border-red-200 text-red-800';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg mb-3 animate-slide-in-right ${bgClass} min-w-[300px]`}>
      <Icon size={20} />
      <span className="font-medium text-sm flex-1">{message}</span>
      <button onClick={onClose}><X size={16} className="opacity-50 hover:opacity-100" /></button>
    </div>
  );
};

const CopyrightFooter = ({ className = "", theme = "light" }) => (
  <div className={`text-center text-xs flex items-center justify-center gap-1.5 py-4 shrink-0 z-40 print:hidden ${theme === 'dark'
    ? 'text-blue-900/60 bg-transparent'
    : 'text-gray-600 border-t border-gray-200 bg-white'
    } ${className}`}>
    <span>&copy; {new Date().getFullYear()} | CBT System by Mas Alfy</span>
    <div className="relative flex items-center justify-center w-4 h-4">
      <div className={`absolute inset-0 rounded-full m-[2px] ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}></div>
      <BadgeCheck className={`w-5 h-5 relative z-10 ${theme === 'dark' ? 'text-blue-500 fill-blue-100' : 'text-white fill-blue-500'}`} />
    </div>
  </div>
);

export default function App() {
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [toasts, setToasts] = useState([]);

  // Data State
  const [schoolData, setSchoolData] = useState(INITIAL_SCHOOL_DATA);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [activeExam, setActiveExam] = useState(null);

  // UI State
  const [adminMenu, setAdminMenu] = useState('dashboard');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Student State
  const [studentStep, setStudentStep] = useState('token');
  const [studentScore, setStudentScore] = useState(0);

  // Helper Functions
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const renderNotifications = () => (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );

  // Fetch Data
  const fetchData = async () => {

    try {
      console.log("Fetching data...");
      const data = await api.getAllData();
      console.log("Data received:", data);
      if (data && data.questions) {
        console.log("First fetched question:", data.questions[0]);
        console.log("Does it have subjectId?", data.questions[0]?.subjectId);
      }
      if (data) {
        const fetchedSchool = data.schoolData || {};
        setSchoolData({
          ...INITIAL_SCHOOL_DATA,
          ...fetchedSchool,
          // Ensure credentials don't get overwritten by empty strings
          adminUsername: fetchedSchool.adminUsername || INITIAL_SCHOOL_DATA.adminUsername,
          adminPassword: fetchedSchool.adminPassword || INITIAL_SCHOOL_DATA.adminPassword
        });
        setClasses(data.classes || []);
        console.log("Fetched Classes:", data.classes);
        setStudents(data.students || []);
        console.log("Fetched Students:", data.students);
        setSubjects(data.subjects || []);

        // Recover subjectId from tags if missing (Workaround for backend issue)
        // Recover subjectId from tags if missing (Workaround for backend issue)
        const hydratedQuestions = (data.questions || []).map(q => {
          let tags = q.tags;
          // Handle case where tags come back as a comma-separated string from Sheets
          if (typeof tags === 'string') {
            tags = tags.split(',').map(t => t.trim());
          } else if (!Array.isArray(tags)) {
            tags = [];
          }

          if (!q.subjectId && tags.length > 0) {
            const sidTag = tags.find(t => typeof t === 'string' && t.startsWith('__sid:'));
            if (sidTag) {
              return { ...q, subjectId: sidTag.split(':')[1], tags };
            }
          }
          return { ...q, tags };
        });
        setQuestions(hydratedQuestions);

        setResults(data.results || []);
        setActiveExam(data.activeExam || null);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      showToast("Gagal memuat data. Menggunakan data lokal.", "error");
      return null;
    } finally {

    }
    return data; // Return data for caller
  };

  const refreshExamStatus = async () => {
    const status = await api.getExamStatus();
    if (status) {
      setActiveExam(status);
      return { activeExam: status };
    }
    return null;
  };

  useEffect(() => {
    fetchData();
    // Check localStorage for login persistence
    const savedRole = localStorage.getItem('cbt_role');
    const savedUser = localStorage.getItem('cbt_user');
    if (savedRole && savedUser) {
      setRole(savedRole);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Token Regen - Auto refresh disabled by user request
  // useEffect(() => { ... }, [activeExam]);

  // --- HANDLERS ---

  const handleLogout = () => {
    setRole(null);
    setCurrentUser(null);
    localStorage.removeItem('cbt_role');
    localStorage.removeItem('cbt_user');
    showToast("Berhasil keluar!", "success");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const user = formData.get('username').trim();
    const pass = formData.get('password').trim();

    // Fix: Ensure comparison handles number vs string from Sheets
    const isAdminMatch = (user === schoolData.adminUsername && String(pass) === String(schoolData.adminPassword));
    const isDefaultAdmin = (user === 'admin' && pass === '123');

    if (isAdminMatch || isDefaultAdmin) {
      setRole('admin');
      const adminUser = { name: schoolData.teacherName || "Admin", role: 'admin' };
      setCurrentUser(adminUser);
      localStorage.setItem('cbt_role', 'admin');
      localStorage.setItem('cbt_user', JSON.stringify(adminUser));
      showToast("Login Berhasil!", "success");
    } else {
      // Check student login
      const student = students.find(s => s.nis == user && String(s.password) === String(pass));
      if (student) {
        setRole('student');
        setCurrentUser(student);
        localStorage.setItem('cbt_role', 'student');
        localStorage.setItem('cbt_user', JSON.stringify(student));
        showToast(`Selamat datang, ${student.name}!`, "success");
      } else {
        showToast("Username atau password salah!", "error");
      }
    }
  };

  // School Data Handlers
  const handleSaveSchool = async (newData) => {
    setSchoolData(prev => ({ ...prev, ...newData }));
    await api.saveSchool(newData);
    showToast("Data sekolah berhasil disimpan!", "success");
  };

  // Student Handlers
  const handleAddStudent = async (data) => {
    const newStudent = { ...data, id: Date.now() };
    setStudents(prev => [...prev, newStudent]);
    await api.saveStudent(newStudent);
    showToast("Murid berhasil ditambahkan!", "success");
  };

  const handleEditStudent = async (data) => {
    setStudents(prev => prev.map(s => s.id === data.id ? data : s));
    await api.saveStudent(data);
    showToast("Data murid berhasil diperbarui!", "success");
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm("Yakin ingin menghapus data ini?")) {
      setStudents(prev => prev.filter(s => s.id !== id));
      await api.deleteStudent(id);
      showToast("Murid berhasil dihapus!", "success");
    }
  };

  const handleImportStudent = (type) => {
    showToast(`Fitur Import ${type} akan segera hadir!`, "info");
  };

  // Class Handlers
  const handleAddClass = async (data) => {
    const newClass = { ...data, id: Date.now() };
    setClasses(prev => [...prev, newClass]);
    await api.saveClass(newClass);
    showToast("Kelas berhasil ditambahkan!", "success");
  };

  const handleEditClass = async (data) => {
    setClasses(prev => prev.map(c => c.id === data.id ? data : c));
    await api.saveClass(data);
    showToast("Data kelas berhasil diperbarui!", "success");
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm("Yakin ingin menghapus kelas ini?")) {
      setClasses(prev => prev.filter(c => c.id !== id));
      await api.deleteClass(id);
      showToast("Kelas berhasil dihapus!", "success");
    }
  };

  // Subject Handlers
  const handleAddSubject = async (data) => {
    const newSubject = { ...data, id: Date.now() };
    setSubjects(prev => [...prev, newSubject]);
    await api.saveSubject(newSubject);
    showToast("Mapel berhasil ditambahkan!", "success");
  };

  const handleEditSubject = async (data) => {
    setSubjects(prev => prev.map(s => s.id === data.id ? data : s));
    await api.saveSubject(data);
    showToast("Data mapel berhasil diperbarui!", "success");
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm("Yakin ingin menghapus mapel ini?")) {
      setSubjects(prev => prev.filter(s => s.id !== id));
      await api.deleteSubject(id);
      showToast("Mapel berhasil dihapus!", "success");
    }
  };

  // Question Handlers
  const handleAddQuestion = async (data) => {
    const newQuestion = { ...data, id: data.id || (Date.now() + Math.random()) };
    setQuestions(prev => [...prev, newQuestion]);
    await api.saveQuestion(newQuestion);
    showToast("Soal berhasil ditambahkan!", "success");
  };

  const handleBatchAddQuestions = async (newQuestions) => {
    // Optimistic update
    setQuestions(prev => [...prev, ...newQuestions]);
    showToast(`Menyimpan ${newQuestions.length} soal...`, "info");

    await api.saveQuestions(newQuestions);
    showToast("Semua soal berhasil disimpan!", "success");
  };

  const handleEditQuestion = async (data) => {
    setQuestions(prev => prev.map(q => q.id === data.id ? data : q));
    await api.saveQuestion(data);
    showToast("Soal berhasil diperbarui!", "success");
  };

  const handleDeleteQuestion = async (id) => {
    if (window.confirm("Yakin ingin menghapus soal ini?")) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      await api.deleteQuestion(id);
      showToast("Soal berhasil dihapus!", "success");
    }
  };

  // Exam/Token Handlers
  const handleToggleExam = async (examData) => {
    if (activeExam?.status === 'ACTIVE') {
      // Deactivate
      setActiveExam(prev => ({ ...prev, status: 'INACTIVE' }));
      await api.deactivateExam();
      showToast("Ujian DINONAKTIFKAN!", "info");
    } else {
      // Activate
      if (!examData) return; // Should not happen
      const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newExamState = {
        ...examData,
        status: 'ACTIVE',
        token: newToken,
        tokenGeneratedAt: Date.now()
      };
      setActiveExam(newExamState);
      await api.activateExam(newExamState);
      showToast("Ujian DIAKTIFKAN!", "success");
    }
  };

  const handleRegenerateToken = async () => {
    const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    const updatedExam = { ...activeExam, token: newToken, tokenGeneratedAt: Date.now() };
    setActiveExam(updatedExam);
    await api.activateExam(updatedExam); // Persist to backend
    showToast("Token baru berhasil digenerate!", "success");
  };

  // Student Exam Handlers
  const handleStudentFinish = async (answers, randomizedQuestions) => {
    // Calculate score
    let correctCount = 0;

    // We must iterate through the randomized questions used in the exam
    // and compare the answer given for that specific question index
    randomizedQuestions.forEach((q, idx) => {
      const answer = answers[idx];

      if (q.type === 'complex') {
        // Complex: answer is array of booleans. Must match q.correct array exactly.
        if (Array.isArray(answer) && Array.isArray(q.correct) &&
          answer.length === q.correct.length &&
          answer.every((val, i) => val === q.correct[i])) {
          correctCount++;
        }
      } else if (q.type === 'mcma') {
        // MCMA: answer is array of indices. Must match q.correct array exactly (sort both to be safe).
        if (Array.isArray(answer) && Array.isArray(q.correct)) {
          const sortedAns = [...answer].sort();
          const sortedCorr = [...q.correct].sort();
          if (sortedAns.length === sortedCorr.length &&
            sortedAns.every((val, i) => val === sortedCorr[i])) {
            correctCount++;
          }
        }
      } else {
        // Single: answer is index. Simple equality.
        if (answer === q.correct) correctCount++;
      }
    });

    const score = (correctCount / randomizedQuestions.length) * 100;
    setStudentScore(score);
    setStudentStep('result');

    // Submit to API
    const newResult = {
      id: Date.now(),
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentClass: currentUser.class,
      subject: activeExam.subjectName,
      score: score,
      date: new Date().toISOString()
    };

    setResults(prev => [...prev, newResult]);

    await api.submitExam({
      ...newResult,
      answers: answers
    });
  };

  // --- RENDER ---

  if (role === 'student') {
    return (
      <>
        {renderNotifications()}
        {studentStep === 'token' ? (
          <StudentDashboard
            user={currentUser}
            activeExam={activeExam}
            onStartExam={() => setStudentStep('exam')}
            onLogout={handleLogout}
            onRefresh={refreshExamStatus}
          />
        ) : studentStep === 'exam' ? (
          <ExamRunner
            user={currentUser}
            exam={activeExam}
            questions={questions}
            onFinish={handleStudentFinish}
          />
        ) : (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl text-center space-y-6 max-w-md w-full">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-3xl font-bold">Ujian Selesai</h2>
              <div className="bg-gray-50 p-6 rounded-2xl">
                <div className="text-sm text-gray-500 uppercase">Nilai Kamu</div>
                <div className="text-5xl font-bold text-indigo-600">{studentScore.toFixed(0)}</div>
              </div>
              <button onClick={handleLogout} className="w-full bg-gray-900 text-white py-4 rounded-xl">Keluar</button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex font-sans overflow-hidden">
        {renderNotifications()}
        <AdminSidebar
          adminMenu={adminMenu}
          setAdminMenu={setAdminMenu}
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
          onLogout={handleLogout}
        />
        <main className={`flex-1 flex flex-col h-screen transition-all duration-300 overflow-hidden ${sidebarExpanded ? 'ml-64' : 'ml-20'}`}>
          <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
            {adminMenu === 'dashboard' && (
              <DashboardHome
                schoolData={schoolData}
                stats={{
                  students: students.length,
                  subjects: subjects.length,
                  questions: questions.length,
                  classes: classes.length
                }}
                activeExam={activeExam}
                subjects={subjects}
                questions={questions}
                classes={classes}
              />
            )}
            {adminMenu === 'school' && (
              <SchoolData
                data={schoolData}
                onSave={handleSaveSchool}
              />
            )}
            {adminMenu === 'classes' && (
              <ClassesData
                classes={classes}
                onAdd={handleAddClass}
                onEdit={handleEditClass}
                onDelete={handleDeleteClass}
                onImport={handleImportStudent}
              />
            )}
            {adminMenu === 'students' && (
              <StudentsData
                students={students}
                classes={classes}
                onAdd={handleAddStudent}
                onEdit={handleEditStudent}
                onDelete={handleDeleteStudent}
                onImport={handleImportStudent}
              />
            )}
            {adminMenu === 'subjects' && (
              <SubjectsData
                subjects={subjects}
                classes={classes}
                questions={questions}
                onAdd={handleAddSubject}
                onEdit={handleEditSubject}
                onDelete={handleDeleteSubject}
              />
            )}
            {adminMenu === 'questions' && (
              <QuestionBank
                questions={questions}
                subjects={subjects}
                classes={classes}
                onAdd={handleAddQuestion}
                onBatchAdd={handleBatchAddQuestions}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteQuestion}
              />
            )}
            {adminMenu === 'token' && (
              <TokenData
                activeExam={activeExam}
                subjects={subjects}
                students={students}
                onToggleExam={handleToggleExam}
                onRegenerateToken={handleRegenerateToken}
              />
            )}
            {adminMenu === 'analysis' && (
              <AnalysisData
                results={results}
                classes={classes}
                subjects={subjects}
                schoolData={schoolData}
              />
            )}
            {adminMenu === 'documents' && (
              <DocumentsData
                activeExam={activeExam}
                schoolData={schoolData}
                students={students}
              />
            )}
          </div>
          <CopyrightFooter theme="dark" />
        </main>
      </div>
    );
  }

  // Login Screen
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      {renderNotifications()}
      <TiltCard className="max-w-4xl min-h-[600px] flex-col md:flex-row">
        <div className="md:w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600">
                <CheckSquare size={24} />
              </div>
              <span className="font-black text-2xl tracking-tight">CBT<span className="text-indigo-200 font-light">ku</span></span>
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">Ujian Online<br />Masa Depan.</h2>
            <p className="text-indigo-100 text-lg opacity-90">Platform evaluasi pembelajaran modern, aman, dan efisien untuk sekolah Anda.</p>
          </div>
          <div className="relative z-10 mt-12">
            <div className="flex items-center gap-4 text-sm font-medium opacity-80">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-8 rounded-full bg-indigo-400 border-2 border-indigo-600"></div>)}
              </div>
              <span>Digunakan oleh 500+ Siswa</span>
            </div>
          </div>
        </div>
        <div className="md:w-1/2 p-12 bg-white flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang! 👋</h3>
            <p className="text-gray-500">Silakan login untuk melanjutkan.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Username / NIS</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input name="username" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl outline-none transition-all font-medium" placeholder="Masukan username..." required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input name="password" type="password" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl outline-none transition-all font-medium" placeholder="••••••••" required />
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2">
              AKSES DASHBOARD <ChevronRight size={20} />
            </button>
          </form>
        </div>
      </TiltCard>
    </div>
  );
}
