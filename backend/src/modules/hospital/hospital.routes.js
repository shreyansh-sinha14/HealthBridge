const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const {saveHospitalProfile, getHospitalProfile, getActivePanics, acknowledgePanic, resolvePanic, updateResources, getHospitalResources, getHospitalForPatients} = require('./hospital.controller');

router.post('/profile', authMiddleware, saveHospitalProfile);
router.get('/profile', authMiddleware, getHospitalProfile);
router.get('/panic/active', authMiddleware, getActivePanics);
router.patch('/panic/:panicId/acknowledge', authMiddleware, acknowledgePanic);
router.patch('/panic/:panicId/resolve', authMiddleware, resolvePanic);
router.patch('/resources', authMiddleware, updateResources);
router.get('/resources/:hospitalId', authMiddleware, getHospitalResources);
router.get('/public/list', authMiddleware, getHospitalForPatients);

module.exports = router;