const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
    {
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        name:{
            type: String,
            required: true
        },
        phone: String,
        address: String,
        location:{
            latitude: Number,
            longitude: Number,
        },
        emergencySupport:{
            type: Boolean,
            default: false
        },
        resources: {
            totalBeds: {type: Number, default: 0},
            availableBeds: {type: Number, default: 0},
            icuBeds: {type: Number, default: 0},
            icuAvailable: {type: Number, default: 0},
            ventilators: {type: Number, default: 0},
            lastUpdated: {type: Date, default: Date.now}
        }
    },
    {timestamps : true}
);

module.exports = mongoose.model('Hospital', hospitalSchema);