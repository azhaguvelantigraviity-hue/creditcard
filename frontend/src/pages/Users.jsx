import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Search, 
    Plus, 
    MoreVertical, 
    Edit, 
    Trash2, 
    Mail, 
    Phone, 
    Shield, 
    UserPlus,
    X,
    Filter,
    CheckCircle
} from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            {children}
        </div>
    );
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'seller',
        status: 'active',
        phoneNumber: '',
        password: ''
    });
    const [tempPassword, setTempPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            phoneNumber: user.phoneNumber || '',
            password: ''
        });
        setIsModalOpen(true);
    };

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/users/${selectedUser._id}`, formData);
            fetchUsers();
            setIsModalOpen(false);
            setSelectedUser(null);
            setFormData({ name: '', email: '', role: 'seller', status: 'active', phoneNumber: '', password: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating staff');
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/users', formData);
            setTempPassword(data.tempPassword);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding staff');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
        
        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleAddUser = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Staff Management</h1>
                    <p className="text-gray-500 dark:text-slate-400">Manage your sales agents and administrators</p>
                </div>
                <button 
                    onClick={handleAddUser}
                    className="bg-sbi-blue hover:bg-sbi-hover text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
                >
                    <Plus size={20} />
                    <span>Add New Staff</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-sbi-blue focus:bg-white dark:bg-slate-800 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <select 
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sbi-blue bg-white dark:bg-slate-800 transition-all"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admins</option>
                        <option value="seller">Sellers</option>
                    </select>

                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sbi-blue bg-white dark:bg-slate-800 transition-all"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <button 
                        onClick={() => {
                            setSearchTerm('');
                            setFilterRole('all');
                            setFilterStatus('all');
                        }}
                        className="px-4 py-2.5 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300 text-sm font-medium transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Staff Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-center">Created At</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                            {filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-sbi-blue flex items-center justify-center font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{user.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center w-fit gap-1.5 ${
                                            user.role === 'admin' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                        }`}>
                                            <Shield size={12} />
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                                            user.status === 'active' ? 'bg-green-100 text-green-700 dark:text-green-400' : 'bg-red-100 text-red-700 dark:text-red-400'
                                        }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 text-center">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditClick(user)} className="p-2 text-gray-400 hover:text-sbi-blue hover:bg-blue-50 dark:bg-blue-500/10 rounded-lg transition-colors">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(user._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:bg-red-500/10 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedUser ? 'Edit Staff Member' : 'Add New Staff Member'}>
                <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8 overflow-y-auto max-h-[90vh] custom-scrollbar">
                    <button 
                        onClick={() => {
                            setIsModalOpen(false);
                            setTempPassword('');
                            setFormData({ name: '', email: '', role: 'seller', status: 'active', phoneNumber: '', password: '' });
                        }}
                        className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 dark:text-slate-400 transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                        {selectedUser ? 'Edit Staff Member' : 'Add New Staff Member'}
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">
                        {selectedUser ? 'Update account details for this user.' : 'Set up account access for a new sales representative.'}
                    </p>

                    {tempPassword ? (
                        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 p-6 rounded-2xl animate-in zoom-in duration-300">
                            <div className="flex items-center gap-3 text-sbi-blue mb-2">
                                <CheckCircle size={20} />
                                <h3 className="font-bold">Staff Member Added!</h3>
                            </div>
                            <p className="text-sm text-blue-800 mb-4">Please share the temporary login password with the staff member:</p>
                            <div className="bg-white dark:bg-slate-800 border border-blue-100 p-4 rounded-xl text-center">
                                <span className="text-2xl font-mono font-black tracking-widest text-sbi-blue">{tempPassword}</span>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setTempPassword('');
                                    setFormData({ name: '', email: '', role: 'seller', status: 'active', phoneNumber: '', password: '' });
                                }}
                                className="w-full mt-6 bg-sbi-blue text-white py-3 rounded-xl font-bold hover:bg-sbi-hover transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={selectedUser ? handleUpdateStaff : handleAddStaff} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Full Name</label>
                                <input 
                                    name="name"
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Rahul Sharma" 
                                    className="w-full p-3.5 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-sbi-blue focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Email Address</label>
                                <input 
                                    name="email"
                                    type="email" 
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="rahul@sbi.com" 
                                    className="w-full p-3.5 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-sbi-blue focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Phone Number</label>
                                <input 
                                    name="phoneNumber"
                                    type="text" 
                                    required
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="10 digit mobile number" 
                                    className="w-full p-3.5 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-sbi-blue focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Role</label>
                                    <select 
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="w-full p-3.5 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-sbi-blue outline-none transition-all bg-white dark:bg-slate-800"
                                    >
                                        <option value="seller">Seller</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Status</label>
                                    <select 
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full p-3.5 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-sbi-blue outline-none transition-all bg-white dark:bg-slate-800"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">
                                    {selectedUser ? 'Reset Password (Leave blank to keep current)' : 'Initial Password'}
                                </label>
                                <input 
                                    name="password"
                                    type="password" 
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder={selectedUser ? 'Enter new password' : 'Empty for auto-generated'} 
                                    className="w-full p-3.5 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-sbi-blue focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <button type="submit" className="w-full bg-sbi-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-sbi-hover transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-blue-100 mt-4">
                                {selectedUser ? 'Save Changes' : 'Save Staff Member'}
                            </button>
                        </form>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Users;
