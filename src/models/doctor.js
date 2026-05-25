const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    specialization: {
        type: String,
        required: true,
    },
    hospital:{
        type: String,
        required: true,
    },
    experience: Number,
    phone: String,
    availability: [{
        days: [String],
        from: String,
        to: String,
    }],
}, {timestamps: true,});
module.exports = mongoose.model('Doctor', doctorSchema);
