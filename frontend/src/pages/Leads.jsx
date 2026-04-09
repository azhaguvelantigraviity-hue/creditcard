import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    Search, 
    Plus, 
    Filter, 
    MoreVertical, 
    Mail, 
    Phone, 
    Calendar,
    MessageSquare,
    Tag,
    ChevronRight,
    Circle,
    CheckCircle2,
    Clock,
    XCircle,
    X,
    UserPlus
} from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white dark:bg-slate-950 rounded-3xl w-full max-w-md shadow-2xl p-8 relative animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
                <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 dark:text-slate-400 transition-colors z-10"><X size={24} /></button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">{title}</h2>
                <div className="mt-6">{children}</div>
            </div>
        </div>
    );
};

const mockLeads = [
    { id: 1, name: 'Anil Kapoor', email: 'anil@gmail.com', phone: '+91 9123456780', status: 'Interested', date: '2026-03-28', assignedTo: 'Rahul Sharma' },
    { id: 2, name: 'Suman Lata', email: 'suman@yahoo.com', phone: '+91 9234567810', status: 'Converted', date: '2026-03-29', assignedTo: 'Priya Verma' },
    { id: 3, name: 'Vikram Singh', email: 'vikram@outlook.com', phone: '+91 9345678120', status: 'New', date: '2026-03-30', assignedTo: 'Rahul Sharma' },
    { id: 4, name: 'Meena Reddy', email: 'meena@rediff.com', phone: '+91 9456781230', status: 'Not Interested', date: '2026-03-30', assignedTo: 'Suresh Raina' },
    { id: 5, name: 'Rajesh G', email: 'rajesh@gmail.com', phone: '+91 9567812340', status: 'Follow Up', date: '2026-03-31', assignedTo: 'Amit Kumar' },
];

const statusStyles = {
    'New': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
    'Interested': 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20',
    'Converted': 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-500/20',
    'Not Interested': 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20',
    'Follow Up': 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-500/20',
};

