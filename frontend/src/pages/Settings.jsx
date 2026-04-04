import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Settings as SettingsIcon, 
    Save, 
    Target, 
    MapPin, 
    Clock, 
    ShieldCheck,
    Navigation,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

const Settings = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [settings, setSettings] = useState({
        officeLat: 12.9610,
        officeLng: 77.5127,
        geofenceRadius: 100,
        lateThreshold: '09:45',
        halfDayThreshold: '11:00',
        autoLogoutTime: '18:30',
        dailyTarget: 10
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/attendance/settings');
            if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await api.put('/attendance/settings', settings);
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error('Error updating settings:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update settings' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <SettingsIcon className="text-blue-600" />
                        System Configuration
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-2 font-medium">Manage global targets, office location, and attendance rules.</p>
                </div>
            </div>

            {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                    message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <p className="font-bold">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-8">
                {/* INCENTIVE TARGETS */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/10">
                            <Target size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Incentive Targets</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Configure daily goals for the sales team.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300 ml-1">Daily Sales Target (Cards)</label>
                            <input 
                                type="number"
                                value={settings.dailyTarget}
                                onChange={(e) => setSettings({...settings, dailyTarget: parseInt(e.target.value)})}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold transition-all"
                                placeholder="e.g. 10"
                            />
                            <p className="text-xs text-gray-400 ml-1">Bonuses of ₹200 start after this many approved sales per day.</p>
                        </div>
                    </div>
                </div>

                {/* OFFICE GEOLOCATION */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
                            <Navigation size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Office Location</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Verify staff presence via GPS geofencing.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300 ml-1">Office Latitude</label>
                            <input 
                                type="number"
                                step="any"
                                value={settings.officeLat}
                                onChange={(e) => setSettings({...settings, officeLat: parseFloat(e.target.value)})}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300 ml-1">Office Longitude</label>
                            <input 
                                type="number"
                                step="any"
                                value={settings.officeLng}
                                onChange={(e) => setSettings({...settings, officeLng: parseFloat(e.target.value)})}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300 ml-1">Radius (Meters)</label>
                            <input 
                                type="number"
                                value={settings.geofenceRadius}
                                onChange={(e) => setSettings({...settings, geofenceRadius: parseInt(e.target.value)})}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* ATTENDANCE RULES */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Attendance Rules</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Set time-based working thresholds.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300 ml-1">Late Threshold (HH:MM)</label>
                            <input 
                                type="time"
                                value={settings.lateThreshold}
                                onChange={(e) => setSettings({...settings, lateThreshold: e.target.value})}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300 ml-1">Half Day Threshold</label>
                            <input 
                                type="time"
                                value={settings.halfDayThreshold}
                                onChange={(e) => setSettings({...settings, halfDayThreshold: e.target.value})}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300 ml-1">Auto-Logout Time</label>
                            <input 
                                type="time"
                                value={settings.autoLogoutTime}
                                onChange={(e) => setSettings({...settings, autoLogoutTime: e.target.value})}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-5 rounded-[2rem] shadow-2xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                        Save System Configuration
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
