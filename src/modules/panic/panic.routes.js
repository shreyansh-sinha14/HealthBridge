const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const panicController = require('./panic.controller');

router.post('/trigger', authMiddleware, panicController.triggerPanic);

module.exports = router;
