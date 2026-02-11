const mongoose = require('mongoose');

const consumptionHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter', required: true },
    period: { type: String, enum: ['WEEKLY', 'MONTHLY', 'YEARLY'], required: true },
    periodDate: { type: Date, required: true }, // Start of period
    periodStartDate: { type: Date, required: true },
    periodEndDate: { type: Date, required: true },
    year: { type: Number, required: true },
    month: { type: Number }, // 1-12
    week: { type: Number }, // 1-52
    consumptionData: {
        previousReading: Number,
        currentReading: Number,
        totalVolumeMc: Number,
        totalVolumeL: Number,
        readingType: String,
        averageDailyL: Number,
        minDailyL: Number,
        maxDailyL: Number
    },
    consumptionByTariff: [{
        tariffName: String,
        minMc: Number,
        maxMc: Number,
        consumedMc: Number,
        ratePerMc: Number,
        costEuro: Number
    }],
    costBreakdown: {
        waterFixed: Number,
        waterVariableTotal: Number,
        sewerageFixed: Number,
        sewerageVariable: Number,
        treatmentFixed: Number,
        treatmentVariable: Number,
        totalBeforeTax: Number,
        taxAmount: Number,
        totalAmount: Number,
        finalAmount: Number,
        paidAmount: Number,
        paymentDate: Date
    },
    billMetadata: {
        billId: String,
        billNumber: String,
        issueDate: Date,
        dueDate: Date,
        billStatus: { type: String, enum: ['ISSUED', 'PAID', 'OVERDUE'] }
    },
    statistics: {
        trend: { type: String, enum: ['UP', 'DOWN', 'STABLE'] },
        trendPercentage: Number,
        averageHourlyL: Number,
        anomalyDetected: Boolean,
        weeklyReadings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WeeklyReading' }],
        readingCount: Number
    }
}, { timestamps: true });

consumptionHistorySchema.index({ userId: 1, period: 1, periodDate: -1 });

module.exports = mongoose.model('ConsumptionHistory', consumptionHistorySchema);
