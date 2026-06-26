const doctor = require('../../models/doctor');
const appointment = require('../../models/appointment');    

// Create or Update Doctor Profile
exports.saveDoctorProfile = async (req, res) => {
    try {
        const {specialization, experience, phone, hospital, availability} = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if(userRole !== 'doctor'){
            return res.status(400).json({message: 'Invalid user ID or user is not a doctor'});
        }

        // Update existing profile
        let doc = await doctor.findOne({user : userId});
        if(doc){
            doc = await doctor.findOneAndUpdate(
                {user : userId},
                {specialization, experience, phone, hospital, availability},
                {new: true}
            );
            return res.status(200).json({message: 'Doctor profile updated successfully', doc});
        }

        doc = await doctor.create({
            user : userId,
            specialization,
            experience,
            phone,
            hospital,
            availability
        });
        res.status(201).json({message: 'Doctor profile created successfully', doc});
    }
    catch(error){
        console.error('Error saving doctor profile:', error.message);
        res.status(500).json({message: 'Server error while saving doctor profile'});
    }
};

// Get Doctor Profile by userID
exports.getDoctorProfile = async(req, res) =>{
    try{
        const userId = req.user.id;
        const userRole = req.user.role;

        if(userRole !== 'doctor'){
            return res.status(400).json({message: 'Invalid user ID or user is not a doctor'});
        }

        const doc = await doctor.findOne({user: userId}).populate('user', 'name email');   
         
        if(!doc){
            return res.status(404).json({message: 'Doctor profile not found'});
        }
        res.status(200).json({doc});
    }
    catch(error){
        console.error('Error fetching doctor profile:', error.message);
        res.status(500).json({message: 'Server error while fetching doctor profile'});
    }
};
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await doctor.find()
      .populate('user', 'name email');

    res.status(200).json({ doctors });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctors' });
  }
};