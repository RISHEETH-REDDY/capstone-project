const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const batches = await mongoose.connection.db.collection('batches').find().toArray();
    const faculties = await mongoose.connection.db.collection('faculties').find().toArray();
    const users = await mongoose.connection.db.collection('users').find().toArray();
    
    const data = { batches, faculties, users };
    fs.writeFileSync('db_dump.json', JSON.stringify(data, null, 2));
    console.log('Data dumped to db_dump.json');
    process.exit(0);
}
run();
