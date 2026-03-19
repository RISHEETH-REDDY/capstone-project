const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Classroom = require('./models/Classroom');
const Faculty = require('./models/Faculty');
const Batch = require('./models/Batch');
const Timetable = require('./models/Timetable');
const Subject = require('./models/Subject');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const classrooms = await Classroom.countDocuments();
        const faculties = await Faculty.countDocuments();
        const batches = await Batch.countDocuments();
        const timetable = await Timetable.countDocuments();
        const subjects = await Subject.countDocuments();

        console.log('--- Database Status ---');
        console.log(`Classrooms: ${classrooms}`);
        console.log(`Faculties: ${faculties}`);
        console.log(`Batches: ${batches}`);
        console.log(`Timetable Entries: ${timetable}`);
        console.log(`Subjects: ${subjects}`);

        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
