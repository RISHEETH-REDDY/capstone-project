import React from 'react';
import { LayoutDashboard, User, Users, ShieldCheck, LogOut, ChevronLeft, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab, role }) => {
    const navigate = useNavigate();

    const handleSignOut = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="hidden lg:flex flex-col w-64 bg-[#0F172A] h-screen fixed left-0 top-0 text-white p-6 justify-between z-50 shadow-2xl">
            <div className="space-y-12">
                {/* Branding */}
                <div className="flex items-center space-x-3 px-2 pt-4 relative">
                    <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center font-black italic text-2xl shadow-lg shadow-blue-500/20">S</div>
                    <span className="font-black tracking-tight text-2xl">Smart<span className="text-[#3B82F6]">Class</span></span>

                    {/* Toggle Button overlap effect from screenshot */}
                    <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-6 h-12 bg-white rounded-r-xl border border-l-0 border-slate-100 flex items-center justify-center cursor-pointer text-slate-400 hover:text-brand-600 shadow-sm transition-all hidden">
                        <ChevronLeft size={16} />
                    </div>
                </div>

                {/* Navigation */}
                <div className="space-y-2 px-1">
                    <p className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 opacity-50">Menu</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all font-bold text-[13px] ${activeTab === 'dashboard' ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <LayoutDashboard size={20} className="mr-4" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all font-bold text-[13px] ${activeTab === 'profile' ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <User size={20} className="mr-4" />
                        Profile
                    </button>
                    <button
                        onClick={() => navigate('/analytics')}
                        className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all font-bold text-[13px] ${activeTab === 'analytics' ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <TrendingUp size={20} className="mr-4" />
                        Analytics
                    </button>
                </div>

                <div className="space-y-2 px-1">
                    <p className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 opacity-50">Views</p>
                    <button className="w-full flex items-center px-5 py-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-bold text-[13px]">
                        <Users size={20} className="mr-4" />
                        Student View
                    </button>
                    <button className="w-full flex items-center px-5 py-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-bold text-[13px]">
                        <ShieldCheck size={20} className="mr-4" />
                        Admin View
                    </button>
                </div>
            </div>

            {/* Logout */}
            <div className="px-1 border-t border-white/5 pt-6">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-5 py-4 rounded-2xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all font-bold text-[13px]"
                >
                    <LogOut size={20} className="mr-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
