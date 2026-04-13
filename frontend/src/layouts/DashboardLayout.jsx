import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, 
    Users, 
    CheckSquare, 
    PhoneCall, 
    TrendingUp, 
    LogOut, 
    AlignLeft, 
    X, 
    ChevronLeft,
    ChevronRight,
    User as UserIcon,
    Calendar,
    Target,
    Phone,
    Coins,
    Sun,
    Moon,
    Shield
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const DashboardLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const navigate = useNavigate();

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        if (!isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const menuItems = [
        { name: 'Overview', icon: LayoutDashboard, path: '/', roles: ['admin', 'tl', 'seller'] },
        { name: 'Staff Management', icon: Users, path: '/users', roles: ['admin'] },
        { name: 'Leads', icon: Target, path: '/leads', roles: ['admin', 'tl', 'seller'] },
        { name: 'Attendance', icon: Calendar, path: '/attendance', roles: ['admin', 'tl', 'seller'] },
        { name: 'Calls Tracking', icon: Phone, path: '/calls', roles: ['admin', 'tl', 'seller'] },
        { name: 'Tasks', icon: CheckSquare, path: '/tasks', roles: ['admin', 'tl', 'seller'] },
        { name: 'Sales Success', icon: TrendingUp, path: '/sales', roles: ['admin', 'tl', 'seller'] },
        { name: 'Incentives', icon: Coins, path: '/incentives', roles: ['admin', 'tl', 'seller'] },
        { name: 'Permission', icon: Shield, path: '/permission', roles: ['admin', 'tl', 'seller'] },
        { name: 'Settings', icon: AlignLeft, path: '/settings', roles: ['admin'] },
    ];

    const filteredMenu = menuItems.filter(item => {
        if (!user || !user.role) return false;
        const userRole = user.role.toLowerCase();
        return item.roles.some(role => role.toLowerCase() === userRole);
    });

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Error during logout:', error);
        }
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-sbi-light dark:bg-slate-950 transition-colors duration-300">
            {/* Sidebar */}
            <aside className={cn(
                "bg-slate-900 dark:bg-slate-950 border-r border-slate-800 text-white w-64 flex-shrink-0 transition-all duration-300 ease-in-out fixed lg:relative z-40 h-full shadow-xl flex flex-col",
                !isSidebarOpen && "-translate-x-full lg:translate-x-0 lg:w-20"
            )}>
                <div className="flex items-center justify-between p-4 border-b border-white/5 min-h-[64px] flex-shrink-0">
                    <div className={cn("font-bold text-xl flex items-center gap-2 tracking-wide", !isSidebarOpen && "hidden")}>
                        <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/30">SBI</div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">Sales Manager</span>
                    </div>
                    
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={cn(
                            "p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors",
                            !isSidebarOpen && "mx-auto"
                        )}
                        title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                        {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-2 py-6 space-y-2 scrollbar-none hover:scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {filteredMenu.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center p-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                isActive 
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 before:absolute before:inset-0 before:bg-white/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity" 
                                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                                !isSidebarOpen && "lg:justify-center"
                            )}
                        >
                            <item.icon size={22} className="flex-shrink-0" />
                            <span className={cn("ml-3 font-medium", !isSidebarOpen && "lg:hidden")}>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 space-y-4 bg-transparent border-t border-white/5 flex-shrink-0">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center w-full p-3 rounded-xl text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 border border-transparent hover:border-red-500/30"
                    >
                        <LogOut size={22} className="group-hover:scale-110 transition-transform" />
                        <span className={cn("ml-3 font-medium", !isSidebarOpen && "lg:hidden")}>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white dark:bg-slate-950 shadow-sm flex-shrink-0 h-16 flex items-center justify-between px-4 lg:px-8 border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-400 lg:hidden transition-colors"
                    >
                        {isSidebarOpen ? <X size={24} /> : <ChevronRight size={24} />}
                    </button>

                    <div className="flex items-center gap-4 ml-auto">
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 flex items-center justify-center group"
                            title="Toggle Light/Dark Mode"
                        >
                            {isDarkMode ? (
                                <Sun size={20} className="text-amber-500 group-hover:rotate-45 transition-transform duration-300" />
                            ) : (
                                <Moon size={20} className="text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
                            )}
                        </button>

                        <div className="flex items-center gap-3 border-l border-gray-200 dark:border-slate-800 pl-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{user?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{user?.role}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-sbi-accent dark:bg-blue-500 flex items-center justify-center text-white font-bold ring-2 ring-blue-50 dark:ring-slate-800">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
