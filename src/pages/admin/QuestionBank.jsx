import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Sparkles, Layers, Image as ImageIcon, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const QuestionBank = ({ questions, subjects, classes, onAdd, onBatchAdd, onEdit, onDelete }) => {
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form State
    const [qType, setQType] = useState('single');
    const [stimulus, setStimulus] = useState(null);
    const [complexOptions, setComplexOptions] = useState([{ text: '', isCorrect: true }]);

    // AI Generator State
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiConfig, setAiConfig] = useState({
        apiKey: localStorage.getItem('gemini_api_key') || '',
        topic: '',
        counts: { mcma: 5, complex: 5, single: 20 },
        contextDist: { math: 40, daily: 60 },
        cognitiveDist: { knowledge: 30, application: 50, reasoning: 20 }
    });
    const [aiLoading, setAiLoading] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);

    // Filter Logic
    const filteredSubjects = subjects.filter(s => s.class === selectedClass);

    // Debugging
    console.log("Selected Subject:", selectedSubject);
    console.log("All Questions:", questions);

    // Use loose equality (==) to handle potential string vs number mismatches in IDs
    const filteredQuestions = selectedSubject
        ? questions.filter(q => {
            const match = q.subjectId == selectedSubject.id;
            if (!match) console.log(`Skipping Q ${q.id}: subjectId ${q.subjectId} != ${selectedSubject.id}`);
            return match;
        })
        : [];

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setStimulus(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddComplexOption = () => {
        setComplexOptions([...complexOptions, { text: '', isCorrect: true }]);
    };

    const handleRemoveComplexOption = (idx) => {
        setComplexOptions(complexOptions.filter((_, i) => i !== idx));
    };

    const handleComplexOptionChange = (idx, field, value) => {
        const newOpts = [...complexOptions];
        newOpts[idx][field] = value;
        setComplexOptions(newOpts);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        let newItem = {
            ...data,
            id: editingItem ? editingItem.id : Date.now(),
            type: qType,
            stimulus: stimulus,
            subjectId: selectedSubject?.id,
            class: selectedClass,
            tags: [`__sid:${selectedSubject?.id}`] // Backup for persistence
        };

        if (qType === 'single') {
            newItem.options = [data.optA, data.optB, data.optC, data.optD];
            newItem.correct = parseInt(data.correct);
        } else if (qType === 'mcma') {
            newItem.options = [data.optA, data.optB, data.optC, data.optD];
            // Collect checked boxes
            const correctIndices = [];
            if (formData.get('checkA')) correctIndices.push(0);
            if (formData.get('checkB')) correctIndices.push(1);
            if (formData.get('checkC')) correctIndices.push(2);
            if (formData.get('checkD')) correctIndices.push(3);
            newItem.correct = correctIndices;
        } else if (qType === 'complex') {
            newItem.options = complexOptions.map(o => o.text);
            newItem.correct = complexOptions.map(o => o.isCorrect);
        }

        if (editingItem) {
            onEdit(newItem);
        } else {
            onAdd(newItem);
        }
        setIsModalOpen(false);
        setEditingItem(null);
        setStimulus(null);
        setComplexOptions([{ text: '', isCorrect: true }]);
    };

    const openAddModal = () => {
        setEditingItem(null);
        setQType('single');
        setStimulus(null);
        setComplexOptions([{ text: '', isCorrect: true }]);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setQType(item.type || 'single');
        setStimulus(item.stimulus);
        if (item.type === 'complex') {
            setComplexOptions(item.options.map((opt, i) => ({
                text: opt,
                isCorrect: item.correct[i]
            })));
        }
        setIsModalOpen(true);
    };

    // AI Handlers
    const handleAIConfigChange = (section, field, value) => {
        if (section === 'root') {
            setAiConfig(prev => ({ ...prev, [field]: value }));
        } else {
            setAiConfig(prev => ({
                ...prev,
                [section]: { ...prev[section], [field]: parseInt(value) || 0 }
            }));
        }
    };

    const handleGenerate = async () => {
        if (!aiConfig.apiKey || !aiConfig.topic) {
            alert("Mohon isi API Key dan Topik!");
            return;
        }

        localStorage.setItem('gemini_api_key', aiConfig.apiKey);
        setAiLoading(true);
        try {
            const questions = await import('../../services/aiService').then(m => m.aiService.generateQuestions(aiConfig.apiKey, aiConfig));
            setGeneratedQuestions(questions);
        } catch (error) {
            alert("Gagal membuat soal: " + error.message);
        } finally {
            setAiLoading(false);
        }
    };

    const handleSaveGenerated = () => {
        const questionsToSave = generatedQuestions.map(q => ({
            ...q,
            subjectId: selectedSubject.id,
            class: selectedClass,
            tags: [...(q.tags || []), `__sid:${selectedSubject.id}`] // Backup for persistence
        }));

        if (onBatchAdd) {
            onBatchAdd(questionsToSave);
        } else {
            // Fallback
            questionsToSave.forEach(q => onAdd(q));
        }

        setIsAIModalOpen(false);
        setGeneratedQuestions([]);
    };

    // View: Select Class
    if (!selectedClass) {
        return (
            <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Bank Soal - Pilih Kelas</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {classes.map((cls) => (
                        <button
                            key={cls.id}
                            onClick={() => setSelectedClass(cls.name)}
                            className={`p-6 rounded-3xl shadow-sm border text-left group transition-all hover:shadow-xl hover:-translate-y-1 bg-white`}
                        >
                            <div className="bg-indigo-50 p-4 rounded-2xl w-fit mb-4 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Layers size={24} />
                            </div>
                            <h3 className="font-bold text-xl text-gray-800 mb-1">{cls.name}</h3>
                            <p className="text-sm text-gray-500">Tingkat {cls.level}</p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // View: Select Subject
    if (!selectedSubject) {
        return (
            <div className="animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setSelectedClass(null)} className="bg-white p-2 rounded-xl border hover:bg-gray-50 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Pilih Mata Pelajaran</h2>
                        <p className="text-sm text-gray-500">Kelas: {selectedClass}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredSubjects.length > 0 ? filteredSubjects.map(s => {
                        // Dynamic count
                        const count = questions.filter(q => q.subjectId == s.id).length;
                        return (
                            <button key={s.id} onClick={() => setSelectedSubject(s)} className="bg-white p-6 rounded-3xl shadow-sm border hover:border-indigo-500 text-left transition-all hover:shadow-lg group">
                                <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors">{s.name}</h3>
                                <p className="text-sm text-gray-500 font-mono mt-1">{s.code}</p>
                                <div className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{count} Soal</div>
                            </button>
                        )
                    }) : (
                        <div className="col-span-3 text-center py-12 text-gray-400">Belum ada mata pelajaran untuk kelas ini.</div>
                    )}
                </div>
            </div>
        );
    }

    // View: Question List
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedSubject(null)} className="bg-white p-2 rounded-xl border hover:bg-gray-50 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{selectedSubject.name}</h2>
                        <p className="text-sm text-gray-500">{selectedSubject.code}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsAIModalOpen(true)}
                        variant="secondary"
                        className="gap-2 text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100"
                    >
                        <Sparkles size={16} /> AI Generate
                    </Button>
                    <Button onClick={openAddModal} className="gap-2">
                        <Plus size={16} /> Tambah Soal
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredQuestions.map((q, idx) => (
                    <Card key={q.id} className="p-6 hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                            <div className="font-bold text-gray-400 text-lg">#{idx + 1}</div>
                            <div className="flex-1">
                                <div className="flex gap-2 mb-2">
                                    <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-500 uppercase">{q.type || 'single'}</span>
                                    {q.tags && q.tags.filter(t => !t.startsWith('__sid:')).map(t => (
                                        <span key={t} className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded uppercase">{t}</span>
                                    ))}
                                </div>
                                {q.stimulus && (
                                    <img src={q.stimulus} alt="Stimulus" className="max-h-40 rounded-lg mb-4 border" />
                                )}
                                <p className="font-medium text-gray-800 mb-4">{q.text}</p>

                                <div className="grid grid-cols-1 gap-2">
                                    {q.type === 'complex' ? (
                                        <div className="border rounded-lg overflow-hidden text-sm">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="p-2 text-left">Pernyataan</th>
                                                        <th className="p-2 w-20 text-center">Benar</th>
                                                        <th className="p-2 w-20 text-center">Salah</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {q.options.map((opt, i) => (
                                                        <tr key={i} className="border-t">
                                                            <td className="p-2">{opt}</td>
                                                            <td className="p-2 text-center">
                                                                <div className={`w-4 h-4 rounded-full mx-auto ${q.correct[i] ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                                            </td>
                                                            <td className="p-2 text-center">
                                                                <div className={`w-4 h-4 rounded-full mx-auto ${!q.correct[i] ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        q.options.map((opt, i) => {
                                            let isCorrect = false;
                                            if (q.type === 'mcma') isCorrect = q.correct.includes(i);
                                            else isCorrect = q.correct === i;

                                            return (
                                                <div key={i} className={`p-3 rounded-lg border flex items-center gap-3 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'}`}>
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                        {String.fromCharCode(65 + i)}
                                                    </div>
                                                    <span className={isCorrect ? 'text-green-800 font-medium' : 'text-gray-600'}>{opt}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => openEditModal(q)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18} /></button>
                                <button onClick={() => onDelete(q.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* ADD/EDIT MODAL */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Soal" : "Tambah Soal Baru"}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Soal</label>
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                            {['single', 'mcma', 'complex'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setQType(t)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${qType === t ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {t === 'single' ? 'Pilihan Ganda' : t === 'mcma' ? 'Pilihan Ganda Kompleks' : 'Benar/Salah'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan / Stimulus</label>
                        <textarea name="text" defaultValue={editingItem?.text} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 mb-2" rows="3" placeholder="Tulis pertanyaan..." required></textarea>

                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                <ImageIcon size={18} />
                                {stimulus ? 'Ganti Gambar' : 'Upload Gambar'}
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                            {stimulus && (
                                <div className="relative group">
                                    <img src={stimulus} alt="Preview" className="h-12 w-12 object-cover rounded-lg border" />
                                    <button type="button" onClick={() => setStimulus(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {qType === 'complex' ? (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Pernyataan & Jawaban</label>
                            {complexOptions.map((opt, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <Input
                                        value={opt.text}
                                        onChange={(e) => handleComplexOptionChange(idx, 'text', e.target.value)}
                                        placeholder={`Pernyataan ${idx + 1}`}
                                        className="flex-1"
                                    />
                                    <div className="flex bg-gray-100 rounded-lg p-1">
                                        <button
                                            type="button"
                                            onClick={() => handleComplexOptionChange(idx, 'isCorrect', true)}
                                            className={`px-3 py-1 text-xs font-bold rounded ${opt.isCorrect ? 'bg-green-500 text-white' : 'text-gray-500'}`}
                                        >B</button>
                                        <button
                                            type="button"
                                            onClick={() => handleComplexOptionChange(idx, 'isCorrect', false)}
                                            className={`px-3 py-1 text-xs font-bold rounded ${!opt.isCorrect ? 'bg-red-500 text-white' : 'text-gray-500'}`}
                                        >S</button>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveComplexOption(idx)} className="text-red-400 hover:text-red-600"><X size={18} /></button>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddComplexOption} className="text-sm text-indigo-600 font-medium hover:underline">+ Tambah Baris</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Pilihan Jawaban</label>
                            {['A', 'B', 'C', 'D'].map((opt, idx) => (
                                <div key={opt} className="flex gap-2 items-center">
                                    <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-400 bg-gray-50 rounded-lg">{opt}</div>
                                    <Input name={`opt${opt}`} defaultValue={editingItem?.options?.[idx]} placeholder={`Opsi ${opt}`} required />

                                    {qType === 'single' ? (
                                        <input
                                            type="radio"
                                            name="correct"
                                            value={idx}
                                            defaultChecked={editingItem?.correct === idx}
                                            className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                                            required
                                        />
                                    ) : (
                                        <input
                                            type="checkbox"
                                            name={`check${opt}`}
                                            defaultChecked={editingItem?.correct?.includes(idx)}
                                            className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 rounded"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-4 border-t flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit">Simpan Soal</Button>
                    </div>
                </form>
            </Modal>

            {/* AI GENERATOR MODAL */}
            <Modal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} title="AI Question Generator">
                {generatedQuestions.length > 0 ? (
                    <div className="space-y-6">
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-green-800 flex items-center gap-3">
                            <Sparkles className="text-green-600" />
                            <div>
                                <p className="font-bold">Berhasil membuat {generatedQuestions.length} soal!</p>
                                <p className="text-sm">Silakan review soal di bawah ini sebelum disimpan ke bank soal.</p>
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                            {generatedQuestions.map((q, i) => (
                                <div key={i} className="p-4 border rounded-xl bg-gray-50 text-sm">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-gray-600">#{i + 1} ({q.type})</span>
                                        <div className="flex gap-1">
                                            {q.tags?.map(t => <span key={t} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{t}</span>)}
                                        </div>
                                    </div>
                                    <p className="mb-2 font-medium">{q.text}</p>
                                    <div className="pl-4 border-l-2 border-gray-300 space-y-1 text-gray-500">
                                        {q.type === 'complex' ? (
                                            q.options.map((o, idx) => <div key={idx}>{o} ({q.correct[idx] ? 'Benar' : 'Salah'})</div>)
                                        ) : (
                                            q.options.map((o, idx) => (
                                                <div key={idx} className={
                                                    (q.type === 'single' && q.correct === idx) || (q.type === 'mcma' && q.correct.includes(idx))
                                                        ? "text-green-600 font-bold" : ""
                                                }>
                                                    {String.fromCharCode(65 + idx)}. {o}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setGeneratedQuestions([])}>Ulangi</Button>
                            <Button onClick={handleSaveGenerated} className="bg-green-600 hover:bg-green-700">Simpan Semua Soal</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">API Key (Google Gemini)</label>
                            <Input
                                value={aiConfig.apiKey}
                                onChange={(e) => handleAIConfigChange('root', 'apiKey', e.target.value)}
                                placeholder="Paste API Key here..."
                                type="password"
                            />
                            <p className="text-xs text-gray-400 mt-1">Key akan disimpan di browser Anda.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Topik / Tujuan Pembelajaran</label>
                            <Input
                                value={aiConfig.topic}
                                onChange={(e) => handleAIConfigChange('root', 'topic', e.target.value)}
                                placeholder="Contoh: Hukum Newton, Aljabar Linear, Sejarah Kemerdekaan..."
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                <h4 className="font-bold text-xs uppercase text-gray-500 border-b pb-2">Jumlah & Tipe</h4>
                                <div>
                                    <label className="text-xs block mb-1">MCMA</label>
                                    <Input type="number" value={aiConfig.counts.mcma} onChange={(e) => handleAIConfigChange('counts', 'mcma', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs block mb-1">Benar/Salah</label>
                                    <Input type="number" value={aiConfig.counts.complex} onChange={(e) => handleAIConfigChange('counts', 'complex', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs block mb-1">Pilihan Ganda</label>
                                    <Input type="number" value={aiConfig.counts.single} onChange={(e) => handleAIConfigChange('counts', 'single', e.target.value)} />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                <h4 className="font-bold text-xs uppercase text-gray-500 border-b pb-2">Konteks (%)</h4>
                                <div>
                                    <label className="text-xs block mb-1">Matematis</label>
                                    <Input type="number" value={aiConfig.contextDist.math} onChange={(e) => handleAIConfigChange('contextDist', 'math', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs block mb-1">Sehari-hari</label>
                                    <Input type="number" value={aiConfig.contextDist.daily} onChange={(e) => handleAIConfigChange('contextDist', 'daily', e.target.value)} />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                <h4 className="font-bold text-xs uppercase text-gray-500 border-b pb-2">Kognitif (%)</h4>
                                <div>
                                    <label className="text-xs block mb-1">Pengetahuan (C1-C2)</label>
                                    <Input type="number" value={aiConfig.cognitiveDist.knowledge} onChange={(e) => handleAIConfigChange('cognitiveDist', 'knowledge', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs block mb-1">Aplikasi (C3)</label>
                                    <Input type="number" value={aiConfig.cognitiveDist.application} onChange={(e) => handleAIConfigChange('cognitiveDist', 'application', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs block mb-1">Penalaran (C4-C6)</label>
                                    <Input type="number" value={aiConfig.cognitiveDist.reasoning} onChange={(e) => handleAIConfigChange('cognitiveDist', 'reasoning', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={aiLoading}
                            className={`w-full py-4 text-lg ${aiLoading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'}`}
                        >
                            {aiLoading ? (
                                <span className="flex items-center gap-2"><Sparkles className="animate-spin" /> Sedang Berpikir...</span>
                            ) : (
                                <span className="flex items-center gap-2"><Sparkles /> Generate Soal Sekarang</span>
                            )}
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default QuestionBank;
