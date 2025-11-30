import React, { useState, useEffect, useMemo } from 'react';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Grid, CheckSquare, Square } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

// Helper to shuffle array
const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

import { api } from '../../services/api';

const ExamRunner = ({ user, exam, questions, onFinish }) => {
    // Randomize questions once on mount
    const [randomizedQuestions, setRandomizedQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(120 * 60);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cheating Detection
    useEffect(() => {
        const handleViolation = () => {
            if (isSubmitting) return; // Ignore if submitting

            // 1. Send Violation Status
            api.updateStudentStatus(exam.token, user.nis, user.name, 'VIOLATION');

            // 2. Alert User
            alert("PERINGATAN KERAS!\n\nAnda terdeteksi meninggalkan halaman ujian (membuka tab lain atau aplikasi lain).\n\nSesuai peraturan, ujian Anda dibatalkan dan harus diulang dari awal.");

            // 3. Force Reset/Reload
            window.location.reload();
        };

        const onVisibilityChange = () => {
            if (document.hidden) {
                handleViolation();
            }
        };

        const onBlur = () => {
            // Optional: Blur might be too sensitive (e.g. clicking browser UI), 
            // but user asked for "keluar dari aplikasi". 
            // VisibilityChange covers tab switching and minimizing.
            // Blur covers clicking outside the window if in windowed mode.
            // Let's stick to visibilityChange for now as it's more robust for "tab switching".
            // If user wants strict "focus lost", we can add blur.
            // "buka tab lain" -> visibilityChange handles this.
            // "keluar dari aplikasi" -> visibilityChange handles minimizing.
            // Let's add blur but maybe with a warning first? 
            // The user said "siswa coba kluar daari aplikasi atau buka tab lain".
            // Let's use visibilityChange as the primary trigger for the harsh penalty.
            handleViolation();
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("blur", onBlur);

        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("blur", onBlur);
        };
    }, [exam, user, isSubmitting]);

    useEffect(() => {
        // Shuffle questions and also shuffle options for Single/MCMA types
        // We need to store the original index mapping for options to score correctly
        const processed = shuffleArray(questions).map(q => {
            if (q.type === 'single' || q.type === 'mcma') {
                // Create array of objects { text, originalIndex }
                const optionsWithIndex = q.options.map((opt, i) => ({ text: opt, originalIndex: i }));
                const shuffledOptions = shuffleArray(optionsWithIndex);
                return { ...q, shuffledOptions };
            }
            return q;
        });
        setRandomizedQuestions(processed);
    }, [questions]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    handleFinish(true); // Force finish
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswer = (value) => {
        setAnswers({ ...answers, [currentQuestionIndex]: value });
    };

    const handleFinish = async (force = false) => {
        setIsSubmitting(true); // Prevent cheating detection

        // Small delay to ensure state updates before any blur event might fire
        await new Promise(r => setTimeout(r, 100));

        if (force || window.confirm('Apakah Anda yakin ingin mengakhiri ujian?')) {
            // Update status to FINISHED
            await api.updateStudentStatus(exam.token, user.nis, user.name, 'FINISHED');

            // We need to map answers back to original question IDs for scoring if needed, 
            // but for now the App.jsx scoring uses index matching. 
            // Since we randomized questions, we need to pass the randomizedQuestions array 
            // along with answers to the parent, OR map answers back to original IDs.
            // To keep it simple for this refactor:
            // We will pass the full `randomizedQuestions` and `answers` to onFinish
            // so App.jsx can calculate score based on the randomized order or ID matching.
            onFinish(answers, randomizedQuestions);
        } else {
            setIsSubmitting(false); // Re-enable detection if cancelled
        }
    };

    if (randomizedQuestions.length === 0) return <div className="p-8 text-center">Memuat soal...</div>;

    const currentQuestion = randomizedQuestions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold">
                            {user.name.charAt(0)}
                        </div>
                        <div className="hidden md:block">
                            <h1 className="font-bold text-gray-800">{exam.subjectName}</h1>
                            <p className="text-xs text-gray-500">{user.name} • {user.class}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
                            <Clock size={20} /> {formatTime(timeLeft)}
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="md:hidden p-2 bg-gray-100 rounded-lg"
                        >
                            <Grid size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 flex gap-6">
                {/* Main Question Area */}
                <div className="flex-1 flex flex-col">
                    <Card className="flex-1 p-6 md:p-10 shadow-lg border-0 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-2">
                                <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-bold">
                                    Soal No. {currentQuestionIndex + 1}
                                </span>
                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                    {currentQuestion.type === 'complex' ? 'Benar/Salah' : currentQuestion.type === 'mcma' ? 'Pilihan Ganda Kompleks' : 'Pilihan Ganda'}
                                </span>
                            </div>
                            <span className="text-gray-400 text-sm">
                                Ukuran font: A A A
                            </span>
                        </div>

                        <div className="flex-1 mb-8">
                            {currentQuestion.stimulus && (
                                <img src={currentQuestion.stimulus} alt="Stimulus" className="max-h-64 rounded-xl mb-6 border shadow-sm" />
                            )}
                            <p className="text-lg md:text-xl leading-relaxed text-gray-800 font-medium whitespace-pre-wrap">
                                {currentQuestion.text}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {/* SINGLE CHOICE RENDERER */}
                            {(currentQuestion.type === 'single' || !currentQuestion.type) && (
                                currentQuestion.shuffledOptions.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(opt.originalIndex)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${answers[currentQuestionIndex] === opt.originalIndex
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md'
                                            : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${answers[currentQuestionIndex] === opt.originalIndex
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-200 text-gray-500 group-hover:bg-indigo-200 group-hover:text-indigo-700'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className="text-base">{opt.text}</span>
                                    </button>
                                ))
                            )}

                            {/* MCMA RENDERER */}
                            {currentQuestion.type === 'mcma' && (
                                currentQuestion.shuffledOptions.map((opt, idx) => {
                                    const currentAnswers = answers[currentQuestionIndex] || [];
                                    const isSelected = currentAnswers.includes(opt.originalIndex);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                const newAnswers = isSelected
                                                    ? currentAnswers.filter(a => a !== opt.originalIndex)
                                                    : [...currentAnswers, opt.originalIndex];
                                                handleAnswer(newAnswers);
                                            }}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${isSelected
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md'
                                                : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`transition-colors ${isSelected ? 'text-indigo-600' : 'text-gray-300 group-hover:text-indigo-400'}`}>
                                                {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                                            </div>
                                            <span className="text-base">{opt.text}</span>
                                        </button>
                                    );
                                })
                            )}

                            {/* COMPLEX (TRUE/FALSE) RENDERER */}
                            {currentQuestion.type === 'complex' && (
                                <div className="border rounded-xl overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                                            <tr>
                                                <th className="p-4 text-left">Pernyataan</th>
                                                <th className="p-4 w-24 text-center">Benar</th>
                                                <th className="p-4 w-24 text-center">Salah</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {currentQuestion.options.map((opt, idx) => {
                                                const currentAns = answers[currentQuestionIndex] || [];
                                                // currentAns[idx] is true/false/undefined
                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="p-4 text-gray-800">{opt}</td>
                                                        <td className="p-4 text-center">
                                                            <input
                                                                type="radio"
                                                                name={`complex-${currentQuestionIndex}-${idx}`}
                                                                checked={currentAns[idx] === true}
                                                                onChange={() => {
                                                                    const newAns = [...(answers[currentQuestionIndex] || [])];
                                                                    newAns[idx] = true;
                                                                    handleAnswer(newAns);
                                                                }}
                                                                className="w-5 h-5 accent-green-600 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <input
                                                                type="radio"
                                                                name={`complex-${currentQuestionIndex}-${idx}`}
                                                                checked={currentAns[idx] === false}
                                                                onChange={() => {
                                                                    const newAns = [...(answers[currentQuestionIndex] || [])];
                                                                    newAns[idx] = false;
                                                                    handleAnswer(newAns);
                                                                }}
                                                                className="w-5 h-5 accent-red-600 cursor-pointer"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Navigation Buttons */}
                    <div className="mt-6 flex justify-between">
                        <Button
                            variant="secondary"
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="w-32"
                        >
                            <ChevronLeft size={18} className="mr-2" /> Sebelumnya
                        </Button>

                        {currentQuestionIndex === randomizedQuestions.length - 1 ? (
                            <Button
                                variant="danger"
                                onClick={handleFinish}
                                className="w-32 bg-green-600 hover:bg-green-700 shadow-green-200"
                            >
                                Selesai <CheckCircle size={18} className="ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(randomizedQuestions.length - 1, prev + 1))}
                                className="w-32"
                            >
                                Selanjutnya <ChevronRight size={18} className="ml-2" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Sidebar Navigation (Desktop) */}
                <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 z-40 md:relative md:transform-none md:w-80 md:shadow-none md:bg-transparent md:block ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <Card className="h-full md:h-auto p-6 overflow-y-auto max-h-screen md:sticky md:top-24">
                        <h3 className="font-bold text-gray-800 mb-4 flex justify-between items-center">
                            Navigasi Soal
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                                {answeredCount}/{randomizedQuestions.length} Terjawab
                            </span>
                        </h3>
                        <div className="grid grid-cols-5 gap-2">
                            {randomizedQuestions.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setCurrentQuestionIndex(idx); setIsSidebarOpen(false); }}
                                    className={`aspect-square rounded-lg font-bold text-sm flex items-center justify-center transition-all ${idx === currentQuestionIndex
                                        ? 'ring-2 ring-indigo-600 ring-offset-2 bg-white text-indigo-600'
                                        : answers[idx] !== undefined
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default ExamRunner;
