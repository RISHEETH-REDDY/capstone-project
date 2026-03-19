const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Faculty = mongoose.connection.db.collection('faculties');
    const User = mongoose.connection.db.collection('users');

    const facs = await Faculty.find().limit(5).toArray();
    console.log('Sample Faculties:', JSON.stringify(facs, null, 2));

    const users = await User.find().limit(5).toArray();
    console.log('Sample Users:', JSON.stringify(users, null, 2));

    process.exit(0);
}
check();
