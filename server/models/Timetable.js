const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    day: { type: String, required: true }, // Monday to Saturday
    slot: { type: String, required: true }, // e.g., "09:00-10:00"
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }
});

module.exports = mongoose.model('Timetable', TimetableSchema);
