import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    BookOpen,
    Zap,
    Plus,
    AlertCircle,
    CheckCircle2,
    LayoutDashboard,
    PieChart,
    ChevronRight,
    X,
    MapPin,
    Search,
    Clock,
    User,
    Users,
    Building2,
    RotateCcw,
    Printer,
    FileSpreadsheet,
    FileText,
    Command,
    Database,
    Bell,
    Download,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
const FacultyDashboard = () => {
    const [activeTab, setActiveTab] = useState('faculty'); // faculty, section, room, free
    const [timetable, setTimetable] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null); // For day-wise filtering
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showAddClassModal, setShowAddClassModal] = useState(false);
    const [newClassData, setNewClassData] = useState({
        faculty: '',
        subject: '',
        batch: '',
        day: '',
        slot: '',
        room: ''
    });
    const [clashNotice, setClashNotice] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState({ name: 'RITIKA YADAV' });
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedBlock, setSelectedBlock] = useState('14');
    const [selectedSlotFreeRoom, setSelectedSlotFreeRoom] = useState('09:00-10:00');

    // Smart Features State
    const [secondaryBatch, setSecondaryBatch] = useState(null);
    const [secondaryTimetable, setSecondaryTimetable] = useState([]);
    const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
    const [suggestedSlots, setSuggestedSlots] = useState([]);

    const [resources, setResources] = useState({
        batches: [],
        subjects: [],
        classrooms: [],
        faculties: []
    });

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];

    useEffect(() => {
        fetchResources();
        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    // Auto-fetch when tab or entity changes
    useEffect(() => {
        if (activeTab === 'faculty' && selectedFaculty?._id) {
            fetchTimetable('facultyId', selectedFaculty._id);
        } else if (activeTab === 'section' && selectedBatch?._id) {
            fetchTimetable('batchId', selectedBatch._id);
        } else if (activeTab === 'room' && selectedRoom?._id) {
            fetchTimetable('classroomId', selectedRoom._id);
        } else if (activeTab === 'free') {
            // Free room logic might need a full fetch or different endpoint
            fetchTimetable('', '');
        }
    }, [activeTab, selectedFaculty?._id, selectedBatch?._id, selectedRoom?._id]);

    const fetchResources = async () => {
        try {
            const [b, s, c, f] = await Promise.all([
                api.get('/batches'),
                api.get('/subjects'),
                api.get('/classrooms'),
                api.get('/faculty')
            ]);

            setResources({
                batches: b.data,
                subjects: s.data,
                classrooms: c.data,
                faculties: f.data
            });

            // Initial auto-select and fetch for logged in user
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const profile = f.data.find(fac =>
                fac.email?.toLowerCase() === user.username?.toLowerCase() ||
                fac.name?.toLowerCase() === user.username?.toLowerCase()
            );

            if (profile) {
                setSelectedFaculty(profile);
            } else if (f.data.length > 0) {
                setSelectedFaculty(f.data[0]);
            }
        } catch (err) { console.error('Error fetching resources', err); }
    };

    const fetchTimetable = async (type, id) => {
        setLoading(true);
        try {
            const url = type ? `/timetable?${type}=${id}` : '/timetable';
            const res = await api.get(url);
            setTimetable(res.data);
            
            // If we're in section view and have a secondary batch, fetch it too
            if (activeTab === 'section' && secondaryBatch) {
                const secRes = await api.get(`/timetable?batchId=${secondaryBatch._id}`);
                setSecondaryTimetable(secRes.data);
            } else {
                setSecondaryTimetable([]);
            }
        } catch (err) { console.error('Error fetching timetable', err); }
        setLoading(false);
    };

    // Auto-fetch secondary timetable when it changes
    useEffect(() => {
        if (activeTab === 'section' && secondaryBatch) {
            const fetchSecondary = async () => {
                try {
                    const secRes = await api.get(`/timetable?batchId=${secondaryBatch._id}`);
                    setSecondaryTimetable(secRes.data);
                } catch (err) { console.error('Secondary timetable error', err); }
            };
            fetchSecondary();
        } else {
            setSecondaryTimetable([]);
        }
    }, [secondaryBatch, activeTab]);

    const handleAddClass = async () => {
        setClashNotice(null);
        const { faculty, subject, batch, day, slot, room } = newClassData;

        // Validation
        if (!faculty || !subject || !batch || !day || !slot || !room) {
            setClashNotice({ message: 'All fields are mandatory', status: 'error' });
            return;
        }

        try {
            // Fetch FULL timetable to check for global clashes
            const fullTimetableRes = await api.get('/timetable');
            const allEntries = fullTimetableRes.data;

            // 1. Faculty Clash
            const facultyClash = allEntries.find(t =>
                t.day === day && t.slot === slot && (t.faculty?._id === faculty || t.faculty === faculty)
            );
            if (facultyClash) {
                setClashNotice({
                    message: `FACULTY CLASH: ${resources.faculties.find(f => f._id === faculty)?.name} is already teaching ${facultyClash.subject?.name} in room ${facultyClash.classroom?.roomNumber}`,
                    status: 'clash'
                });
                return;
            }

            // 2. Room Clash
            const roomClash = allEntries.find(t =>
                t.day === day && t.slot === slot && (t.classroom?._id === room || t.classroom === room)
            );
            if (roomClash) {
                setClashNotice({
                    message: `ROOM CLASH: Room ${resources.classrooms.find(r => r._id === room)?.roomNumber} is occupied by ${roomClash.faculty?.name} (${roomClash.batch?.name})`,
                    status: 'clash'
                });
                return;
            }

            // 3. Batch Clash
            const batchClash = allEntries.find(t =>
                t.day === day && t.slot === slot && (t.batch?._id === batch || t.batch === batch)
            );
            if (batchClash) {
                setClashNotice({
                    message: `BATCH CLASH: Batch ${resources.batches.find(b => b._id === batch)?.name} already has a class: ${batchClash.subject?.name}`,
                    status: 'clash'
                });
                return;
            }

            // If no clashes, add class
            await api.post('/timetable', {
                faculty,
                subject,
                batch,
                day,
                slot,
                classroom: room
            });

            // Success
            setClashNotice({ message: 'Class added successfully without any conflicts!', status: 'success' });
            setTimeout(() => {
                setShowAddClassModal(false);
                setClashNotice(null);
                fetchResources(); // Refresh
                if (activeTab === 'faculty') fetchTimetable('facultyId', selectedFaculty._id);
                else if (activeTab === 'section') fetchTimetable('batchId', selectedBatch._id);
                else if (activeTab === 'room') fetchTimetable('classroomId', selectedRoom._id);
            }, 2000);

        } catch (err) {
            console.error('Error adding class:', err);
            setClashNotice({ message: err.response?.data?.message || 'Failed to add class', status: 'error' });
        }
    };

    const getEntryForSlot = (day, slot) => {
        return timetable.find(t => t.day === day && t.slot === slot);
    };

    const getSecondaryEntryForSlot = (day, slot) => {
        return secondaryTimetable.find(t => t.day === day && t.slot === slot);
    };

    const getFreeRoomsForSlot = (day, slot) => {
        const busyRoomIds = timetable.filter(t => t.day === day && t.slot === slot).map(t => t.classroom?._id || t.classroom);
        return resources.classrooms.filter(r => !busyRoomIds.includes(r._id) && (selectedBlock ? r.block === selectedBlock : true));
    };

    const getStatusInfo = (day, slot) => {
        if (!slot || typeof slot !== 'string') return { color: 'bg-slate-300', text: 'Unknown', animate: false };

        const now = new Date();
        const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];

        if (day !== currentDay) {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return days.indexOf(day) < days.indexOf(currentDay)
                ? { color: 'bg-rose-500', text: 'Past', animate: false }
                : { color: 'bg-amber-500', text: 'Upcoming', animate: false };
        }

        const [hours] = slot.split(':').map(Number);
        const currentHour = now.getHours();

        if (currentHour > hours) return { color: 'bg-rose-500', text: 'Past', animate: false };
        if (currentHour === hours) return { color: 'bg-emerald-500', text: 'Ongoing', animate: true };
        return { color: 'bg-amber-500', text: 'Upcoming', animate: false };
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadStatus(null);
        
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Fetch resources mapping
            const [batchRes, subjectRes, classroomRes, facultyRes] = await Promise.all([
                api.get('/batches'),
                api.get('/subjects'),
                api.get('/classrooms'),
                api.get('/faculty')
            ]);
            
            const batches = batchRes.data;
            const subjects = subjectRes.data;
            const classrooms = classroomRes.data;
            const faculties = facultyRes.data;

            const structuredData = [];
            const errors = [];
            const LUNCH_SLOTS = ['12:00-13:00', '13:00-14:00', '14:00-15:00'];
            
            // For break constraint checking (day -> entity -> slot mapped)
            const scheduleMap = {
                faculty: {},
                batch: {}
            };

            jsonData.forEach((row, index) => {
                const day = row.Day?.trim();
                const slot = row.Time?.trim();
                const facultyName = row.Faculty?.trim();
                const subjectName = row.Subject?.trim();
                const batchName = row.Batch?.trim();
                const defaultRoom = row['Default Room']?.toString().trim();

                if (!day || !slot || !facultyName || !subjectName || !batchName) return; // Skip empty rows

                const faculty = faculties.find(f => f.name.toLowerCase() === facultyName.toLowerCase());
                const subject = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
                const batch = batches.find(b => b.name.toLowerCase() === batchName.toLowerCase());
                const classroom = classrooms.find(c => c.roomNumber.toLowerCase() === defaultRoom?.toLowerCase());

                if (!faculty) errors.push(`Row ${index + 2}: Faculty '${facultyName}' not found`);
                if (!subject) errors.push(`Row ${index + 2}: Subject '${subjectName}' not found`);
                if (!batch) errors.push(`Row ${index + 2}: Batch '${batchName}' not found`);
                if (defaultRoom && !classroom) errors.push(`Row ${index + 2}: Classroom '${defaultRoom}' not found`);

                if (faculty && subject && batch) {
                    const entry = {
                        day,
                        slot,
                        faculty: faculty._id,
                        subject: subject._id,
                        batch: batch._id,
                        classroom: classroom?._id
                    };
                    
                    // Conflict Detection Setup
                    // Check if faculty, batch or room is already booked this day/slot
                    const conflictFaculty = structuredData.find(e => e.day === day && e.slot === slot && e.faculty === faculty._id);
                    if (conflictFaculty) errors.push(`Conflict in Row ${index + 2}: Faculty '${facultyName}' already has a class on ${day} ${slot}`);
                    
                    const conflictBatch = structuredData.find(e => e.day === day && e.slot === slot && e.batch === batch._id);
                    if (conflictBatch) errors.push(`Conflict in Row ${index + 2}: Batch '${batchName}' already has a class on ${day} ${slot}`);
                    
                    if (classroom) {
                        const conflictRoom = structuredData.find(e => e.day === day && e.slot === slot && e.classroom === classroom._id);
                        if (conflictRoom) errors.push(`Conflict in Row ${index + 2}: Room '${defaultRoom}' already booked on ${day} ${slot}`);
                    }

                    // Map for break constraint checking
                    if(!scheduleMap.faculty[faculty._id]) scheduleMap.faculty[faculty._id] = {};
                    if(!scheduleMap.faculty[faculty._id][day]) scheduleMap.faculty[faculty._id][day] = [];
                    scheduleMap.faculty[faculty._id][day].push(slot);

                    if(!scheduleMap.batch[batch._id]) scheduleMap.batch[batch._id] = {};
                    if(!scheduleMap.batch[batch._id][day]) scheduleMap.batch[batch._id][day] = [];
                    scheduleMap.batch[batch._id][day].push(slot);

                    structuredData.push(entry);
                }
            });

            // Validate Lunch Break Constraints Structure
            Object.keys(scheduleMap.faculty).forEach(facId => {
                Object.keys(scheduleMap.faculty[facId]).forEach(day => {
                    const bookedSlots = scheduleMap.faculty[facId][day];
                    // At least one of the lunch slots MUST NOT be booked
                    const hasLunchBreak = LUNCH_SLOTS.some(lunchSlot => !bookedSlots.includes(lunchSlot));
                    if (!hasLunchBreak) {
                        const facName = faculties.find(f => f._id === facId)?.name;
                        errors.push(`Break Constraint: Faculty '${facName}' does not have a lunch break on ${day} between 12-3 PM.`);
                    }
                });
            });

            Object.keys(scheduleMap.batch).forEach(batchId => {
                Object.keys(scheduleMap.batch[batchId]).forEach(day => {
                    const bookedSlots = scheduleMap.batch[batchId][day];
                    // At least one of the lunch slots MUST NOT be booked
                    const hasLunchBreak = LUNCH_SLOTS.some(lunchSlot => !bookedSlots.includes(lunchSlot));
                    if (!hasLunchBreak) {
                        const bName = batches.find(b => b._id === batchId)?.name;
                        errors.push(`Break Constraint: Batch '${bName}' does not have a lunch break on ${day} between 12-3 PM.`);
                    }
                });
            });

            if (errors.length > 0) {
                setUploadStatus({ status: 'error', message: 'Validation failed.', details: errors });
                setIsUploading(false);
                return;
            }

            // If everything is validated, send batch payload to server
            if (structuredData.length > 0) {
                 await api.post('/timetable/bulk', { timetable: structuredData });
                 setUploadStatus({ status: 'success', message: 'Timetable imported successfully!' });
                 fetchTimetable(); // Refresh globally
                 setTimeout(() => setShowUploadModal(false), 2000);
            } else {
                setUploadStatus({ status: 'error', message: 'No valid timetable entries found.' });
            }
        } catch (err) {
            console.error('File processing error:', err);
            setUploadStatus({ status: 'error', message: err.response?.data?.message || 'Failed to process file' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSearch = () => {
        if (!searchQuery && activeTab !== 'free') return;

        let found = null;
        if (activeTab === 'section') {
            found = resources.batches.find(b =>
                b.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (found) {
                setSelectedBatch(found);
                fetchTimetable('batchId', found._id);
            }
        } else if (activeTab === 'room') {
            found = resources.classrooms.find(r =>
                r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (found) {
                setSelectedRoom(found);
                fetchTimetable('classroomId', found._id);
            }
        }
    };

    const getTargetTimetable = () => {
        // The `timetable` state already contains the fetched data for the current view (faculty/section/room/free).
        // It is updated whenever activeTab or the selected entity (faculty, section, etc.) changes.
        return timetable;
    };

    const getExportName = () => {
        // Use the current header name which already handles tab logic (Faculty Name, Batch Name, Room Number)
        return getHeaderName();
    };

    const exportToExcel = () => {
        try {
            const targetData = getTargetTimetable();
            const data = targetData.map(entry => ({
                Day: entry.day,
                Slot: entry.slot,
                Subject: entry.subject?.name || 'N/A',
                Code: entry.subject?.code || 'N/A',
                Faculty: entry.faculty?.name || 'N/A',
                Room: entry.classroom?.roomNumber || 'N/A',
                Batch: entry.batch?.name || 'N/A'
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Timetable");

            // Keep filename generation safe
            const rawName = getExportName() || 'Timetable';
            const safeName = rawName.replace(/[^a-zA-Z0-9\s-]/g, '_').trim();
            const fileName = `${safeName}_Schedule.xlsx`;

            // Reverting to official library method which uses safer internal fallbacks
            XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error('Excel Export Error:', err);
            setClashNotice({ message: 'Failed to export Excel. Please check console.', status: 'error' });
        }
    };

    // Smart Features Logic
    const getBatchAnalytics = () => {
        if (activeTab !== 'section' || !selectedBatch) return null;

        const totalHours = timetable.length;
        
        // Find busiest day
        const dayCounts = {};
        timetable.forEach(t => {
            dayCounts[t.day] = (dayCounts[t.day] || 0) + 1;
        });
        
        let busiestDay = 'N/A';
        let maxLoad = 0;
        Object.entries(dayCounts).forEach(([day, count]) => {
            if (count > maxLoad) {
                maxLoad = count;
                busiestDay = day;
            }
        });

        // Cognitive Load Warning (High consecutive classes)
        const loadWarning = maxLoad >= 5 ? `High Load Warning: ${busiestDay} has ${maxLoad} classes` : 'Schedule Load: Optimal';

        return { totalHours, busiestDay, maxLoad, loadWarning };
    };

    const generateSmartSuggestions = () => {
        if (!selectedBatch) return;
        
        // Find slots where the specific batch is free, AND there is at least one free room
        const recommendations = [];
        
        // Exclude Saturday for standard recommendations unless necessary
        const searchDays = DAYS.filter(d => d !== 'Saturday');
        
        for (const day of searchDays) {
            for (const slot of SLOTS) {
                // Is this batch already busy?
                const isBatchBusy = timetable.some(t => t.day === day && t.slot === slot);
                
                if (!isBatchBusy) {
                    // Are there any free rooms in the system?
                    // Note: This requires full timetable fetch, so we might make an API call or use existing full data
                    // For now, we simulate finding the 'first available room'
                    recommendations.push({
                        day,
                        slot,
                        room: 'Auto-Assign', 
                        confidence: 'High' // Or calculate based on room sparsity
                    });
                }
                if (recommendations.length >= 3) break;
            }
            if (recommendations.length >= 3) break;
        }
        
        setSuggestedSlots(recommendations);
        setShowSuggestionsModal(true);
    };

    const exportToPDF = () => {
        try {
            const targetData = getTargetTimetable();
            const doc = new jsPDF();
            const tableColumn = ["Day", "Slot", "Subject", "Faculty", "Room", "Batch"];
            const tableRows = targetData.map(entry => [
                entry.day,
                entry.slot,
                entry.subject?.name || 'N/A',
                entry.faculty?.name || 'N/A',
                entry.classroom?.roomNumber || 'N/A',
                entry.batch?.name || 'N/A'
            ]);

            const rawName = String(getExportName() || 'Timetable');
            const safeName = rawName.replace(/[^a-zA-Z0-9\s-]/g, '_').trim();

            doc.text(`Timetable: ${rawName}`, 14, 15);
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                theme: 'grid',
                headStyles: { fillStyle: 'F1F5F9', textColor: '0F172A', fontStyle: 'bold' }
            });

            // Ensure literal string with .pdf extension
            const finalFileName = `${safeName}_Schedule.pdf`;

            // Use jsPDF's built in save method which handles IE/Edge fallbacks and base64 internally
            doc.save(finalFileName);
        } catch (err) {
            console.error('PDF Export Error:', err);
            setClashNotice({ message: 'Failed to generate PDF. Please check console.', status: 'error' });
        }
    };

    const getHeaderName = () => {
        if (activeTab === 'faculty') return selectedFaculty?.name || 'SELECT FACULTY';
        if (activeTab === 'section') return selectedBatch?.name || 'SELECT BATCH';
        if (activeTab === 'room') return selectedRoom?.roomNumber ? `ROOM ${selectedRoom.roomNumber}` : 'SELECT ROOM';
        return `BUILDING ${selectedBlock} AVAILABILITY`;
    };

    const uniqueBlocks = [...new Set(resources.classrooms.map(c => c.block).filter(Boolean))].sort();

    return (
        <div className="p-6 w-full space-y-6 min-w-0 bg-bg-main dark:bg-[#020617] text-text-main transition-colors duration-300">
            {/* Header & Main Actions */}
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight mb-1">SCHEDULE OVERVIEW</h1>
                    <div className="flex items-center gap-4 text-[var(--text-muted)]">
                        <div className="flex items-center gap-2 bg-bg-card px-3 py-1.5 rounded-lg border border-[var(--border-main)] shadow-sm">
                            <Clock size={14} className="text-[var(--brand-primary)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{currentTime.toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-bg-card px-3 py-1.5 rounded-lg border border-[var(--border-main)] shadow-sm">
                            <Users size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{resources.faculties.length} ACTIVE FACULTY</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-4 bg-bg-card text-text-muted rounded-2xl border border-border-main shadow-sm hover:bg-brand-500/10 transition-all relative group"
                        >
                            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                            <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 border-2 border-[var(--bg-card)] rounded-full animate-bounce"></div>
                        </button>
                        {showNotifications && (
                            <div className="absolute right-0 mt-4 w-96 bg-[#0F172A] rounded-[32px] shadow-2xl p-6 z-[100] border border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-white font-black text-sm uppercase tracking-widest">Upcoming Classes</h4>
                                    <span className="px-3 py-1 bg-bg-card/10 text-[#3B82F6] text-[10px] font-black rounded-lg">LIVE SYNC</span>
                                </div>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
                                    {timetable.filter(t => getStatusInfo(t.day, t.slot).text === 'Upcoming').slice(0, 3).map((notif, idx) => (
                                        <div key={idx} className="p-4 bg-bg-card/5 rounded-2xl border border-white/5 hover:bg-bg-card/10 transition-all group">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">{notif.day}</span>
                                                <span className="text-[10px] font-black text-slate-500 uppercase">{notif.slot}</span>
                                            </div>
                                            <h5 className="text-white text-sm font-bold mb-1 line-clamp-1">{notif.subject?.name}</h5>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Room {notif.classroom?.roomNumber}</span>
                                                <span className="text-[10px] font-bold text-[#3B82F6]">{notif.batch?.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {timetable.filter(t => getStatusInfo(t.day, t.slot).text === 'Upcoming').length === 0 && (
                                        <div className="py-10 text-center opacity-30 italic text-white text-xs uppercase tracking-widest font-black">No upcoming classes</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => fetchResources()}
                        className="p-4 bg-bg-card text-text-muted rounded-2xl border border-border-main shadow-sm hover:bg-brand-500/10 transition-all group"
                    >
                        <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                    <button
                        onClick={() => setShowAddClassModal(true)}
                        className="flex items-center gap-3 px-6 py-4 bg-[#3B82F6] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
                    >
                        <Plus size={18} /> ADD CLASS
                    </button>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                    >
                        <Plus size={18} /> UPLOAD DATA
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-3 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                    >
                        <FileSpreadsheet size={18} /> EXPORT EXCEL
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-3 px-6 py-4 bg-rose-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
                    >
                        <FileText size={18} /> GET PDF
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Total Lectures', value: timetable.filter(t => selectedDay ? t.day === selectedDay : true).length, icon: BookOpen, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-500/10', trend: '+12%' },
                    { label: 'Ongoing', value: timetable.filter(t => (selectedDay ? t.day === selectedDay : true) && getStatusInfo(t.day, t.slot).text === 'Ongoing').length, icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', trend: 'Live' },
                    { label: 'Weekly Hours', value: timetable.filter(t => selectedDay ? t.day === selectedDay : true).length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', trend: '100%' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="pro-card group relative overflow-hidden"
                    >
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-500/5 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl shadow-sm group-hover:rotate-12 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <h4 className="text-3xl font-black text-[var(--text-main)] mb-1 relative z-10">{stat.value}</h4>
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] relative z-10">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Smart Analytics Ribbon (Only shown for Sections) */}
            {activeTab === 'section' && selectedBatch && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="flex flex-wrap gap-4 items-center bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-500/20"
                >
                    <div className="flex items-center gap-3 pr-6 border-r border-indigo-200 dark:border-indigo-800">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <PieChart size={18} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Smart Batch Analytics</p>
                            <h5 className="text-sm font-black text-indigo-700 dark:text-indigo-300">{selectedBatch.name} Profile</h5>
                        </div>
                    </div>
                    
                    {(() => {
                        const stats = getBatchAnalytics();
                        return (
                            <>
                                <div className="flex flex-col px-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Weekly Academic Hours</span>
                                    <span className="text-lg font-black text-slate-800 dark:text-slate-200">{stats.totalHours} <span className="text-[10px]">HRS</span></span>
                                </div>
                                <div className="flex flex-col px-4 border-l border-indigo-200 dark:border-indigo-800">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Heaviest Load Day</span>
                                    <span className="text-lg font-black text-slate-800 dark:text-slate-200">{stats.busiestDay.slice(0,3)} <span className="text-[10px]">({stats.maxLoad} CLASSES)</span></span>
                                </div>
                                <div className="flex flex-col px-4 border-l border-indigo-200 dark:border-indigo-800 flex-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">Cognitive Load Status</span>
                                    {stats.maxLoad >= 5 ? (
                                        <div className="inline-flex max-w-fit items-center gap-1.5 px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-rose-200">
                                            <AlertCircle size={10} /> {stats.loadWarning}
                                        </div>
                                    ) : (
                                        <div className="inline-flex max-w-fit items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                                            <CheckCircle2 size={10} /> {stats.loadWarning}
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </motion.div>
            )}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center p-2 bg-bg-card rounded-[28px] w-fit border border-[var(--border-main)]">
                    {[
                        { id: 'faculty', label: 'Faculty View', icon: User },
                        { id: 'section', label: 'Section-wise', icon: Users },
                        { id: 'room', label: 'Room-wise', icon: MapPin },
                        { id: 'free', label: 'Free Room', icon: Database }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSearchQuery('');
                                setSelectedDay(null);
                                setSearchDate('');
                            }}
                            className={`flex items-center gap-3 px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-[var(--brand-primary)] text-white shadow-lg scale-[1.02]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center p-2 bg-bg-card rounded-[28px] w-fit border border-[var(--border-main)]">
                    {DAYS.filter(d => d !== 'Saturday').map(day => (
                        <button
                            key={day}
                            onClick={() => {
                                setSelectedDay(selectedDay === day ? null : day);
                                if (selectedDay === day) setSearchDate('');
                            }}
                            className={`px-6 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all ${selectedDay === day
                                ? 'bg-[#3B82F6] text-white shadow-lg'
                                : 'text-text-muted hover:text-slate-600 hover:bg-bg-card/50'
                                }`}
                        >
                            {day.slice(0, 3)}
                        </button>
                    ))}
                    <button
                        onClick={() => {
                            setSelectedDay(null);
                            setSearchDate('');
                        }}
                        className={`px-6 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all ${!selectedDay
                            ? 'bg-slate-900 text-white shadow-lg'
                            : 'text-text-muted hover:text-slate-600'
                            }`}
                    >
                        ALL
                    </button>
                </div>
            </div>

            <div className="bg-bg-card rounded-[32px] border border-[var(--border-main)] shadow-sm p-6 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-10">
                    {activeTab === 'free' ? (
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 ml-2">Building ::</label>
                                <select
                                    value={selectedBlock}
                                    onChange={(e) => setSelectedBlock(e.target.value)}
                                    className="w-40 p-3 bg-bg-main border border-border-main rounded-2xl text-xs font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all cursor-pointer"
                                >
                                    {uniqueBlocks.map(block => (
                                        <option key={block} value={block}>{block}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 ml-2">Time ::</label>
                                <select
                                    value={selectedSlotFreeRoom}
                                    onChange={(e) => setSelectedSlotFreeRoom(e.target.value)}
                                    className="w-48 p-3 bg-bg-main border border-border-main rounded-2xl text-xs font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all cursor-pointer"
                                >
                                    {SLOTS.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                             {/* Space maintained for UI alignment */}
                        </div>
                    )}
                    <div className="h-12 w-px bg-[var(--border-main)] mx-2"></div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">SCHEDULE FOR</span>
                        <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight">{getHeaderName()}</h3>
                    </div>
                </div>

                <div className="flex-1 flex items-center gap-4 max-w-2xl ml-auto">
                    <div className="flex items-center gap-4 px-6 py-4 bg-bg-main rounded-[24px] border border-border-main">
                        <Calendar size={18} className="text-[#3B82F6]" />
                        <input
                            type="date"
                            value={searchDate}
                            onChange={(e) => {
                                setSearchDate(e.target.value);
                                if (e.target.value) {
                                    const [y, m, d] = e.target.value.split('-');
                                    const date = new Date(y, m - 1, d);
                                    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
                                    if (DAYS.includes(dayName)) setSelectedDay(dayName);
                                } else {
                                    setSelectedDay(null);
                                }
                            }}
                            className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-slate-600 cursor-pointer"
                        />
                    </div>
                    {activeTab === 'faculty' ? (
                        <div className="flex-1 relative">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                            <select
                                value={selectedFaculty?._id || ''}
                                onChange={(e) => {
                                    const found = resources.faculties.find(f => f._id === e.target.value);
                                    if (found) {
                                        setSelectedFaculty(found);
                                        fetchTimetable('facultyId', found._id);
                                    }
                                }}
                                className="w-full pl-14 pr-6 py-4.5 bg-[var(--bg-main)] border-none rounded-[24px] text-sm font-bold text-[var(--text-main)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 outline-none cursor-pointer appearance-none"
                            >
                                <option value="" disabled>Select a Faculty Member</option>
                                {resources.faculties.map(f => (
                                    <option key={f._id} value={f._id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder={activeTab === 'free' ? 'Search rooms...' : 'Search here...'}
                                    className="w-full pl-14 pr-6 py-4.5 bg-[var(--bg-main)] border-none rounded-[24px] text-sm font-bold text-[var(--text-main)] focus:ring-2 focus:ring-[var(--brand-primary)]/10 outline-none"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="px-10 py-4.5 bg-[#3B82F6] text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all"
                            >
                                SEARCH
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-10 px-6">
                <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">STATUS LEGEND:</span>
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#F43F5E]"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase">PAST</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#10B981] animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase">ONGOING</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase">UPCOMING</span>
                    </div>
                </div>
            </div>

            {/* Table: Fully utilizing width */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card rounded-[32px] shadow-2xl overflow-hidden border border-[var(--border-main)] pro-card !p-0"
            >
                <div className="overflow-x-auto">
                    {activeTab === 'free' ? (
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-bg-main border-b border-[var(--border-main)] whitespace-nowrap">
                                    <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#3B82F6]">RoomNo</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#3B82F6]">Capacity</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#3B82F6]">RoomType</th>
                                    {DAYS.filter(d => (selectedDay ? d === selectedDay : d !== 'Saturday')).map(day => (
                                        <th key={day} className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#3B82F6]">{day.slice(0, 3)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-bg-card divide-y divide-slate-100 dark:divide-white/5">
                                {resources.classrooms.filter(r => r.block === selectedBlock && (searchQuery ? r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) : true)).map(room => (
                                    <tr key={room._id} className="hover:bg-bg-main/50 transition-colors">
                                        <td className="p-4 text-xs font-bold text-text-main">{room.roomNumber}</td>
                                        <td className="p-4 text-xs font-bold text-text-muted">{room.capacity}</td>
                                        <td className="p-4 text-xs font-bold text-text-muted">{room.type}</td>
                                        {DAYS.filter(d => (selectedDay ? d === selectedDay : d !== 'Saturday')).map(day => {
                                            // Check if specific room is busy on this DAY at the globally selected selectedSlotFreeRoom
                                            const isBusy = timetable.some(t => t.day === day && t.slot === selectedSlotFreeRoom && (t.classroom?._id === room._id || t.classroom === room._id));
                                            return (
                                                <td key={`${room._id}-${day}`} className="p-4 text-[10px] font-black uppercase tracking-widest text-center min-w-[100px]">
                                                    {isBusy ? (
                                                        <span className="text-rose-500">Occupied</span>
                                                    ) : (
                                                        <span className="text-emerald-500">Free</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                {resources.classrooms.filter(r => r.block === selectedBlock && (searchQuery ? r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) : true)).length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-text-muted text-xs font-bold uppercase tracking-widest">
                                            No rooms found in Building {selectedBlock}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-900 border-b border-white/10">
                                    <th className="p-4 text-[9px] font-black uppercase tracking-[0.2em] text-white text-center w-24 border-r border-white/5 opacity-80">Matrix</th>
                                    {DAYS.filter(d => (selectedDay ? d === selectedDay : d !== 'Saturday')).map(day => (
                                        <th key={day} className="p-4 text-[9px] font-black uppercase tracking-[0.2em] text-white text-center border-r border-white/5 opacity-80 last:border-r-0">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-bg-card divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={selectedDay ? 2 : 6} className="h-96 text-center">
                                            <div className="flex flex-col items-center justify-center gap-6">
                                                <div className="w-16 h-16 border-8 border-brand-50 border-t-brand-500 rounded-full animate-spin"></div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-black text-text-main uppercase tracking-widest">Syncing Matrix...</span>
                                                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest animate-pulse">Accessing Core Databases</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (timetable.length === 0) ? (
                                    <tr>
                                        <td colSpan={selectedDay ? 2 : 6} className="h-96 text-center">
                                            <div className="flex flex-col items-center justify-center gap-8">
                                                <div className="w-32 h-32 bg-bg-main rounded-full flex items-center justify-center text-slate-200">
                                                    <AlertCircle size={80} />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-xl font-black text-slate-300 uppercase tracking-tight">No Data Stream Found</span>
                                                    <p className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Adjust parameters or run generation engine</p>
                                                </div>
                                                <button
                                                    onClick={() => fetchResources()}
                                                    className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/20"
                                                >
                                                    RETRY CONNECTION
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    SLOTS.map(slot => (
                                        <tr key={slot} className={`group hover:bg-bg-main/50 transition-colors ${selectedDay ? 'opacity-40 hover:opacity-100 transition-opacity' : ''}`}>
                                            <td className="p-4 text-[9px] font-black text-text-muted text-center bg-bg-main/30 border-r border-border-main">{slot}</td>
                                            {DAYS.filter(d => (selectedDay ? d === selectedDay : d !== 'Saturday')).map(day => {
                                                const entry = getEntryForSlot(day, slot);
                                                const secondaryEntry = activeTab === 'section' && secondaryBatch ? getSecondaryEntryForSlot(day, slot) : null;
                                                const status = getStatusInfo(day, slot);
                                                
                                                // Matrix Merge Logic
                                                const isMutualFree = activeTab === 'section' && secondaryBatch && !entry && !secondaryEntry;

                                                return (
                                                    <td key={`${day}-${slot}`} className={`p-2 min-w-[180px] max-w-[240px] ${selectedDay === day ? 'opacity-100 z-10' : ''}`}>
                                                        {entry ? (
                                                        <motion.div
                                                            whileHover={{ scale: 1.02 }}
                                                            className="relative h-32 p-4 bg-bg-card rounded-2xl border border-[var(--border-main)] shadow-sm group-hover:shadow-2xl transition-all duration-500 overflow-hidden"
                                                        >
                                                            <div className={`absolute top-0 left-0 right-0 h-2 ${status.color} ${status.animate ? 'animate-pulse' : ''}`}></div>

                                                            <div className="flex flex-col h-full justify-between relative z-10">
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black rounded-md tracking-widest uppercase">
                                                                            {entry.subject?.code || 'SUB'}
                                                                        </span>
                                                                        <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest ${status.animate ? 'text-emerald-500' : 'text-text-muted'}`}>
                                                                            <Clock size={10} className={status.animate ? 'animate-spin-slow' : ''} />
                                                                            {status.text}
                                                                        </div>
                                                                    </div>
                                                                    <h4 className="text-sm font-black text-text-main leading-tight mb-1 line-clamp-1">{entry.subject?.name}</h4>
                                                                    <div className="flex items-center text-text-muted text-[9px] font-black uppercase tracking-widest">
                                                                        <User size={12} className="mr-1.5" />
                                                                        {entry.faculty?.name}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-white/5">
                                                                    <div className="flex items-center text-brand-500 text-[9px] font-black tracking-widest">
                                                                        <MapPin size={12} className="mr-1.5" />
                                                                        RM {entry.classroom?.roomNumber}
                                                                    </div>
                                                                    <div className="flex items-center text-text-muted text-[9px] font-black tracking-widest">
                                                                        <Users size={12} className="mr-1.5" />
                                                                        {entry.batch?.name}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-bg-main rounded-full opacity-30 group-hover:scale-150 transition-all duration-700"></div>
                                                        </motion.div>
                                                    ) : secondaryEntry ? (
                                                        <motion.div
                                                            whileHover={{ scale: 1.02 }}
                                                            className="relative h-32 p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm transition-all duration-500 overflow-hidden"
                                                        >
                                                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-300"></div>
                                                            <div className="flex flex-col h-full justify-between relative z-10 opacity-70">
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-black rounded-md tracking-widest uppercase">{secondaryEntry.subject?.code}</span>
                                                                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Secondary</span>
                                                                    </div>
                                                                    <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 leading-tight mb-1 line-clamp-1">{secondaryEntry.subject?.name}</h4>
                                                                </div>
                                                                <div className="flex items-center text-indigo-500 text-[9px] font-black tracking-widest pt-2 border-t border-indigo-100 dark:border-indigo-800">
                                                                    <Users size={12} className="mr-1.5" />
                                                                    {secondaryEntry.batch?.name} Busy
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ) : isMutualFree ? (
                                                        <div className="h-32 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 dark:border-emerald-500 rounded-2xl flex flex-col items-center justify-center group-hover:bg-emerald-100 group-hover:shadow-xl transition-all duration-300">
                                                            <CheckCircle2 size={24} className="text-emerald-500 mb-2" />
                                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center px-4">Both Batches<br/>Free Slot</span>
                                                        </div>
                                                    ) : (
                                                        <div className="h-44 border border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] flex items-center justify-center group-hover:bg-bg-card group-hover:border-solid group-hover:border-[var(--brand-primary)] group-hover:shadow-xl transition-all duration-300 opacity-50">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interval</span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    )}
                </div>
            </motion.div>

            {/* Upload Modal */}
            {
                showUploadModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowUploadModal(false)}></div>
                        <div className="relative w-full max-w-2xl bg-bg-card rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-12">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-3xl font-black text-text-main tracking-tight mb-2">UPLOAD ENGINE</h3>
                                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Bulk Import Timetable & Resources</p>
                                    </div>
                                    <button onClick={() => setShowUploadModal(false)} className="p-4 bg-bg-main text-text-muted rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-12">
                                    <div className="relative p-10 border-2 border-dashed border-border-main rounded-[40px] flex flex-col items-center justify-center text-center group hover:border-[#3B82F6] hover:bg-blue-50/30 transition-all cursor-pointer overflow-hidden">
                                        <input 
                                            type="file" 
                                            accept=".xlsx, .xls, .csv" 
                                            onChange={handleFileUpload} 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            disabled={isUploading} 
                                        />
                                        <div className="w-20 h-20 bg-blue-50 text-[#3B82F6] rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            {isUploading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div> : <FileSpreadsheet size={40} />}
                                        </div>
                                        <h5 className="text-sm font-black text-text-main uppercase mb-2">
                                            {isUploading ? 'Processing File...' : 'Drop Excel Here'}
                                        </h5>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Support .xlsx, .csv</p>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <div className="p-8 bg-bg-main rounded-[32px] border border-border-main">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-bg-card text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm">
                                                    <Download size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="text-[13px] font-black text-text-main uppercase">Input Template</h5>
                                                    <p className="text-[10px] font-bold text-text-muted">V2.4 LATEST BUILD</p>
                                                </div>
                                            </div>
                                            <a href="/SmartClass_Final_Scaled (1).xlsx" download className="w-full py-4 block text-center bg-bg-card text-text-main border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm">
                                                DOWNLOAD CURRENT DATA
                                            </a>
                                        </div>
                                        <div className="p-6 bg-amber-50 rounded-[28px] border border-amber-100 flex items-start gap-4">
                                            <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                            <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">File will be validated for lunch break constraints & overlaps before syncing.</p>
                                        </div>
                                    </div>
                                </div>

                                {uploadStatus && (
                                    <div className={`mb-8 p-6 rounded-[28px] border flex items-start gap-4 animate-in slide-in-from-top-4 ${uploadStatus.status === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                        {uploadStatus.status === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                                        <div className="flex-1 max-h-40 overflow-y-auto">
                                            <h5 className="text-sm font-black uppercase mb-1">{uploadStatus.message}</h5>
                                            {uploadStatus.details && uploadStatus.details.map((detail, idx) => (
                                                <p key={idx} className="text-[10px] font-bold mt-1 text-rose-600 block">{detail}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Class Modal */}
            {
                showAddClassModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { setShowAddClassModal(false); setClashNotice(null); }}></div>
                        <div className="relative w-full max-w-4xl bg-bg-card rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-12">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-3xl font-black text-text-main tracking-tight mb-2">MANUAL ENTRY</h3>
                                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Add Single Class with Auto-Clash Detection</p>
                                    </div>
                                    <button onClick={() => { setShowAddClassModal(false); setClashNotice(null); }} className="p-4 bg-bg-main text-text-muted rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                                        <X size={24} />
                                    </button>
                                </div>

                                {clashNotice && (
                                    <div className={`mb-8 p-6 rounded-[28px] border flex items-start gap-4 animate-in slide-in-from-top-4 duration-300 ${clashNotice.status === 'clash' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                        clashNotice.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                            clashNotice.status === 'error' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                                'bg-bg-main border-border-main text-slate-700'
                                        }`}>
                                        {clashNotice.status === 'clash' ? <AlertCircle size={24} /> :
                                            clashNotice.status === 'success' ? <CheckCircle2 size={24} /> :
                                                <AlertCircle size={24} />}
                                        <div>
                                            <h5 className="text-sm font-black uppercase mb-1">
                                                {clashNotice.status === 'clash' ? 'Conflict Detected' :
                                                    clashNotice.status === 'success' ? 'Operation Success' : 'Attention Required'}
                                            </h5>
                                            <p className="text-xs font-bold uppercase tracking-tight leading-relaxed">{clashNotice.message}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">Faculty Member</label>
                                        <select
                                            value={newClassData.faculty}
                                            onChange={(e) => setNewClassData({ ...newClassData, faculty: e.target.value })}
                                            className="w-full p-4 bg-bg-main border border-border-main rounded-2xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                                        >
                                            <option value="">Select Faculty</option>
                                            {resources.faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">Subject</label>
                                        <select
                                            value={newClassData.subject}
                                            onChange={(e) => setNewClassData({ ...newClassData, subject: e.target.value })}
                                            className="w-full p-4 bg-bg-main border border-border-main rounded-2xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                                        >
                                            <option value="">Select Subject</option>
                                            {resources.subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">Batch / Section</label>
                                        <select
                                            value={newClassData.batch}
                                            onChange={(e) => setNewClassData({ ...newClassData, batch: e.target.value })}
                                            className="w-full p-4 bg-bg-main border border-border-main rounded-2xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                                        >
                                            <option value="">Select Batch</option>
                                            {resources.batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">Day of Week</label>
                                        <select
                                            value={newClassData.day}
                                            onChange={(e) => setNewClassData({ ...newClassData, day: e.target.value })}
                                            className="w-full p-4 bg-bg-main border border-border-main rounded-2xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                                        >
                                            <option value="">Select Day</option>
                                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">Time Slot</label>
                                        <select
                                            value={newClassData.slot}
                                            onChange={(e) => setNewClassData({ ...newClassData, slot: e.target.value })}
                                            className="w-full p-4 bg-bg-main border border-border-main rounded-2xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                                        >
                                            <option value="">Select Slot</option>
                                            {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4">Classroom</label>
                                        <select
                                            value={newClassData.room}
                                            onChange={(e) => setNewClassData({ ...newClassData, room: e.target.value })}
                                            className="w-full p-4 bg-bg-main border border-border-main rounded-2xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                                        >
                                            <option value="">Select Room</option>
                                            {resources.classrooms.map(r => <option key={r._id} value={r._id}>{r.roomNumber} ({r.type})</option>)}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddClass}
                                    className="w-full py-6 bg-[#3B82F6] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-4"
                                >
                                    <CheckCircle2 size={20} /> VERIFY & ADD TO SCHEDULE
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Smart Auto-Suggest Modal */}
            {
                showSuggestionsModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowSuggestionsModal(false)}></div>
                        <div className="relative w-full max-w-xl bg-bg-card rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-indigo-100 dark:border-indigo-500/20">
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                                <Zap size={20} className="animate-pulse" />
                                            </div>
                                            <h3 className="text-2xl font-black text-indigo-900 dark:text-indigo-100 tracking-tight">AI SUGGESTIONS</h3>
                                        </div>
                                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] ml-2">Optimal extra class slots for {selectedBatch?.name}</p>
                                    </div>
                                    <button onClick={() => setShowSuggestionsModal(false)} className="p-4 bg-bg-main text-text-muted rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-4 mb-4">
                                    {suggestedSlots.length === 0 ? (
                                        <div className="p-8 text-center text-text-muted text-sm font-bold bg-bg-main rounded-[24px]">
                                            No optimal free slots could be calculated at this time.
                                        </div>
                                    ) : (
                                        suggestedSlots.map((suggestion, idx) => (
                                            <div key={idx} className="group relative overflow-hidden p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/10 dark:to-bg-main border border-indigo-100 dark:border-indigo-800/50 rounded-[32px] hover:shadow-xl hover:border-indigo-300 transition-all">
                                                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-white dark:bg-bg-card rounded-[20px] shadow-sm border border-slate-100 dark:border-white/5">
                                                            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{suggestion.day.slice(0,3)}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={14} className="text-slate-400" />
                                                                <span className="text-sm font-black text-slate-700 dark:text-slate-300">{suggestion.slot}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <MapPin size={12} className="text-indigo-400" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Available Room: {suggestion.room}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            setNewClassData(prev => ({ ...prev, day: suggestion.day, slot: suggestion.slot, batch: selectedBatch._id, room: '' }));
                                                            setShowSuggestionsModal(false);
                                                            setShowAddClassModal(true);
                                                        }}
                                                        className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95 flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                                                    >
                                                        BOOK THIS <ArrowRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mt-6">
                                    Calculations based on mutual availability algorithms
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default FacultyDashboard;
