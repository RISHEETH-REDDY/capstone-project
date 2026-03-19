import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck, Sparkles, Zap, Smartphone, Globe } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [role, setRole] = useState('faculty'); // 'faculty' or 'student'
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    role: role
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                // Use the role from the server, NOT the UI toggle
                navigate(data.user.role === 'faculty' ? '/faculty' : '/student');
            } else {
                setError(data.error || 'Authentication failed. Please check your credentials.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An error occurred during login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 lg:p-10 font-sans overflow-hidden transition-all duration-700 relative ${role === 'student'
            ? 'bg-gradient-to-br from-[#EEF2FF] via-[#E0E7FF] to-[#C7D2FE]'
            : 'bg-gradient-to-br from-[#F5F3FF] via-[#EDE9FE] to-[#DDD6FE]'
            }`}>

            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="w-full max-w-6xl h-[600px] lg:h-[700px] bg-white/80 backdrop-blur-xl rounded-[40px] shadow-[0_32px_120px_rgba(0,0,0,0.1)] flex flex-col lg:flex-row overflow-hidden relative border border-white/40">

                {/* Left Side: 3D Illustration */}
                <div className={`hidden lg:flex lg:w-1/2 items-center justify-center border-r border-white/20 p-12 transition-all duration-700 ${role === 'student'
                    ? 'bg-gradient-to-b from-brand-50/50 to-white/50'
                    : 'bg-gradient-to-b from-violet-50/50 to-white/50'
                    }`}>
                    <img
                        src="/assets/login_bg.png"
                        alt="Academic Illustration"
                        className="w-full h-auto object-contain animate-floating drop-shadow-2xl"
                    />
                </div>

                {/* Right Side: Login Form */}
                <div className="flex-1 flex flex-col p-8 lg:p-16 relative bg-white/30">

                    {/* Role Toggle */}
                    <div className="flex justify-center lg:justify-end mb-8 relative z-30">
                        <div className="flex p-1 bg-white/50 backdrop-blur-md rounded-full border border-white shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
                            <button
                                type="button"
                                onClick={() => setRole('student')}
                                className={`px-8 py-2.5 rounded-full text-sm font-black transition-all duration-500 ${role === 'student'
                                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-xl shadow-brand-500/25 scale-105'
                                    : 'text-slate-500 hover:text-brand-500 hover:bg-white/50'
                                    }`}
                            >
                                Student
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('faculty')}
                                className={`px-8 py-2.5 rounded-full text-sm font-black transition-all duration-500 ${role === 'faculty'
                                    ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-xl shadow-violet-500/25 scale-105'
                                    : 'text-slate-500 hover:text-violet-500 hover:bg-white/50'
                                    }`}
                            >
                                Teacher
                            </button>
                        </div>
                    </div>

                    {/* Login Card */}
                    <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.08)] border border-white border-t-white/40 overflow-hidden relative z-10 hover:shadow-2xl transition-all duration-500">
                        <div className={`py-6 text-center transition-all duration-700 ${role === 'student'
                            ? 'bg-gradient-to-r from-brand-500 to-brand-600'
                            : 'bg-gradient-to-r from-violet-500 to-violet-600'
                            }`}>
                            <h2 className="text-white text-xl font-black uppercase tracking-[0.3em] drop-shadow-sm">Log In</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 lg:p-10 space-y-6">
                            {error && (
                                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[11px] font-black text-center animate-shake uppercase tracking-wider">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 transition-all text-slate-700 text-sm font-bold placeholder:text-slate-300 placeholder:font-medium"
                                        placeholder="jondoe32@gmail.com"
                                    />
                                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-500 ${formData.username ? 'bg-brand-500 animate-pulse' : 'bg-slate-200'}`}></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 transition-all text-slate-700 text-sm font-bold placeholder:text-slate-300 placeholder:font-medium"
                                        placeholder="••••••••••••"
                                    />
                                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-500 ${formData.password ? 'bg-brand-500 animate-pulse' : 'bg-slate-200'}`}></div>
                                </div>
                                <div className="text-right">
                                    <a href="#" className={`text-[10px] font-black uppercase tracking-widest transition-colors ${role === 'student' ? 'text-brand-500 hover:text-brand-600' : 'text-violet-500 hover:text-violet-600'}`}>Forgot Password?</a>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center group overflow-hidden relative ${role === 'student'
                                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 shadow-brand-500/25'
                                    : 'bg-gradient-to-r from-violet-500 to-violet-600 shadow-violet-500/25'
                                    }`}
                            >
                                <span className="relative z-10 flex items-center">
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            Log in
                                            <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Character Asset - Positioned absolute */}
                <div className="hidden lg:block absolute bottom-0 -right-24 w-[400px] pointer-events-none z-20">
                    <img
                        src={role === 'student' ? "/assets/student_v7.png?v=4" : "/assets/teacher_v7.png?v=4"}
                        alt="Character"
                        className="w-full h-auto drop-shadow-[-20px_0_40px_rgba(0,0,0,0.1)] transition-all duration-700"
                        style={{
                            mixBlendMode: 'multiply',
                            filter: 'brightness(1.05) contrast(1.1)',
                            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 85%)',
                            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 85%)'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
