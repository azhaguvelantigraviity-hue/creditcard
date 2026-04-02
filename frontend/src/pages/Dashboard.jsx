import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
    Users, 
    Target, 
    TrendingUp, 
    PieChart as PieIcon, 
    ArrowUpRight, 
    ArrowDownRight,
    Clock,
    ShieldCheck,
    PhoneCall
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    AreaChart, 
    Area,
    LineChart,
    Line
} from 'recharts';

const colorClasses = {
    blue: {
        bg: "bg-blue-50 dark:bg-blue-500/10",
        border: "border-blue-100 dark:border-blue-500/20",
        text: "text-blue-900 dark:text-blue-100",
        iconText: "text-blue-600 dark:text-blue-400"
    },
    cyan: {
        bg: "bg-cyan-50 dark:bg-cyan-500/10",
        border: "border-cyan-100 dark:border-cyan-500/20",
        text: "text-cyan-900 dark:text-cyan-100",
        iconText: "text-cyan-600 dark:text-cyan-400"
    },
    indigo: {
        bg: "bg-indigo-50 dark:bg-indigo-500/10",
        border: "border-indigo-100 dark:border-indigo-500/20",
        text: "text-indigo-900 dark:text-indigo-100",
        iconText: "text-indigo-600 dark:text-indigo-400"
    },
    emerald: {
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        border: "border-emerald-100 dark:border-emerald-500/20",
        text: "text-emerald-900 dark:text-emerald-100",
        iconText: "text-emerald-600 dark:text-emerald-400"
    }
};

const StatCard = ({ title, value, icon: Icon, trend, color }) => {
    const theme = colorClasses[color] || colorClasses.blue;
    return (
        <div className={`${theme.bg} p-6 rounded-2xl shadow-sm border ${theme.border} transition-all hover:shadow-md hover:scale-[1.02] cursor-default`}>
            <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm ${theme.iconText}`}>
                    <Icon size={24} />
                </div>
                {trend != null && (
                    <div className={`flex items-center text-sm font-black ${trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        <span className="ml-1">{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            <div className="mt-4">
                <h3 className="text-gray-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">{title}</h3>
                <p className={`text-3xl font-black ${theme.text} mt-1`}>{value}</p>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/stats/dashboard');
                setStats(data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sbi-blue"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Welcome Back, {user?.name}!</h1>
                <p className="text-gray-500 dark:text-slate-400">Here's what's happening with your sales today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title={isAdmin ? "Total Sellers" : "My Sales (Cards)"} 
                    value={stats?.totalSellers || "0"} 
                    icon={Users} 
                    trend={stats?.trend?.sellers} 
                    color="blue" 
                />
                <StatCard 
                    title={isAdmin ? "Active Leads" : "Assigned Leads"} 
                    value={stats?.activeLeads || "0"} 
                    icon={Target} 
                    trend={stats?.trend?.leads} 
                    color="cyan" 
                />
                <StatCard 
                    title="Total Revenue" 
                    value={`₹${(stats?.totalSalesAmount || 0).toLocaleString()}`} 
                    icon={TrendingUp} 
                    trend={stats?.trend?.sales} 
                    color="indigo" 
                />
                <StatCard 
                    title="Conversion Rate" 
                    value={`${stats?.conversionRate || 0}%`} 
                    icon={ShieldCheck} 
                    trend={stats?.trend?.conversion} 
                    color="emerald" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Sales vs Leads Analysis</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Weekly performance metrics</p>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.chartData || []}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2c3e8c" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#2c3e8c" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="opacity-50 dark:opacity-10" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-colors-slate-800)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#2c3e8c" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                <Area type="monotone" dataKey="leads" stroke="#00a1e1" strokeWidth={3} fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Performance Table / Quick View */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Recent Activities</h2>
                        <button className="text-sbi-blue dark:text-blue-400 text-sm font-semibold hover:underline">View All</button>
                    </div>
                    <div className="space-y-6">
                        {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                            stats.recentActivities.map((activity, idx) => {
                                const IconComponent = {
                                    Target: Target,
                                    Clock: Clock,
                                    ShieldCheck: ShieldCheck,
                                    PhoneCall: PhoneCall
                                }[activity.iconType] || Clock;

                                return (
                                    <div key={idx} className="flex gap-4 group hover:bg-gray-50/50 dark:hover:bg-slate-700 p-2 -mx-2 rounded-xl transition-all">
                                        <div className="p-2.5 bg-gray-50 dark:bg-slate-700 rounded-xl text-sbi-blue dark:text-blue-400 h-fit border border-gray-100 dark:border-gray-800 group-hover:scale-110 transition-transform">
                                            <IconComponent size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm dark:text-slate-400"><span className="font-bold text-gray-900 dark:text-slate-100">{activity.name}</span> <span className="text-gray-600 dark:text-slate-400">{activity.action}</span></p>
                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium">{activity.timeLabel}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">No recent activity detected.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
