const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    credits: { type: Number, required: true },
    type: { type: String, enum: ['Theory', 'Lab'], default: 'Theory' },
    contactHours: { type: Number, required: true }
});

module.exports = mongoose.model('Subject', SubjectSchema);
