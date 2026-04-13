import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, Loader2, ScanFace, Camera, RefreshCw, Smartphone, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';
import * as faceService from '../services/faceService';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginMode, setLoginMode] = useState('password'); // 'face' or 'password'
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const videoRef = React.useRef(null);
    const intervalRef = React.useRef(null);
    
    const { login, faceLogin } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        const initModels = async () => {
            const loaded = await faceService.loadModels();
            setModelsLoaded(loaded);
        };
        initModels();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            stopCamera();
        };
    }, []);

    React.useEffect(() => {
        if (loginMode === 'face' && modelsLoaded) {
            startCamera();
        } else {
            stopCamera();
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    }, [loginMode, modelsLoaded]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480, facingMode: 'user' } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                startScanning();
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Could not access camera. Falling back to password login.");
            setLoginMode('password');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const startScanning = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        intervalRef.current = setInterval(async () => {
            if (videoRef.current && !isScanning && !loading) {
                await attemptFaceLogin();
            }
        }, 3000); // Attempt every 3 seconds
    };

    const attemptFaceLogin = async () => {
        if (!videoRef.current) return;
        setIsScanning(true);
        try {
            const descriptor = await faceService.getFaceDescriptor(videoRef.current);
            if (descriptor) {
                await faceLogin(Array.from(descriptor));
                if (intervalRef.current) clearInterval(intervalRef.current);
                navigate('/');
            }
        } catch (err) {
            // Ignore individual scanning failures to prevent flickering errors
            console.log("Scan attempt failed or no match");
        } finally {
            setIsScanning(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sbi-blue to-sbi-hover px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
                <div className="p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-sbi-blue rounded-full flex items-center justify-center text-white mb-4 shadow-lg">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">SBI Sales Management</h1>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mt-2">
                            Enter your credentials to access your dashboard
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 mb-6 rounded-r-md text-sm animate-in slide-in-from-top-1">
                            <p>{error}</p>
                        </div>
                    )}

                    {loginMode === 'face' ? (
                        <div className="space-y-6">
                            <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                                <video 
                                    ref={videoRef}
                                    autoPlay 
                                    muted 
                                    playsInline
                                    className="w-full h-full object-cover scale-x-[-1]"
                                />
                                
                                {/* Scanning Overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className={`absolute inset-0 border-2 transition-colors duration-500 ${isScanning ? 'border-sbi-blue animate-pulse' : 'border-white/20'}`}></div>
                                    
                                    {/* Scanning Line */}
                                    {isScanning && (
                                        <div className="absolute inset-x-0 h-1 bg-sbi-blue shadow-[0_0_15px_rgba(0,120,215,0.8)] animate-scan-line"></div>
                                    )}

                                    {/* Corner Accents */}
                                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-sbi-blue/60"></div>
                                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-sbi-blue/60"></div>
                                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-sbi-blue/60"></div>
                                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-sbi-blue/60"></div>
                                </div>

                                {!modelsLoaded && (
                                    <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white">
                                        <RefreshCw className="animate-spin mb-3" size={32} />
                                        <p className="text-sm font-medium">Initializing Security...</p>
                                    </div>
                                )}
                            </div>

                            <div className="text-center">
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 italic">
                                    {isScanning ? "Scanning face..." : "Position your face in the frame to login automatically."}
                                </p>
                                
                                <button
                                    onClick={() => setLoginMode('password')}
                                    className="text-sbi-blue hover:text-sbi-accent text-sm font-bold flex items-center justify-center gap-2 w-full py-3 px-4 border border-sbi-blue/20 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                >
                                    <Lock size={16} />
                                    Use Password Login Instead
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sbi-accent focus:border-transparent outline-none transition-all bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-800"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sbi-accent focus:border-transparent outline-none transition-all bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-800"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-sbi-blue hover:bg-sbi-accent text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:bg-gray-400 disabled:scale-100 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login to System'}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => setLoginMode('face')}
                                    className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-100 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <ScanFace size={20} />
                                    Switch to Face Login
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-900/50 p-4 text-center border-t border-gray-100 dark:border-slate-700">
                    <p className="text-xs text-gray-400">SBI Credit Card Sales Management System v1.0.0</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
