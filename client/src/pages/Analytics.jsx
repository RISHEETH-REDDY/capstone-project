import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { LayoutDashboard, Users, BookOpen, School, TrendingUp, FilterX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Analytics = () => {
    const [rawData, setRawData] = useState({
        timetable: [],
        faculty: [],
        batches: [],
        classrooms: []
    });
    const [activeFilters, setActiveFilters] = useState({
        day: null,
        facultyId: null,
        roomStatus: null,
        batchId: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [viewMode, setViewMode] = useState('personal'); // 'personal' or 'global'

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // Determine user role
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                const profileRes = await api.get(`/users/profile/${storedUser.username}`);
                setUserProfile(profileRes.data);

                // Fetch everything for frontend calculation
                const [timeRes, facRes, batchRes, roomRes] = await Promise.all([
                    api.get('/timetable'),
                    api.get('/faculty'),
                    api.get('/batches'),
                    api.get('/classrooms')
                ]);

                setRawData({
                    timetable: timeRes.data,
                    faculty: facRes.data,
                    batches: batchRes.data,
                    classrooms: roomRes.data
                });

                // Personal mode auto-filter
                if (viewMode === 'personal') {
                    if (profileRes.data.role === 'student' && profileRes.data.batch) {
                        setActiveFilters(prev => ({ ...prev, batchId: profileRes.data.batch }));
                    } else if (profileRes.data.role === 'faculty') {
                        const fac = facRes.data.find(f => 
                            f.email?.toLowerCase() === profileRes.data.email?.toLowerCase() ||
                            f.name?.toLowerCase() === profileRes.data.username?.toLowerCase()
                        );
                        if (fac) setActiveFilters(prev => ({ ...prev, facultyId: fac._id }));
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to sync engine data.');
                setLoading(false);
            }
        };
        fetchAllData();
    }, [viewMode]);

    // --- Filter Logic ---
    const filteredTimetable = useMemo(() => {
        return rawData.timetable.filter(t => {
            if (activeFilters.day && t.day !== activeFilters.day) return false;
            if (activeFilters.facultyId && (t.faculty?._id !== activeFilters.facultyId && t.faculty !== activeFilters.facultyId)) return false;
            if (activeFilters.batchId && (t.batch?._id !== activeFilters.batchId && t.batch !== activeFilters.batchId)) return false;
            
            // Room Status Filter is reactive (calculated below)
            if (activeFilters.roomStatus) {
                const roomUsage = rawData.timetable.filter(entry => (entry.classroom?._id || entry.classroom) === (t.classroom?._id || t.classroom)).length;
                const status = (roomUsage / 6) > 4 ? 'Fully Utilized' : 'Under Utilized';
                if (!activeFilters.roomStatus.includes(status)) return false;
            }
            return true;
        });
    }, [rawData, activeFilters]);

    // --- Computed Metrics ---
    const distributionData = useMemo(() => {
        return DAYS.map(day => ({
            day,
            count: filteredTimetable.filter(t => t.day === day).length
        }));
    }, [filteredTimetable]);

    const workloadData = useMemo(() => {
        const counts = {};
        filteredTimetable.forEach(t => {
            const facName = t.faculty?.name || 'Unknown';
            counts[facName] = (counts[facName] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ 
                name, 
                classes: count,
                id: rawData.faculty.find(f => f.name === name)?._id 
            }))
            .sort((a, b) => b.classes - a.classes)
            .slice(0, 15);
    }, [filteredTimetable, rawData.faculty]);

    const roomUtilizationData = useMemo(() => {
        const stats = { 'Fully Utilized': 0, 'Under Utilized': 0 };
        const usedRoomIds = [...new Set(filteredTimetable.map(t => (t.classroom?._id || t.classroom)))];
        
        usedRoomIds.forEach(roomId => {
            if (!roomId) return;
            const globalUsage = rawData.timetable.filter(t => (t.classroom?._id || t.classroom) === roomId).length;
            const status = (globalUsage / 6) > 4 ? 'Fully Utilized' : 'Under Utilized';
            stats[status]++;
        });

        if (Object.values(activeFilters).every(v => v === null)) {
            const allStats = { 'Fully Utilized': 0, 'Under Utilized': 0 };
            rawData.classrooms.forEach(room => {
                const usage = rawData.timetable.filter(t => (t.classroom?._id || t.classroom) === room._id).length;
                const status = (usage / 6) > 4 ? 'Fully Utilized' : 'Under Utilized';
                allStats[status]++;
            });
            return [
                { name: 'Fully Utilized (>4 hrs/day)', value: allStats['Fully Utilized'], color: '#10b981' },
                { name: 'Under Utilized (<=4 hrs/day)', value: allStats['Under Utilized'], color: '#f43f5e' }
            ];
        }

        return [
            { name: 'Fully Utilized (>4 hrs/day)', value: stats['Fully Utilized'] || 0, color: '#10b981' },
            { name: 'Under Utilized (<=4 hrs/day)', value: stats['Under Utilized'] || 0, color: '#f43f5e' }
        ];
    }, [filteredTimetable, rawData, activeFilters]);

    const detailedRooms = useMemo(() => {
        return rawData.classrooms.map(room => {
            const globalUsage = rawData.timetable.filter(t => (t.classroom?._id || t.classroom) === room._id).length;
            const status = (globalUsage / 6) > 4 ? 'Fully Utilized' : 'Under Utilized';
            return { ...room, status, usage: globalUsage };
        }).filter(room => {
            if (activeFilters.roomStatus && room.status !== activeFilters.roomStatus) return false;
            // If filtering by Day or Faculty, only show rooms present in the filtered timetable
            if (activeFilters.day || activeFilters.facultyId || activeFilters.batchId) {
                const isUsed = filteredTimetable.some(t => (t.classroom?._id || t.classroom) === room._id);
                if (!isUsed) return false;
            }
            return true;
        });
    }, [rawData, activeFilters, filteredTimetable]);

    const totals = useMemo(() => ({
        classes: filteredTimetable.length,
        faculty: new Set(filteredTimetable.filter(t => t.faculty).map(t => t.faculty?._id || t.faculty)).size,
        batches: new Set(filteredTimetable.filter(t => t.batch).map(t => t.batch?._id || t.batch)).size,
        classrooms: new Set(filteredTimetable.filter(t => t.classroom).map(t => t.classroom?._id || t.classroom)).size
    }), [filteredTimetable]);

    const clearFilters = () => {
        setActiveFilters({ day: null, facultyId: null, roomStatus: null, batchId: null });
        if (viewMode === 'personal' && userProfile) {
            if (userProfile.role === 'student' && userProfile.batch) setActiveFilters(prev => ({ ...prev, batchId: userProfile.batch }));
            else if (userProfile.role === 'faculty') {
                 const email = userProfile.email || userProfile.username;
                 const fac = rawData.faculty.find(f => f.email?.toLowerCase() === email?.toLowerCase());
                 if (fac) setActiveFilters(prev => ({ ...prev, facultyId: fac._id }));
            }
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-bg-main">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-bg-card p-6 rounded-3xl shadow-sm border border-[var(--border-main)] flex items-center space-x-4">
            <div className={`p-4 rounded-2xl ${color} bg-opacity-10`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            <div>
                <p className="text-[var(--text-muted)] text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-[var(--text-main)]">{value || 0}</h3>
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-6 bg-bg-main min-h-screen text-text-main transition-colors duration-300">
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-main)]">Analytics <span className="text-[var(--brand-primary)]">Engine</span></h1>
                    <div className="mt-2 flex items-center gap-3">
                        <p className="text-text-muted text-xs font-bold uppercase tracking-tight">
                            {Object.values(activeFilters).some(v => v) 
                                ? (viewMode === 'personal' ? 'My Personal Analytics' : 'Co-Linked Dataset Active') 
                                : 'Live System Matrix Dashboard'}
                        </p>
                        {Object.values(activeFilters).some(v => v) && (
                            <button onClick={clearFilters} className="px-3 py-1 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 hover:bg-rose-100 transition-all border border-rose-100 dark:border-rose-500/20">
                                <FilterX size={12} /> Clear Current Matrix
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center p-1.5 bg-bg-card rounded-2xl border border-border-main">
                    <button onClick={() => setViewMode('personal')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'personal' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Personal</button>
                    <button onClick={() => setViewMode('global')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'global' ? 'bg-[var(--brand-primary)] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Global</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Live Lectures" value={totals.classes} icon={BookOpen} color="bg-blue-500" />
                <StatCard title="Target Faculty" value={totals.faculty} icon={Users} color="bg-emerald-500" />
                <StatCard title="Observed Batches" value={totals.batches} icon={LayoutDashboard} color="bg-amber-500" />
                <StatCard title="Room Capacity" value={totals.classrooms} icon={School} color="bg-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-bg-card p-8 rounded-3xl shadow-sm border border-[var(--border-main)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={60} />
                    </div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        Weekly Class Load
                        {activeFilters.day && <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded-md">FILTER: {activeFilters.day}</span>}
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distributionData} onClick={(data) => {
                                if (data?.activeLabel) setActiveFilters(prev => ({ ...prev, day: prev.day === data.activeLabel ? null : data.activeLabel }));
                            }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" opacity={0.5} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} barSize={40}>
                                    {distributionData.map((entry, index) => (
                                        <Cell key={index} fill={activeFilters.day === entry.day ? '#1D4ED8' : '#3B82F6'} opacity={activeFilters.day && activeFilters.day !== entry.day ? 0.2 : 1} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-bg-card p-8 rounded-3xl shadow-sm border border-[var(--border-main)] relative overflow-hidden group">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        Workload Allocation
                        {activeFilters.facultyId && <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md">FACULTY FILTER ACTIVE</span>}
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={workloadData} onClick={(data) => {
                                if (data?.activePayload?.[0]) {
                                    const id = data.activePayload[0].payload.id;
                                    setActiveFilters(prev => ({ ...prev, facultyId: prev.facultyId === id ? null : id }));
                                }
                            }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" opacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                <Line 
                                    type="monotone" 
                                    dataKey="classes" 
                                    stroke="#3B82F6" 
                                    strokeWidth={4} 
                                    dot={{ r: 6, strokeWidth: 2, fill: '#fff' }} 
                                    activeDot={{ r: 10, strokeWidth: 0 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-bg-card p-8 rounded-3xl shadow-sm border border-[var(--border-main)] relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black flex items-center gap-2">
                            Room Performance <span className="text-[var(--brand-primary)]">Division</span>
                        </h3>
                        <p className="text-text-muted text-sm mt-1">Classrooms grouped by their average daily usage threshold (4 hrs/day).</p>
                    </div>
                    <button onClick={clearFilters} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-main rounded-xl text-xs font-black uppercase transition-all">
                        Reset Map
                    </button>
                </div>

                <div className="space-y-12">
                    {/* Fully Utilized Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <h4 className="text-lg font-bold text-emerald-600 flex items-center gap-2">
                                <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                                Fully Utilized
                            </h4>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-black uppercase">
                                {detailedRooms.filter(r => r.status === 'Fully Utilized').length} Rooms
                            </span>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-2">
                            {detailedRooms.filter(r => r.status === 'Fully Utilized').map((room, idx) => (
                                <RoomCard key={room._id || idx} room={room} />
                            ))}
                            {detailedRooms.filter(r => r.status === 'Fully Utilized').length === 0 && (
                                <p className="text-text-muted text-xs italic">No rooms in this category for current filter.</p>
                            )}
                        </div>
                    </div>

                    {/* Under Utilized Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <h4 className="text-lg font-bold text-rose-600 flex items-center gap-2">
                                <div className="w-2 h-6 bg-rose-500 rounded-full"></div>
                                Under Utilized
                            </h4>
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md text-[10px] font-black uppercase">
                                {detailedRooms.filter(r => r.status === 'Under Utilized').length} Rooms
                            </span>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-2">
                            {detailedRooms.filter(r => r.status === 'Under Utilized').map((room, idx) => (
                                <RoomCard key={room._id || idx} room={room} />
                            ))}
                            {detailedRooms.filter(r => r.status === 'Under Utilized').length === 0 && (
                                <p className="text-text-muted text-xs italic">No rooms in this category for current filter.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Component for Room Grid
const RoomCard = ({ room }) => (
    <div className={`
        relative p-2 h-14 rounded-xl border flex flex-col items-center justify-center transition-all group/room
        ${room.status === 'Fully Utilized' 
            ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100' 
            : 'bg-rose-50 border-rose-100 hover:bg-rose-100'}
    `}>
        <span className={`text-[11px] font-black ${room.status === 'Fully Utilized' ? 'text-emerald-700' : 'text-rose-700'}`}>
            {room.roomNo || room.roomNumber}
        </span>
        <span className="text-[8px] opacity-20 font-bold uppercase group-hover/room:opacity-60 transition-opacity">
            {room.block || 'M'}
        </span>
        
        {/* Hover Performance Overlay */}
        <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 rounded-xl opacity-0 group-hover/room:opacity-100 flex flex-col items-center justify-center transition-opacity z-10 p-1 border border-blue-500 shadow-lg">
            <span className="text-[9px] font-black text-blue-600">{room.usage} Slts</span>
            <div className="w-8 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div 
                    className={`h-full ${room.status === 'Fully Utilized' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, (room.usage / 24) * 100)}%` }}
                ></div>
            </div>
        </div>
    </div>
);

export default Analytics;
