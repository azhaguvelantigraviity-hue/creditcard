import React, { useState } from 'react';
import { Coffee, Briefcase, CheckCircle2, AlertTriangle, X } from 'lucide-react';

const LogoutReasonModal = ({ onSubmit, onDismiss }) => {
    const [reason, setReason] = useState('');
    const reasons = [
        { value: 'Personal', label: 'Personal Logout', icon: Coffee, color: 'orange', desc: 'Personal break or end of day' },
        { value: 'Official', label: 'Official / Work Complete', icon: Briefcase, color: 'blue', desc: 'Work day finished or official duty' },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 text-white relative">
                    <button 
                        onClick={onDismiss}
                        className="absolute right-4 top-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <AlertTriangle size={22} />
                        </div>
                        <h3 className="text-xl font-black">Attendance Logout</h3>
                    </div>
                    <p className="text-rose-100 text-sm font-medium">Please provide a reason for ending your session today.</p>
                </div>
                
                <div className="p-6 space-y-3">
                    {reasons.map(({ value, label, icon: Icon, color, desc }) => (
                        <button
                            key={value}
                            onClick={() => setReason(value)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${
                                reason === value
                                    ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-500/10`
                                    : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                reason === value ? `bg-${color}-500 text-white shadow-lg shadow-${color}-500/30` : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 group-hover:scale-110'
                            }`}>
                                <Icon size={18} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold transition-colors ${reason === value ? `text-${color}-700 dark:text-${color}-400` : 'text-gray-900 dark:text-slate-100'}`}>{label}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{desc}</p>
                            </div>
                            {reason === value && (
                                <CheckCircle2 className={`text-${color}-500`} size={20} />
                            )}
                        </button>
                    ))}

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onDismiss}
                            className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50 transition-all text-sm"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => reason && onSubmit(reason)}
                            disabled={!reason}
                            className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 text-sm"
                        >
                            Next Step
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogoutReasonModal;
