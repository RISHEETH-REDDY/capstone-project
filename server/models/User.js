const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'faculty', 'student'], default: 'faculty' },
    email: { type: String },
    rollNumber: { type: String },
    department: { type: String },
    section: { type: String },
    batch: { type: String }
});

module.exports = mongoose.model('User', UserSchema);
