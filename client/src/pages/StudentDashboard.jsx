import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Clock,
    Calendar,
    BookOpen,
    User,
    MapPin,
    Filter,
    Search,
    ArrowRight,
    FileSpreadsheet,
    FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StudentDashboard = () => {
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [batchId, setBatchId] = useState(''); // Would come from user profile in a real app
    const [batches, setBatches] = useState([]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [searchError, setSearchError] = useState('');
    const [studentInfo, setStudentInfo] = useState(null);

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'];

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearchError('');
        setStudentInfo(null);
        setLoading(true);

        try {
            // First try to look up real user Student ID -> Batch Name ID Mapping
            const res = await api.get(`/users/profile/${searchQuery}`);
            const user = res.data;

            const bId = user.batch;
            const targetBatch = batches.find(b => b._id === bId || b.name === bId);
            
            if (targetBatch) {
                setBatchId(targetBatch._id);
                setStudentInfo(user);
            } else {
                setSearchError('Student found, but missing valid Section mapping in DB.');
            }
        } catch (err) {
            // Fallback: If no db hit, filter dynamically assuming typed value is batch name (e.g. CSE-A)
            const matchedBatch = batches.find(b => b.name.toLowerCase() === searchQuery.toLowerCase());
            if (matchedBatch) {
                setBatchId(matchedBatch._id);
                setStudentInfo({ name: 'Filtered by Batch', rollNumber: matchedBatch.name });
            } else {
                setSearchError('Student ID / Batch not found.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const bRes = await api.get('/batches');
                setBatches(bRes.data);
                if (bRes.data.length > 0) {
                    setBatchId(bRes.data[0]._id);
                }
            } catch (err) {
                console.error('Failed to fetch batches', err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (batchId) {
            const fetchTimetable = async () => {
                setLoading(true);
                try {
                    const res = await api.get(`/timetable?batchId=${batchId}`);
                    setTimetable(res.data);
                } catch (err) {
                    console.error('Failed to fetch timetable', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchTimetable();
        }
    }, [batchId]);

    const getStatusColor = (day, slot) => {
        const now = new Date();
        const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];

        // Simple day priority for demo (comparing current day to schedule day)
        const dayIndex = DAYS.indexOf(day);
        const currentDayIndex = DAYS.indexOf(currentDay);

        if (dayIndex < currentDayIndex) return 'bg-rose-500'; // Past
        if (dayIndex > currentDayIndex) return 'bg-amber-500'; // Upcoming

        // Same day - check slot time
        const [startStr] = slot.split('-');
        let [hours, minutes] = startStr.split(':').map(Number);

        // Standardize 09:00-04:00 to 24hr for calculation
        if (hours < 9) hours += 12; // Handle 01:00, 02:00, etc.

        const slotStartTime = new Date();
        slotStartTime.setHours(hours, minutes, 0);

        const slotEndTime = new Date(slotStartTime);
        slotEndTime.setHours(slotStartTime.getHours() + 1);

        if (now > slotEndTime) return 'bg-rose-500'; // Past
        if (now < slotStartTime) return 'bg-amber-500'; // Upcoming
        return 'bg-emerald-500'; // Ongoing
    };

    const getEntryForSlot = (day, slot) => {
        return timetable.find(t => t.day === day && t.slot === slot);
    };

    const [selectedDay, setSelectedDay] = useState('Monday');

    const handleDayClick = (day) => {
        setSelectedDay(selectedDay === day ? null : day);
    };

    const getExportName = () => {
        const batchName = batches.find(b => b._id === batchId)?.name || 'Batch';
        return `Student_Timetable_${batchName}`;
    };

    const exportToExcel = () => {
        try {
            const data = timetable.map(entry => ({
                Day: entry.day,
                Slot: entry.slot,
                Subject: entry.subject?.name || 'N/A',
                Code: entry.subject?.code || 'N/A',
                Faculty: entry.faculty?.name || 'N/A',
                Room: entry.classroom?.roomNumber || 'N/A'
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Timetable");

            const rawName = getExportName();
            const safeName = rawName.replace(/[^a-zA-Z0-9\s-]/g, '_').trim();
            const fileName = `${safeName}.xlsx`;

            XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error('Excel Export Error:', err);
            alert('Failed to export Excel. Please check console.');
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            const tableColumn = ["Day", "Slot", "Subject", "Faculty", "Room"];
            const tableRows = timetable.map(entry => [
                entry.day,
                entry.slot,
                entry.subject?.name || 'N/A',
                entry.faculty?.name || 'N/A',
                entry.classroom?.roomNumber || 'N/A'
            ]);

            const rawName = getExportName();
            const safeName = rawName.replace(/[^a-zA-Z0-9\s-]/g, '_').trim();

            doc.text(`Timetable: ${rawName}`, 14, 15);
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                theme: 'grid',
                headStyles: { fillStyle: 'F1F5F9', textColor: '0F172A', fontStyle: 'bold' }
            });

            const finalFileName = `${safeName}.pdf`;
            doc.save(finalFileName);
        } catch (err) {
            console.error('PDF Export Error:', err);
            alert('Failed to generate PDF. Please check console.');
        }
    };

    const displayedDays = selectedDay ? [selectedDay] : DAYS;

    return (
        <div className="space-y-10">
            {/* Header / Selector */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">My <span className="text-gradient">Timetable</span></h1>
                    <p className="text-slate-500 font-medium">Real-time schedule and class status tracking.</p>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Student Identity Search ... */}
                    <div className="flex flex-col relative">
                        <form onSubmit={handleSearch} className="relative group flex items-center">
                            <Search className="absolute left-4 w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Student ID or Batch..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 pr-28 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none font-bold text-sm shadow-sm transition-all w-80"
                            />
                            <button type="submit" className="absolute right-2 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                Search
                            </button>
                        </form>
                        {searchError ? (
                            <span className="absolute -bottom-6 left-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-500 animate-in slide-in-from-top-2">
                                {searchError}
                            </span>
                        ) : null}
                        {studentInfo ? (
                            <span className="absolute -bottom-6 left-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-500 animate-in slide-in-from-top-2">
                                Showing: {studentInfo?.name || studentInfo?.username || 'Student'} ({studentInfo?.rollNumber || studentInfo?.name || 'N/A'})
                            </span>
                        ) : null}
                    </div>

                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-5 py-3.5 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all hover:-translate-y-1"
                    >
                        <FileSpreadsheet size={16} /> EXPORT EXCEL
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-5 py-3.5 bg-rose-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all hover:-translate-y-1"
                    >
                        <FileText size={16} /> GET PDF
                    </button>
                </div>
            </div>

            {/* Timetable Grid */}
            <div className="overflow-x-auto pb-8">
                <div className={`min-w-[${selectedDay ? '600px' : '1000px'}] grid ${selectedDay ? 'grid-cols-2' : 'grid-cols-7'} gap-6 transition-all duration-500`}>
                    {/* Time Column Header */}
                    <div className="pro-card bg-slate-900 border-none text-white flex items-center justify-center p-4">
                        <Clock className="w-5 h-5 text-brand-400 mr-2" />
                        <span className="text-xs font-black uppercase tracking-widest">Slots</span>
                    </div>

                    {/* Days Headers */}
                    {displayedDays.map(day => (
                        <button
                            key={day}
                            onClick={() => handleDayClick(day)}
                            className={`pro-card border-slate-200 flex flex-col items-center justify-center p-4 transition-all duration-300 ${selectedDay === day ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/20 scale-105' : 'bg-white/50 hover:bg-white hover:shadow-lg'}`}
                        >
                            <span className={`text-xs font-black uppercase tracking-widest mb-1 ${selectedDay === day ? 'text-white/70' : 'text-slate-400'}`}>{day.substring(0, 3)}</span>
                            <span className={`text-lg font-black ${selectedDay === day ? 'text-white' : 'text-slate-900'}`}>{day}</span>
                        </button>
                    ))}

                    {/* Matrix Rows */}
                    {SLOTS.map(slot => (
                        <React.Fragment key={slot}>
                            {/* Time Slot Label */}
                            <div className="flex items-center justify-center font-bold text-slate-500 text-sm">
                                {slot}
                            </div>

                            {/* Data Cells */}
                            {displayedDays.map(day => {
                                const entry = getEntryForSlot(day, slot);
                                const statusColor = getStatusColor(day, slot);

                                return (
                                    <div key={`${day}-${slot}`} className={`relative min-h-[160px] rounded-[24px] overflow-hidden group transition-all duration-300 ${entry ? 'pro-card p-6 border-none shadow-xl hover:scale-[1.03] hover:z-10' : 'bg-slate-100/50 border-2 border-dashed border-slate-200'}`}>
                                        {entry ? (
                                            <>
                                                {/* Status Bar */}
                                                <div className={`absolute top-0 left-0 right-0 h-1.5 ${statusColor} opacity-80`}></div>

                                                <div className="space-y-4">
                                                    <div className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-tighter">
                                                        {entry.subject?.code}
                                                    </div>

                                                    <div>
                                                        <h4 className="font-black text-slate-900 leading-tight mb-1">{entry.subject?.name}</h4>
                                                        <div className="flex items-center text-slate-400 text-xs font-bold">
                                                            <User size={12} className="mr-1.5" />
                                                            {entry.faculty?.name}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2">
                                                        <div className="flex items-center text-brand-600 text-xs font-black">
                                                            <MapPin size={12} className="mr-1.5" />
                                                            {entry.classroom?.roomNumber}
                                                        </div>
                                                        <div className={`w-3 h-3 rounded-full ${statusColor} animate-pulse shadow-lg`}></div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Free slot</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-8 p-6 glass-panel rounded-3xl border-none">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Status Guide</span>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                        <span className="text-sm font-bold text-slate-600">Ongoing Class</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20"></div>
                        <span className="text-sm font-bold text-slate-600">Upcoming Class</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500/20"></div>
                        <span className="text-sm font-bold text-slate-600">Attended / Past</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
