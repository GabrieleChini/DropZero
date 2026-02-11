const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getTerritorialStats, getMapData, getAlerts } = require('../controllers/adminController');

router.get('/stats', protect, admin, getTerritorialStats);
router.get('/map', protect, admin, getMapData);
router.get('/alerts', protect, admin, getAlerts);

module.exports = router;
