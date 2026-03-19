import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Zap, Wifi, ChevronRight } from 'lucide-react';

const LiveStatusRibbon = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        }).toUpperCase();
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="bg-[var(--bg-card)] border-b border-[var(--border-main)] px-6 py-2 flex items-center justify-between text-[10px] font-black tracking-[0.15em] uppercase transition-colors duration-300">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 text-[var(--brand-primary)]">
                    <Wifi size={14} className="animate-pulse" />
                    <span>System Live</span>
                </div>

                <div className="h-4 w-px bg-[var(--border-main)]"></div>

                <div className="flex items-center gap-3 text-[var(--text-main)]">
                    <Calendar size={14} className="opacity-50" />
                    <span>{formatDate(currentTime)}</span>
                </div>

                <div className="flex items-center gap-3 text-[var(--text-main)]">
                    <Clock size={14} className="opacity-50" />
                    <span className="tabular-nums">{formatTime(currentTime)}</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 text-[var(--text-muted)]">
                    <span>SEMESTER: <span className="text-[var(--text-main)]">SPRING 2026</span></span>
                </div>

                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-center gap-3 pl-4 border-l border-[var(--border-main)]"
                >
                    <span className="text-[var(--text-muted)]">NEXT SESSION:</span>
                    <div className="flex items-center gap-2 bg-[var(--brand-50)] text-[var(--brand-primary)] px-3 py-1 rounded-full border border-[var(--brand-primary)]/10">
                        <Zap size={10} />
                        <span>AI432 • 10:30 AM</span>
                        <ChevronRight size={10} />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LiveStatusRibbon;
