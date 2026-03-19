const mongoose = require('mongoose');

const ClassroomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    roomNumber: { type: String }, // Added to satisfy existing DB index
    block: { type: String }, // Added for block-wise filtering
    capacity: { type: Number, required: true },
    type: { type: String, enum: ['Lecture Hall', 'Laboratory'], default: 'Lecture Hall' }
});

module.exports = mongoose.model('Classroom', ClassroomSchema);
