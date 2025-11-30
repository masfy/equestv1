import React from 'react';
import {
    LayoutDashboard, School, Layers, Users, BookOpen,
    FileText, Key, BarChart2, ClipboardList, CheckSquare,
    ChevronLeft, Menu, LogOut
} from 'lucide-react';

const AdminSidebar = ({ adminMenu, setAdminMenu, sidebarExpanded, setSidebarExpanded, onLogout }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'school', label: 'Data Sekolah', icon: School },
        { id: 'classes', label: 'Data Kelas', icon: Layers },
        { id: 'students', label: 'Data Murid', icon: Users },
        { id: 'subjects', label: 'Data Mapel', icon: BookOpen },
        { id: 'questions', label: 'Bank Soal', icon: FileText },
        { id: 'token', label: 'Token Ujian', icon: Key },
        { id: 'analysis', label: 'Nilai & Analisis', icon: BarChart2 },
        { id: 'documents', label: 'Administrasi', icon: ClipboardList },
    ];

    return (
        <aside className={`bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-30 transition-all duration-300 flex flex-col ${sidebarExpanded ? 'w-64' : 'w-20'}`}>
            <div className="p-6 flex items-center justify-between">
                <div className={`font-black text-2xl text-indigo-600 flex items-center gap-2 ${!sidebarExpanded && 'justify-center w-full'}`}>
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <CheckSquare size={20} />
                    </div>
                    {sidebarExpanded && <span>CBT<span className="text-gray-400 font-light">ku</span></span>}
                </div>
                <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className={`p-2 hover:bg-gray-100 rounded-lg text-gray-400 ${!sidebarExpanded && 'hidden'}`}>
                    {sidebarExpanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setAdminMenu(item.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${adminMenu === item.id
                            ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            } ${!sidebarExpanded && 'justify-center'}`}
                    >
                        <item.icon size={20} className={adminMenu === item.id ? 'text-indigo-600' : 'text-gray-400'} />
                        {sidebarExpanded && <span>{item.label}</span>}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium ${!sidebarExpanded && 'justify-center'}`}
                >
                    <LogOut size={20} />
                    {sidebarExpanded && <span>Keluar</span>}
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
