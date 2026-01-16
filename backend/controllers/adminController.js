const Meter = require('../models/Meter');
const WeeklyReading = require('../models/WeeklyReading');

// @desc    Get aggregated stats for the municipality
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getTerritorialStats = async (req, res) => {
    try {
        // 1. Total Active Meters
        const totalMeters = await Meter.countDocuments({ status: 'ACTIVE' });

        // 2. Total Consumption (Last Week)
        // Find the LATEST reading date across ALL readings
        const latestReadingDoc = await WeeklyReading.findOne().sort({ weekEndDate: -1 });

        let totalConsumptionLastWeek = 0;
        let activeAlerts = 0;

        if (latestReadingDoc) {
            const targetDate = new Date(latestReadingDoc.weekEndDate);
            // Ensure we match purely on the date part if necessary, but since seed is normalized, exact match works
            // To be safe against minor drifts, we can query a range of 24h around the target date
            const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

            const lastWeekReadings = await WeeklyReading.find({
                weekEndDate: { $gte: startOfDay, $lte: endOfDay }
            });

            totalConsumptionLastWeek = lastWeekReadings.reduce((acc, r) => acc + r.volumeM3, 0);

            // Simulate alerts based on high consumption (> 10m3 is high for domestic weekly)
            activeAlerts = lastWeekReadings.filter(r => r.volumeM3 > 8).length;
        }

        // 3. Zone Breakdown (Simple aggregation)
        const metersByZone = await Meter.aggregate([
            { $match: { status: 'ACTIVE' } },
            { $group: { _id: "$zone", count: { $sum: 1 } } }
        ]);

        res.json({
            municipality: 'Trento',
            totalMeters,
            totalConsumptionLastWeek: parseFloat(totalConsumptionLastWeek.toFixed(2)),
            activeAlerts,
            metersByZone
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get map data (Zones with status)
// @route   GET /api/admin/map
// @access  Private (Admin)
exports.getMapData = async (req, res) => {
    try {
        const zones = [
            { name: 'Gardolo', status: 'OK', consumption: 0, anomalies: 0 },
            { name: 'Meano', status: 'OK', consumption: 0, anomalies: 0 },
            { name: 'Bondone', status: 'OK', consumption: 0, anomalies: 0 },
            { name: 'Sardagna', status: 'OK', consumption: 0, anomalies: 0 },
            { name: 'Ravina-Romagnano', status: 'OK', consumption: 0, anomalies: 0 },
            { name: 'Argentario', status: 'OK', consumption: 0, anomalies: 0 },
            { name: 'Povo', status: 'OK', consumption: 0, anomalies: 0 },
            { name: 'Mattarello', status: 'OK', consumption: 0, anomalies: 0 },
            { name: 'Villazzano', status: 'OK', consumption: 0, anomalies: 0 },
            { name: 'Oltrefersina', status: 'OK', consumption: 0, anomalies: 0 },
            { name: 'San Giuseppe-Santa Chiara', status: 'OK', consumption: 0, anomalies: 0 },
            { name: 'Centro Storico - Piedicastello', status: 'OK', consumption: 0, anomalies: 0 }
        ];

        // Aggregate consumption by zone for the last week
        const latestReadingDoc = await WeeklyReading.findOne().sort({ weekEndDate: -1 });
        if (!latestReadingDoc) return res.json(zones);

        const targetDate = new Date(latestReadingDoc.weekEndDate);
        const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

        const lastWeekReadings = await WeeklyReading.find({
            weekEndDate: { $gte: startOfDay, $lte: endOfDay }
        });

        // Get all meters to map MeterID -> Zone
        const allMeters = await Meter.find({ status: 'ACTIVE' }, 'meterId zone');
        const meterZoneMap = {};
        allMeters.forEach(m => meterZoneMap[m._id.toString()] = m.zone);

        // Calculate stats per zone
        lastWeekReadings.forEach(r => {
            const zoneName = meterZoneMap[r.meterId.toString()];
            const zone = zones.find(z => z.name === zoneName);
            if (zone) {
                zone.consumption += r.volumeM3;
                if (r.volumeM3 > 8) zone.anomalies++;
            }
        });

        // Round and set status
        zones.forEach(zone => {
            zone.consumption = parseFloat(zone.consumption.toFixed(1));
            // Determine status logic (Thresholds scaled by meter count normally, simplified here)
            if (zone.anomalies > 2) zone.status = 'CRITICAL';
            else if (zone.anomalies > 0) zone.status = 'WARNING';
            else zone.status = 'OK';
        });

        res.json(zones);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get list of specific alerts/anomalies
// @route   GET /api/admin/alerts
// @access  Private (Admin)
exports.getAlerts = async (req, res) => {
    try {
        const latestReadingDoc = await WeeklyReading.findOne().sort({ weekEndDate: -1 });
        if (!latestReadingDoc) return res.json([]);

        const targetDate = new Date(latestReadingDoc.weekEndDate);
        const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

        // Find high consumption readings
        const highReadings = await WeeklyReading.find({
            weekEndDate: { $gte: startOfDay, $lte: endOfDay },
            volumeM3: { $gt: 8 } // Threshold
        }).populate('userId', 'firstName lastName address email');

        // Enhance with Meter info (for Zone)
        const meterIds = highReadings.map(r => r.meterId);
        const meters = await Meter.find({ _id: { $in: meterIds } });
        const meterMap = {};
        meters.forEach(m => meterMap[m._id.toString()] = m);

        const alerts = highReadings.map(r => {
            const meter = meterMap[r.meterId.toString()];
            const severity = r.volumeM3 > 15 ? 'CRITICAL' : 'WARNING';

            return {
                id: r._id,
                user: r.userId ? `${r.userId.firstName} ${r.userId.lastName}` : 'Utente Sconosciuto',
                address: r.userId ? r.userId.address : 'Indirizzo non disp.',
                zone: meter ? meter.zone : 'N/A',
                volume: r.volumeM3,
                severity,
                date: r.weekEndDate
            };
        });

        // Sort Critical first
        alerts.sort((a, b) => (a.severity === 'CRITICAL' ? -1 : 1));

        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
