const Hospital = require('../../models/hospital');
const Panic = require('../../models/panic');
const User = require('../../models/user');

//update and create hospital profile
exports.saveHospitalProfile = async(req, res) =>{
    try{
        if(req.user.role !== 'hospital'){
            return res.status(403).json({
                message: "Only hospital can create it's profile"
            });
        }

        const {name, phone, address, location, emergencySupport} = req.body;

        let hospital = await Hospital.findOne({user : req.user.id});

        if(hospital){
            hospital = await Hospital.findOneAndUpdate(
                {user: req.user.id},
                {name, phone, address, location, emergencySupport},
                {new: true}
            );
            return res.status(200).json({
                message: 'Hospital Profile Updated',
                hospital
            });
        }
        hospital = await Hospital.create({
            user: req.user.id,
            name,
            phone,
            address,
            location,
            emergencySupport
        });
        res.status(201).json({
            message: 'Hospital profile created',
            hospital
        });
    }
    catch(error){
        console.log('Hospital profile error:', error.message);
        res.status(500).json({message: 'Server error'});
    }
};
// get hospital profile

exports.getHospitalProfile = async(req, res)=>{
    try{
        const hospital = await Hospital.findOne({user: req.user.id})
        .populate('user', 'email');

        if(!hospital){
            return res.status(404).json({
                message: 'Hospital Profile not found'
            });
        }
        res.status(200).json({hospital});
    }
    catch(error){
        res.status(500).json({message: 'Server error'});
    }
};
// get active panics
exports.getActivePanics = async(req, res) => {
  try {
    if(req.user.role !== 'hospital') {
      return res.status(403).json({message: 'Access denied'});
    }

    // Find the hospital profile for this user
    const hospital = await Hospital.findOne({user: req.user.id});
    if(!hospital) {
      return res.status(404).json({message: 'Hospital profile not found'});
    }

    // Fetch panics assigned to THIS hospital
    // that are either active or acknowledged (not resolved)
    const panics = await Panic.find({
      assignedHospital: hospital._id,
      status: { $in: ['active', 'acknowledged'] }
    })
    .populate({
      path: 'patient',
      populate: { path: 'user', select: 'name phone' }
    });

    res.status(200).json({panics});
  } catch(error) {
    res.status(500).json({message: 'Error fetching panic alerts'});
  }
};

// acknowledge panic

exports.acknowledgePanic = async(req, res) => {
  try {
    const {panicId} = req.params;

    const hospital = await Hospital.findOne({user: req.user.id});
    if(!hospital) {
      return res.status(404).json({message: 'Hospital profile not found'});
    }

    const panic = await Panic.findOneAndUpdate(
      {
        _id: panicId,
        assignedHospital: hospital._id,
        status: 'active'
      },
      { status: 'acknowledged' },
      { new: true }
    );

    if(!panic) {
      return res.status(400).json({message: 'Panic not found or already acknowledged'});
    }

    res.status(200).json({ message: 'Panic acknowledged', panic });
  } catch(error) {
    res.status(500).json({message: 'Error acknowledging panic'});
  }
};
// resolve panic

exports.resolvePanic = async(req, res) => {
  try {
    if(req.user.role !== 'hospital') {
      return res.status(403).json({message: 'Access denied'});
    }

    const {panicId} = req.params;

    const hospital = await Hospital.findOne({user: req.user.id});
    if(!hospital) {
      return res.status(404).json({message: 'Hospital profile not found'});
    }

    const panic = await Panic.findOneAndUpdate(
      {
        _id: panicId,
        assignedHospital: hospital._id,
        status: 'acknowledged'
      },
      { status: 'resolved' },
      { new: true }
    );

    if(!panic) {
      return res.status(400).json({message: 'Panic not found or not assigned to this hospital'});
    }

    res.status(200).json({ message: 'Panic resolved successfully', panic });
  } catch(error) {
    res.status(500).json({message: 'Error resolving panic'});
  }
};

exports.updateResources = async(req, res) =>{
    try{
        if(req.user.role !== 'hospital'){
            return res.status(403).json({message: 'Only hospitals can update resources'});
        }
        const {resources} = req.body;

        const hospital = await Hospital.findOneAndUpdate(
            {user: req.user.id},
            {
                resources: {
                    ...resources,
                    lastUpdated: new Date()
                }
            },
            {new: true}
        );
        if(!hospital){
            return res.status(404).json({
                message: 'Hospital profile not found'
            });
        }
        res.status(200).json({
            message: 'Hospital resources updated successfully',
            resources: hospital.resources
        });
    }
    catch(error){
        res.status(500).json({
            message: 'Error updating resources'
        });
    }
}

exports.getHospitalResources = async(req, res) => {
    try{
        const {hospitalId} = req.params;

        const hospital = await Hospital.findById(hospitalId)
        .select('name resources emergencySupport');

        if(!hospital){
            return res.status(404).json({
                message: 'Hospital not found'
            });
        }
        res.status(200).json({hospital});
    }
    catch(error){
        res.status(500).json({
            message: 'Error fetching resources'
        });
    }
};

exports.getHospitalForPatients = async(req, res) =>{
    try{
        const hospitals = await Hospital.find({},
            'name address resources'
        );

        const enrichedHospitals = hospitals.map(hospital => {
            let warning = null;
            if(hospital.resources){
                if(hospital.resources.icuAvailable < 2){
                    warning = 'Critical ICU shortage';
                }
                else if(hospital.resources.availableBeds < 5){
                    warning = 'Limited bed availability';
            }
        }

            return {
                ...hospital.toObject(),
                availabilityWarning: warning
            };
        });
        res.status(200).json({hospitals: enrichedHospitals});
    }
    catch(error){
        res.status(500).json({message: 'Error fetching hospitals'});
    }
};