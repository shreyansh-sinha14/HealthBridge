const Patient = require('../../models/patient');
const Panic = require('../../models/panic');
const User = require('../../models/user');

exports.savePatientProfile = async (req, res) => {
    try {
        const{age, gender, bloodGroup, phone, address, emergencyContact} = req.body;

        const userId = req.user.id;
        const userRole = req.user.role;

        if(userRole !== 'patient'){
            return res.status(400).json({message: 'Invalid user ID or user is not a patient'});
        }

        // Update existing profile
        let patient = await Patient.findOne({user: userId});
        if(patient){
            
            patient = await Patient.findOneAndUpdate(
                {user: userId},
                {age, gender, bloodGroup, phone, address, emergencyContact},
                {new: true}
            );
            return res.status(200).json({message: 'Patient profile updated successfully', patient});
        }
        // Create new profile
        patient = await Patient.create({
            user : userId,
            age,
            gender,
            bloodGroup,
            phone,
            address,
            emergencyContact
        });
        return res.status(201).json({message: 'Patient profile created successfully', patient});
    }
    catch(error){
        console.error('Error saving patient profile:', error.message);
        res.status(500).json({message: 'Server error while saving patient profile'});
    }
};

// Get patient profile by userID

exports.getPatientProfile = async(req, res) =>{
    try{
        const userId = req.user.id;
        const userRole = req.user.role;

        if(userRole !== 'patient'){
            return res.status(400).json({message: 'Invalid user ID or user is not a patient'});
        }

        const patient = await Patient.findOne({user: userId}).populate('user', 'name email');

        if(!patient){
            return res.status(404).json({message: 'Patient profile not found'});
        }
        res.status(200).json({patient});
    }
    catch(error){
        console.error('Error fetching patient profile:', error.message);
        res.status(500).json({message: 'Server error while fetching patient profile'});
    }
};
