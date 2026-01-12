const mongoose = require('mongoose');

const territorialStatisticSchema = new mongoose.Schema({
    statisticsId: { type: String, required: true, unique: true },
    municipality: { type: String, required: true },
    zone: { type: String, required: true },
    statisticsDate: { type: Date, required: true },
    userCount: Number,
    meterCount: Number,
    consumptionMetrics: {
        totalVolumeL: Number,
        averagePerUserL: Number,
        averagePerWeekL: Number,
        medianConsumptionL: Number,
        stdDeviation: Number,
        minWeeklyL: Number,
        maxWeeklyL: Number
    },
    costMetrics: {
        totalCost: Number,
        averagePerUser: Number,
        medianCost: Number
    },
    meterTypeBreakdown: {
        domestic: Number,
        commercial: Number,
        public: Number
    },
    heatmapIntensity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    userCountValid: Boolean
}, { timestamps: true });

territorialStatisticSchema.index({ municipality: 1, statisticsDate: -1 });

module.exports = mongoose.model('TerritorialStatistic', territorialStatisticSchema);
