const express = require('express');
const cors = require('cors');
const authRoutes = require('./modules/auth/auth.routes');
const patientRoutes = require('./modules/patient/patient.routes');
const doctorRoutes = require('./modules/doctor/doctor.routes');
const appointmentRoutes = require('./modules/appointment/appointment.routes');
const adminRoutes = require('./modules/adminn/adminn.routes');
const panicRoutes = require('./modules/panic/panic.routes');
const hospitalRoutes = require('./modules/hospital/hospital.routes');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/appointment', appointmentRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/adminn', adminRoutes);
app.use('/api/panic', panicRoutes);
app.use('/api/hospital', hospitalRoutes);
app.get('/', (req, res) => {
    res.send('Health Bridge Backend is running');
});

module.exports = app;
