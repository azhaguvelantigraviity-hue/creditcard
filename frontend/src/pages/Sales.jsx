import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Add API config
import { 
    TrendingUp, 
    Award, 
    CreditCard, 
    Target, 
    ArrowUpRight, 
    ArrowDownRight,
    Search,
    Filter,
    ChevronRight,
    Star,
    CheckCircle2
} from 'lucide-react';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    Tooltip, 
    CartesianGrid,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const Sales = () => {
    const [showFilter, setShowFilter] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('Monthly Stats');
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalIssuedCards: 0,
        topPerformer: { id: 0, name: 'Loading...', sales: 0, revenue: '₹0', avatar: '--' },
        monthlyStats: [],
        typeStats: [],
        recentSales: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/sales/stats');
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch live sales stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const totalPieCards = useMemo(() => stats.typeStats.reduce((acc, curr) => acc + curr.value, 0) || 1, [stats.typeStats]);

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse p-8">
                <div className="h-20 bg-gray-200 rounded-2xl w-full"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-2xl w-full"></div>)}
                </div>
                <div className="h-96 bg-gray-200 rounded-3xl w-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Success Selling</h1>
                    <p className="text-gray-500 dark:text-slate-400">Analyze sales performance and track achievements</p>
                </div>
                <div className="flex gap-2 relative">
                    <button 
                        onClick={() => setShowFilter(!showFilter)}
                        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50 transition-all shadow-sm"
                    >
                        <Filter size={18} />
                        <span>{selectedFilter}</span>
                    </button>
                    
                    {showFilter && (
                        <div className="absolute top-12 left-0 w-48 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden origin-top-left animate-in fade-in zoom-in-95 duration-200">
                            {['Monthly Stats', 'Weekly Stats', 'Daily Stats', 'Yearly Stats'].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => {
                                        setSelectedFilter(f);
                                        setShowFilter(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${selectedFilter === f ? 'bg-blue-50 dark:bg-blue-500/10 text-sbi-blue' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}

                    <button 
                        onClick={() => navigate('/incentives')}
                        className="bg-sbi-blue hover:bg-sbi-hover text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
                    >
                        <Award size={18} />
                        <span>View Incentives</span>
                    </button>
                </div>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-sbi-blue w-fit rounded-xl mb-4">
                            <CreditCard size={24} />
                        </div>
                        <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium">Total Revenue Generated</h3>
                        <p className="text-3xl font-black text-gray-900 dark:text-slate-100 mt-1">₹{stats.totalRevenue > 100000 ? (stats.totalRevenue / 100000).toFixed(2) + ' Lakhs' : stats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-bold">
                        <ArrowUpRight size={18} />
                        <span>Connected Live ✨</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit rounded-xl mb-4">
                            <Target size={24} />
                        </div>
                        <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium">Total Successfully Issued Cards</h3>
                        <p className="text-3xl font-black text-gray-900 dark:text-slate-100 mt-1">{stats.totalIssuedCards.toLocaleString()}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-bold">
                        <TrendingUp size={18} />
                        <span>Sales Target Tracking Active</span>
                    </div>
                </div>

                {/* Top Performer Card */}
                <div className="bg-gradient-to-br from-sbi-blue to-sbi-hover p-6 rounded-2xl shadow-lg relative overflow-hidden text-white border-none">
                    <Award className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
                    <div className="flex justify-between items-center mb-6">
                        <span className="bg-white dark:bg-slate-800/20 text-sbi-blue dark:text-white px-3 py-1 rounded-full text-xs font-black uppercase backdrop-blur-sm tracking-wide shadow-sm">Top Performer</span>
                        <Star className="fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800/20 text-sbi-blue dark:text-white backdrop-blur-md flex items-center justify-center font-black text-xl border border-white/30 shadow-sm">
                            {stats.topPerformer?.avatar}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{stats.topPerformer?.name}</h3>
                            <p className="text-blue-100 text-sm">{stats.topPerformer?.sales} Sales This Month</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <p className="text-2xl font-black">{stats.topPerformer?.revenue}</p>
                        <button className="text-xs font-bold text-blue-200 hover:text-white transition-colors flex items-center gap-1 opacity-50 cursor-pointer" title="Coming soon">
                            Full Leaderboard <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Growth Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">Revenue Growth Analysis</h2>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00a1e1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#00a1e1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#00a1e1" strokeWidth={3} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Popular Card Types */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6 w-full text-left">Popular Card Types</h2>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={stats.typeStats} 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.typeStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full mt-4">
                        {stats.typeStats.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-sm text-gray-600 dark:text-slate-400 font-medium">{item.name}</span>
                                <span className="text-xs font-bold text-gray-900 dark:text-slate-100 ml-auto">{((item.value / totalPieCards) * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Sales Success Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Recent Successful Sales</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold" size={16} />
                        <input type="text" placeholder="Search application ID..." className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sbi-blue focus:bg-white dark:bg-slate-800 transition-all w-64" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Application ID</th>
                                <th className="px-6 py-4">Customer Name</th>
                                <th className="px-6 py-4">Card Model</th>
                                <th className="px-6 py-4">Seller Name</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                            {stats.recentSales.length > 0 ? stats.recentSales.map((sale, idx) => (
                                <tr key={idx} className="hover:bg-blue-50 dark:bg-blue-500/10 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-sbi-blue underline cursor-pointer">{sale.id}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-800 dark:text-slate-100">{sale.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{sale.card}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{sale.seller}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold">
                                            <CheckCircle2 size={14} /> Approved
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">No recent sales found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Sales;
