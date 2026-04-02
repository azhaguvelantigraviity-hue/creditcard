import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
    Wallet, 
    ArrowUpRight, 
    Clock, 
    CheckCircle2, 
    Target, 
    Users, 
    Award, 
    Search, 
    Filter, 
    ChevronRight,
    ArrowRight,
    Download,
    Eye,
    Star,
    Zap,
    TrendingUp,
    MoreVertical,
    Share2,
    Calendar,
    CreditCard,
    X,
    BarChart3
} from 'lucide-react';

// Sub-component for Stats Cards
const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform duration-200`}>
                <Icon size={24} />
            </div>
            {trend && (
                <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-lg">
                    <TrendingUp size={12} /> {trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{value}</h3>
        </div>
    </div>
);

const Incentives = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ totalEarnings: 0, credited: 0, pending: 0, count: 0 });
    const [ledger, setLedger] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const ledgerRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, ledgerRes, monthlyRes] = await Promise.all([
                    api.get('/incentives/stats'),
                    api.get('/incentives/ledger'),
                    api.get('/incentives/monthly')
                ]);

                setStats(statsRes.data);
                setLedger(ledgerRes.data);
                setMonthlyData(monthlyRes.data);
            } catch (error) {
                console.error('Error fetching incentives:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const scrollToLedger = () => {
        if (ledgerRef.current) {
            const element = ledgerRef.current;
            const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({ top: elementTop - 20, behavior: 'smooth' });
        }
    };

    const filteredLedger = ledger.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-8">
                <div className="h-48 bg-gray-200 rounded-[2.5rem] w-full"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-2xl w-full"></div>)}
                </div>
                <div className="h-96 bg-gray-200 rounded-3xl w-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 bg-gray-50 dark:bg-slate-900/50/30 px-4 sm:px-6 lg:px-8">
            {/* HERO SECTION - Premium Fintech Redesign */}
            <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#1e3a8a] p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(30,58,138,0.2)] relative overflow-hidden text-white group border border-white/10">
                <div className="absolute right-0 top-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Zap size={220} className="text-white" />
                </div>
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="bg-white dark:bg-slate-800/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full border border-white/10 shadow-lg">
                                Premium Seller
                            </span>
                            <div className="flex items-center gap-2 bg-amber-400 text-blue-900 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl shadow-amber-400/30">
                                <Star size={14} fill="currentColor" /> Top 5% National
                            </div>
                        </div>
                        <div>
                            <h1 className="text-5xl font-black tracking-tight mb-4 leading-none uppercase">Earnings <span className="text-blue-200">Dashboard</span></h1>
                            <p className="text-blue-100/80 font-medium text-xl max-w-lg leading-relaxed">
                                You’re crushing your conversion targets! Your current performance puts you in the elite league of sellers.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <button 
                                onClick={() => setShowStatsModal(true)}
                                className="flex items-center gap-2 bg-white dark:bg-slate-800 text-blue-900 font-bold px-6 py-3 rounded-2xl hover:bg-blue-50 dark:bg-blue-500/10 transition-all shadow-lg active:scale-95"
                            >
                                <BarChart3 size={18} />
                                Monthly Stats
                            </button>
                            <button 
                                onClick={scrollToLedger}
                                className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-md text-white border border-white/20 font-bold px-6 py-3 rounded-2xl hover:bg-white dark:bg-slate-800/10 transition-all active:scale-95"
                            >
                                <CreditCard size={18} />
                                View Incentives
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 bg-white dark:bg-slate-800/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border-none dark:border dark:border-white/10 shadow-2xl transition-all hover:-translate-y-1 group/card min-w-[320px]">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-300 to-amber-500 text-blue-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/20 group-hover/card:scale-110 transition-transform duration-500">
                            <Award size={36} />
                        </div>
                        <div>
                            <p className="text-[12px] font-black text-gray-500 dark:text-blue-200 uppercase tracking-widest leading-none mb-2">Achievement Level</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Gold Partner</p>
                        </div>
                        <div className="ml-auto w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800/10 flex items-center justify-center text-gray-400 dark:text-white/50 group-hover/card:text-gray-900 dark:group-hover/card:text-white group-hover/card:bg-gray-100 dark:group-hover/card:bg-slate-800/20 transition-all cursor-pointer">
                            <ChevronRight size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Earnings" 
                    value={`₹${stats.totalEarnings.toLocaleString()}`} 
                    icon={Wallet} 
                    color="blue" 
                    trend="+12% growth"
                />
                <StatCard 
                    title="Total Credited" 
                    value={`₹${stats.credited.toLocaleString()}`} 
                    icon={CheckCircle2} 
                    color="green" 
                />
                <StatCard 
                    title="Pending Amount" 
                    value={`₹${stats.pending.toLocaleString()}`} 
                    icon={Clock} 
                    color="yellow" 
                />
            </div>

            {/* COMMISSION LEDGER - GRID VIEW */}
            <div ref={ledgerRef} id="commission-ledger" className="space-y-6 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 leading-none mb-2">Commission Ledger</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 leading-none">Activity logs and successful card conversions</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search logs..." 
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all shadow-sm"
                            />
                        </div>
                        <button 
                            id="monthly-stats-btn"
                            onClick={() => setShowStatsModal(true)}
                            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-gray-600 dark:text-slate-400 font-bold text-sm hover:bg-blue-50 dark:bg-blue-500/10 hover:text-blue-700 dark:text-blue-400 transition-all border border-gray-100 dark:border-slate-700 shadow-sm whitespace-nowrap"
                        >
                            <BarChart3 size={18} />
                            Monthly Stats
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredLedger.length > 0 ? filteredLedger.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-md border border-gray-100 dark:border-slate-700 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                            <div className="mb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-lg">
                                        {item.name.charAt(0)}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                        item.status === 'Credited' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100' :
                                        item.status === 'Pending' ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-100' :
                                        'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100'
                                    }`}>
                                        {item.status}
                                    </span>
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-slate-100 text-base mb-0.5">{item.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.product}</p>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Incentive</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-slate-100">{item.amount}</p>
                                </div>
                                <div className="text-gray-400 text-xs font-medium">
                                    {item.date}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-20 bg-white dark:bg-slate-800 rounded-[2rem] border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                            <Clock size={48} className="mb-4 opacity-20" />
                            <p className="font-bold">No incentive records found</p>
                            <p className="text-sm">Start making cards to see your earnings here!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MONTHLY STATS MODAL */}
            {showStatsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-blue-50 dark:bg-blue-500/10/30">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Performance Insights</h3>
                                <p className="text-gray-500 dark:text-slate-400 font-medium">Your monthly earnings breakdown</p>
                            </div>
                            <button 
                                onClick={() => setShowStatsModal(false)}
                                className="p-2 hover:bg-white dark:bg-slate-800 rounded-full transition-all text-gray-400 hover:text-gray-900 dark:text-slate-100"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="space-y-6">
                                {monthlyData.length > 0 ? monthlyData.map((item, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="font-bold text-gray-700 dark:text-slate-300">{item.name}</span>
                                            <span className="font-black text-blue-600 text-lg">₹{item.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.min((item.amount / 5000) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 text-gray-400 font-medium">
                                        No performance data available for this range.
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-10 p-6 bg-blue-600 rounded-3xl text-white flex justify-between items-center">
                                <div>
                                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Estimated Yearly Projection</p>
                                    <p className="text-3xl font-black">₹{(stats.totalEarnings * 12).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Total Sales</p>
                                    <p className="text-3xl font-black">{stats.count}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Incentives;
