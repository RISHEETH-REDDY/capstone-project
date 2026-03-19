const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    // Find all unique faculty IDs in timetables
    const facultyIdsInTimetable = await db.collection('timetables').distinct('faculty');
    console.log(`Found ${facultyIdsInTimetable.length} faculties in timetable.`);

    for (const fId of facultyIdsInTimetable) {
        if (!fId) continue;
        
        const faculty = await db.collection('faculties').findOne({ _id: fId });
        if (!faculty) continue;

        const user = await db.collection('users').findOne({
            $or: [
                { username: faculty.name },
                { email: faculty.email }
            ]
        });

        if (user) {
            console.log('--- FOUND MATCH ---');
            console.log('Faculty:', faculty.name, 'Email:', faculty.email, 'ID:', faculty._id);
            console.log('User:', user.username, 'Role:', user.role);
            
            const count = await db.collection('timetables').countDocuments({ faculty: fId });
            console.log('Classes Count:', count);
            break; 
        }
    }
    process.exit(0);
}
run();
