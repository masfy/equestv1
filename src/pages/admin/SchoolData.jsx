import React, { useState } from 'react';
import { School, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const SchoolData = ({ data, onSave }) => {
    const [formData, setFormData] = useState(data);
    const [tempLogo, setTempLogo] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempLogo(reader.result);
                setFormData(prev => ({ ...prev, logo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Card className="max-w-3xl mx-auto animate-fade-in">
            <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                        <School size={24} />
                    </div>
                    <CardTitle>Identitas Sekolah</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Logo Section */}
                        <div className="shrink-0 text-center w-full md:w-auto">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Logo Sekolah</label>
                            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center overflow-hidden mx-auto bg-gray-50 hover:bg-gray-100 transition-colors relative group">
                                <img
                                    src={tempLogo || formData.logo}
                                    alt="Logo"
                                    className="w-full h-full object-contain p-2"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <span className="text-white text-xs font-bold">Ubah</span>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="flex-1 space-y-4 w-full">
                            <Input
                                label="Nama Sekolah"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            <Input
                                label="Alamat Lengkap"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                            />
                            <Input
                                label="Tahun Ajaran"
                                name="term"
                                value={formData.term}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-bold text-gray-800 mb-4">Data Kepala Sekolah</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nama Kepala Sekolah"
                                name="principalName"
                                value={formData.principalName}
                                onChange={handleChange}
                                placeholder="Nama lengkap beserta gelar"
                            />
                            <Input
                                label="NIP Kepala Sekolah"
                                name="principalNip"
                                value={formData.principalNip}
                                onChange={handleChange}
                                placeholder="NIP 18 digit"
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-bold text-gray-800 mb-4">Data Guru / Pengawas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nama Guru"
                                name="teacherName"
                                value={formData.teacherName}
                                onChange={handleChange}
                                placeholder="Nama lengkap beserta gelar"
                            />
                            <Input
                                label="NIP Guru"
                                name="teacherNip"
                                value={formData.teacherNip}
                                onChange={handleChange}
                                placeholder="NIP 18 digit"
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-bold text-gray-800 mb-4">Akun Administrator</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Username Admin"
                                name="adminUsername"
                                value={formData.adminUsername}
                                onChange={handleChange}
                            />
                            <Input
                                label="Password Admin"
                                name="adminPassword"
                                value={formData.adminPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="w-full md:w-auto gap-2">
                            <Save size={18} /> Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default SchoolData;
