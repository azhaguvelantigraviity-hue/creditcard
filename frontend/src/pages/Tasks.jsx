import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    Plus, 
    CheckSquare, 
    Clock, 
    AlertCircle, 
    ChevronRight, 
    User,
    Calendar,
    Search,
    MessageSquare,
    ClipboardList,
    X,
    CheckCircle,
    MoreVertical,
    Edit2,
    Trash2,
    Target,
    Wallet
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

const mockTasks = [
    { id: 1, title: 'Follow up with Anil Kapoor', description: 'Interested in SBI Elite card, needs more info on lounge access.', priority: 'High', status: 'Pending', dueDate: '2026-03-31', assignedTo: 'Rahul Sharma' },
    { id: 2, title: 'Submit Weekly Sales Report', description: 'Compile all conversions for the last week.', priority: 'Medium', status: 'In Progress', dueDate: '2026-04-01', assignedTo: 'Priya Verma' },
    { id: 3, title: 'Client Meeting - Vikram Singh', description: 'Documentation collection for Credit Card application.', priority: 'High', status: 'Completed', dueDate: '2026-03-30', assignedTo: 'Rahul Sharma' },
    { id: 4, title: 'Training Session', description: 'New card features training for all sellers.', priority: 'Low', status: 'Pending', dueDate: '2026-04-02', assignedTo: 'Suresh Raina' },
];

const priorityStyles = {
    'High': 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-100',
    'Medium': 'text-orange-600 bg-orange-50 border-orange-100',
    'Low': 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-100',
};

const Tasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [users, setUsers] = useState([]); // For assignment dropdown
    const [openDropdownId, setOpenDropdownId] = useState(null); // For three-dot menu
    const [todayCount, setTodayCount] = useState(0); // Today's cards count
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editSelectedTask, setEditSelectedTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
        priority: 'Medium',
        targetCards: 0
    });

    useEffect(() => {
        fetchTasks();
        if (user?.role === 'admin') {
            fetchUsers();
        } else {
            fetchTodayStats();
        }
    }, [user]);

    const fetchTodayStats = async () => {
        try {
            const { data } = await api.get('/incentives/stats');
            setTodayCount(data.todayCount || 0);
        } catch (error) {
            console.error('Error fetching today stats:', error);
        }
    };

    const fetchTasks = async () => {
        try {
            const { data } = await api.get('/tasks');
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data.filter(u => u.role === 'seller'));
        } catch (error) {
            console.error('Error fetching sellers for tasks:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', formData);
            setIsModalOpen(false);
            fetchTasks();
            setFormData({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium', targetCards: 0 });
        } catch (error) {
            alert(error.response?.data?.message || 'Error assigning task');
        }
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    const handleDeleteClick = (id) => {
        setTaskToDelete(id);
        setDeleteModalOpen(true);
        setOpenDropdownId(null);
    };

    const confirmDelete = async () => {
        if (!taskToDelete) return;
        try {
            await api.delete(`/tasks/${taskToDelete}`);
            setDeleteModalOpen(false);
            setTaskToDelete(null);
            fetchTasks();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting task');
        }
    };

    const openEditModal = (task) => {
        setEditSelectedTask(task);
        // Pre-fill form data for the selected task
        setFormData({
            title: task.title,
            description: task.description,
            assignedTo: task.assignedTo?._id || '',
            dueDate: new Date(task.dueDate).toISOString().split('T')[0],
            priority: task.priority,
            targetCards: task.targetCards || 0
        });
        setOpenDropdownId(null);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/tasks/${editSelectedTask._id}`, formData);
            setIsEditModalOpen(false);
            setEditSelectedTask(null);
            setFormData({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium', targetCards: 0 });
            fetchTasks();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating task');
        }
    };

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [updateStatusVal, setUpdateStatusVal] = useState('');

    const openStatusModal = (task) => {
        setSelectedTask(task);
        setUpdateStatusVal(task.status);
        setStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!selectedTask) return;
        try {
            await api.put(`/tasks/${selectedTask._id}`, { status: updateStatusVal });
            setStatusModalOpen(false);
            fetchTasks();
        } catch (error) {
            console.error('Error updating task status:', error);
            alert(error.response?.data?.message || 'Error updating status');
        }
    };

    const filteredTasks = tasks.filter(t => {
        const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
        const query = searchQuery.toLowerCase();
        const matchesSearch = !query || 
            t.title?.toLowerCase().includes(query) || 
            t.description?.toLowerCase().includes(query) || 
            t.assignedTo?.name?.toLowerCase().includes(query);
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Task Management</h1>
                    <p className="text-gray-500 dark:text-slate-400">Track staff activities. Incentives calculated for sales above daily 10-card target.</p>
                </div>
                {user?.role === 'admin' ? (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-sbi-blue hover:bg-sbi-hover text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
                    >
                        <Plus size={20} />
                        <span>Assign New Task</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-xl font-bold border border-green-200 dark:border-green-500/20 shadow-sm">
                        <Target size={18} />
                        <span>Today's Sales: {todayCount} Cards</span>
                    </div>
                )}
            </div>

            {/* Task Filters */}
            <div className="bg-white dark:bg-slate-950 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-2 overflow-x-auto">
                {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
                    <button 
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                            filterStatus === status ? 'bg-sbi-blue text-white shadow-md' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input
                    type="text"
                    placeholder="Search tasks by title, description, or assignee..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-sbi-blue/30 focus:border-sbi-blue transition-all shadow-sm"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Tasks List */}
            <div className="flex flex-col gap-4">
                {filteredTasks.map((task) => (
                    <div key={task._id} className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Priority badge + Title + Description */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${priorityStyles[task.priority] || priorityStyles['Medium']}`}>
                                        {task.priority}
                                    </span>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 truncate group-hover:text-sbi-blue transition-colors">
                                        {task.title}
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                                    {task.description}
                                </p>
                            </div>

                            {/* Target progress (compact) */}
                            {task.targetCards > 0 && (
                                <div className="sm:w-56 shrink-0">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-gray-400 dark:text-slate-500 font-semibold flex items-center gap-1">
                                            <Target size={12} />
                                            {task.targetCards} Cards
                                        </span>
                                        <span className={`font-bold ${task.actualCards >= task.targetCards ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {task.actualCards || 0}/{task.targetCards}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                task.actualCards >= task.targetCards ? 'bg-green-500' : 'bg-blue-600'
                                            }`}
                                            style={{ width: `${Math.min(((task.actualCards || 0) / task.targetCards) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="w-[110%] -ml-[5%] flex items-center justify-between mt-3 pt-2 border-t border-gray-50 dark:border-slate-800/50">
                                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tight flex items-center gap-1">
                                            <Wallet size={11} className="text-amber-500" />
                                            Est. Incentive
                                        </span>
                                        <span className={`text-xs font-black ${task.incentiveAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-300 dark:text-slate-600'}`}>
                                            ₹{(task.incentiveAmount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Assignee */}
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                                    {task.assignedTo?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="text-xs">
                                    <p className="font-semibold text-gray-700 dark:text-slate-300 leading-tight">{task.assignedTo?.name || 'Unassigned'}</p>
                                    <p className="text-gray-400 dark:text-slate-500 flex items-center gap-1">
                                        <Calendar size={10} />
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Status + Actions */}
                            <div className="flex items-center gap-3 shrink-0">
                                <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                                    task.status === 'Completed' ? 'text-green-600 bg-green-50 dark:bg-green-500/10' : 
                                    task.status === 'Pending' ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10' : 
                                    'text-blue-600 bg-blue-50 dark:bg-blue-500/10'
                                }`}>
                                    {task.status === 'Completed' ? <CheckCircle size={13} /> : <Clock size={13} />}
                                    {task.status}
                                </div>
                                <button 
                                    onClick={() => openStatusModal(task)}
                                    className="text-[11px] font-bold text-sbi-blue border border-blue-100 dark:border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all uppercase tracking-tight whitespace-nowrap"
                                >
                                    Update
                                </button>
                                {user?.role === 'admin' && (
                                    <div className="relative">
                                        <button 
                                            onClick={() => setOpenDropdownId(openDropdownId === task._id ? null : task._id)} 
                                            className="p-1.5 text-gray-400 hover:text-sbi-blue dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-90"
                                            title="Options"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        {openDropdownId === task._id && (
                                            <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 py-2 animate-in fade-in zoom-in-95 overflow-hidden">
                                                <button 
                                                    onClick={() => openEditModal(task)}
                                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-sbi-blue/5 dark:hover:bg-blue-500/10 hover:text-sbi-blue dark:hover:text-blue-400 transition-colors"
                                                >
                                                    <Edit2 size={16} /> Edit Task
                                                </button>
                                                <div className="my-1 border-t border-gray-50 dark:border-slate-800/50" />
                                                <button 
                                                    onClick={() => handleDeleteClick(task._id)}
                                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                >
                                                    <Trash2 size={16} /> Delete Task
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredTasks.length === 0 && !loading && (
                    <div className="col-span-full text-center py-20 bg-white dark:bg-slate-950 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-700">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-4">
                            <ClipboardList size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">No tasks found</h3>
                        <p className="text-gray-500 dark:text-slate-400">Everything is clear!</p>
                    </div>
                )}
            </div>

            {/* Modal for assigning new task */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign New Task">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Task Title</label>
                        <input name="title" required value={formData.title} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue" placeholder="e.g. Follow up with Lead" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Description</label>
                        <textarea name="description" required value={formData.description} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue h-24" placeholder="What needs to be done?" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Priority</label>
                            <select name="priority" value={formData.priority} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue bg-white dark:bg-slate-950">
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Due Date</label>
                            <input name="dueDate" type="date" required value={formData.dueDate} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Target Cards (Optional)</label>
                        <input name="targetCards" type="number" value={formData.targetCards} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue h-12" placeholder="e.g. 15" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Assign To</label>
                        <select name="assignedTo" required value={formData.assignedTo} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue bg-white dark:bg-slate-950">
                            <option value="">Select Staff</option>
                            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-sbi-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-sbi-hover transition-all active:scale-95 shadow-lg mt-4">
                        Confirm Assignment
                    </button>
                </form>
            </Modal>

            {/* Modal for editing existing task */}
            <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setFormData({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium' }); }} title="Edit Task">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Task Title</label>
                        <input name="title" required value={formData.title} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue text-gray-900 dark:text-white dark:bg-slate-950" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Description</label>
                        <textarea name="description" required value={formData.description} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue h-24 text-gray-900 dark:text-white dark:bg-slate-950" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Priority</label>
                            <select name="priority" value={formData.priority} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue text-gray-900 dark:text-white bg-white dark:bg-slate-950">
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Due Date</label>
                            <input name="dueDate" type="date" required value={formData.dueDate} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue text-gray-900 dark:text-white dark:bg-slate-950" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Target Cards (Optional)</label>
                        <input name="targetCards" type="number" value={formData.targetCards} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue text-gray-900 dark:text-white dark:bg-slate-950 h-12" placeholder="e.g. 15" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Assign To</label>
                        <select name="assignedTo" required value={formData.assignedTo} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue text-gray-900 dark:text-white bg-white dark:bg-slate-950">
                            <option value="">Select Staff</option>
                            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-sbi-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-sbi-hover transition-all active:scale-95 shadow-lg mt-4">
                        Save Changes
                    </button>
                </form>
            </Modal>

            {/* Modal for updating status */}
            <Modal isOpen={statusModalOpen} onClose={() => setStatusModalOpen(false)} title="Update Task Status">
                <div className="space-y-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">
                        {selectedTask?.title}
                    </p>
                    <select 
                        value={updateStatusVal}
                        onChange={(e) => setUpdateStatusVal(e.target.value)}
                        className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sbi-blue bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                    >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                    <button 
                        onClick={handleUpdateStatus} 
                        className="w-full bg-sbi-blue text-white py-3 rounded-xl font-bold hover:bg-sbi-hover transition-all active:scale-95 shadow-md"
                    >
                        Save Status
                    </button>
                </div>
            </Modal>

            {/* Custom Delete Confirmation Modal */}
            <Modal isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setTaskToDelete(null); }} title="Delete Task">
                <div className="space-y-6">
                    <div className="flex items-center justify-center p-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 rounded-full flex items-center justify-center">
                            <AlertCircle size={32} />
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Are you sure?</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            Do you really want to delete this task? This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => { setDeleteModalOpen(false); setTaskToDelete(null); }}
                            className="flex-1 px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-red-600/30"
                        >
                            Delete Task
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Tasks;
