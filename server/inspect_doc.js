const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const t = await db.collection('timetables').findOne();
    console.log('Full Timetable Document:', JSON.stringify(t, null, 2));
    
    process.exit(0);
}
check();
