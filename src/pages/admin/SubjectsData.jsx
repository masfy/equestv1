import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const SubjectsData = ({ subjects, classes, questions = [], onAdd, onEdit, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (editingItem) {
            onEdit({ ...editingItem, ...data });
        } else {
            onAdd({ ...data, questionCount: 0 });
        }
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const openAddModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Data Mata Pelajaran</h2>
                <Button onClick={openAddModal} className="gap-2">
                    <Plus size={16} /> Tambah Mapel
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map(item => {
                    // Dynamic count
                    // Use loose equality for ID matching just in case
                    const count = questions.filter(q => q.subjectId == item.id).length;

                    return (
                        <Card key={item.id} className="p-6 hover:shadow-md transition-shadow border-l-4 border-l-indigo-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                                    <p className="text-sm text-gray-500 font-mono">{item.code}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEditModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => onDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                                    {item.class}
                                </span>
                                <span className="text-gray-400">
                                    {count} Soal
                                </span>
                            </div>
                        </Card>
                    )
                })}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? "Edit Mapel" : "Tambah Mapel"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        name="name"
                        label="Nama Mata Pelajaran"
                        defaultValue={editingItem?.name}
                        required
                    />
                    <Input
                        name="code"
                        label="Kode Mapel"
                        defaultValue={editingItem?.code}
                        required
                    />
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2">
                            Kelas
                        </label>
                        <select
                            name="class"
                            defaultValue={editingItem?.class || classes[0]?.name}
                            className="w-full p-3 border-2 border-transparent bg-gray-50 rounded-xl outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                        >
                            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <Button type="submit" className="w-full mt-4">
                        SIMPAN
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default SubjectsData;
