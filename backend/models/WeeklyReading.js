const mongoose = require('mongoose');

const weeklyReadingSchema = new mongoose.Schema({
    readingId: { type: String, required: true, unique: true }, // WR-20251206-001
    meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStartDate: { type: Date, required: true },
    weekEndDate: { type: Date, required: true },
    readingDate: { type: Date, default: Date.now },
    previousReading: { type: Number, required: true },
    currentReading: { type: Number, required: true },
    volumeConsumed: { type: Number, required: true }, // Liters
    volumeM3: { type: Number },
    readingType: { type: String, enum: ['TELELETTURA', 'MANUALE'], default: 'TELELETTURA' },
    dataQuality: { type: String, enum: ['VALID', 'ESTIMATED', 'SUSPICIOUS'], default: 'VALID' },
    cost: { type: Number }, // Estimated cost
    costBreakdown: {
        baseRate: Number,
        consumptionCost: Number,
        fixedCharge: Number,
        taxes: Number
    },
    syncedAt: { type: Date }
}, { timestamps: true });

// Compound index for efficient querying
weeklyReadingSchema.index({ meterId: 1, weekEndDate: -1 });
weeklyReadingSchema.index({ userId: 1, weekEndDate: -1 });

module.exports = mongoose.model('WeeklyReading', weeklyReadingSchema);
