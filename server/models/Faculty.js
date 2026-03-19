const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    maxLoad: { type: Number, default: 12 } // Max hours per week
});

module.exports = mongoose.model('Faculty', FacultySchema);
