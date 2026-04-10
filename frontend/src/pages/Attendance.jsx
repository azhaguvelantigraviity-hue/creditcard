import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import {
    MapPin, Clock, LogIn, LogOut, Wifi, WifiOff,
    CheckCircle2, AlertCircle, Timer, Building2,
    MonitorSmartphone, Users, Settings, ChevronDown,
    Navigation, Coffee, Briefcase, UserCheck,
    TrendingUp, Calendar, Filter, RefreshCw, X,
    ArrowRight, Shield, Activity, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import LogoutReasonModal from '../components/LogoutReasonModal';
import FaceScannerModal from '../components/FaceScannerModal';

// ─── Helpers ────────────────────────────────────────────────────
const formatTime = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};

const statusStyle = (status) => {
    switch (status) {
        case 'On Time': return 'bg-green-100 text-green-700 dark:text-green-400 border-green-200';
        case 'Late': return 'bg-yellow-100 text-yellow-700 dark:text-yellow-400 border-yellow-200';
        case 'Half Day': return 'bg-red-100 text-red-700 dark:text-red-400 border-red-200';
        case 'Absent': return 'bg-gray-100 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-gray-800';
        default: return 'bg-gray-100 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-gray-800';
    }
};

// ─── Working Timer ───────────────────────────────────────────────
const WorkingTimer = ({ loginTime }) => {
    const [elapsed, setElapsed] = useState('00:00:00');

    useEffect(() => {
        if (!loginTime) return;
        const tick = () => {
            const diff = Date.now() - new Date(loginTime).getTime();
            const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
            const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
            const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
            setElapsed(`${h}:${m}:${s}`);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [loginTime]);

    return <span className="font-mono text-3xl font-black text-blue-600">{elapsed}</span>;
};

// ─── Exit Reason Modal ───────────────────────────────────────────
const ExitReasonModal = ({ onSubmit, onDismiss }) => {
    const [reason, setReason] = useState('');
    const reasons = [
        { value: 'Personal', label: 'Personal', icon: Coffee, color: 'orange', desc: 'Break time — will be deducted' },
        { value: 'Official Work', label: 'Official Work', icon: Briefcase, color: 'blue', desc: 'Work outside — not deducted' },
        { value: 'Meeting Candidate', label: 'Meeting Candidate', icon: UserCheck, color: 'purple', desc: 'Client meeting — not deducted' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800/20 rounded-xl flex items-center justify-center">
                            <AlertTriangle size={22} />
                        </div>
                        <h3 className="text-xl font-black">Leaving Office Zone</h3>
                    </div>
                    <p className="text-orange-100 text-sm">You have moved outside the 100m office boundary. Please select a reason.</p>
                </div>
                <div className="p-6 space-y-3">
                    {reasons.map(({ value, label, icon: Icon, color, desc }) => (
                        <button
                            key={value}
                            onClick={() => setReason(value)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                                reason === value
                                    ? `border-${color}-400 bg-${color}-50`
                                    : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                reason === value ? `bg-${color}-500 text-white` : 'bg-gray-100 text-gray-500 dark:text-slate-400'
                            }`}>
                                <Icon size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-slate-100">{label}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">{desc}</p>
                            </div>
                            {reason === value && (
                                <CheckCircle2 className="ml-auto text-green-500" size={20} />
                            )}
                        </button>
                    ))}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onDismiss}
                            className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => reason && onSubmit(reason)}
                            disabled={!reason}
                            className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Confirm Exit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Staff Dashboard View ────────────────────────────────────────
const StaffView = () => {
    const [mode, setMode] = useState('office');
    const [session, setSession] = useState(null);
    const [openMovement, setOpenMovement] = useState(null);
    const [isInsideOffice, setIsInsideOffice] = useState(true);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showLogoutReasonModal, setShowLogoutReasonModal] = useState(false);
    const [showLogoutFaceScanner, setShowLogoutFaceScanner] = useState(false);
    const [showLoginFaceScanner, setShowLoginFaceScanner] = useState(false);
    const [logoutReason, setLogoutReason] = useState('');
    const [geoError, setGeoError] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [movementLogs, setMovementLogs] = useState([]);
    const [settings, setSettings] = useState(null);
    const geoWatchRef = useRef(null);
    const pollRef = useRef(null);

    const fetchTodayStatus = useCallback(async () => {
        try {
            const { data } = await api.get('/attendance/today');
            setSession(data.attendance);
            setOpenMovement(data.openMovement);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.clear();
                window.location.href = '/login';
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMovementLogs = useCallback(async () => {
        try {
            const { data } = await api.get('/attendance/movement');
            setMovementLogs(data);
        } catch (err) { console.error(err); }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            const { data } = await api.get('/attendance/settings');
            setSettings(data);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        fetchTodayStatus();
        fetchMovementLogs();
        fetchSettings();
    }, [fetchTodayStatus, fetchMovementLogs, fetchSettings]);

    // Auto-logout is disabled — sessions run for 24 hrs until manual logout

    // Geo-fence polling every 3 minutes while logged in (office mode)
    useEffect(() => {
        if (!session?.isActive || session?.mode !== 'office') {
            if (pollRef.current) clearInterval(pollRef.current);
            return;
        }
        const checkGeo = () => {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    try {
                        const { data } = await api.post('/attendance/geofence-check', {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude
                        });

                        const wasInside = isInsideOffice;
                        setIsInsideOffice(data.isInsideOffice);

                        if (wasInside && !data.isInsideOffice && !openMovement) {
                            setShowExitModal(true);
                        }
                        if (!wasInside && data.isInsideOffice && openMovement) {
                            await handleReEntry();
                        }
                    } catch (err) { console.error(err); }
                },
                (err) => console.error('Geo error:', err)
            );
        };
        checkGeo();
        pollRef.current = setInterval(checkGeo, 3 * 60 * 1000);
        return () => clearInterval(pollRef.current);
    }, [session, openMovement, isInsideOffice]);

    const getLocation = () => new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });

    const [tempLocation, setTempLocation] = useState({});

    const handleLoginInitiate = async () => {
        setLoginError('');
        setActionLoading(true);
        try {
            let locationData = {};
            if (mode === 'office') {
                const loc = await getLocation();
                locationData = { lat: loc.lat, lng: loc.lng };
            } else {
                try {
                    const loc = await getLocation();
                    locationData = { lat: loc.lat, lng: loc.lng };
                } catch (_) {}
            }
            setTempLocation(locationData);
            setShowLoginFaceScanner(true);
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setActionLoading(true); // stay loading until face verify or cancel
        }
    };

    const handleLoginFaceVerify = async (descriptor) => {
        try {
            const { data } = await api.post('/attendance/login', { mode, ...tempLocation, faceDescriptor: descriptor });
            setSession(data.attendance);
            setIsInsideOffice(true);
            setShowLoginFaceScanner(false);
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Verification failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLoginCancel = () => {
        setShowLoginFaceScanner(false);
        setActionLoading(false);
    };

    const handleLogoutInitiate = () => {
        setShowLogoutReasonModal(true);
    };

    const handleLogoutReasonSubmit = (reason) => {
        setLogoutReason(reason);
        setShowLogoutReasonModal(false);
        setShowLogoutFaceScanner(true);
    };

    const finalizeLogout = async (reason) => {
        setActionLoading(true);
        try {
            const { data } = await api.post('/attendance/logout', { logoutReason: reason });
            setSession(data.attendance);
            setOpenMovement(null);
            fetchMovementLogs();
            setShowLogoutFaceScanner(false);
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleExitSubmit = async (reason) => {
        setShowExitModal(false);
        try {
            const loc = await getLocation().catch(() => ({}));
            await api.post('/attendance/movement/exit', { reason, lat: loc.lat, lng: loc.lng });
            await fetchTodayStatus();
            await fetchMovementLogs();
        } catch (err) { console.error(err); }
    };

    const handleReEntry = async () => {
        try {
            await api.post('/attendance/movement/reentry', {});
            await fetchTodayStatus();
            await fetchMovementLogs();
        } catch (err) { console.error(err); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isLoggedIn = session?.isActive;
    const isLoggedOut = session && !session.isActive;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {showExitModal && (
                <ExitReasonModal
                    onSubmit={handleExitSubmit}
                    onDismiss={() => setShowExitModal(false)}
                />
            )}

            {showLogoutReasonModal && (
                <LogoutReasonModal
                    onSubmit={handleLogoutReasonSubmit}
                    onDismiss={() => setShowLogoutReasonModal(false)}
                />
            )}

            {showLoginFaceScanner && (
                <FaceScannerModal
                    title="Login Verification"
                    onVerify={handleLoginFaceVerify}
                    onDismiss={handleLoginCancel}
                />
            )}

            {showLogoutFaceScanner && (
                <FaceScannerModal
                    title="Logout Verification"
                    onVerify={() => finalizeLogout(logoutReason)}
                    onDismiss={() => setShowLogoutFaceScanner(false)}
                />
            )}

            {/* Hero Card */}
            <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#1e3a8a] p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                <div className="absolute right-4 top-4 opacity-10"><Shield size={120} /></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Attendance System</p>
                            <h1 className="text-3xl font-black">Today's Tracking</h1>
                            <p className="text-blue-200 text-sm mt-1">
                                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        {/* Inside/Outside Badge */}
                        {isLoggedIn && session.mode === 'office' && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${
                                isInsideOffice ? 'bg-green-400/20 text-green-300 border border-green-400/30' : 'bg-red-400/20 text-red-300 border border-red-400/30'
                            }`}>
                                <div className={`w-2 h-2 rounded-full ${isInsideOffice ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                                {isInsideOffice ? 'Inside Office' : 'Outside Office'}
                            </div>
                        )}
                    </div>

                    {/* Timer */}
                    {isLoggedIn && (
                        <div className="bg-white dark:bg-slate-800/10 backdrop-blur-md rounded-2xl p-5 mb-6 border border-white/10">
                            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-2">Working Time</p>
                            <WorkingTimer loginTime={session.loginTime} />
                            <div className="flex gap-4 mt-3 text-xs text-blue-200 font-medium">
                                <span>Login: {formatTime(session.loginTime)}</span>
                                <span>•</span>
                                <span>Mode: {session.mode === 'office' ? '🏢 Office' : '💻 Remote'}</span>
                            </div>
                        </div>
                    )}

                    {/* Status Badge */}
                    {session && (
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm mb-4 border ${statusStyle(session.status)}`}>
                            {session.status === 'On Time' && <CheckCircle2 size={14} />}
                            {session.status === 'Late' && <Clock size={14} />}
                            {session.status === 'Half Day' && <AlertCircle size={14} />}
                            {session.status}
                        </div>
                    )}

                    {/* Outside badge */}
                    {isLoggedIn && openMovement && (
                        <div className="flex items-center gap-2 bg-orange-400/20 text-orange-300 border border-orange-400/30 px-4 py-2 rounded-full text-sm font-bold mb-4 w-fit">
                            <Navigation size={14} className="animate-pulse" />
                            Outside ({openMovement.reason})
                        </div>
                    )}

                    {/* Logged out summary */}
                    {isLoggedOut && (
                        <div className="bg-white dark:bg-slate-800/10 rounded-2xl p-4 mb-4 grid grid-cols-2 gap-3 shadow-sm border border-gray-100 dark:border-transparent">
                            <div>
                                <p className="text-gray-500 dark:text-blue-200 text-xs font-bold uppercase">Login</p>
                                <p className="text-gray-900 dark:text-white font-black">{formatTime(session.loginTime)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-blue-200 text-xs font-bold uppercase">Logout</p>
                                <p className="text-gray-900 dark:text-white font-black">{formatTime(session.logoutTime)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-blue-200 text-xs font-bold uppercase">Working Hours</p>
                                <p className="text-gray-900 dark:text-white font-black">{formatDuration(session.totalWorkingMinutes)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-blue-200 text-xs font-bold uppercase">Break Deduction</p>
                                <p className="text-orange-600 dark:text-orange-300 font-black">{formatDuration(session.totalOutsideMinutes)}</p>
                            </div>
                            {session.logoutReason && (
                                <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-white/5">
                                    <p className="text-gray-500 dark:text-blue-200 text-xs font-bold uppercase">Logout Reason</p>
                                    <p className="text-gray-900 dark:text-white font-black flex items-center gap-2">
                                        {session.logoutReason === 'Official' ? <Briefcase size={14} className="text-blue-400" /> : <Coffee size={14} className="text-orange-400" />}
                                        {session.logoutReason}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mode Toggle (only before login) */}
                    {!session && (
                        <div className="flex justify-center gap-6 mb-8 mt-4">
                            <button
                                onClick={() => setMode('office')}
                                className={`flex flex-col items-center justify-center w-28 h-28 gap-2 rounded-3xl font-bold text-sm transition-all duration-300 ${
                                    mode === 'office' ? 'bg-white dark:bg-slate-800 text-blue-900 shadow-[0_10px_40px_rgba(0,0,0,0.2)] scale-105 ring-4 ring-white/30' : 'bg-white dark:bg-slate-800/10 text-white border border-white/20 hover:bg-white dark:bg-slate-800/20 hover:scale-105'
                                }`}
                            >
                                <Building2 size={28} />
                                <span>Office Mode</span>
                            </button>
                            <button
                                onClick={() => setMode('remote')}
                                className={`flex flex-col items-center justify-center w-28 h-28 gap-2 rounded-3xl font-bold text-sm transition-all duration-300 ${
                                    mode === 'remote' ? 'bg-white dark:bg-slate-800 text-blue-900 shadow-[0_10px_40px_rgba(0,0,0,0.2)] scale-105 ring-4 ring-white/30' : 'bg-white dark:bg-slate-800/10 text-white border border-white/20 hover:bg-white dark:bg-slate-800/20 hover:scale-105'
                                }`}
                            >
                                <MonitorSmartphone size={28} />
                                <span>Remote Mode</span>
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {loginError && (
                        <div className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-2xl px-4 py-3 text-sm font-medium mb-4 flex items-center gap-2">
                            <AlertCircle size={16} />
                            {loginError}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-3">
                        {!session && (
                            <button
                                onClick={handleLoginInitiate}
                                disabled={actionLoading}
                                className="w-64 flex items-center justify-center gap-2 bg-green-400 text-green-900 font-black py-3 rounded-xl hover:bg-green-300 transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-green-400/20 text-base"
                            >
                                {actionLoading && !showLoginFaceScanner ? <div className="w-5 h-5 border-2 border-green-900 border-t-transparent rounded-full animate-spin"></div> : <LogIn size={20} />}
                                {actionLoading && !showLoginFaceScanner ? 'Checking Location...' : `Login (${mode === 'office' ? '🏢 Office' : '💻 Remote'})`}
                            </button>
                        )}
                        {isLoggedIn && (
                            <button
                                onClick={handleLogoutInitiate}
                                disabled={actionLoading}
                                className="w-64 flex items-center justify-center gap-2 bg-red-400 text-white font-black py-3 rounded-xl hover:bg-red-500 transition-all active:scale-95 disabled:opacity-60 shadow-lg text-base"
                            >
                                {actionLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <LogOut size={20} />}
                                {actionLoading ? 'Logging out...' : 'Logout'}
                            </button>
                        )}
                        {isLoggedOut && (
                            <div className="w-64 flex items-center justify-center gap-2 bg-white dark:border-transparent dark:bg-slate-800/10 text-gray-900 dark:text-white font-bold py-3 rounded-xl shadow-sm border border-gray-100 text-base">
                                <CheckCircle2 size={18} className="text-green-500" />
                                Session Completed
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mode Info Card */}
            {!session && (
                <div className={`p-5 rounded-2xl border ${mode === 'office' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100' : 'bg-purple-50 dark:bg-purple-500/10 border-purple-100'}`}>
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl ${mode === 'office' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {mode === 'office' ? <MapPin size={20} /> : <Wifi size={20} />}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-slate-100 mb-1">{mode === 'office' ? 'Office Mode Active' : 'Remote Mode Active'}</p>
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                {mode === 'office'
                                    ? `Your location will be verified. You must be within ${settings?.geofenceRadius || 100}m of the office to login.`
                                    : 'No location restriction. You can login from anywhere. Location stored optionally.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Movement Logs */}
            {movementLogs.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-5 border-b border-gray-50">
                        <h3 className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <Activity size={18} className="text-blue-600" />
                            Movement Log
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                        {movementLogs.map((log, idx) => (
                            <div key={idx} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                        log.reason === 'Personal' ? 'bg-orange-100 text-orange-600' :
                                        log.reason === 'Official Work' ? 'bg-blue-100 text-blue-600' :
                                        'bg-purple-100 text-purple-600'
                                    }`}>
                                        {log.reason === 'Personal' ? <Coffee size={14} /> :
                                         log.reason === 'Official Work' ? <Briefcase size={14} /> :
                                         <UserCheck size={14} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">{log.reason}</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            {formatTime(log.exitTime)} → {log.reEntryTime ? formatTime(log.reEntryTime) : 'Still outside'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {log.durationMinutes > 0 && (
                                        <p className="font-black text-sm text-gray-900 dark:text-slate-100">{formatDuration(log.durationMinutes)}</p>
                                    )}
                                    {log.deducted && (
                                        <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Deducted</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Admin Dashboard View ────────────────────────────────────────
const AdminView = () => {
    const [records, setRecords] = useState([]);
    const [period, setPeriod] = useState('daily');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settingsForm, setSettingsForm] = useState({});
    const [expandedRow, setExpandedRow] = useState(null);
    const [movementCache, setMovementCache] = useState({});

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/attendance/admin?period=${period}&date=${selectedDate}`);
            setRecords(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [period, selectedDate]);

    const fetchSettings = useCallback(async () => {
        try {
            const { data } = await api.get('/attendance/settings');
            setSettings(data);
            setSettingsForm({
                officeLat: data.officeLat,
                officeLng: data.officeLng,
                geofenceRadius: data.geofenceRadius,
                lateThreshold: data.lateThreshold,
                halfDayThreshold: data.halfDayThreshold,
                autoLogoutTime: data.autoLogoutTime
            });
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => { fetchReports(); fetchSettings(); }, [fetchReports, fetchSettings]);

    const saveSettings = async () => {
        try {
            await api.put('/attendance/settings', settingsForm);
            setShowSettings(false);
            fetchSettings();
        } catch (err) { console.error(err); }
    };

    // Stats aggregate
    const stats = {
        total: records.length,
        onTime: records.filter(r => r.status === 'On Time').length,
        late: records.filter(r => r.status === 'Late').length,
        halfDay: records.filter(r => r.status === 'Half Day').length,
        absent: records.filter(r => r.status === 'Absent').length,
    };

    return (
        <div className="space-y-6">
            {/* Settings Modal */}
            {showSettings && settings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black">Office Settings</h3>
                                <p className="text-slate-400 text-sm">Geo-fence & time configuration</p>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white dark:bg-slate-800/10 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { key: 'officeLat', label: 'Office Latitude', type: 'number' },
                                    { key: 'officeLng', label: 'Office Longitude', type: 'number' },
                                    { key: 'geofenceRadius', label: 'Radius (meters)', type: 'number' },
                                    { key: 'lateThreshold', label: 'Late After (HH:MM)', type: 'text' },
                                    { key: 'halfDayThreshold', label: 'Half Day After (HH:MM)', type: 'text' },
                                    { key: 'autoLogoutTime', label: 'Auto Logout (HH:MM)', type: 'text' },
                                ].map(({ key, label, type }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</label>
                                        <input
                                            type={type}
                                            value={settingsForm[key] || ''}
                                            onChange={e => setSettingsForm(p => ({ ...p, [key]: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                        />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={saveSettings}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100">Attendance Dashboard</h1>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">Monitor team attendance & work status</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5 shadow-sm">
                        <Calendar size={16} className="text-blue-600" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-bold text-gray-700 dark:text-slate-300"
                        />
                    </div>
                    <button onClick={fetchReports} className="p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50 transition-all shadow-sm">
                        <RefreshCw size={18} className="text-gray-600 dark:text-slate-400" />
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50 transition-all shadow-sm text-sm"
                    >
                        <Settings size={16} /> Office Settings
                    </button>
                </div>
            </div>

            {/* Period Tabs */}
            <div className="flex bg-white dark:bg-slate-800 rounded-2xl p-1.5 border border-gray-100 dark:border-slate-700 shadow-sm w-fit gap-1">
                {['daily', 'weekly', 'monthly'].map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-5 py-2 rounded-xl font-bold text-sm capitalize transition-all ${
                            period === p ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-slate-100'
                        }`}
                    >
                        {p}
                    </button>
                ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: 'blue', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400' },
                    { label: 'On Time', value: stats.onTime, color: 'green', bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-700 dark:text-green-400' },
                    { label: 'Late', value: stats.late, color: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-500/10', text: 'text-yellow-700 dark:text-yellow-400' },
                    { label: 'Half Day', value: stats.halfDay, color: 'red', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-700 dark:text-red-400' },
                    { label: 'Absent', value: stats.absent, color: 'gray', bg: 'bg-gray-50 dark:bg-slate-900/50', text: 'text-gray-600 dark:text-slate-400' },
                ].map(({ label, value, bg, text }) => (
                    <div key={label} className={`${bg} p-4 rounded-2xl border border-white shadow-sm`}>
                        <p className={`${text} text-xs font-bold uppercase tracking-wider`}>{label}</p>
                        <p className={`${text} text-3xl font-black mt-1`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Attendance Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-slate-100">Employee Records</h3>
                    <span className="text-xs text-gray-500 dark:text-slate-400 font-medium bg-gray-100 px-3 py-1 rounded-full">{records.length} records</span>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Users size={48} className="mb-4 opacity-20" />
                        <p className="font-bold">No attendance records for this period</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
                                <tr>
                                    {['Date', 'Employee', 'Login Type', 'Login', 'Logout', 'Status', 'Working Hrs'].map(h => (
                                        <th key={h} className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                {records.map((rec, idx) => (
                                    <React.Fragment key={rec._id || idx}>
                                        <tr
                                            className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                                            onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                                        >
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <p className="text-sm font-bold text-gray-900 dark:text-slate-100 italic">
                                                    {new Date(rec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                                                        {rec.userId?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-slate-100 text-sm leading-none">{rec.userId?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-400 dark:text-slate-500">{rec.userId?.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                                                    rec.mode === 'office' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100/50' : 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-100/50'
                                                }`}>
                                                    {rec.mode === 'office' ? <Building2 size={12} /> : <MonitorSmartphone size={12} />}
                                                    {rec.mode === 'office' ? 'Office' : 'Remote'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-gray-700 dark:text-slate-300 whitespace-nowrap">{formatTime(rec.loginTime)}</td>
                                            <td className="px-4 py-4 text-sm font-medium text-gray-700 dark:text-slate-300 whitespace-nowrap">{formatTime(rec.logoutTime)}</td>
                                            <td className="px-4 py-4">
                                                <span className={`text-xs font-black px-3 py-1 rounded-full border ${statusStyle(rec.status)}`}>
                                                    {rec.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-bold text-gray-900 dark:text-slate-100 whitespace-nowrap">
                                                {rec.isActive ? (
                                                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                                        Active
                                                    </span>
                                                ) : formatDuration(rec.totalWorkingMinutes)}
                                            </td>
                                        </tr>
                                        {/* Expanded movement logs */}
                                        {expandedRow === idx && rec.movements?.length > 0 && (
                                            <tr>
                                                <td colSpan={7} className="bg-blue-50/30 dark:bg-slate-900/30 px-6 py-4 shadow-inner">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <p className="text-xs font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                            <Activity size={12} /> Movement History
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {rec.movements.map((m, mi) => (
                                                            <div key={mi} className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700/50 text-sm shadow-sm transition-transform hover:scale-[1.01]">
                                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                                                    m.reason === 'Personal' ? 'bg-orange-100 text-orange-700' :
                                                                    m.reason === 'Official Work' ? 'bg-blue-100 text-blue-700 dark:text-blue-400' :
                                                                    'bg-purple-100 text-purple-700 dark:text-purple-400'
                                                                }`}>
                                                                    {m.reason === 'Personal' ? <Coffee size={16} /> :
                                                                     m.reason === 'Official Work' ? <Briefcase size={16} /> :
                                                                     <UserCheck size={16} />}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="font-bold text-gray-900 dark:text-slate-100">{m.reason}</p>
                                                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                                                        {formatTime(m.exitTime)} → {m.reEntryTime ? formatTime(m.reEntryTime) : 'Active Outside'}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-black text-gray-900 dark:text-slate-100">{formatDuration(m.durationMinutes)}</p>
                                                                    {m.deducted && <span className="text-[10px] font-black text-red-500 uppercase">Deducted</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Attendance Page ────────────────────────────────────────
const Attendance = () => {
    const { user } = useAuth();
    
    // Check role from context first, fall back to localStorage just in case
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user?.role || storedUser?.role;
    const isAdmin = role?.toLowerCase() === 'admin';

    return isAdmin ? <AdminView /> : <StaffView />;
};

export default Attendance;
