const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const {scheduleAppointment, getPatientAppointments, getDoctorAppointments, updateAppointmentStatus} = require('./appointment.controller');

console.log('authMiddleware:', typeof authMiddleware);
console.log('updateAppointmentStatus:', typeof updateAppointmentStatus);
console.log('getAllDoctors:', typeof getAllDoctors);

router.post('/book', authMiddleware, scheduleAppointment);
router.get('/patient', authMiddleware, getPatientAppointments);
router.get('/doctor', authMiddleware, getDoctorAppointments);
router.patch('/:appointmentId/status', authMiddleware, updateAppointmentStatus);

module.exports = router;