const Leads = () => {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [users, setUsers] = useState([]); // For assignment dropdown
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        status: 'New',
        assignedTo: '',
        notes: '',
        cardType: 'Card 1'
    });

    // Modals state
    const [selectedLead, setSelectedLead] = useState(null);
    const [modalType, setModalType] = useState(null); // 'status', 'notes', 'history'
    const [updateData, setUpdateData] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const openModal = (type, lead) => {
        setSelectedLead(lead);
        setModalType(type);
        setUpdateData(type === 'status' ? lead.status : '');
    };

    const handleUpdate = async () => {
        if (!selectedLead) return;
        setActionLoading(true);
        try {
            const payload = modalType === 'status' ? { status: updateData } : { note: updateData };
            await api.put(`/leads/${selectedLead._id}`, payload);
            fetchLeads(); // refresh leads
            setModalType(null);
            setSelectedLead(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update lead');
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
        if (user?.role === 'admin') {
            fetchUsers();
        }
    }, [user]);

    const fetchLeads = async () => {
        try {
            const { data } = await api.get('/leads');
            setLeads(data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data.filter(u => u.role === 'seller'));
        } catch (error) {
            console.error('Error fetching sellers:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (user.role === 'seller') {
                payload.assignedTo = user._id;
            }
            await api.post('/leads', payload);
            setIsModalOpen(false);
            fetchLeads();
            setFormData({ name: '', email: '', phoneNumber: '', status: 'New', assignedTo: '', notes: '', cardType: 'Card 1' });
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding lead');
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             lead.phoneNumber?.includes(searchTerm);
        const matchesStatus = filterStatus === 'All' || lead.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Leads Management</h1>
                    <p className="text-gray-500 dark:text-slate-400">Track and manage credit card potential customers</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-sbi-blue hover:bg-sbi-hover text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
                >
                    <Plus size={20} />
                    <span>Add New Lead</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or phone..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-sbi-blue transition-all outline-none shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-sm font-medium text-gray-500 dark:text-slate-400 hidden sm:block whitespace-nowrap">Status:</span>
                    <select 
                        className="flex-1 md:w-40 px-3 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-sbi-blue outline-none text-sm font-medium shadow-sm"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="New">New</option>
                        <option value="Interested">Interested</option>
                        <option value="Follow Up">Follow Up</option>
                        <option value="Converted">Converted</option>
                        <option value="Not Interested">Not Interested</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredLeads.map((lead) => (
                    <div key={lead._id} className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        {/* Status Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusStyles[lead.status]?.includes('text-blue') ? 'bg-blue-500' : statusStyles[lead.status]?.includes('text-indigo') ? 'bg-indigo-500' : statusStyles[lead.status]?.includes('text-green') ? 'bg-emerald-500' : statusStyles[lead.status]?.includes('text-red') ? 'bg-red-500' : 'bg-orange-500'}`} />
                        
                        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                                    {lead.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                        {lead.name}
                                        <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/30 uppercase tracking-tighter ml-1">
                                            {lead.cardType || 'Card 1'}
                                        </span>
                                        <ChevronRight size={14} className="text-gray-300" />
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                        <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                                            <Phone size={14} />
                                            {lead.phoneNumber}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 border-l border-gray-200 dark:border-gray-800 pl-4">
                                            <Mail size={14} />
                                            {lead.email}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                                <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${statusStyles[lead.status] || ''}`}>
                                    {lead.status}
                                </div>
                                <div className="px-4 py-1.5 rounded-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-600 dark:text-slate-400 flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    {new Date(lead.createdAt).toLocaleDateString()}
                                </div>
                                <div className="px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 text-xs font-medium text-blue-700 dark:text-blue-400">
                                    Assigned to: {lead.assignedTo?.name || 'Unassigned'}
                                </div>

                                {lead.lastCall && (
                                    <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="flex items-center gap-1.5">
                                            <MessageSquare size={14} className="text-blue-500" />
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase">Last Interaction:</span>
                                            <span className="text-xs font-bold text-gray-900 dark:text-slate-100">{lead.lastCall.sellerName}</span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-700" />
                                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                            <Clock size={12} strokeWidth={3} />
                                            <span className="text-xs font-black">{lead.lastCall.duration || '0s'}</span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="relative">
                                    <button onClick={() => setOpenDropdownId(openDropdownId === lead._id ? null : lead._id)} className="p-2 text-gray-400 hover:text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-xl transition-all">
                                        <MoreVertical size={20} />
                                    </button>
                                    {openDropdownId === lead._id && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-950 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-10 py-2 animate-in fade-in zoom-in-95">
                                            <a href={`tel:${lead.phoneNumber}`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                <Phone size={14} /> Call Lead
                                            </a>
                                            {lead.email && (
                                                <a href={`mailto:${lead.email}`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                    <Mail size={14} /> Email Lead
                                                </a>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${lead.name} - ${lead.phoneNumber}`);
                                                    setOpenDropdownId(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                            >
                                                <MessageSquare size={14} /> Copy Details
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons (Visible on hover) */}
                        <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-2">
                            <button onClick={() => openModal('status', lead)} className="text-xs font-bold text-sbi-blue dark:text-blue-400 border border-blue-100 dark:border-blue-500/30 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors uppercase tracking-tight shadow-sm">Update Status</button>
                            <button onClick={() => openModal('notes', lead)} className="text-xs font-bold text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/80 transition-colors uppercase tracking-tight shadow-sm">Add Notes</button>
                            <button onClick={() => openModal('history', lead)} className="text-xs font-bold text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/80 transition-colors uppercase tracking-tight shadow-sm">View History</button>
                        </div>
                    </div>
                ))}
                {filteredLeads.length === 0 && !loading && (
                    <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-700">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-4">
                            <Search size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">No leads found</h3>
                        <p className="text-gray-500 dark:text-slate-400">Try adjusting your filters or search terms.</p>
                    </div>
                )}
            </div>

            {/* Action Modals */}
            <Modal isOpen={!!modalType} onClose={() => { setModalType(null); setSelectedLead(null); }} title={
                modalType === 'status' ? 'Update Lead Status' : 
                modalType === 'notes' ? 'Add Lead Note' : 'Lead History'
            }>
                {modalType === 'status' && (
                    <div className="space-y-4">
                        <select 
                            value={updateData}
                            onChange={(e) => setUpdateData(e.target.value)}
                            className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue bg-white dark:bg-slate-950"
                        >
                            <option value="New">New</option>
                            <option value="Interested">Interested</option>
                            <option value="Follow Up">Follow Up</option>
                            <option value="Converted">Converted</option>
                            <option value="Not Interested">Not Interested</option>
                        </select>
                        <button onClick={handleUpdate} disabled={actionLoading} className="w-full bg-sbi-blue text-white py-3 rounded-xl font-bold hover:bg-sbi-hover transition-all disabled:opacity-50">
                            {actionLoading ? 'Updating...' : 'Save Status'}
                        </button>
                    </div>
                )}
                {modalType === 'notes' && (
                    <div className="space-y-4">
                        <textarea 
                            value={updateData}
                            onChange={(e) => setUpdateData(e.target.value)}
                            className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue h-32"
                            placeholder="Type note details here..."
                        />
                        <button onClick={handleUpdate} disabled={actionLoading || !updateData.trim()} className="w-full bg-sbi-blue text-white py-3 rounded-xl font-bold hover:bg-sbi-hover transition-all disabled:opacity-50">
                            {actionLoading ? 'Adding note...' : 'Save Note'}
                        </button>
                    </div>
                )}
                {modalType === 'history' && selectedLead && (
                    <div className="space-y-4">
                        {selectedLead.notes?.length > 0 ? (
                            <div className="space-y-3">
                                {selectedLead.notes.map((note, idx) => (
                                    <div key={idx} className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl text-sm border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-sbi-blue opacity-50" />
                                        <p className="text-gray-800 dark:text-slate-200 font-medium">{note.text}</p>
                                        <p className="text-xs text-gray-400 mt-2 font-bold flex items-center gap-1">
                                            <Calendar size={12} /> {new Date(note.date).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 font-medium bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-2">
                                <Clock size={24} className="text-gray-400" />    
                                No notes or history found for this lead.
                            </div>
                        )}
                        <button onClick={() => { setModalType(null); setSelectedLead(null); }} className="w-full bg-gray-100 dark:bg-slate-950 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all mt-2 shadow-sm">
                            Close
                        </button>
                    </div>
                )}
            </Modal>

            {/* Modal for adding new lead */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Lead">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Customer Name</label>
                        <input name="name" required value={formData.name} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue" placeholder="e.g. Ramesh Kumar" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Phone Number</label>
                            <input name="phoneNumber" required value={formData.phoneNumber} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue" placeholder="10 Digit Number" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Email</label>
                            <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue" placeholder="Optional" />
                        </div>
                    </div>
                    {user?.role === 'admin' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Assign To Seller</label>
                            <select name="assignedTo" value={formData.assignedTo} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue bg-white dark:bg-slate-950">
                                <option value="">Select Seller</option>
                                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">List Type (Card Category)</label>
                        <select name="cardType" value={formData.cardType} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue bg-white dark:bg-slate-950 font-bold">
                            <option value="Card 1">Card 1</option>
                            <option value="Card 2">Card 2</option>
                            <option value="Card 3">Card 3</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Initial Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue h-24" placeholder="Any special requirements?" />
                    </div>
                    <button type="submit" className="w-full bg-sbi-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-sbi-hover transition-all active:scale-95 shadow-lg mt-4">
                        Save Potential Customer
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Leads;
