import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    User,
    Users,
    ShieldCheck,
    LogOut,
    Search,
    Bell,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Menu,
    Calendar,
    Settings,
    HelpCircle,
    Sun,
    Moon,
    Palette
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import LiveStatusRibbon from './LiveStatusRibbon';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { theme, accent, toggleTheme, setAccent } = useTheme();

    // Safely parse user data
    let user = {};
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser && storedUser !== 'undefined') {
            user = JSON.parse(storedUser);
        }
    } catch (e) {
        console.error('Failed to parse user data', e);
    }

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const navItems = [
        { path: user.role === 'faculty' ? '/faculty' : '/student', name: 'Dashboard', icon: LayoutDashboard },
        { path: '/profile', name: 'Profile', icon: User },
    ];

    if (user.role === 'faculty' || user.role === 'admin') {
        navItems.push(
            { path: '/analytics', name: 'Analytics', icon: TrendingUp },
            { path: '/student-view', name: 'Student View', icon: Users, section: 'Management' },
            { path: '/admin-view', name: 'Admin View', icon: ShieldCheck, section: 'Management' }
        );
    }

    const getBreadcrumbs = () => {
        const path = location.pathname.split('/').filter(p => p);
        return path.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ');
    };

    return (
        <div className="flex min-h-screen bg-bg-main font-sans antialiased text-text-main transition-colors duration-300">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 72 : 240 }}
                className="fixed left-0 top-0 bottom-0 bg-surface-dark text-white z-50 flex flex-col shadow-2xl border-r border-white/5"
            >
                {/* Branding */}
                <div className="h-16 flex items-center px-6 mb-2">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="min-w-[32px] h-8 bg-brand-500 rounded-lg flex items-center justify-center font-black italic text-lg shadow-lg shadow-brand-500/20">
                            S
                        </div>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="font-black tracking-tight text-xl whitespace-nowrap"
                            >
                                Smart<span className="text-brand-400">Class</span>
                            </motion.span>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto scrollbar-hide">
                    <div>
                        {!isCollapsed && <p className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 opacity-50">Main Menu</p>}
                        <div className="space-y-1">
                            {navItems.filter(item => !item.section).map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center px-4 py-3 rounded-xl transition-all font-bold text-[13px] group ${isActive
                                            ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-4'} transition-transform group-hover:scale-110`} />
                                        {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {navItems.some(item => item.section === 'Management') && (
                        <div>
                            {!isCollapsed && <p className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 opacity-50">General</p>}
                            <div className="space-y-1">
                                {navItems.filter(item => item.section === 'Management').map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center px-4 py-3 rounded-xl transition-all font-bold text-[13px] group ${isActive
                                                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <item.icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-4'} transition-transform group-hover:scale-110`} />
                                            {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </nav>

                {/* Footer / Sign Out */}
                <div className="p-3 mt-auto border-t border-white/5 bg-white/5 backdrop-blur-sm">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2.5 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all font-bold text-[12px] group"
                    >
                        <LogOut className={`w-4 h-4 ${isCollapsed ? 'mx-auto' : 'mr-3'} group-hover:-translate-x-1 transition-transform`} />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                    {!isCollapsed && (
                        <div className="mt-4 px-2 py-3 bg-white/5 rounded-2xl flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs uppercase">
                                {user.username?.[0] || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-white truncate uppercase">{user.username || 'User'}</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{user.role || 'Member'}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-24 w-6 h-12 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all z-10 text-slate-400 hover:text-brand-500"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </motion.aside>

            {/* Main Content Area */}
            <div className={`flex-1 transition-all duration-500 ${isCollapsed ? 'ml-[72px]' : 'ml-[240px]'} flex flex-col min-h-screen`}>
                {/* Header / Top Bar */}
                <header className="h-16 bg-bg-card/70 backdrop-blur-xl border-b border-border-main sticky top-0 z-40 flex items-center justify-between px-6 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
                            <span>/</span>
                            <span className="text-[var(--text-main)] opacity-100">{getBreadcrumbs()}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 pr-4 py-2 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl text-[11px] font-bold outline-none ring-2 ring-transparent focus:ring-brand-500/10 focus:bg-[var(--bg-card)] text-[var(--text-main)] transition-all w-48"
                            />
                        </div>
                        <div className="flex items-center space-x-1">
                            {/* Accent Picker */}
                            <div className="flex items-center bg-slate-100 rounded-xl p-1 mx-2 dark:bg-slate-800">
                                {['brand', 'emerald', 'violet'].map((a) => (
                                    <button
                                        key={a}
                                        onClick={() => setAccent(a)}
                                        className={`w-4 h-4 rounded-full transition-all ${accent === a ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'opacity-40 hover:opacity-100'}`}
                                        style={{ backgroundColor: a === 'brand' ? '#0e8ad9' : a === 'emerald' ? '#10b981' : '#8b5cf6' }}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={toggleTheme}
                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all dark:hover:bg-slate-800"
                            >
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            </button>

                            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all relative dark:hover:bg-slate-800">
                                <Bell size={18} />
                                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 border-2 border-[var(--bg-card)] rounded-full"></span>
                            </button>
                            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all dark:hover:bg-slate-800">
                                <Settings size={18} />
                            </button>
                        </div>
                        <div className="h-6 w-px bg-[var(--border-main)]"></div>
                        <div className="flex items-center space-x-3 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-[var(--text-main)] uppercase leading-none mb-0.5">{user.username}</p>
                                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">{user.role}</p>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-violet flex items-center justify-center text-white text-xs font-black shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                                {user.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Live Status Ribbon Expansion (Phase 2) */}
                <LiveStatusRibbon />

                <main className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="max-w-[1600px] mx-auto"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default Layout;
