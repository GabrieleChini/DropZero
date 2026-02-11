const mongoose = require('mongoose');

const tariffSchema = new mongoose.Schema({
    tariffId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    type: { type: String, enum: ['DOMESTIC', 'COMMERCIAL', 'PUBLIC'], required: true },
    municipality: { type: String, required: true },
    effectiveDate: { type: Date, required: true },
    expiryDate: { type: Date },
    baseRate: { type: Number, required: true },
    fixedCharge: { type: Number, required: true },
    fixedChargeWeekly: Number,
    consumptionBrackets: [{
        minM3: Number,
        maxM3: Number,
        ratePerM3: Number,
        description: String
    }],
    taxRate: { type: Number, default: 0.10 },
    seasonalAdjustment: {
        summer: Number,
        winter: Number
    },
    isActive: { type: Boolean, default: true },
    notes: String
}, { timestamps: true });

tariffSchema.index({ type: 1, municipality: 1, effectiveDate: -1 });

module.exports = mongoose.model('Tariff', tariffSchema);
