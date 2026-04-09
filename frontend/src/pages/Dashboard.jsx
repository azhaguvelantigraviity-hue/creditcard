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
    PhoneCall,
    Wallet,
    CreditCard,
    Award,
    IndianRupee
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
    const [incentives, setIncentives] = useState([]);
    const [incentivesLoading, setIncentivesLoading] = useState(true);
    const [sellerStats, setSellerStats] = useState(null);
    const [adminStats, setAdminStats] = useState(null);

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

        const fetchIncentives = async () => {
            try {
                const { data } = await api.get('/incentives/dashboard-summary');
                setIncentives(data);
            } catch (error) {
                console.error('Error fetching incentive summary:', error);
            } finally {
                setIncentivesLoading(false);
            }
        };

        const fetchSellerStats = async () => {
            if (isAdmin) return;
            try {
                const { data } = await api.get('/incentives/stats');
                setSellerStats(data);
            } catch (error) {
                console.error('Error fetching seller personal stats:', error);
            }
        };

        const fetchAdminStats = async () => {
            if (!isAdmin) return;
            try {
                const { data } = await api.get('/incentives/admin-stats');
                setAdminStats(data);
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            }
        };

        fetchStats();
        fetchIncentives();
        fetchSellerStats();
        fetchAdminStats();
    }, [isAdmin]);

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sbi-blue"></div>
        </div>
    );

    // Compute totals for incentive summary cards
    const totalCardsSold = incentives.reduce((sum, i) => sum + i.cardsSold, 0);
    const totalIncentiveAmt = incentives.reduce((sum, i) => sum + i.totalIncentive, 0);
    const totalPending = incentives.reduce((sum, i) => sum + i.pendingIncentive, 0);

    return (
        <div className="space-y-8 pb-10">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Welcome Back, {user?.name}!</h1>
                <p className="text-gray-500 dark:text-slate-400">Here's what's happening with your sales today.</p>
            </div>

            {/* Seller Specific: Today's Target Overview */}
            {!isAdmin && sellerStats && (
                <div className="bg-gradient-to-br from-sbi-blue to-[#1a2553] p-6 rounded-2xl shadow-md text-white mb-6 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 text-white/5">
                        <Target size={150} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Target className="text-amber-400" /> Today's Target Overview
                                </h2>
                                {sellerStats.currentTier && sellerStats.currentTier !== 'Unranked' && (
                                    <div className={`px-4 py-1.5 rounded-full text-sm font-black tracking-widest shadow-lg ${
                                        sellerStats.currentTier === 'Gold' ? 'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-yellow-900 border border-yellow-300' :
                                        sellerStats.currentTier === 'Silver' ? 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 text-slate-800 border border-slate-300' :
                                        'bg-gradient-to-r from-[#e6b17e] via-[#cd7f32] to-[#8c521b] text-white border border-[#cd7f32]'
                                    }`}>
                                        {sellerStats.currentTier === 'Gold' ? '🥇' : sellerStats.currentTier === 'Silver' ? '🥈' : '🥉'} {sellerStats.currentTier.toUpperCase()} TIER
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                                    <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold">Today Sales</p>
                                    <p className="text-2xl font-black">{sellerStats.todayCount} Cards</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                                    <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold">Target</p>
                                    <p className="text-2xl font-black">{sellerStats.dailyTarget} Cards</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                                    <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold">Extra Sales</p>
                                    <p className="text-2xl font-black text-amber-300">{sellerStats.todayExtra} Cards</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                                    <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold">Incentive Earned</p>
                                    <p className="text-2xl font-black text-green-300">₹{sellerStats.todayEarnings}</p>
                                </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="mt-2">
                                <div className="flex justify-between text-sm mb-1 font-bold text-blue-100">
                                    <span>Progress</span>
                                    <span>{sellerStats.todayCount}/{sellerStats.dailyTarget} completed</span>
                                </div>
                                <div className="h-2 w-full bg-blue-900/50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-amber-400 to-green-400 rounded-full" 
                                        style={{ width: `${Math.min((sellerStats.todayCount / sellerStats.dailyTarget) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Celebratory Message block */}
                        {sellerStats.todayEarnings > 0 && (
                            <div className="bg-green-500/20 border border-green-400/30 p-4 rounded-xl text-center md:w-64 animate-pulse">
                                <Award size={32} className="text-green-300 mx-auto mb-2" />
                                <p className="font-bold text-lg text-green-100">You earned ₹{sellerStats.todayEarnings} today 🎉</p>
                                <p className="text-xs text-green-200/80 mt-1">Keep pushing for more extra sales!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Admin Specific: Admin Earnings Overview */}
            {isAdmin && adminStats && (
                <div className="bg-gradient-to-br from-purple-900 to-purple-950 p-6 rounded-2xl shadow-md text-white mb-6 relative overflow-hidden">
                    <div className="absolute -right-5 -bottom-5 text-white/5">
                        <IndianRupee size={150} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Award className="text-amber-400" /> Admin Earnings Overview
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                                    <p className="text-purple-200 text-xs uppercase tracking-wider font-semibold">Active Model</p>
                                    <p className="text-xl font-black capitalize">{adminStats.model.replace('_', ' ')}</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                                    <p className="text-purple-200 text-xs uppercase tracking-wider font-semibold">
                                        {adminStats.model === 'total_sales' ? 'Company Targets' : 
                                         adminStats.model === 'per_seller' ? 'Successful Sellers' : 'Total Payouts'}
                                    </p>
                                    <p className="text-2xl font-black">{adminStats.details.target}</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                                    <p className="text-purple-200 text-xs uppercase tracking-wider font-semibold">Multiplier</p>
                                    <p className="text-2xl font-black text-amber-300">
                                        {adminStats.model === 'percentage' ? '' : '₹'}{adminStats.details.multiplier}
                                    </p>
                                </div>
                                <div className="bg-purple-600/30 rounded-xl p-3 border border-purple-400/30 backdrop-blur-sm shadow-inner">
                                    <p className="text-purple-100 text-xs uppercase tracking-wider font-semibold">Today's Earnings</p>
                                    <p className="text-2xl font-black text-green-300 tracking-tight">₹{adminStats.adminEarnings.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {adminStats.adminEarnings > 0 && (
                            <div className="bg-green-500/20 border border-green-400/30 p-4 rounded-xl text-center md:w-64 animate-pulse">
                                <Wallet size={32} className="text-green-300 mx-auto mb-2" />
                                <p className="font-bold text-lg text-green-100">You earned ₹{adminStats.adminEarnings.toLocaleString()} today 🎉</p>
                                <p className="text-xs text-green-200/80 mt-1">From team performance</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

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

            {/* Incentives Summary Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                {/* Section Header */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Award size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Incentives Overview</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {isAdmin ? 'All sellers performance & earnings' : 'Your sales incentive summary'}
                            </p>
                        </div>
                    </div>
                    {/* Quick stat chips */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-500/20">
                            <CreditCard size={13} />
                            {totalCardsSold} Cards Sold
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold border border-green-100 dark:border-green-500/20">
                            <Wallet size={13} />
                            ₹{totalIncentiveAmt.toLocaleString()} Total
                        </div>
                        {totalPending > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-lg text-xs font-bold border border-orange-100 dark:border-orange-500/20">
                                <Clock size={13} />
                                ₹{totalPending.toLocaleString()} Pending
                            </div>
                        )}
                    </div>
                </div>

                {/* Incentives Table */}
                <div className="overflow-x-auto">
                    {incentivesLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sbi-blue"></div>
                        </div>
                    ) : incentives.length > 0 ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/80">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-left">Seller Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">Daily Goal (10)</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">Cards Sold</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">Pending</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">Total Earnings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                {incentives.map((item) => (
                                    <tr key={item._id} className="hover:bg-blue-50/30 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-700 dark:to-slate-600 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-inner border border-white dark:border-slate-500">
                                                    {item.sellerName?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-900 dark:text-slate-100 block leading-tight">{item.sellerName}</span>
                                                    <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Sales Executive</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 w-32 mx-auto">
                                                <div className="flex items-center justify-between text-[10px] font-bold">
                                                    <span className={item.dailyCount >= item.dailyTarget ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}>
                                                        {item.dailyCount || 0}/{item.dailyTarget || 10}
                                                    </span>
                                                    <span className="text-gray-400">
                                                        {Math.round(((item.dailyCount || 0) / (item.dailyTarget || 10)) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden border border-gray-200/50 dark:border-slate-600/30">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ${item.dailyCount >= item.dailyTarget ? 'bg-green-500' : 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]'}`}
                                                        style={{ width: `${Math.min(((item.dailyCount || 0) / (item.dailyTarget || 10)) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold text-sm border border-blue-100 dark:border-blue-500/20">
                                                <CreditCard size={13} className="opacity-60" />
                                                {item.cardsSold}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.pendingIncentive > 0 ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-sm border border-orange-100 dark:border-orange-500/20">
                                                    <Clock size={13} className="opacity-60" />
                                                    ₹{item.pendingIncentive.toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="text-sm font-medium text-gray-400 dark:text-slate-500">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-lg font-black text-gray-900 dark:text-slate-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors tracking-tight">
                                                ₹{item.totalIncentive.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Footer totals row */}
                            <tfoot>
                                <tr className="border-t-2 border-gray-200 dark:border-slate-600 bg-gray-50/80 dark:bg-slate-800/80">
                                    <td className="px-6 py-4">
                                        <span className="font-black text-gray-900 dark:text-slate-100 uppercase text-xs tracking-wider">
                                            {isAdmin ? `Total (${incentives.length} Sellers)` : 'Your Total'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-black text-gray-900 dark:text-slate-100 text-sm">{totalCardsSold}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-bold text-gray-500 dark:text-slate-400 text-sm">₹200</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-black text-orange-600 dark:text-orange-400 text-sm">₹{totalPending.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-lg font-black text-green-600 dark:text-green-400">₹{totalIncentiveAmt.toLocaleString()}</span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto text-gray-300 dark:text-slate-500 mb-4">
                                <Wallet size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">No incentive data yet</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Incentive data will appear once card sales are approved.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

