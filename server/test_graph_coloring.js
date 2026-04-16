const { generateSchedule } = require('./utils/scheduler');

// Mock Data
const batches = [
    { _id: 'b1', name: 'CS-A', size: 60 },
    { _id: 'b2', name: 'CS-B', size: 40 }
];

const subjects = [
    { _id: 's1', name: 'Algorithms', code: 'CS101' },
    { _id: 's2', name: 'Database', code: 'CS102' }
];

const faculties = [
    { _id: 'f1', name: 'Dr. Smith', expertise: 'Algorithms CS101' },
    { _id: 'f2', name: 'Dr. Jones', expertise: 'Database CS102' }
];

const classrooms = [
    { _id: 'r1', name: 'Room 101', capacity: 70 },
    { _id: 'r2', name: 'Room 102', capacity: 30 }
];

async function runTest() {
    console.log('Running Graph Coloring Test with Performance Metrics...');
    try {
        const result = await generateSchedule(batches, subjects, faculties, classrooms, 2);
        const { schedule, performance } = result;

        console.log('\n--- Performance Metrics ---');
        console.log(`Execution Time: ${performance.executionTimeMs} ms`);
        console.log(`Accuracy Rate: ${performance.accuracyRate}%`);
        console.log(`Nodes Resolved: ${performance.scheduledNodes} / ${performance.totalNodes}`);

        console.log('\n--- Generated Schedule ---');
        schedule.forEach((s, i) => {
            console.log(`${i+1}. ${s.day} ${s.slot} | Batch: ${s.batch.name} | Subject: ${s.subject.name} | Faculty: ${s.faculty.name} | Room: ${s.classroom.name}`);
        });

        // Validation
        let errors = [];
        
        // 1. Check for Batch Overlaps
        batches.forEach(b => {
            const batchSchedule = schedule.filter(s => s.batch._id === b._id);
            const slots = batchSchedule.map(s => `${s.day}-${s.slot}`);
            const uniqueSlots = new Set(slots);
            if (slots.length !== uniqueSlots.size) {
                errors.push(`Overlap detected for Batch ${b.name}`);
            }
        });

        // 2. Check for Faculty Overlaps
        faculties.forEach(f => {
            const facultySchedule = schedule.filter(s => s.faculty._id === f._id);
            const slots = facultySchedule.map(s => `${s.day}-${s.slot}`);
            const uniqueSlots = new Set(slots);
            if (slots.length !== uniqueSlots.size) {
                errors.push(`Overlap detected for Faculty ${f.name}`);
            }
        });

        // 3. Check for Room Overlaps
        classrooms.forEach(r => {
            const roomSchedule = schedule.filter(s => s.classroom._id === r._id);
            const slots = roomSchedule.map(s => `${s.day}-${s.slot}`);
            const uniqueSlots = new Set(slots);
            if (slots.length !== uniqueSlots.size) {
                errors.push(`Overlap detected for Room ${r.name}`);
            }
        });

        if (errors.length === 0) {
            console.log('\n✅ All validations passed! No overlaps detected.');
        } else {
            console.error('\n❌ Validations failed:');
            errors.forEach(e => console.error(` - ${e}`));
        }

    } catch (err) {
        console.error('Test failed with error:', err);
    }
}

runTest();
