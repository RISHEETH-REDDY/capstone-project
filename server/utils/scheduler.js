const { performance } = require('perf_hooks');
const Timetable = require('../models/Timetable');

// Constants
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', 'Lunch Break', '14:00-15:00', '15:00-16:00', '16:00-17:00'];
const AVAILABLE_SLOTS = SLOTS.filter(s => s !== 'Lunch Break');

/**
 * Graph Coloring Approach (Welsh-Powell Algorithm)
 * 1. Nodes = Class sessions (Batch + Subject + Session Index)
 * 2. Edges = Conflict (Same Batch or potential same Faculty)
 * 3. Colors = Time Slots (Day + Time)
 */
const generateSchedule = async (batches, subjects, faculties, classrooms, sessionsPerSubject = 3) => {
    const startTime = performance.now();
    console.log('--- Starting Graph Coloring Timetable Generation ---');
    let nodes = [];

    // Step 1: Initialize Nodes
    for (const batch of batches) {
        for (const subject of subjects) {
            const eligibleFaculty = faculties.filter(f => 
                f.expertise && (f.expertise.includes(subject.code) || f.expertise.includes(subject.name))
            );
            
            if (eligibleFaculty.length === 0) {
                console.warn(`No eligible faculty found for subject: ${subject.name} (${subject.code})`);
                continue;
            }

            for (let i = 0; i < sessionsPerSubject; i++) {
                nodes.push({
                    id: `${batch._id}-${subject._id}-${i}`,
                    batch,
                    subject,
                    eligibleFaculty,
                    neighbors: new Set(),
                    degree: 0,
                    assignedSlot: null,
                    assignedFaculty: null,
                    assignedRoom: null
                });
            }
        }
    }

    // Step 2: Build Adjacency Matrix (Conflicts)
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const n1 = nodes[i];
            const n2 = nodes[j];

            let hasConflict = false;

            // Constraint: Same Batch cannot have two classes at once
            if (n1.batch._id.toString() === n2.batch._id.toString()) {
                hasConflict = true;
            }

            if (hasConflict) {
                n1.neighbors.add(n2.id);
                n2.neighbors.add(n1.id);
                n1.degree++;
                n2.degree++;
            }
        }
    }

    // Step 3: Sort nodes by degree (Welsh-Powell)
    nodes.sort((a, b) => b.degree - a.degree);

    // Step 4: Define Colors (Slots)
    const COLORS = [];
    for (const day of DAYS) {
        for (const slot of AVAILABLE_SLOTS) {
            COLORS.push({ day, slot });
        }
    }

    // Step 5: Assign Colors and resolve secondary constraints (Faculty & Rooms)
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    for (const node of nodes) {
        for (const color of COLORS) {
            // A. Check Graph Coloring Constraint: No neighbor can have the same color
            let neighborConflict = false;
            for (const neighborId of node.neighbors) {
                const neighbor = nodeMap.get(neighborId);
                if (neighbor && neighbor.assignedSlot && 
                    neighbor.assignedSlot.day === color.day && 
                    neighbor.assignedSlot.slot === color.slot) {
                    neighborConflict = true;
                    break;
                }
            }
            if (neighborConflict) continue;

            // B. Resolve Faculty Constraint: Faculty must be free
            const validFaculty = node.eligibleFaculty.find(f => {
                // Check if this faculty is already booked in this slot by ANY other assigned node
                return !nodes.some(n => 
                    n.assignedSlot && 
                    n.assignedSlot.day === color.day && 
                    n.assignedSlot.slot === color.slot && 
                    n.assignedFaculty && n.assignedFaculty._id.toString() === f._id.toString()
                );
            });
            if (!validFaculty) continue;

            // C. Resolve Room Constraint: Room must be free and fit capacity
            const validRoom = classrooms.find(room => {
                const isLargeEnough = room.capacity >= node.batch.size;
                const isOccupied = nodes.some(n => 
                    n.assignedSlot && 
                    n.assignedSlot.day === color.day && 
                    n.assignedSlot.slot === color.slot && 
                    n.assignedRoom && n.assignedRoom._id.toString() === room._id.toString()
                );
                return isLargeEnough && !isOccupied;
            });
            if (!validRoom) continue;

            // SUCCESS: Assign the color and resources
            node.assignedSlot = color;
            node.assignedFaculty = validFaculty;
            node.assignedRoom = validRoom;
            break;
        }
    }

    // Step 6: Format and return
    const schedule = nodes
        .filter(n => n.assignedSlot)
        .map(n => ({
            batch: n.batch,
            day: n.assignedSlot.day,
            slot: n.assignedSlot.slot,
            subject: n.subject,
            faculty: n.assignedFaculty,
            classroom: n.assignedRoom
        }));

    const endTime = performance.now();
    const executionTimeMs = (endTime - startTime).toFixed(4);
    const accuracyRate = nodes.length > 0 ? ((schedule.length / nodes.length) * 100).toFixed(2) : 100;

    console.log(`--- Generation Complete: Scheduled ${schedule.length}/${nodes.length} sessions in ${executionTimeMs}ms (Accuracy: ${accuracyRate}%) ---`);
    
    return {
        schedule,
        performance: {
            executionTimeMs,
            accuracyRate,
            totalNodes: nodes.length,
            scheduledNodes: schedule.length
        }
    };
};

module.exports = { generateSchedule };
