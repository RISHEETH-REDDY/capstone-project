import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
    Users,
    Home,
    BookOpen,
    Search,
    Plus,
    Filter,
    MoreVertical,
    Download,
    Building2,
    GraduationCap,
    Clock,
    Zap
} from 'lucide-react';

const Resources = () => {
    const [activeTab, setActiveTab] = useState('classrooms');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = [
        { id: 'classrooms', label: 'Classrooms', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { id: 'faculty', label: 'Faculty', icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 'subjects', label: 'Subjects', icon: BookOpen, color: 'text-rose-500', bg: 'bg-rose-50' },
    ];

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/${activeTab}`);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(item => {
        const query = searchTerm.toLowerCase();
        if (activeTab === 'classrooms') return item.roomNumber?.toLowerCase().includes(query);
        if (activeTab === 'faculty') return item.name?.toLowerCase().includes(query) || item.email?.toLowerCase().includes(query);
        if (activeTab === 'subjects') return item.name?.toLowerCase().includes(query) || item.code?.toLowerCase().includes(query);
        return true;
    });

    return (
        <div className="space-y-10">
            {/* V2 Vibrant Header Area */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-accent-pink rounded-[40px] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl">
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <Zap className="text-brand-500 w-5 h-5 fill-current" />
                            <span className="text-xs font-black uppercase tracking-widest text-brand-600">Resource Control</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter font-display mb-2">Asset Management</h1>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xl">Curate and optimize your academic infrastructure with our high-precision database.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="btn-vibrant whitespace-nowrap">
                            <Plus className="w-5 h-5" />
                            Provision {activeTab.slice(0, -1)}
                        </button>
                        <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100">
                            <Download className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation & High-Impact Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex p-2 bg-slate-100/50 rounded-3xl w-fit border border-slate-200/40">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                                className={`flex items-center px-8 py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-widest ${isActive
                                        ? 'bg-white text-brand-600 shadow-lg shadow-slate-200 border border-slate-200/50'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'
                                    }`}
                            >
                                <tab.icon className={`w-5 h-5 mr-3 ${isActive ? tab.color : 'text-slate-400'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="relative group min-w-[380px]">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-brand-500 transition-colors" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={`Search ${activeTab} registry...`}
                        className="w-full pl-14 pr-14 py-5 bg-white border border-slate-200 rounded-[28px] shadow-sm focus:ring-8 focus:ring-brand-500/5 focus:border-brand-500 transition-all outline-none text-slate-900 font-bold"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-50 rounded-xl text-slate-400">
                        <Filter className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Content Display Grid - Vibrant Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(n => (
                        <div key={n} className="bg-white rounded-[40px] p-10 border border-slate-100 animate-pulse h-64 shadow-sm"></div>
                    ))
                ) : filteredData.length > 0 ? (
                    filteredData.map((item, idx) => (
                        <div key={idx} className="pro-card group">
                            <div className="flex items-start justify-between mb-8">
                                <div className={`p-4 rounded-[24px] ${tabs.find(t => t.id === activeTab).bg} ${tabs.find(t => t.id === activeTab).color} group-hover:bg-brand-500 group-hover:text-white transition-all duration-500 rotate-[-5deg] group-hover:rotate-0`}>
                                    {activeTab === 'classrooms' && <Building2 size={28} />}
                                    {activeTab === 'faculty' && <GraduationCap size={28} />}
                                    {activeTab === 'subjects' && <BookOpen size={28} />}
                                </div>
                                <button className="p-3 text-slate-300 hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all">
                                    <MoreVertical size={22} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {activeTab === 'classrooms' && (
                                    <>
                                        <h3 className="text-2xl font-black text-slate-900 leading-tight">{item.roomNumber || item.name}</h3>
                                        <div className="flex items-center text-slate-400 text-xs font-black uppercase tracking-widest">
                                            <Users size={14} className="mr-2 text-brand-500" />
                                            CAPACITY: {item.capacity}
                                        </div>
                                        <div className="flex gap-2 pt-4">
                                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black ring-1 ring-emerald-100">AVAILABLE</span>
                                            <span className="px-4 py-1.5 bg-brand-50 text-brand-600 rounded-full text-xs font-black tracking-tighter uppercase italic">{item.type || 'Lecture Hall'}</span>
                                        </div>
                                    </>
                                )}
                                {activeTab === 'faculty' && (
                                    <>
                                        <h3 className="text-2xl font-black text-slate-900 leading-tight">{item.name}</h3>
                                        <p className="text-slate-400 font-bold truncate text-sm">{item.email}</p>
                                        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-50">
                                            <div className="flex items-center text-slate-900 font-black text-xs uppercase tracking-widest">
                                                <Clock size={14} className="mr-2 text-accent-pink" />
                                                LOAD: {item.maxLoad}h
                                            </div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.department || 'N/A'}</span>
                                        </div>
                                    </>
                                )}
                                {activeTab === 'subjects' && (
                                    <>
                                        <h3 className="text-2xl font-black text-slate-900 leading-tight line-clamp-2 min-h-[3rem]">{item.name}</h3>
                                        <p className="text-brand-600 text-sm font-black tracking-[0.2em] mb-4 uppercase italic">ID: {item.code}</p>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-brand-50 transition-colors">
                                                <p className="text-[10px] text-slate-300 uppercase font-black tracking-[0.2em] mb-1">Credits</p>
                                                <p className="text-slate-900 font-black text-lg">{item.credits || 4}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-accent-pink/5 transition-colors">
                                                <p className="text-[10px] text-slate-300 uppercase font-black tracking-[0.2em] mb-1">Hours</p>
                                                <p className="text-slate-900 font-black text-lg">{item.contactHours || 3}h</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 bg-white rounded-[60px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 relative border border-slate-100/50">
                            <Search className="text-slate-200 w-12 h-12" />
                            <div className="absolute top-0 right-0 w-6 h-6 bg-brand-500 rounded-full border-4 border-white"></div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Database empty.</h3>
                        <p className="text-slate-400 font-medium max-w-sm mx-auto">No records found matching your selection.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Resources;
