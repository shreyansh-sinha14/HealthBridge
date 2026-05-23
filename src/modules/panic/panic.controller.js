const Patient = require('../../models/patient');
const Panic = require('../../models/panic');
const Hospital = require('../../models/hospital');
const {calculateDistance} = require('../../utils/distance');
//const user = require('../../models/user');

exports.triggerPanic = async(req, res) =>{
    try{
        if(req.user.role !== 'patient'){
            return res.status(403).json({message: 'Only patients can trigger panic'});
        }

        const patient = await Patient.findOne({user: req.user.id});
        if(!patient){
            return res.status(404).json({message: 'Patient profile not found'});
        }

        const {latitude, longitude, address, reason} = req.body;

        //Fetch all emergency hospitals

        const hospitals = await Hospital.find({emergencySupport: true});

        if(!hospitals.length){
            return res.status(404).json({
                message: 'No emergency hospitals available'
            });
        }
        // Find nearest hospital

        let nearestHospital = null;
        let shortestDistance = Infinity;

        hospitals.forEach((hospital) => {
            if(!hospital.location||
                hospital.location.latitude == null ||
                hospital.location.longitude == null
            ) return;

            // const hospitalLat = Number(hospital.location.latitude);
            // const hospitalLng = Number(hospital.location.longitude);

            const distance = calculateDistance(Number(latitude), Number(longitude), Number(hospital.location.latitude), Number(hospital.location.longitude));

            console.log("Hospitals fetched:", hospitals.length);
hospitals.forEach(h => {
    console.log(h.name, h.location);
});


            if(!isNaN(distance) && distance < shortestDistance){
                shortestDistance = distance;
                nearestHospital = hospital;
            }
        });
        if(!nearestHospital){
                return res.status(404).json({
                    message: 'No hospital with valid location found'
                });
            }

            // determine resource warning

             const icuBeds = nearestHospital.resources?.icuAvailable ?? 0;
             const bedsAvailable = nearestHospital.resources?.availableBeds ?? 0;
        let availabilityWarning = null;
        if (icuBeds < 2) {
            availabilityWarning = 'Critical ICU shortage';
        } else if (bedsAvailable < 5) {
            availabilityWarning = 'Limited bed availability';
        }
        //create panic & auto assign

        const panic = await Panic.create({
            patient: patient._id,
            location: {latitude, longitude, address},
            reason,
            status: 'acknowledged',
            assignedHospital: nearestHospital._id
        });

        res.status(201).json({
            message: 'Panic alert auto-assigned to nearest hospital',
            hospital: {
                name: nearestHospital.name,
                email: nearestHospital.email,
                resources: nearestHospital.resources,
                availabilityWarning
            },
            distanceInKm: shortestDistance.toFixed(2),
            panic
        });
    }
    catch(error){
        console.error(error.message);
        res.status(500).json({message: 'Server error'});
    }
};