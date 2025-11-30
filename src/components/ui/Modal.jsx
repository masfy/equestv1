import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

const Modal = ({ isOpen, onClose, title, children, className }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div
                className={cn(
                    "bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col max-h-[90vh] shadow-2xl animate-slide-up",
                    className
                )}
            >
                <div className="flex justify-between mb-4 border-b pb-2">
                    <h3 className="font-bold text-lg text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
