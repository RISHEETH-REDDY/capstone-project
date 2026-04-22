const mongoose = require('mongoose');
const XLSX = require('xlsx');
const dotenv = require('dotenv');
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

        const file = 'timetable_ready_database (1).xlsx';
        const workbook = XLSX.readFile(file);

        console.log('Clearing existing data...');
        await Promise.all([
            Classroom.deleteMany({}),
            Faculty.deleteMany({}),
            Subject.deleteMany({}),
            Batch.deleteMany({}),
            Timetable.deleteMany({}),
            User.deleteMany({})
        ]);

        const roomMap = {};
        if (workbook.Sheets['1. Rooms']) {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets['1. Rooms']);
            console.log(`Importing ${data.length} Classrooms...`);
            for (const row of data) {
                roomMap[row.Room_ID] = row.Room_Number;
                await Classroom.findOneAndUpdate(
                    { roomNumber: row.Room_Number },
                    {
                        name: row.Room_Number,
                        roomNumber: row.Room_Number,
                        capacity: row.Capacity || 60,
                        type: row.Room_Type || 'Lecture Hall'
                    },
                    { upsert: true }
                );
            }
        }

        if (workbook.Sheets['2. Subjects']) {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets['2. Subjects']);
            console.log(`Importing ${data.length} Subjects...`);
            for (const row of data) {
                await Subject.findOneAndUpdate(
                    { code: row.Subject_Code },
                    {
                        name: row.Subject_Name,
                        code: row.Subject_Code,
                        credits: 4,
                        contactHours: row.Hours_per_Week || 3,
                        type: row.Subject_Type || 'Theory'
                    },
                    { upsert: true }
                );
            }
        }

        const facMap = {};
        if (workbook.Sheets['3. Faculty']) {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets['3. Faculty']);
            console.log(`Importing ${data.length} Teachers...`);
            for (const row of data) {
                facMap[row.Faculty_ID] = row.Email;
                await Faculty.findOneAndUpdate(
                    { email: row.Email },
                    {
                        name: row.Faculty_Name,
                        email: row.Email,
                        department: row.Department,
                        maxLoad: 12
                    },
                    { upsert: true }
                );
                await User.findOneAndUpdate(
                    { email: row.Email },
                    {
                        username: row.Email,
                        password: row.Password || 'password123',
                        role: 'faculty',
                        email: row.Email,
                        department: row.Department
                    },
                    { upsert: true }
                );
            }
        }

        if (workbook.Sheets['5. Student Groups']) {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets['5. Student Groups']);
            console.log(`Importing ${data.length} Batches...`);
            for (const row of data) {
                await Batch.findOneAndUpdate(
                    { name: row.Group_ID },
                    {
                        name: row.Group_ID,
                        department: row.Program_Name,
                        section: row.Section,
                        size: row.Strength || 60
                    },
                    { upsert: true }
                );
            }
        }

        if (workbook.Sheets['6. Students']) {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets['6. Students']);
            console.log(`Importing ${data.length} Students...`);
            for (const row of data) {
                if (!row.Email) continue;
                await User.findOneAndUpdate(
                    { email: row.Email },
                    {
                        username: row.Email,
                        password: row.Password || 'password123',
                        role: 'student',
                        email: row.Email,
                        rollNumber: row.Student_ID,
                        department: row.Program,
                        section: row.Section,
                        batch: String(row.Group)
                    },
                    { upsert: true }
                );
            }
        }

        const slotMap = {};
        if (workbook.Sheets['7. Time Slots']) {
            const slots = XLSX.utils.sheet_to_json(workbook.Sheets['7. Time Slots']);
            for (const s of slots) {
                slotMap[s.Slot_ID] = { day: s.Day, time: `${s.Start_Time}-${s.End_Time}` };
            }
        }

        if (workbook.Sheets['9. Sample Allocation']) {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets['9. Sample Allocation']);
            console.log(`Importing ${data.length} Timetable entries...`);
            
            for (const row of data) {
                const roomNum = roomMap[row.Room_ID];
                const facEmail = facMap[row.Faculty_ID];
                const slotInfo = slotMap[row.Slot_ID];

                if (!roomNum || !facEmail || !slotInfo) continue;

                const [subject, faculty, classroom, batchDoc] = await Promise.all([
                    Subject.findOne({ code: row.Subject_Code }),
                    Faculty.findOne({ email: facEmail }),
                    Classroom.findOne({ roomNumber: roomNum }),
                    Batch.findOne({ name: row.Group_ID })
                ]);

                if (subject && faculty && classroom && batchDoc) {
                    await Timetable.create({
                        batch: batchDoc._id,
                        day: slotInfo.day,
                        slot: slotInfo.time,
                        subject: subject._id,
                        faculty: faculty._id,
                        classroom: classroom._id
                    });
                } else {
                    console.warn(`Missing ref for allocation ${row.Allocation_ID}`);
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
