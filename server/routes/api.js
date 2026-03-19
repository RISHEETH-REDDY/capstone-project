const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Classroom = require('../models/Classroom');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Batch = require('../models/Batch');
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const { generateSchedule } = require('../utils/scheduler');
const bcrypt = require('bcryptjs'); // Assuming bcryptjs is preferred for passwords, but checking existing first


// --- Resources CRUD ---

// Classrooms
router.post('/classrooms', async (req, res) => {
    try {
        const newClassroom = new Classroom(req.body);
        await newClassroom.save();
        res.status(201).json(newClassroom);
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.get('/classrooms', async (req, res) => {
    const classrooms = await Classroom.find();
    res.json(classrooms);
});

// Get available classrooms for a specific day and slot
router.get('/classrooms/available', async (req, res) => {
    try {
        const { day, slot } = req.query;
        if (!day || !slot) return res.status(400).json({ error: 'Day and slot are required' });

        // Find all busy rooms in this slot
        const busyEntries = await Timetable.find({ day, slot }).select('classroom');
        const busyRoomIds = busyEntries.map(e => e.classroom);

        // Find rooms NOT in the busy list
        const availableRooms = await Classroom.find({ _id: { $nin: busyRoomIds } });
        res.json(availableRooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Faculty
router.post('/faculty', async (req, res) => {
    try {
        const newFaculty = new Faculty(req.body);
        await newFaculty.save();
        res.status(201).json(newFaculty);
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.get('/faculty', async (req, res) => {
    const faculty = await Faculty.find();
    res.json(faculty);
});

// Faculty Stats (Work Burden)
router.get('/faculty/stats/:id', async (req, res) => {
    try {
        const faculty = await Faculty.findById(req.params.id);
        if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

        const sessions = await Timetable.find({ faculty: req.params.id });
        const currentLoad = sessions.length; // Assuming each session is 1 hour

        res.json({
            name: faculty.name,
            currentLoad,
            maxLoad: faculty.maxLoad,
            percentage: Math.min(100, (currentLoad / faculty.maxLoad) * 100).toFixed(1)
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Subjects
router.post('/subjects', async (req, res) => {
    try {
        const newSubject = new Subject(req.body);
        await newSubject.save();
        res.status(201).json(newSubject);
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.get('/subjects', async (req, res) => {
    const subjects = await Subject.find();
    res.json(subjects);
});

// Batches
router.post('/batches', async (req, res) => {
    try {
        const newBatch = new Batch(req.body);
        await newBatch.save();
        res.status(201).json(newBatch);
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.get('/batches', async (req, res) => {
    const batches = await Batch.find();
    res.json(batches);
});

// Users Profile Lookup
router.get('/users/profile/:identifier', async (req, res) => {
    try {
        const id = req.params.identifier;
        const user = await User.findOne({ 
            $or: [
                { username: id },
                { email: id },
                { rollNumber: id }
            ]
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Authentication ---

router.post('/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user by username or email
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if the selected role matches the database role
        if (role && user.role !== role) {
            return res.status(401).json({ 
                error: `Access Denied: Your account does not have ${role} privileges for this portal.` 
            });
        }

        // In a real app, we would use bcrypt.compare(password, user.password)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            token: 'mock-jwt-token',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                name: user.name || user.username
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Timetable Management ---

// Get full timetable (with population)
router.get('/timetable', async (req, res) => {
    try {
        const query = {};
        if (req.query.batchId) query.batch = req.query.batchId;
        if (req.query.facultyId) query.faculty = req.query.facultyId;
        if (req.query.classroomId) query.classroom = req.query.classroomId;

        const schedule = await Timetable.find(query)
            .populate('batch')
            .populate('subject')
            .populate('faculty')
            .populate('classroom');
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clash Detection Logic
router.post('/timetable/clash-check', async (req, res) => {
    try {
        const { day, slot, facultyId, classroomId, batchId } = req.body;

        // 1. Check Faculty availability
        const facultyBusy = await Timetable.findOne({ day, slot, faculty: facultyId });
        if (facultyBusy) return res.json({ clash: true, message: 'Faculty is already assigned to another class in this slot.' });

        // 2. Check Classroom availability
        const classroomBusy = await Timetable.findOne({ day, slot, classroom: classroomId });
        if (classroomBusy) return res.json({ clash: true, message: 'Classroom is already occupied in this slot.' });

        // 3. Check Batch availability
        const batchBusy = await Timetable.findOne({ day, slot, batch: batchId });
        if (batchBusy) return res.json({ clash: true, message: 'Batch already has a scheduled class in this slot.' });

        res.json({ clash: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Manual Insertion
router.post('/timetable/insert', async (req, res) => {
    try {
        const newEntry = new Timetable(req.body);
        await newEntry.save();
        res.status(201).json(newEntry);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Bulk Insert (Wipes old data and inserts new timetable array)
router.post('/timetable/bulk', async (req, res) => {
    try {
        const { timetable } = req.body;
        if (!timetable || !Array.isArray(timetable)) {
            return res.status(400).json({ error: 'Valid timetable array is required' });
        }
        
        // Remove old timetable data
        await Timetable.deleteMany({});
        
        // Insert new records
        const newEntries = await Timetable.insertMany(timetable);
        res.status(201).json({ message: 'Timetable uploaded and synced successfully', count: newEntries.length });
    } catch (err) {
        console.error('Bulk insert error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Generate Timetable
router.post('/generate', async (req, res) => {
    // ... (rest of the generate logic remains same)
    try {
        const { batches } = req.body; // Expecting list of batches with sizes, IDs
        // Fetch all resources
        const classrooms = await Classroom.find();
        const faculties = await Faculty.find();
        const subjects = await Subject.find();

        if (!batches || batches.length === 0) {
            return res.status(400).json({ error: 'No batches provided' });
        }

        // Run algorithm
        const schedule = await generateSchedule(batches, subjects, faculties, classrooms);
        
        // Save to DB (optional, or just return)
        // await Timetable.insertMany(schedule.map(s => ({...s, subject: s.subject._id, faculty: s.faculty._id, classroom: s.classroom._id})));

        res.json(schedule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Generation failed' });
    }
});

// --- Analytics ---

// Get class distribution (classes per day)
router.get('/analytics/distribution', async (req, res) => {
    let { facultyId, batchId } = req.query;
    console.log('--- Analytics Distribution Request ---');
    console.log('Query Params:', { facultyId, batchId });
    try {
        let matchStage = { $match: {} };
        
        if (facultyId && mongoose.Types.ObjectId.isValid(facultyId)) {
            matchStage = { $match: { faculty: new mongoose.Types.ObjectId(facultyId) } };
            console.log('Filtering by Faculty ObjectId:', facultyId);
        } else if (batchId) {
            let bId = batchId;
            if (!mongoose.Types.ObjectId.isValid(batchId)) {
                console.log('Resolving Batch Name to ID:', batchId);
                const batchDoc = await Batch.findOne({ name: batchId });
                if (batchDoc) {
                    bId = batchDoc._id;
                    console.log('Resolved to:', bId);
                } else {
                    console.warn('Batch document not found for name:', batchId);
                }
            }
            if (mongoose.Types.ObjectId.isValid(bId.toString())) {
                matchStage = { $match: { batch: new mongoose.Types.ObjectId(bId.toString()) } };
                console.log('Filtering by Batch ID:', bId);
            }
        }
        
        const distribution = await Timetable.aggregate([
            matchStage,
            {
                $group: {
                    _id: "$day",
                    count: { $sum: 1 }
                }
            }
        ]);

        const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const formattedData = daysOrder.map(day => ({
            day,
            count: distribution.find(d => d._id === day)?.count || 0
        }));

        res.json(formattedData);
    } catch (err) {
        console.error('ERROR in /analytics/distribution:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get resource summary (faculty workload and classroom occupancy)
router.get('/analytics/summary', async (req, res) => {
    let { facultyId, batchId } = req.query;
    console.log('--- Analytics Summary Request ---');
    console.log('Query Params:', { facultyId, batchId });
    try {
        let filter = {};
        if (facultyId && mongoose.Types.ObjectId.isValid(facultyId)) {
            filter = { faculty: new mongoose.Types.ObjectId(facultyId) };
            console.log('Filtering Summary by Faculty:', facultyId);
        } else if (batchId) {
            let bId = batchId;
            if (!mongoose.Types.ObjectId.isValid(batchId)) {
                console.log('Resolving Batch Name to ID for Summary:', batchId);
                const batchDoc = await Batch.findOne({ name: batchId });
                if (batchDoc) bId = batchDoc._id;
            }
            if (mongoose.Types.ObjectId.isValid(bId.toString())) {
                filter = { batch: new mongoose.Types.ObjectId(bId.toString()) };
                console.log('Filtering Summary by Batch ID:', bId);
            }
        }
        
        const totalClasses = await Timetable.countDocuments(filter);
        const facultyCount = await Faculty.countDocuments();
        const classroomCount = await Classroom.countDocuments();
        const batchCount = await Batch.countDocuments();

        console.log(`Counts - Classes: ${totalClasses}, Faculty: ${facultyCount}, Rooms: ${classroomCount}, Batches: ${batchCount}`);

        // Faculty workload (classes per faculty)
        const matchStage = { $match: filter };

        const facultyWorkload = await Timetable.aggregate([
            matchStage,
            {
                $group: {
                    _id: "$faculty",
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'faculties',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'facultyInfo'
                }
            },
            { $unwind: { path: "$facultyInfo", preserveNullAndEmptyArrays: false } }, // Remove if no info found
            {
                $project: {
                    name: "$facultyInfo.name",
                    classes: "$count",
                    maxLoad: "$facultyInfo.maxLoad"
                }
            },
            { $sort: { classes: -1 } },
            { $limit: 15 }
        ]);

        console.log(`Faculty Workload count: ${facultyWorkload.length}`);
        
        const responseData = {
            totals: {
                classes: totalClasses,
                faculty: facultyCount,
                classrooms: classroomCount,
                batches: batchCount
            },
            facultyWorkload
        };

        console.log('Sending Summary Data');
        res.json(responseData);
    } catch (err) {
        console.error('ERROR in /analytics/summary:', err);
        res.status(500).json({ error: err.message });
    }
});

// Room Utilization Data
router.get('/analytics/room-utilization', async (req, res) => {
    try {
        const totalSlotsPerWeek = 48; // 6 days * 8 slots (including 12-1pm)
        
        const usageData = await Timetable.aggregate([
            {
                $group: {
                    _id: "$classroom",
                    usedSlots: { $sum: 1 }
                }
            }
        ]);
        
        let fullyUtilized = 0;
        let moderatelyUtilized = 0;
        let underUtilized = 0;
        
        usageData.forEach(room => {
            const percentage = (room.usedSlots / totalSlotsPerWeek) * 100;
            if (percentage > 80) fullyUtilized++;
            else if (percentage >= 40) moderatelyUtilized++;
            else underUtilized++;
        });

        // Add rooms with 0 slots
        const totalRooms = await Classroom.countDocuments();
        const unusedRooms = totalRooms - usageData.length;
        if(unusedRooms > 0) underUtilized += unusedRooms;

        const data = [
            { name: 'Fully Utilized (>80%)', value: fullyUtilized, color: '#10b981' }, // emerald-500
            { name: 'Moderately Utilized (40-80%)', value: moderatelyUtilized, color: '#f59e0b' }, // amber-500
            { name: 'Under Utilized (<40%)', value: underUtilized, color: '#f43f5e' } // rose-500
        ];

        res.json(data);
    } catch (err) {
        console.error('ERROR in /analytics/room-utilization:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
