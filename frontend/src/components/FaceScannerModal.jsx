import React, { useState, useEffect, useRef } from 'react';
import { Camera, ScanFace, RefreshCw, X, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import * as faceService from '../services/faceService';

const FaceScannerModal = ({ onVerify, onDismiss, title = "Face Verification" }) => {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const videoRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            const loaded = await faceService.loadModels();
            setModelsLoaded(loaded);
            if (loaded) startCamera();
        };
        init();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            stopCamera();
        };
    }, []);

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
            setError("Could not access camera. Please check permissions.");
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
            if (videoRef.current && !isScanning && !success) {
                await attemptVerification();
            }
        }, 1500);
    };

    const attemptVerification = async () => {
        if (!videoRef.current) return;
        setIsScanning(true);
        try {
            const descriptor = await faceService.getFaceDescriptor(videoRef.current);
            if (descriptor) {
                // Handle local verification or just get the descriptor to send back
                // For logout, we'll verify and then onVerify(descriptor)
                setSuccess(true);
                if (intervalRef.current) clearInterval(intervalRef.current);
                // Faster automatic completion for a seamless feel
                setTimeout(() => {
                    onVerify(Array.from(descriptor));
                }, 600);
            }
        } catch (err) {
            console.log("Scan attempt failed or no match");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#1e3a8a] p-5 text-white relative">
                    <button 
                        onClick={onDismiss}
                        className="absolute right-6 top-6 p-2.5 hover:bg-white/20 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-2xl transition-colors duration-500 ${success ? 'bg-green-400/20' : 'bg-white/20'}`}>
                            {success ? <CheckCircle2 size={28} className="text-green-300" /> : <ShieldCheck size={28} className="text-white" />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black">{title}</h3>
                            <p className="text-blue-100 text-sm font-medium opacity-80">
                                {success ? "Authentication successful" : "Verify your face to complete this action"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-5">
                    {/* Camera Feed Container */}
                    <div className="relative aspect-video bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex items-center justify-center border-2 border-gray-100 dark:border-slate-700">
                        <video 
                            ref={videoRef}
                            autoPlay 
                            muted 
                            playsInline
                            className="w-full h-full object-cover scale-x-[-1]"
                        />

                        {/* Scanning HUD Overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className={`absolute inset-0 border-4 transition-all duration-500 rounded-[2rem] ${
                                success ? 'border-green-500' : 
                                isScanning ? 'border-blue-500 animate-pulse' : 'border-white/10 dark:border-slate-800/10'
                            }`}></div>
                            
                            {/* Animated Scan Line */}
                            {!success && isScanning && (
                                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_20px_rgba(37,99,235,0.8)] animate-scan-line"></div>
                            )}

                            {/* Corner Decals */}
                            <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500/80 rounded-tl-lg translate-x-[-5px] translate-y-[-5px]"></div>
                            <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500/80 rounded-tr-lg translate-x-[5px] translate-y-[-5px]"></div>
                            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500/80 rounded-bl-lg translate-x-[-5px] translate-y-[5px]"></div>
                            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500/80 rounded-br-lg translate-x-[5px] translate-y-[5px]"></div>

                            {/* Success Overlay */}
                            {success && (
                                <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[2px] flex items-center justify-center animate-in zoom-in duration-300">
                                    <div className="bg-white rounded-full p-6 shadow-2xl animate-bounce">
                                        <CheckCircle2 size={64} className="text-green-500" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Loader / Initialization Overlay */}
                        {!modelsLoaded && !error && (
                            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white p-6 text-center">
                                <RefreshCw className="animate-spin mb-4 text-blue-500" size={48} />
                                <h4 className="text-xl font-bold mb-2">Initializing AI Engine</h4>
                                <p className="text-slate-400 text-sm max-w-xs">Loading secure face detection models. Please wait a moment...</p>
                            </div>
                        )}

                        {/* Error Overlay */}
                        {error && (
                            <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in duration-500">
                                <AlertCircle className="mb-4" size={48} />
                                <h4 className="text-xl font-bold mb-2">System Error</h4>
                                <p className="text-red-100 text-sm mb-6">{error}</p>
                                <button 
                                    onClick={startCamera}
                                    className="px-8 py-3 bg-white text-red-900 font-bold rounded-2xl hover:bg-slate-100 transition-all shadow-xl"
                                >
                                    Retry Access
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <div className="flex flex-col items-center justify-center gap-3 mb-4">
                            <div className={`p-4 rounded-full transition-all duration-500 ${success ? 'bg-green-100 text-green-600 scale-110 shadow-lg shadow-green-200' : 'bg-blue-50 text-blue-600'}`}>
                                {success ? <CheckCircle2 size={32} /> : <ScanFace size={32} className={isScanning ? 'animate-pulse' : ''} />}
                            </div>
                            <p className={`text-sm font-black uppercase tracking-[0.2em] ${success ? 'text-green-600' : 'text-slate-400'}`}>
                                {success ? "Face Verified Success" : isScanning ? "Analyzing Bio-Data..." : "Scanning Face..."}
                            </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs mx-auto italic opacity-70">
                            {success 
                                ? "Secure verification complete. Proceeding automatically..." 
                                : `Biometric verification is required to finalize ${title.toLowerCase()}.`
                            }
                        </p>
                    </div>

                    <button
                        onClick={onDismiss}
                        className="w-full py-3.5 text-gray-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all text-[11px] uppercase tracking-widest border border-transparent hover:border-gray-100 dark:hover:border-slate-600"
                    >
                        Cancel {title.split(' ').pop().toLowerCase()}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FaceScannerModal;
