const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const {getAllUsers, getAllDoctors, getAllAppointments, getAllPatients} = require('./adminn.controller');

router.get('/users', authMiddleware, getAllUsers);
router.get('/patients', authMiddleware, getAllPatients);
router.get('/doctors', authMiddleware, getAllDoctors);
router.get('/appointments', authMiddleware, getAllAppointments);
module.exports = router;