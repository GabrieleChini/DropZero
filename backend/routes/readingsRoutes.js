const express = require('express');
const router = express.Router();
const { getDashboardStats, getHistory, getChartData, addReading, getAdvice } = require('../controllers/readingsController');

// All routes here should be protected in a real app, adding auth middleware layer later
router.get('/dashboard/:userId', getDashboardStats);
router.get('/history/:userId', getHistory);
router.get('/chart/:userId', getChartData);
router.get('/advice/:userId', getAdvice);
router.post('/', addReading);

module.exports = router;
