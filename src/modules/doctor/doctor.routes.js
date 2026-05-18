const express = require('express');
const router = express.Router();
const {saveDoctorProfile, getDoctorProfile, getAllDoctors} = require('./doctor.controller');
const authMiddleware = require('../../middleware/auth.middleware');

router.post('/profile', authMiddleware, saveDoctorProfile);
router.get('/profile', authMiddleware, getDoctorProfile);
router.get('/list', authMiddleware, getAllDoctors);

module.exports = router;