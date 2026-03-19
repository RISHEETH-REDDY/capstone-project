const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    section: { type: String },
    semester: { type: Number }, // derived or default
    size: { type: Number, default: 60 } // Default size if not in Excel
});

module.exports = mongoose.model('Batch', BatchSchema);
