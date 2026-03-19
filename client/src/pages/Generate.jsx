import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
    Calendar,
    Play,
    CheckCircle2,
    Clock,
    Layers,
    Cpu,
    Check,
    Download,
    Building2,
    GraduationCap,
    Sparkles,
    ArrowRight,
    Search,
    Shield
} from 'lucide-react';

const Generate = () => {
    const [batches, setBatches] = useState([]);
    const [selectedBatches, setSelectedBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [step, setStep] = useState(1);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const res = await axios.get('/api/batches');
                setBatches(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchBatches();
    }, []);

    const handleBatchToggle = (batchId) => {
        setSelectedBatches(prev =>
            prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
        );
    };

    const handleGenerate = async () => {
        setLoading(true);
        setStep(2);
        try {
            const selectedBatchObjects = batches.filter(b => selectedBatches.includes(b._id));
            const res = await axios.post('/api/generate', { batches: selectedBatchObjects });
            setResult(res.data);
            setStep(3);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            {/* V2 Algorithmic Header */}
            <div className="text-center space-y-6 pt-12 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-500/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>

                <div className="inline-flex items-center px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-black tracking-[0.2em] mb-4 uppercase ring-8 ring-slate-900/5">
                    <Cpu className="w-4 h-4 mr-3 text-brand-400" />
                    Neural Engine Core
                </div>
                <h1 className="text-7xl font-black text-slate-900 tracking-tighter font-display italic leading-tight">
                    Algorithm <span className="text-gradient">Synthesis</span>
                </h1>
                <p className="text-slate-500 text-xl font-medium max-w-3xl mx-auto leading-relaxed">
                    Optimize university resources with our multi-constraint SAT solver. Conflict-free schedules generated with 99.9% accuracy.
                </p>
            </div>

            {/* V2 Stepper - Clean & Professional */}
            <div className="flex items-center justify-center space-x-10 mb-12">
                {[1, 2, 3].map(s => (
                    <React.Fragment key={s}>
                        <div className="flex flex-col items-center group">
                            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-xl transition-all duration-700 relative ${step >= s
                                    ? 'bg-brand-500 text-white shadow-2xl shadow-brand-500/40 scale-110'
                                    : 'bg-white text-slate-300 border-2 border-slate-100'
                                }`}>
                                {step > s ? <Check className="w-8 h-8" /> : s}
                                {step === s && (
                                    <div className="absolute -inset-2 bg-brand-500/10 rounded-[32px] animate-ping opacity-30"></div>
                                )}
                            </div>
                            <span className={`mt-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${step >= s ? 'text-brand-600' : 'text-slate-300'}`}>
                                {s === 1 && 'Configuration'}
                                {s === 2 && 'Optimization'}
                                {s === 3 && 'Verification'}
                            </span>
                        </div>
                        {s < 3 && <div className={`w-24 h-1 rounded-full ${step > s ? 'bg-brand-500' : 'bg-slate-100'}`}></div>}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Selection - Professional Grid */}
            {step === 1 && (
                <div className="bg-white rounded-[60px] border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.03)] overflow-hidden animate-in zoom-in-95 duration-700">
                    <div className="p-12 lg:p-16 bg-slate-50/30 border-b border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Configuration Profile</h3>
                            <p className="text-slate-400 font-medium text-lg">Select target cohorts for this compute cycle.</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl flex items-center">
                                <Search className="w-4 h-4 text-slate-300 mr-3" />
                                <input type="text" placeholder="Filter batches..." className="bg-transparent text-sm font-bold focus:outline-none" />
                            </div>
                            <div className="px-6 py-3 bg-brand-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-500/20">
                                {selectedBatches.length} Selected
                            </div>
                        </div>
                    </div>
                    <div className="p-12 lg:p-16">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                            {batches.map((batch) => (
                                <button
                                    key={batch._id}
                                    onClick={() => handleBatchToggle(batch._id)}
                                    className={`p-10 rounded-[40px] border-2 text-left transition-all duration-500 group relative overflow-hidden ${selectedBatches.includes(batch._id)
                                            ? 'bg-brand-50 border-brand-500 shadow-2xl shadow-brand-500/10'
                                            : 'bg-white border-slate-100 hover:border-brand-200 hover:shadow-2xl hover:shadow-slate-200/50'
                                        }`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-all duration-700 ${selectedBatches.includes(batch._id)
                                            ? 'bg-brand-500 text-white rotate-[10deg]'
                                            : 'bg-slate-50 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 group-hover:rotate-[-5deg]'
                                        }`}>
                                        <Layers size={28} />
                                    </div>
                                    <h4 className="font-black text-2xl text-slate-900 mb-2 truncate uppercase italic">{batch.name}</h4>
                                    <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        <Shield size={12} className="mr-2 text-brand-400" />
                                        DEPT: {batch.department}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={selectedBatches.length === 0}
                            onClick={handleGenerate}
                            className={`w-full py-8 rounded-[32px] font-black text-2xl flex items-center justify-center transition-all shadow-2xl active:scale-[0.98] group ${selectedBatches.length > 0
                                    ? 'bg-slate-900 text-white hover:bg-brand-500 shadow-slate-900/20'
                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                                }`}
                        >
                            <Play className="w-8 h-8 mr-4 fill-current group-hover:animate-pulse" />
                            DEPLOY SYNTHESIS ENGINE
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Processing - Professional Spinner */}
            {step === 2 && (
                <div className="bg-white rounded-[60px] border border-slate-100 shadow-2xl text-center py-32 animate-in zoom-in-95 duration-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                        <div className="flex items-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            <Clock size={12} className="mr-2" />
                            Est. Time: 4.2s
                        </div>
                    </div>

                    <div className="relative mb-16 inline-block">
                        <div className="w-56 h-56 border-2 border-slate-50 rounded-full mx-auto"></div>
                        <div className="absolute inset-0 w-56 h-56 border-t-8 border-brand-500 rounded-full animate-spin"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-slate-900 text-brand-400 rounded-full shadow-2xl flex items-center justify-center overflow-hidden">
                            <Cpu className="w-14 h-14 animate-[pulse_1.5s_infinite]" />
                        </div>
                    </div>

                    <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">Calibrating Constraints...</h2>
                    <p className="text-slate-400 max-w-lg mx-auto font-bold text-lg leading-relaxed">
                        Solving multi-agent game theory equations to find the most balanced allocation for faculty and students.
                    </p>

                    <div className="mt-20 space-y-6 max-w-md mx-auto px-8">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-brand-600 font-black text-xs uppercase tracking-widest italic">Computing Layer 4</span>
                            <span className="text-slate-900 font-black text-2xl tracking-tighter">72%</span>
                        </div>
                        <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-brand-500 to-accent-pink rounded-full w-[72%] transition-all duration-1000"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Result - High-Impact V2 View */}
            {step === 3 && result && (
                <div className="space-y-12 animate-in slide-in-from-bottom-12 duration-1000">
                    <div className="bg-slate-900 rounded-[60px] p-12 lg:p-16 text-white border-none shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden relative">
                        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-12">
                            <div className="flex items-center gap-10">
                                <div className="w-32 h-32 bg-gradient-to-br from-brand-500 to-accent-pink shadow-2xl rounded-[40px] flex items-center justify-center animate-floating">
                                    <CheckCircle2 className="text-white w-20 h-20" />
                                </div>
                                <div>
                                    <h2 className="text-5xl font-black tracking-tighter mb-4 leading-tight">Optimization <br /> <span className="text-brand-400 italic">Successful.</span></h2>
                                    <p className="text-slate-400 font-bold text-xl">{result.length} conflict-free nodes detected across the cluster.</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-5">
                                <button className="px-10 py-6 bg-white text-slate-900 rounded-[28px] font-black text-lg shadow-2xl hover:bg-brand-500 hover:text-white transition-all active:scale-95 flex items-center">
                                    <Download className="w-6 h-6 mr-3" />
                                    EXPORT ASSETS
                                </button>
                                <button onClick={() => setStep(1)} className="px-10 py-6 bg-white/5 border-2 border-white/10 text-white rounded-[28px] font-black text-lg hover:bg-white/10 transition-all font-display">
                                    NEW RECALCULATION
                                </button>
                            </div>
                        </div>
                        {/* Mesh gradient background blur */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[140px] translate-x-1/2 -translate-y-1/2"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {result.map((s, idx) => (
                            <div key={idx} className="pro-card group bg-white border-slate-100 hover:border-brand-500 duration-500">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="px-5 py-2 bg-slate-900 text-white text-[10px] font-black rounded-2xl uppercase tracking-[0.2em]">{s.day}</div>
                                    <div className="text-brand-600 font-black text-xs uppercase tracking-widest bg-brand-50 px-4 py-2 rounded-xl group-hover:bg-brand-500 group-hover:text-white transition-colors">{s.timeSlot}</div>
                                </div>
                                <h4 className="text-3xl font-black text-slate-900 mb-6 line-clamp-2 leading-[1.1] tracking-tighter uppercase italic group-hover:text-brand-500 transition-colors">{s.subject.name}</h4>
                                <div className="space-y-5 pt-8 border-t border-slate-50">
                                    <div className="flex items-center text-slate-600 font-black text-xs uppercase tracking-widest">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mr-4 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                                            <Building2 size={20} />
                                        </div>
                                        ROOM {s.classroom.roomNumber || s.classroom.name}
                                    </div>
                                    <div className="flex items-center text-slate-600 font-black text-xs uppercase tracking-widest">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mr-4 group-hover:bg-accent-pink/5 group-hover:text-accent-pink transition-colors">
                                            <GraduationCap size={20} />
                                        </div>
                                        {s.faculty.name}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Generate;
