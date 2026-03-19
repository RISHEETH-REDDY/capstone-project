const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Faculty = require('./models/Faculty');
const Timetable = require('./models/Timetable');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        // Find Aditya Khan
        const faculty = await Faculty.findOne({ name: { $regex: /aditya khan/i } });
        if (!faculty) {
            console.log('Faculty Aditya Khan not found');
            process.exit(1);
        }

        console.log(`Found faculty: ${faculty.name} (ID: ${faculty._id})`);

        // Find all their classes
        const classes = await Timetable.find({ faculty: faculty._id });
        console.log(`Total current classes: ${classes.length}`);

        if (classes.length <= 10) {
             console.log('Classes are already 10 or less. No action needed.');
             process.exit(0);
        }

        // We'll keep 10 classes and delete the rest to make it look realistic but not overwhelming
        const numClassesToKeep = 10;
        const classesToDelete = classes.slice(numClassesToKeep);

        console.log(`Will remove ${classesToDelete.length} classes to leave ${numClassesToKeep}.`);

        let deletedCount = 0;
        for (const cls of classesToDelete) {
             await Timetable.findByIdAndDelete(cls._id);
             deletedCount++;
        }

        console.log(`Successfully removed ${deletedCount} classes.`);
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
