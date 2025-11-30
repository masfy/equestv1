import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Upload, Filter } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const StudentsData = ({ students, classes, onAdd, onEdit, onDelete, onImport }) => {
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const filteredStudents = students.filter(s => {
        const matchClass = filterClass ? s.class === filterClass : true;
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search);
        return matchClass && matchSearch;
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (editingItem) {
            onEdit({ ...editingItem, ...data });
        } else {
            onAdd(data);
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
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Data Murid</h2>
                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                    <div className="relative w-full md:w-40">
                        <select
                            className="w-full p-2.5 pl-9 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-100 appearance-none"
                            value={filterClass}
                            onChange={e => setFilterClass(e.target.value)}
                        >
                            <option value="">Semua Kelas</option>
                            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari Nama/NIS..."
                            className="w-full pl-10 p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                    </div>
                    <Button variant="secondary" onClick={() => onImport('Murid')} className="gap-2">
                        <Upload size={16} />
                    </Button>
                    <Button onClick={openAddModal} className="gap-2">
                        <Plus size={16} /> Tambah
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-0 shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                            <tr>
                                <th className="p-4">Nama Lengkap</th>
                                <th className="p-4">NIS / Username</th>
                                <th className="p-4">Kelas</th>
                                <th className="p-4">Password</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold text-gray-800">{item.name}</td>
                                        <td className="p-4 font-mono text-gray-600">{item.nis}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                                                {item.class}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-gray-400">{item.password}</td>
                                        <td className="p-4 flex justify-end gap-2">
                                            <button onClick={() => openEditModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => onDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">
                                        Tidak ada data murid ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? "Edit Murid" : "Tambah Murid"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        name="name"
                        label="Nama Lengkap"
                        defaultValue={editingItem?.name}
                        required
                    />
                    <Input
                        name="nis"
                        label="NIS (Username)"
                        defaultValue={editingItem?.nis}
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
                    <Input
                        name="password"
                        label="Password"
                        defaultValue={editingItem?.password}
                        required
                    />
                    <Button type="submit" className="w-full mt-4">
                        SIMPAN
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default StudentsData;
