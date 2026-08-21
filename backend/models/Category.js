const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    section: { type: String, required: true },
    description: { type: String, default: '' },
    isMandatory: { type: Boolean, default: false },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Category', categorySchema);