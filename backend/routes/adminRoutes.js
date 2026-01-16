const express = require('express');
const router = express.Router();
const { getTerritorialStats, getMapData, getAlerts } = require('../controllers/adminController');

router.get('/stats', getTerritorialStats);
router.get('/map', getMapData);
router.get('/alerts', getAlerts);

module.exports = router;
