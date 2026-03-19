import React from 'react';
import { User, Mail, Shield, Building2, Calendar, Edit3, Settings, ShieldCheck } from 'lucide-react';

const Profile = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{"role": "faculty", "username": "Admin"}');

    return (
        <div className="p-6 space-y-6 bg-bg-main min-h-screen text-text-main transition-colors duration-300">
            <div>
                <h1 className="text-3xl font-black text-text-main tracking-tight">My <span className="text-[var(--brand-primary)]">Profile</span></h1>
                <p className="text-text-muted font-bold mt-2">Manage your professional information and settings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-bg-card rounded-[32px] border border-border-main shadow-sm p-8 flex flex-col items-center text-center">
                        <div className="w-32 h-32 bg-bg-main rounded-full flex items-center justify-center border-4 border-[var(--brand-primary)]/10 mb-6 group relative overflow-hidden">
                            <User className="w-16 h-16 text-[var(--brand-primary)]" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Edit3 className="text-white w-6 h-6" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">{user.username}</h2>
                        <div className="inline-flex items-center px-4 py-1.5 bg-[var(--brand-50)] text-[var(--brand-primary)] rounded-full text-[10px] font-black tracking-widest uppercase mt-4">
                            {user.role} Member
                        </div>

                        <div className="w-full h-px bg-border-main my-8"></div>

                        <div className="w-full space-y-4">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-10 h-10 bg-[var(--bg-main)] rounded-xl flex items-center justify-center text-[var(--text-muted)]">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Email Address</p>
                                    <p className="text-sm font-bold text-[var(--text-main)]">{user.username}@university.edu</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-10 h-10 bg-bg-main rounded-xl flex items-center justify-center text-slate-400">
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Department</p>
                                    <p className="text-sm font-bold text-slate-700">Computer Science & IT</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Settings / Information */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-bg-card rounded-[32px] border border-border-main shadow-sm p-8">
                        <h3 className="text-xl font-black text-text-main uppercase tracking-tight mb-8">Professional Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Full Name</label>
                                <input
                                    type="text"
                                    defaultValue={user.username}
                                    className="w-full px-6 py-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl text-sm font-bold text-[var(--text-main)] focus:ring-4 focus:ring-[var(--brand-primary)]/10 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Employee ID</label>
                                <input
                                    type="text"
                                    defaultValue="EMP-90210"
                                    className="w-full px-6 py-4 bg-bg-main border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-[#3B82F6]/10 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Designation</label>
                                <input
                                    type="text"
                                    defaultValue="Assistant Professor"
                                    className="w-full px-6 py-4 bg-bg-main border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-[#3B82F6]/10 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Office Room</label>
                                <input
                                    type="text"
                                    defaultValue="B-Block, Room 402"
                                    className="w-full px-6 py-4 bg-bg-main border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-[#3B82F6]/10 outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end">
                            <button className="px-10 py-4 bg-[#3B82F6] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all">
                                SAVE CHANGES
                            </button>
                        </div>
                    </div>

                    <div className="bg-bg-card rounded-[40px] border border-slate-100 shadow-sm p-10 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-[#ECFDF5] rounded-2xl flex items-center justify-center text-[#10B981]">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Security Settings</h4>
                                <p className="text-sm font-bold text-slate-400">Manage your password and authentication methods.</p>
                            </div>
                        </div>
                        <button className="px-8 py-3.5 bg-bg-main text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                            MANAGE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
