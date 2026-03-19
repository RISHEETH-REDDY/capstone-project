const mongoose = require('mongoose');
const XLSX = require('xlsx');
const dotenv = require('dotenv');
const fs = require('fs');
const Classroom = require('./models/Classroom');
const Faculty = require('./models/Faculty');
const Subject = require('./models/Subject');
const Batch = require('./models/Batch');
const Timetable = require('./models/Timetable');
const User = require('./models/User');

dotenv.config();

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const file = 'SmartClass_Final_Scaled (1).xlsx';
        const workbook = XLSX.readFile(file);

        // 1. Clear existing data for a clean start
        console.log('Clearing existing data...');
        await Promise.all([
            Classroom.deleteMany({}),
            Faculty.deleteMany({}),
            Subject.deleteMany({}),
            Batch.deleteMany({}),
            Timetable.deleteMany({}),
            User.deleteMany({})
        ]);

        // 1. Import Classrooms
        if (workbook.Sheets['Classrooms']) {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets['Classrooms']);
            console.log(`Importing ${data.length} Classrooms...`);
            for (const row of data) {
                await Classroom.findOneAndUpdate(
                    { roomNumber: row.roomNumber },
                    {
                        name: row.roomNumber,
                        roomNumber: row.roomNumber,
                        capacity: row.capacity || 60,
                        type: 'Lecture Hall'
                    },
                    { upsert: true }
                );
            }
        }

        // 2. Import Faculty & Create Users for them
        if (workbook.Sheets['Teachers']) {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets['Teachers']);
            console.log(`Importing ${data.length} Teachers...`);
            for (const row of data) {
                // Create Faculty entry
                await Faculty.findOneAndUpdate(
                    { email: row.email },
                    {
                        name: row.name,
                        email: row.email,
                        department: row.department,
                        maxLoad: 12
                    },
                    { upsert: true }
                );
                // Create User entry
                await User.findOneAndUpdate(
                    { email: row.email },
                    {
                        username: row.email,
                        password: row.password || 'password123',
                        role: 'faculty',
                        email: row.email,
                        department: row.department
                    },
                    { upsert: true }
                );
            }
        }

        // 3. Import Students
        if (workbook.Sheets['Students']) {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets['Students']);
            console.log(`Importing ${data.length} Students...`);
            for (const row of data) {
                if (!row.email) {
                    console.warn(`Skipping student with no email: ${row.name}`);
                    continue;
                }
                await User.findOneAndUpdate(
                    { email: row.email },
                    {
                        username: row.email, // Use email as username to ensure uniqueness
                        password: row.password || 'password123',
                        role: 'student',
                        email: row.email,
                        rollNumber: row.rollNumber,
                        department: row.department,
                        section: row.section,
                        batch: row.batch
                    },
                    { upsert: true }
                );
            }
        }

        // 4. Import Subjects
        if (workbook.Sheets['Subjects']) {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets['Subjects']);
            console.log(`Importing ${data.length} Subjects...`);
            for (const row of data) {
                await Subject.findOneAndUpdate(
                    { code: row.code },
                    {
                        name: row.name,
                        code: row.code,
                        credits: 4,
                        contactHours: 3,
                        type: 'Theory'
                    },
                    { upsert: true }
                );
            }
        }

        // 5. Import Batches
        if (workbook.Sheets['Batches']) {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets['Batches']);
            console.log(`Importing ${data.length} Batches...`);
            for (const row of data) {
                await Batch.findOneAndUpdate(
                    { name: row.name },
                    {
                        name: row.name,
                        department: row.department,
                        section: row.section,
                        size: 60
                    },
                    { upsert: true }
                );
            }
        }

        // 6. Import Timetable
        if (workbook.Sheets['Timetable']) {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets['Timetable']);
            console.log(`Importing ${data.length} Timetable entries...`);
            
            // Clear existing timetable to avoid duplication issues
            await Timetable.deleteMany({});

            for (const row of data) {
                // Resolve Refs
                const [subject, faculty, classroom, batchDoc] = await Promise.all([
                    Subject.findOne({ code: row.subject }),
                    Faculty.findOne({ name: row.teacher }),
                    Classroom.findOne({ roomNumber: row.classroom }),
                    Batch.findOne({ name: row.batch })
                ]);

                if (subject && faculty && classroom && batchDoc) {
                    // Normalize Day
                    const dayMap = {
                        'Mon': 'Monday',
                        'Tue': 'Tuesday',
                        'Wed': 'Wednesday',
                        'Thu': 'Thursday',
                        'Fri': 'Friday',
                        'Sat': 'Saturday',
                        'Sun': 'Sunday'
                    };
                    const fullDay = dayMap[row.day] || row.day;

                    await Timetable.create({
                        batch: batchDoc._id,
                        day: fullDay,
                        slot: `${row.startTime}-${row.endTime}`,
                        subject: subject._id,
                        faculty: faculty._id,
                        classroom: classroom._id
                    });
                } else {
                    console.warn(`Skipping row for ${row.batch} due to missing refs: Subject(${row.subject}), Teacher(${row.teacher}), Classroom(${row.classroom}), Batch(${row.batch})`);
                }
            }
        }

        console.log('Data Import Completed Successfully!');
        process.exit();
    } catch (err) {
        console.error('Error importing data:', err);
        process.exit(1);
    }
};

importData();
