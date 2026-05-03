import React, { useState } from 'react';
import {
    LayoutDashboard, School, Layers, Users, BookOpen, FileText,
    Key, ClipboardList, BarChart2, LogOut, Menu, ChevronLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';

const AdminLayout = ({ children, activeMenu, onMenuChange, onLogout }) => {
    const [sidebarExpanded, setSidebarExpanded] = useState(true);

    const menus = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'school', label: 'Data Sekolah', icon: School },
        { id: 'classes', label: 'Data Kelas', icon: Layers },
        { id: 'students', label: 'Data Murid', icon: Users },
        { id: 'subjects', label: 'Data Mapel', icon: BookOpen },
        { id: 'questions', label: 'Bank Soal', icon: FileText },
        { id: 'token', label: 'Token Ujian', icon: Key },
        { id: 'documents', label: 'Administrasi', icon: ClipboardList },
        { id: 'analysis', label: 'Nilai & Analisis', icon: BarChart2 },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans overflow-hidden">
            {/* Sidebar */}
            <div
                className={cn(
                    "bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-30 shadow-lg transition-all duration-300",
                    sidebarExpanded ? 'w-64' : 'w-20'
                )}
            >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between h-20">
                    <div className={cn("flex items-center gap-3 overflow-hidden transition-all", !sidebarExpanded && 'justify-center w-full')}>
                        <div className="w-10 h-10 min-w-[2.5rem] bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                            A
                        </div>
                        {sidebarExpanded && (
                            <div>
                                <h2 className="font-bold text-gray-800 leading-tight">Admin</h2>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Panel Guru</p>
                            </div>
                        )}
                    </div>
                    {sidebarExpanded && (
                        <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="text-gray-400 hover:text-indigo-600">
                            <ChevronLeft size={20} />
                        </button>
                    )}
                </div>

                {!sidebarExpanded && (
                    <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="w-full py-2 text-gray-400 hover:text-indigo-600 flex justify-center">
                        <Menu size={20} />
                    </button>
                )}

                <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
                    {menus.map(menu => (
                        <button
                            key={menu.id}
                            onClick={() => onMenuChange(menu.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all group relative",
                                activeMenu === menu.id
                                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
                                !sidebarExpanded && 'justify-center'
                            )}
                            title={!sidebarExpanded ? menu.label : ''}
                        >
                            <menu.icon size={22} className={cn("min-w-[22px]", activeMenu === menu.id ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600')} />
                            {sidebarExpanded && <span>{menu.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={onLogout}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all",
                            !sidebarExpanded && 'justify-center'
                        )}
                    >
                        <LogOut size={22} />
                        {sidebarExpanded && "Keluar"}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col h-screen transition-all duration-300 overflow-hidden",
                sidebarExpanded ? 'ml-64' : 'ml-20'
            )}>
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    {children}
                </div>

                {/* Footer */}
                <div className="text-center text-xs flex items-center justify-center gap-1.5 py-4 shrink-0 z-40 border-t border-gray-200 bg-white text-gray-600">
                    <span>&copy; {new Date().getFullYear()} | e-Quest System</span>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
