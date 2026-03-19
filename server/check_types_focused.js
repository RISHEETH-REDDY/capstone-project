const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const t = await db.collection('timetables').findOne();
    const f = await db.collection('faculties').findOne();

    console.log('Timetable faculty type:', t.faculty.constructor.name, typeof t.faculty);
    console.log('Faculty _id type:', f._id.constructor.name, typeof f._id);
    
    process.exit(0);
}
check();
