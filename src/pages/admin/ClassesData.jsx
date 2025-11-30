import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Upload } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const ClassesData = ({ classes, onAdd, onEdit, onDelete, onImport }) => {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const filteredClasses = classes.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

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
                <h2 className="text-2xl font-bold text-gray-800">Data Kelas</h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari Kelas..."
                            className="w-full pl-10 p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                    </div>
                    <Button variant="secondary" onClick={() => onImport('Kelas')} className="gap-2">
                        <Upload size={16} /> <span className="hidden md:inline">Import</span>
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
                                <th className="p-4">Nama Kelas</th>
                                <th className="p-4">Tingkat</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredClasses.length > 0 ? (
                                filteredClasses.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-900">{item.name}</td>
                                        <td className="p-4 text-gray-600">{item.level}</td>
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
                                    <td colSpan="3" className="p-8 text-center text-gray-400">
                                        Tidak ada data kelas ditemukan.
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
                title={editingItem ? "Edit Kelas" : "Tambah Kelas"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        name="name"
                        label="Nama Kelas"
                        defaultValue={editingItem?.name}
                        placeholder="Contoh: X MIPA 1"
                        required
                    />
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2">
                            Tingkat
                        </label>
                        <select
                            name="level"
                            defaultValue={editingItem?.level || '10'}
                            className="w-full p-3 border-2 border-transparent bg-gray-50 rounded-xl outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                        >
                            <option value="1">Kelas 1</option>
                            <option value="2">Kelas 2</option>
                            <option value="3">Kelas 3</option>
                            <option value="4">Kelas 4</option>
                            <option value="5">Kelas 5</option>
                            <option value="6">Kelas 6</option>
                            <option value="7">Kelas 7</option>
                            <option value="8">Kelas 8</option>
                            <option value="9">Kelas 9</option>
                            <option value="10">Kelas 10</option>
                            <option value="11">Kelas 11</option>
                            <option value="12">Kelas 12</option>
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

export default ClassesData;
