const Timetable = require('../models/Timetable');

// Constants
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', 'Lunch Break', '14:00-15:00', '15:00-16:00', '16:00-17:00'];

const generateSchedule = async (batches, subjects, faculties, classrooms) => {
    let timetable = [];
    
    // Helper to check availability
    const isSlotAvailable = (day, slot, resourceId, resourceType) => {
        return !timetable.find(t => 
            t.day === day && 
            t.slot === slot && 
            t[resourceType]?._id.toString() === resourceId.toString()
        );
    };

    // Helper to check for consecutive classes of same subject for a batch
    const checkConsecutiveSubject = (day, slotIndex, batchId, subjectId) => {
        if (slotIndex === 0) return true;
        const prevSlot = SLOTS[slotIndex - 1];
        if (prevSlot === 'Lunch Break') {
             if (slotIndex < 2) return true;
             const preLunchSlot = SLOTS[slotIndex - 2];
             return !timetable.find(t => t.day === day && t.slot === preLunchSlot && t.batch._id.toString() === batchId.toString() && t.subject._id.toString() === subjectId.toString());
        }
        return !timetable.find(t => t.day === day && t.slot === prevSlot && t.batch._id.toString() === batchId.toString() && t.subject._id.toString() === subjectId.toString());
    };

    // Iterate over batches
    for (const batch of batches) {
        for (const subject of subjects) {
            let classesScheduled = 0;
            const classesNeeded = 3; // Hardcoded for MVP

            // Find valid faculty for this subject
            const eligibleFaculty = faculties.filter(f => f.expertise && (f.expertise.includes(subject.code) || f.expertise.includes(subject.name)));
            
            if (eligibleFaculty.length === 0) continue;

            for (const day of DAYS) {
                if (classesScheduled >= classesNeeded) break;

                for (let i = 0; i < SLOTS.length; i++) {
                    const slot = SLOTS[i];
                    if (slot === 'Lunch Break') continue;
                    if (classesScheduled >= classesNeeded) break;

                    // 1. Check if Batch is free
                    if (!isSlotAvailable(day, slot, batch._id, 'batch')) continue;

                    // 2. No conjunctive classes logic
                    if (!checkConsecutiveSubject(day, i, batch._id, subject._id)) continue;

                    // 3. Check if Room is free (and fits)
                    const validRoom = classrooms.find(room => 
                        room.capacity >= batch.size && 
                        isSlotAvailable(day, slot, room._id, 'classroom')
                    );
                    if (!validRoom) continue;

                    // 4. Check if Faculty is free
                    const validFaculty = eligibleFaculty.find(f => isSlotAvailable(day, slot, f._id, 'faculty'));
                    if (!validFaculty) continue;

                    // Assign
                    timetable.push({
                        batch: batch,
                        day,
                        slot,
                        subject: subject,
                        faculty: validFaculty,
                        classroom: validRoom
                    });
                    classesScheduled++;
                }
            }
        }
    }
    return timetable;
};

module.exports = { generateSchedule };
