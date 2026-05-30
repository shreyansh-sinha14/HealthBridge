const appointment = require('../../models/appointment');
const patient = require('../../models/patient');
const doctor = require('../../models/doctor');


// Schedule an Appointment

exports.scheduleAppointment = async(req, res) => {
    try{
        const {doctorId, appointmentDate, reason} = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (new Date(appointmentDate) < new Date()) {
            return res.status(400).json({ 
                message: "Cannot book past date" 
            });
        }

         if(userRole !== 'patient'){
            return res.status(400).json({message: 'Invalid user ID or user is not a patient'});
        }

        const pat = await patient.findOne({user: userId});
        if(!pat){
            return res.status(404).json({message: 'Patient profile not found'});
        }
        const doc = await doctor.findById(doctorId);
        if(!doc){
            return res.status(404).json({message: 'Doctor profile not found'});
        }

        const newAppointment = await appointment.create({
            patient: pat._id,
            doctor: doc._id,
            appointmentDate,
            reason,
        });
        return res.status(201).json({
            message: 'Appointment scheduled successfully', 
            appointment: newAppointment
        });

    }
    catch(error){
        console.error('Error scheduling appointment:', error.message);
        res.status(500).json({message: 'Server error while scheduling appointment'});
    }
};

exports.getPatientAppointments = async(req, res) => {
    try{
        const userId = req.user.id;
        const role = req.user.role;
        if(role !== 'patient'){
            return res.status(400).json({message: 'Invalid user ID or user is not a patient'});
        }
        const pat = await patient.findOne({user: userId});
        if(!pat){
            return res.status(404).json({message: 'Patient profile not found'});
        }
        const appoint = await appointment.find({patient: pat._id})
        .populate({ 
            path: 'doctor',
            populate: {path: 'user', select: 'name email'}
        });
        return res.status(200).json({appointments: appoint});
    }
    catch(error){
        console.error('Error fetching patient appointments:', error.message);
        res.status(500).json({message: 'Server error while fetching patient appointments'});
    }
};


exports.getDoctorAppointments = async(req, res) => {
    try{
        const userId = req.user.id;
        const userRole = req.user.role;

        if(userRole !== 'doctor'){
            return res.status(400).json({message: 'Invalid user ID or user is not a doctor'});
        }
        const doc = await doctor.findOne({user: userId});
        if(!doc){
            return res.status(404).json({message: 'Doctor profile not found'});
        }
        const appoint = await appointment.find({doctor: doc._id})
        .populate({
            path: 'patient',
            populate: {path: 'user', select: 'name email'}
        });
        return res.status(200).json({appointments: appoint});
    }
    catch(error){
        console.error('Error fetching doctor appointments:', error.message);
        res.status(500).json({message: 'Server error while fetching doctor appointments'});
    }
};
// Update Appointment Status
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { appointmentId} = req.params;
        const { status } = req.body;

        // Validate status
        if(!['completed', 'cancelled'].includes(status)){
            return res.status(400).json({ message: 'Invalid status value' });
        }
        //find doctor profile from JWT

        const doct = await doctor.findOne({ user: req.user.id });
        if (!doct) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

            // find the appointment that belongs to this doctor
        const appoint = await appointment.findOne({
            _id: appointmentId,
            doctor: doct._id
        });
        if (!appoint) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appoint.status = status;
        await appoint.save();
        res.status(200).json({ message: 'Appointment status updated successfully', appointment: appoint });
    }
    catch (error) {
        console.error('Error updating appointment status:', error.message);
        res.status(500).json({ message: 'Server error while updating appointment status' });
    }
};
