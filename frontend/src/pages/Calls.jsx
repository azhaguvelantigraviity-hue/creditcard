import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    Phone, 
    PhoneIncoming, 
    PhoneOutgoing, 
    PhoneMissed, 
    Search, 
    Plus, 
    Filter, 
    MoreVertical, 
    Calendar,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    RotateCcw,
    ChevronRight,
    X
} from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-8 relative animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
                <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 dark:text-slate-400 transition-colors z-10"><X size={24} /></button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">{title}</h2>
                <div className="mt-6">{children}</div>
            </div>
        </div>
    );
};

const outcomeStyles = {
    'Interested': 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100',
    'Follow Up': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100',
    'Not Interested': 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100',
    'No Answer': 'bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-300 border-gray-100 dark:border-slate-700',
    'Busy': 'bg-orange-50 text-orange-700 border-orange-100',
    'Call Back': 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

const Calls = () => {
    const { user } = useAuth();
    const [calls, setCalls] = useState([]);
    const [stats, setStats] = useState({
        totalCalls: 0,
        successRate: '0%',
        avgDuration: '0s',
        missedTasks: 0
    });
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOutcome, setFilterOutcome] = useState('All');
    const [formData, setFormData] = useState({
        leadId: '',
        outcome: 'Interested',
        notes: '',
        duration: ''
    });

    useEffect(() => {
        fetchCalls();
        fetchStats();
        fetchLeads();
    }, []);

    const fetchCalls = async () => {
        try {
            const { data } = await api.get('/calls');
            setCalls(data);
        } catch (error) {
            console.error('Error fetching calls:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/calls/stats');
            setStats(data);
        } catch (error) {
            console.error('Error fetching call stats:', error);
        }
    };

    const fetchLeads = async () => {
        try {
            const { data } = await api.get('/leads');
            setLeads(data);
        } catch (error) {
            console.error('Error fetching leads for calls:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/calls', formData);
            setIsModalOpen(false);
            fetchCalls();
            fetchStats();
            setFormData({ leadId: '', outcome: 'Interested', notes: '', duration: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Error logging call');
        }
    };

    const filteredCalls = calls.filter(call => {
        const matchesSearch = call.leadId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             call.sellerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             call.leadId?.phone?.includes(searchTerm);
        const matchesOutcome = filterOutcome === 'All' || call.outcome === filterOutcome;
        return matchesSearch && matchesOutcome;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Calls Tracking</h1>
                    <p className="text-gray-500 dark:text-slate-400">Monitor and log tele-calling activities</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-sbi-blue hover:bg-sbi-hover text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
                >
                    <Plus size={20} />
                    <span>Log New Call</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Calls Today', value: stats.totalCalls, icon: Phone, color: 'blue' },
                    { label: 'Avg Duration', value: stats.avgDuration, icon: Clock, color: 'indigo' },
                    { label: 'Success Rate', value: stats.successRate, icon: CheckCircle2, color: 'green' },
                    { label: 'Missed Tasks', value: stats.missedTasks, icon: PhoneMissed, color: 'red' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{stat.label}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by lead, seller, or phone..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-sbi-blue outline-none shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select 
                        className="flex-1 md:w-40 px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-sbi-blue outline-none text-sm font-medium shadow-sm transition-all"
                        value={filterOutcome}
                        onChange={(e) => setFilterOutcome(e.target.value)}
                    >
                        <option value="All">All Outcomes</option>
                        <option value="Interested">Interested</option>
                        <option value="Follow Up">Follow Up</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="No Answer">No Answer</option>
                    </select>
                </div>
            </div>

            {/* Call Logs Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-900/50/50">
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider pl-8">Lead / Customer</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Seller</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Outcome</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right pr-8">Date & Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                            {filteredCalls.map((call) => (
                                <tr key={call._id} className="hover:bg-blue-50 dark:bg-blue-500/10/30 transition-colors group">
                                    <td className="p-4 pl-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                {call.leadId?.name?.charAt(0) || 'L'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-slate-100 leading-none mb-1">{call.leadId?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">{call.leadId?.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <PhoneOutgoing size={16} className="text-blue-500" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Call</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                                {call.sellerId?.name?.split(' ').map(n=>n[0]).join('') || 'S'}
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{call.sellerId?.name || 'Seller'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${outcomeStyles[call.outcome] || outcomeStyles['No Answer']}`}>
                                            {call.outcome}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right pr-8">
                                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-none mb-1">{new Date(call.createdAt).toLocaleDateString()}</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">{new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredCalls.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-slate-800">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-4">
                            <Phone size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">No calls found</h3>
                        <p className="text-gray-500 dark:text-slate-400 font-medium">Try adjusting your filters or search terms.</p>
                    </div>
                )}
            </div>

            {/* Modal for logging new call */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Call">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Select Lead</label>
                        <select 
                            name="leadId" 
                            required 
                            value={formData.leadId} 
                            onChange={handleInputChange} 
                            className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue bg-white dark:bg-slate-800"
                        >
                            <option value="">Search Lead...</option>
                            {leads.map(lead => <option key={lead._id} value={lead._id}>{lead.name} ({lead.phone})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Outcome</label>
                        <select 
                            name="outcome" 
                            value={formData.outcome} 
                            onChange={handleInputChange} 
                            className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue bg-white dark:bg-slate-800"
                        >
                            <option value="Interested">Interested</option>
                            <option value="Follow Up">Follow Up</option>
                            <option value="Not Interested">Not Interested</option>
                            <option value="No Answer">No Answer</option>
                            <option value="Busy">Busy</option>
                            <option value="Call Back">Call Back</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Call Notes</label>
                        <textarea 
                            name="notes" 
                            value={formData.notes} 
                            onChange={handleInputChange} 
                            className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue h-24" 
                            placeholder="Summary of the conversation..." 
                        />
                    </div>
                    <button type="submit" className="w-full bg-sbi-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-sbi-hover transition-all active:scale-95 shadow-lg mt-4">
                        Save Call Log
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Calls;
