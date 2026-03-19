import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { LayoutDashboard, Users, BookOpen, School, TrendingUp } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Analytics = () => {
    const [distributionData, setDistributionData] = useState([]);
    const [roomUtilization, setRoomUtilization] = useState([]);
    const [summaryData, setSummaryData] = useState({
        totals: { classes: 0, faculty: 0, batches: 0, classrooms: 0 },
        facultyWorkload: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [viewMode, setViewMode] = useState('personal'); // 'personal' or 'global'

    useEffect(() => {
        const fetchAnalytics = async () => {
            console.log('Analytics: Fetching data...');
            setLoading(true);
            setError(null);
            try {
                // 1. Identify User and Role accurately
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                if (!storedUser.username) {
                    setError('Session expired. Please login again.');
                    setLoading(false);
                    return;
                }

                // Fetch full user profile from backend
                const profileRes = await api.get(`/users/profile/${storedUser.username}`);
                const fullUser = profileRes.data;

                let facultyId = null;
                let batchId = null;
                let profileInfo = { name: fullUser.username, role: fullUser.role };

                if (fullUser.role === 'student') {
                    if (fullUser.batch) {
                        batchId = fullUser.batch;
                        profileInfo.title = fullUser.section || 'Student Profile';
                    }
                } else if (fullUser.role === 'faculty' || fullUser.role === 'admin') {
                    const facultyRes = await api.get('/faculty');
                    const profile = facultyRes.data.find(fac =>
                        fac.email?.toLowerCase().trim() === fullUser.email?.toLowerCase().trim() ||
                        fac.name?.toLowerCase().trim() === fullUser.username?.toLowerCase().trim()
                    );

                    if (profile) {
                        facultyId = profile._id;
                        profileInfo = { ...profile, role: 'faculty', title: 'Faculty Profile' };
                    }
                }

                setUserProfile(profileInfo);

                // 2. Fetch Data
                const finalFacultyId = viewMode === 'personal' ? facultyId : null;
                const finalBatchId = viewMode === 'personal' ? batchId : null;

                // Safeguard: If personal mode requested but no ID found, we should warn or show empty
                if (viewMode === 'personal' && !facultyId && !batchId) {
                    console.warn('Analytics: Personal mode requested but no profile ID found.');
                    setDistributionData([]);
                    setSummaryData({ totals: { classes: 0, faculty: 0, batches: 0, classrooms: 0 }, facultyWorkload: [] });
                    setLoading(false);
                    return;
                }

                let query = '';
                if (finalFacultyId) query = `?facultyId=${finalFacultyId}`;
                else if (finalBatchId) query = `?batchId=${finalBatchId}`;

                const [distRes, summaryRes, roomRes] = await Promise.all([
                    api.get(`/analytics/distribution${query}`),
                    api.get(`/analytics/summary${query}`),
                    api.get('/analytics/room-utilization')
                ]);

                setDistributionData(distRes.data || []);
                setSummaryData(summaryRes.data || { totals: { classes: 0, faculty: 0, batches: 0, classrooms: 0 }, facultyWorkload: [] });
                setRoomUtilization(roomRes.data || []);
                setLoading(false);
            } catch (error) {
                console.error('Analytics: Error fetching data:', error);
                setError(error.response?.data?.error || error.message || 'Failed to fetch analytics data');
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [viewMode]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-bg-main">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-text-muted font-medium">Loading analytics engine...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-bg-main min-h-screen">
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-[32px] text-center max-w-2xl mx-auto shadow-sm">
                    <h2 className="text-xl font-bold text-rose-900 mb-2">Sync Error</h2>
                    <p className="text-rose-700 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition-all"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-bg-card p-6 rounded-3xl shadow-sm border border-[var(--border-main)] flex items-center space-x-4">
            <div className={`p-4 rounded-2xl ${color} bg-opacity-10`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            <div>
                <p className="text-[var(--text-muted)] text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-[var(--text-main)]">{value}</h3>
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-6 bg-bg-main min-h-screen text-text-main transition-colors duration-300">
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-main)]">Analytics <span className="text-[var(--brand-primary)]">Engine</span></h1>
                    <p className="text-text-muted mt-1">
                        {viewMode === 'personal' && userProfile
                            ? (userProfile.title === 'Faculty Profile' || userProfile.batch
                                ? `Displaying personal metrics for ${userProfile.name}`
                                : `Profile not fully linked. Displaying system overview.`)
                            : 'Real-time insights across the entire system.'}
                    </p>
                </div>

                <div className="flex items-center p-1.5 bg-[var(--border-main)] rounded-2xl">
                    <button
                        onClick={() => setViewMode('personal')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'personal' ? 'bg-bg-card text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Personal
                    </button>
                    <button
                        onClick={() => setViewMode('global')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'global' ? 'bg-bg-card text-[var(--brand-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        Global
                    </button>
                </div>

                <div className="bg-[var(--brand-primary)] text-white px-6 py-2 rounded-2xl font-bold shadow-lg shadow-blue-500/20 flex items-center">
                    <TrendingUp size={18} className="mr-2" />
                    Live Matrix
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={viewMode === 'personal' ? "My Classes" : "Total Classes"}
                    value={summaryData?.totals?.classes ?? '...'}
                    icon={BookOpen}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Faculty Members"
                    value={summaryData?.totals?.faculty ?? '...'}
                    icon={Users}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Total Batches"
                    value={summaryData?.totals?.batches ?? '...'}
                    icon={LayoutDashboard}
                    color="bg-amber-500"
                />
                <StatCard
                    title="Classrooms"
                    value={summaryData?.totals?.classrooms ?? '...'}
                    icon={School}
                    color="bg-rose-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weekly Distribution Chart */}
                <div className="bg-bg-card p-8 rounded-3xl shadow-sm border border-[var(--border-main)]">
                    <h3 className="text-xl font-bold text-[var(--text-main)] mb-6">Weekly Class Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distributionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" opacity={0.5} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Faculty Workload Chart */}
                <div className="bg-bg-card p-8 rounded-3xl shadow-sm border border-[var(--border-main)]">
                    <h3 className="text-xl font-bold text-[var(--text-main)] mb-6">
                        {viewMode === 'personal' ? 'Session Comparison' : 'Top Faculty Workload'}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={summaryData.facultyWorkload}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" opacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="classes" stroke="#3B82F6" strokeWidth={3} dot={{ r: 6, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Workload Distribution Pie */}
            <div className="bg-bg-card p-8 rounded-3xl shadow-sm border border-[var(--border-main)]">
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-6">
                    {viewMode === 'personal' && userProfile?.role === 'faculty' ? 'My Capacity Utilization' : 'Workload Allocation'}
                </h3>
                <div className="h-[400px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={(() => {
                                    if (viewMode === 'personal' && userProfile?.role === 'faculty' && summaryData.facultyWorkload[0]) {
                                        const myData = summaryData.facultyWorkload[0];
                                        const assigned = myData.classes || 0;
                                        const capacity = myData.maxLoad || 12;
                                        const free = Math.max(0, capacity - assigned);
                                        return [
                                            { name: 'Assigned Sessions', classes: assigned, fill: '#3B82F6' },
                                            { name: 'Remaining Capacity', classes: free, fill: '#E2E8F0' }
                                        ];
                                    }
                                    return summaryData.facultyWorkload;
                                })()}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="classes"
                                nameKey="name"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {(viewMode === 'personal' && userProfile?.role === 'faculty')
                                    ? null // Fills are handled in data array above
                                    : summaryData.facultyWorkload.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))
                                }
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Room Utilization Pie */}
                {viewMode === 'global' && (
                    <div className="bg-bg-card p-8 rounded-3xl shadow-sm border border-[var(--border-main)]">
                        <h3 className="text-xl font-bold text-[var(--text-main)] mb-6">Room Utilization Matrix</h3>
                        <div className="h-[400px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={roomUtilization}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {roomUtilization.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
