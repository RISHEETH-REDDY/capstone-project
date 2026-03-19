const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Timetable = mongoose.connection.db.collection('timetables');
    const Batch = mongoose.connection.db.collection('batches');
    const Faculty = mongoose.connection.db.collection('faculties');

    // 1. Get a sample Faculty with classes
    const sampleClass = await Timetable.findOne({ faculty: { $exists: true, $ne: null } });
    if (sampleClass) {
        const fId = sampleClass.faculty;
        console.log('Testing Faculty ID:', fId);
        
        // Test Count
        const count = await Timetable.countDocuments({ faculty: new mongoose.Types.ObjectId(fId.toString()) });
        console.log('Classes found for this faculty (ObjectId):', count);
        
        const countRaw = await Timetable.countDocuments({ faculty: fId });
        console.log('Classes found for this faculty (Raw):', countRaw);
    }

    // 2. Get a sample Batch with classes
    const batchClass = await Timetable.findOne({ batch: { $exists: true, $ne: null } });
    if (batchClass) {
        const bId = batchClass.batch;
        console.log('Testing Batch ID:', bId);

        const bCount = await Timetable.countDocuments({ batch: new mongoose.Types.ObjectId(bId.toString()) });
        console.log('Classes found for this batch (ObjectId):', bCount);
    }

    process.exit(0);
}
run();
