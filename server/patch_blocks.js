const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartclass').then(async () => {
    const db = mongoose.connection.db;
    const classrooms = await db.collection('classrooms').find().toArray();
    for (let c of classrooms) {
        let block = '14';
        if (c.roomNumber && c.roomNumber.includes('-')) {
            block = c.roomNumber.split('-')[0];
        }
        await db.collection('classrooms').updateOne({ _id: c._id }, { $set: { block } });
    }
    console.log(`Patched ${classrooms.length} blocks.`);
    process.exit(0);
}).catch(console.error);
