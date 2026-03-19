const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check faculty collection sample
    const facultyColl = mongoose.connection.db.collection('faculties');
    const facultySample = await facultyColl.findOne();
    console.log('Faculty Sample:', JSON.stringify(facultySample, null, 2));

    // Check timetable collection sample
    const timetableColl = mongoose.connection.db.collection('timetables');
    const timetableSample = await timetableColl.findOne();
    console.log('Timetable Sample:', JSON.stringify(timetableSample, null, 2));

    process.exit(0);
}
check();
