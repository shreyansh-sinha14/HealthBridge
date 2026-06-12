const mongoose = require('mongoose');
const patientSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    age: Number,
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    bloodGroup: String,
    phone: String,
    address: String,
    emergencyContact: {
        name: String,
        phone: String,
        relation: String,
    },
}, {timestamps: true,});

module.exports = mongoose.model('Patient', patientSchema);