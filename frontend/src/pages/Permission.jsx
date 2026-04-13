import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    Shield, 
    Plus, 
    Check, 
    X, 
    Clock, 
    Calendar, 
    User, 
    FileText,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Trash2
} from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 relative animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute right-8 top-8 text-gray-400 hover:text-gray-600 dark:text-slate-400 transition-colors z-10"><X size={24} /></button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-sbi-blue rounded-2xl">
                        <Shield size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight">{title}</h2>
                </div>
                {children}
            </div>
        </div>
    );
};

const formatDuration = (val) => {
    if (!val) return '-';
    const str = String(val).trim();
    // If it already has letters (like 'hr', 'mins'), just return it
    if (/[a-zA-Z]/.test(str)) return str;
    
    // Otherwise it's just numbers, infer hrs vs mins based on magnitude
    const num = Number(str);
    if (!isNaN(num)) {
        if (num > 10) return `${num} Mins`;
        return num <= 1 ? `${num} Hr` : `${num} Hrs`;
    }
    return str;
};

const Permission = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        duration: '',
        type: 'Personal',
        reason: ''
    });

    useEffect(() => {
        fetchPermissions();
        
        // Auto-refresh every 60 seconds
        const interval = setInterval(() => {
            fetchPermissions(true);
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const fetchPermissions = async (silent = false) => {
        if (!silent) setLoading(true);
        if (silent) setIsSyncing(true);
        try {
            const { data } = await api.get('/permissions');
            setPermissions(data);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        } finally {
            setLoading(false);
            if (silent) {
                setTimeout(() => setIsSyncing(false), 2000);
            }
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/permissions', formData);
            setIsModalOpen(false);
            fetchPermissions();
            setFormData({
                date: new Date().toISOString().split('T')[0],
                startTime: '',
                endTime: '',
                duration: '',
                type: 'Personal',
                reason: ''
            });
            showNotification('Request submitted successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Error submitting request');
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.patch(`/permissions/${id}/status`, { status });
            fetchPermissions();
            showNotification(`Permission ${status === 'Approved' ? 'Approved' : 'Rejected'}`);
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this permission record? This action cannot be undone.')) return;
        try {
            await api.delete(`/permissions/${id}`);
            fetchPermissions(true);
            showNotification('Permission record deleted');
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting record');
        }
    };

    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-500/20';
            case 'Rejected': return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20';
            default: return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Global Notification Popup */}
            {notification && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-full duration-300">
                    <div className="bg-slate-900 dark:bg-blue-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 font-black text-lg ring-4 ring-white/10 backdrop-blur-md">
                        {notification.includes('Approved') ? <CheckCircle2 size={24} className="text-green-300" /> : <AlertCircle size={24} />}
                        {notification}
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight">Permission Manager</h1>
                    <p className="text-gray-500 dark:text-slate-400 font-medium">Formally request or manage staff time-off permissions</p>
                </div>
                {!isAdmin && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-sbi-blue hover:bg-sbi-hover text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl shadow-blue-500/20 active:scale-95 uppercase tracking-wider text-sm"
                    >
                        <Plus size={20} />
                        Request Permission
                    </button>
                )}
            </div>

            {/* Dashboard View */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/30">
                    <h2 className="text-xl font-black text-gray-900 dark:text-slate-100 uppercase tracking-tighter">Permission Ledger</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-widest leading-none">
                            <Clock size={14} className={isSyncing ? "animate-spin text-blue-500" : ""} /> 
                            Real-time Sync
                            {isSyncing && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-1" />}
                        </span>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-transparent text-gray-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-50 dark:border-slate-800">
                                <th className="px-8 py-6">Employee</th>
                                <th className="px-8 py-6">Date & Timing</th>
                                <th className="px-8 py-6">Duration</th>
                                <th className="px-8 py-6">Type</th>
                                {isAdmin && <th className="px-8 py-6">Reason</th>}
                                <th className="px-8 py-6 text-center">Status / Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                            {permissions.map((perm) => (
                                <tr key={perm._id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 uppercase">
                                                {(perm.userId?.name || user?.name || 'S').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 dark:text-slate-100 tracking-tight">{perm.userId?.name || user?.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{perm.userId?.role || user?.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300 font-bold text-sm italic">
                                            <Calendar size={14} className="text-blue-500" />
                                            {new Date(perm.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            <span className="mx-2 opacity-20">|</span>
                                            <Clock size={14} className="text-amber-500" />
                                            {perm.startTime} - {perm.endTime}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-black text-gray-900 dark:text-slate-100 italic">
                                        {formatDuration(perm.duration)}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                                            perm.type === 'Official' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20' : 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-500/20'
                                        }`}>
                                            {perm.type}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 max-w-xs">{perm.reason}</p>
                                        </td>
                                    )}
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="flex items-center gap-2">
                                                {perm.status === 'Pending' && isAdmin ? (
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleStatusUpdate(perm._id, 'Approved')}
                                                            className="w-9 h-9 flex items-center justify-center bg-green-500 text-white rounded-xl hover:bg-green-600 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-green-500/30"
                                                            title="Approve"
                                                        >
                                                            <Check size={20} strokeWidth={3} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(perm._id, 'Rejected')}
                                                            className="w-9 h-9 flex items-center justify-center bg-red-500 text-white rounded-xl hover:bg-red-600 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-red-500/30"
                                                            title="Reject"
                                                        >
                                                            <X size={20} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusStyle(perm.status)}`}>
                                                        {perm.status === 'Approved' && <Check size={10} className="inline mr-1" strokeWidth={4} />}
                                                        {perm.status === 'Rejected' && <X size={10} className="inline mr-1" strokeWidth={4} />}
                                                        {perm.status}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Delete Option */}
                                            {(isAdmin || perm.status === 'Pending') && (
                                                <button 
                                                    onClick={() => handleDelete(perm._id)}
                                                    className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 rounded-xl transition-all active:scale-95"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && permissions.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-30 grayscale">
                                            <FileText size={48} className="mb-4" />
                                            <p className="text-xl font-black uppercase tracking-widest">No Permission Logs</p>
                                            <p className="text-xs font-bold mt-2">Activity will appear here once requests are made.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Request Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Permission Request">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Permission Date</label>
                            <input name="date" type="date" required value={formData.date} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold shadow-inner" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Start Timing</label>
                            <input name="startTime" type="time" required value={formData.startTime} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">End Timing</label>
                            <input name="endTime" type="time" required value={formData.endTime} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Total Duration</label>
                            <input name="duration" required value={formData.duration} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="e.g. 2 Hours" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Permission Type</label>
                            <select name="type" value={formData.type} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none cursor-pointer">
                                <option value="Personal">Personal</option>
                                <option value="Official">Official</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Detailed Reason</label>
                        <textarea name="reason" required value={formData.reason} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold min-h-[100px]" placeholder="Brief context for the admin..." />
                    </div>
                    <button type="submit" className="w-full bg-sbi-blue text-white py-4 rounded-[1.5rem] font-black text-lg hover:bg-sbi-hover transition-all active:scale-95 shadow-2xl shadow-blue-500/30 uppercase tracking-[0.2em] mt-2">
                        Submit Official Request
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Permission;
