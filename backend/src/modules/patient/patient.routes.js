const express = require('express');
const router = express.Router();
const {savePatientProfile, getPatientProfile} = require('./patient.controller');
const authMiddleware = require('../../middleware/auth.middleware');

router.post('/profile', authMiddleware, savePatientProfile);
router.get('/profile', authMiddleware, getPatientProfile);

module.exports = router;
