const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    // Find a faculty with classes
    const classDoc = await db.collection('timetables').findOne({ faculty: { $ne: null } });
    if (!classDoc) {
        console.log('No faculty with classes found in timetables.');
        process.exit(0);
    }
    const fId = classDoc.faculty;
    console.log('Testing with Faculty ID:', fId);

    // Verify type
    console.log('ID constructor:', fId.constructor.name);

    // Test aggregation with the exact same logic as the API
    const matchStage = { $match: { faculty: new mongoose.Types.ObjectId(fId.toString()) } };
    
    const results = await db.collection('timetables').aggregate([
        matchStage,
        {
            $group: {
                _id: "$faculty",
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'faculties',
                localField: '_id',
                foreignField: '_id',
                as: 'facultyInfo'
            }
        },
        { $unwind: "$facultyInfo" },
        {
            $project: {
                name: "$facultyInfo.name",
                classes: "$count",
                maxLoad: "$facultyInfo.maxLoad"
            }
        }
    ]).toArray();

    console.log('Aggregation result:', JSON.stringify(results, null, 2));
    process.exit(0);
}
run();
