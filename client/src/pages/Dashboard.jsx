import React from 'react';
import {
    Users,
    BookOpen,
    Home,
    Calendar,
    ArrowUpRight,
    TrendingUp,
    MoreHorizontal,
    Zap,
    Trophy,
    Clock,
    CheckCircle2,
    Database,
    CircleDashed,
    Activity
} from 'lucide-react';

// Internal Helper Component for Hero Visual
const CircleProgress = ({ value, color }) => (
    <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
            <circle cx="48" cy="48" r="40" stroke={color} strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * value) / 100} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-black text-2xl">{value}%</div>
    </div>
);

const Dashboard = () => {
    const stats = [
        { label: 'Total Classrooms', value: '42', icon: Home, trend: '+3 new', color: 'bg-indigo-500', bg: 'bg-indigo-50' },
        { label: 'Verified Faculty', value: '156', icon: Users, trend: '98% Active', color: 'bg-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Active Batches', value: '28', icon: Calendar, trend: 'Semester 4', color: 'bg-rose-500', bg: 'bg-rose-50' }
    ];

    const activities = [
        { title: 'New Batch Added', desc: 'CSE Final Year - Section A', time: '2 mins ago', type: 'batch' },
        { title: 'Faculty Update', desc: 'Dr. Emily Watson updated expertise', time: '45 mins ago', type: 'faculty' },
        { title: 'System Optimized', desc: 'Recalculated 120 slots for conflicts', time: '2 hours ago', type: 'system' },
    ];

    return (
        <div className="space-y-10">
            {/* V2 Hero Section - High Impact */}
            <section className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-brand-500 to-accent-pink rounded-[48px] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative overflow-hidden bg-slate-900 rounded-[48px] p-12 lg:p-20 text-white shadow-2xl">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-500/20 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent-pink/10 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4"></div>

                    <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8">
                                <Trophy className="text-amber-400 w-4 h-4" />
                                <span className="text-xs font-black tracking-widest uppercase">System of the Year 2026</span>
                            </div>
                            <h1 className="text-6xl font-black mb-6 tracking-tighter leading-[1.1]">
                                Intelligence <br />
                                <span className="text-brand-400 italic">for the Elite.</span>
                            </h1>
                            <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-lg mb-12">
                                Welcome to the most advanced academic scheduling platform ever built. Optimized, stable, and incredibly beautiful.
                            </p>
                            <div className="flex space-x-5">
                                <button className="btn-vibrant">
                                    Launch Scheduler
                                    <ArrowUpRight className="w-5 h-5" />
                                </button>
                                <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all">
                                    View Analytics
                                </button>
                            </div>
                        </div>

                        <div className="hidden lg:grid grid-cols-2 gap-6 relative">
                            {/* Visual KPI Bubbles */}
                            <div className="p-8 glass-panel border-white/10 rounded-[40px] flex flex-col items-center justify-center animate-floating">
                                <CircleProgress value={85} color="#6366f1" />
                                <p className="mt-4 font-black uppercase tracking-widest text-xs text-brand-300">Classroom Fill</p>
                            </div>
                            <div className="p-8 glass-panel border-white/10 rounded-[40px] flex flex-col items-center justify-center translate-y-12">
                                <div className="p-4 bg-emerald-500/20 rounded-2xl mb-4">
                                    <CheckCircle2 className="text-emerald-400 w-8 h-8" />
                                </div>
                                <p className="text-3xl font-black">Zero</p>
                                <p className="font-black uppercase tracking-widest text-xs text-emerald-400">Conflicts</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="pro-card group relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-white/5 to-white/0 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-black text-text-muted bg-bg-main px-2 py-1 rounded-lg border border-border-main">
                                {stat.trend} <ArrowUpRight size={12} className={stat.color} />
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black tracking-tight mb-1 text-[var(--text-main)]">{stat.value}</h2>
                            <h3 className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">{stat.label}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Recent Activities */}
                <div className="lg:col-span-2 pro-card">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight mb-1">Live Events</h2>
                            <p className="text-slate-400 text-sm font-medium">Real-time system updates and actions</p>
                        </div>
                        <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-600 transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {activities.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-6 rounded-[24px] border border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-center space-x-6">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {item.type === 'batch' && <Database className="text-brand-400 w-5 h-5" />}
                                        {item.type === 'faculty' && <Users className="text-accent-pink w-5 h-5" />}
                                        {item.type === 'system' && <Zap className="text-amber-400 w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 mb-1">{item.title}</h4>
                                        <p className="text-slate-500 font-medium text-sm">{item.desc}</p>
                                    </div>
                                </div>
                                <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <Clock size={12} className="mr-2" />
                                    {item.time}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="space-y-8">
                    <div className="pro-card bg-brand-500 text-white border-none shadow-xl shadow-brand-500/20 overflow-hidden relative group">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-3">Quick Scheduler</h3>
                            <p className="text-white/70 text-sm font-medium mb-8 leading-relaxed">Instantly generate a draft based on previous constraints.</p>
                            <button className="w-full py-4 bg-white text-brand-600 rounded-2xl font-black shadow-lg hover:scale-[1.03] transition-transform">
                                RUN AUTO-FIX
                            </button>
                        </div>
                        <CircleDashed className="absolute -bottom-10 -right-10 w-40 h-40 text-white/10 group-hover:scale-110 transition-transform" />
                    </div>

                    {/* System Status - Replaces Efficiency */}
                    <div className="pro-card">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-[var(--text-main)]">SYSTEM STATUS</h3>
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Core Services Pipeline</p>
                            </div>
                            <Activity className="text-emerald-500" size={24} />
                        </div>
                        <div className="space-y-6">
                            {[
                                { name: 'Database Routing', status: 'Online', color: 'bg-emerald-500', ping: '12ms' },
                                { name: 'Analytics Engine', status: 'Online', color: 'bg-emerald-500', ping: '45ms' },
                                { name: 'Schedule Optimizer', status: 'Standby', color: 'bg-amber-500', ping: 'Idle' },
                                { name: 'Mail Service', status: 'Online', color: 'bg-brand-500', ping: '8ms' }
                            ].map((system, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-bg-main border border-border-main hover:border-brand-500/30 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2.5 h-2.5 rounded-full ${system.color} shadow-[0_0_10px_currentColor] group-hover:animate-pulse`}></div>
                                        <span className="text-xs font-black uppercase tracking-widest text-text-main">{system.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${system.color.replace('bg-', 'text-')}`}>{system.status}</span>
                                        <span className="text-[10px] font-bold text-text-muted bg-bg-card px-2 py-1 rounded-lg">{system.ping}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
