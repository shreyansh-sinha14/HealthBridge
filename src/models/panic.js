const mongoose = require('mongoose');

const panicSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    location: {
        latitude: Number,
        longitude: Number,
        address: String,
    },
    reason:{
        type: String,
        default: 'Emergency',
    },
    status:{
        type: String,
        enum: ['active', 'resolved', 'acknowledged'],
        default: 'active',
    },
    assignedHospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital'
    }
}, {timestamps: true,});

module.exports = mongoose.model('Panic', panicSchema);