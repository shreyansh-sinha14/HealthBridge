const User = require('../../models/user');
const Patient = require('../../models/patient');
const Doctor = require('../../models/doctor');
const Appointment = require('../../models/appointment');

//get all users

exports.getAllUsers = async (req, res) => {
    try{
        if(req.user.role !== 'admin'){
            return res.status(403).json({message: 'Access denied'});
        }
        const users = await User.find().select('-password');
        res.status(200).json({users});
    }
    catch(error){
        console.error('Error fetching users:', error.message);
        res.status(500).json({message: 'Server error while fetching users'});
    }
};

// get all patients
exports.getAllPatients = async (req, res) => {
    try{
        if(req.user.role !== 'admin'){
            return res.status(403).json({message: 'Access denied'});
        }
        const patients = await Patient.find().populate('user', 'name email');
        res.status(200).json({patients});
    }
    catch(error){
        console.error('Error fetching patients:', error.message);
        res.status(500).json({message: 'Server error while fetching patients'});
    }
};

// get all doctors
exports.getAllDoctors = async (req, res) => {
    try{
        if(req.user.role !== 'admin'){
            return res.status(403).json({message: 'Access denied'});
        }
        const doctors = await Doctor.find().populate('user', 'name email');
        res.status(200).json({doctors});
    }
    catch(error){
        console.error('Error fetching doctors:', error.message);
        res.status(500).json({message: 'Server error while fetching doctors'});
    }
};

// get all appointments
exports.getAllAppointments = async (req, res) => {
    try{
        if(req.user.role !== 'admin'){
            return res.status(403).json({message: 'Access denied'});
        }
        const appointments = await Appointment.find()
        .populate({
            path : 'patient',
            populate: {path: 'user', select: 'name email'}
        })
        .populate({
            path : 'doctor',
            populate: {path: 'user', select: 'name email'}
        });
        res.status(200).json({appointments});
    }
    catch(error){
        console.error('Error fetching appointments:', error.message);
        res.status(500).json({message: 'Server error while fetching appointments'});
    }
};