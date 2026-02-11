const Meter = require('../models/Meter');
const WeeklyReading = require('../models/WeeklyReading');

// @desc    Get aggregated stats for the municipality
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getTerritorialStats = async (req, res) => {
    try {
        // 1. Total Active Meters
        const totalMeters = await Meter.countDocuments({ status: 'ACTIVE' });

        // 2. Aggregate LATEST reading for EACH meter
        const latestReadings = await WeeklyReading.aggregate([
            { $sort: { meterId: 1, weekEndDate: -1 } },
            { $group: { _id: "$meterId", latest: { $first: "$$ROOT" } } }
        ]);

        const totalConsumptionLastWeek = latestReadings.reduce((acc, r) => acc + r.latest.volumeM3, 0);
        const activeAlerts = latestReadings.filter(r => r.latest.volumeM3 > 8).length;

        res.json({
            municipality: 'Trento',
            totalMeters,
            totalConsumptionLastWeek: parseFloat(totalConsumptionLastWeek.toFixed(2)),
            activeAlerts,
            metersByZone: [] // Handled by separate map call usually, or add here if needed
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

        // Get LATEST reading for EACH meter
        const latestReadings = await WeeklyReading.aggregate([
            { $sort: { meterId: 1, weekEndDate: -1 } },
            { $group: { _id: "$meterId", latest: { $first: "$$ROOT" } } }
        ]);

        // Get all meters to map MeterID -> Zone
        const allMeters = await Meter.find({ status: 'ACTIVE' }, 'meterId zone');
        const meterZoneMap = {};
        allMeters.forEach(m => meterZoneMap[m._id.toString()] = m.zone);

        // Calculate stats per zone
        latestReadings.forEach(r => {
            const zoneName = meterZoneMap[r._id.toString()];
            const zone = zones.find(z => z.name === zoneName);
            if (zone) {
                zone.consumption += r.latest.volumeM3;
                if (r.latest.volumeM3 > 8) zone.anomalies++;
            }
        });

        // Round and set status
        zones.forEach(zone => {
            zone.consumption = parseFloat(zone.consumption.toFixed(1));
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
        // Get LATEST reading for EACH meter, filtered by threshold
        const latestReadings = await WeeklyReading.aggregate([
            { $sort: { meterId: 1, weekEndDate: -1 } },
            { $group: { _id: "$meterId", latest: { $first: "$$ROOT" } } },
            { $match: { "latest.volumeM3": { $gt: 8 } } }
        ]);

        // Enhance with Meter info (for Zone)
        const meterIds = latestReadings.map(r => r._id);
        const meters = await Meter.find({ _id: { $in: meterIds } });
        const meterMap = {};
        meters.forEach(m => meterMap[m._id.toString()] = m);

        const alerts = latestReadings.map(r => {
            const meter = meterMap[r._id.toString()];
            const severity = r.latest.volumeM3 > 15 ? 'CRITICAL' : 'WARNING';

            return {
                id: r.latest._id,
                zone: meter ? meter.zone : 'N/A',
                volume: r.latest.volumeM3,
                severity,
                date: r.latest.weekEndDate
            };
        });

        alerts.sort((a, b) => (a.severity === 'CRITICAL' ? -1 : 1));
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
