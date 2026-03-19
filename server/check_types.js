const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkTypes() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const timetable = await db.collection('timetables').findOne();
    const faculty = await db.collection('faculties').findOne();

    console.log('Timetable Sample Types:');
    if (timetable) {
        for (let key in timetable) {
            console.log(`${key}: ${typeof timetable[key]} (${timetable[key].constructor.name})`);
        }
    }

    console.log('\nFaculty Sample Types:');
    if (faculty) {
        for (let key in faculty) {
            console.log(`${key}: ${typeof faculty[key]} (${faculty[key].constructor.name})`);
        }
    }

    process.exit(0);
}
checkTypes();
