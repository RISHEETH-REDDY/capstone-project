const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Classroom = require('./models/Classroom');
const Faculty = require('./models/Faculty');
const Batch = require('./models/Batch');
const Timetable = require('./models/Timetable');
const Subject = require('./models/Subject');

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const data = {
        classrooms: await Classroom.countDocuments(),
        faculties: await Faculty.countDocuments(),
        batches: await Batch.countDocuments(),
        timetable: await Timetable.countDocuments(),
        subjects: await Subject.countDocuments()
    };
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
}
check();
