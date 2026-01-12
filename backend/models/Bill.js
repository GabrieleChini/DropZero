const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    billId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter', required: true },
    billingPeriodStart: { type: Date, required: true },
    billingPeriodEnd: { type: Date, required: true },
    billingCycleWeeks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WeeklyReading' }],
    billIssueDate: { type: Date, required: true },
    billDueDate: { type: Date, required: true },
    billStatus: { type: String, enum: ['DRAFT', 'ISSUED', 'PAID', 'OVERDUE'], default: 'DRAFT' },
    consumptionData: {
        totalVolumeL: Number,
        totalVolumeM3: Number,
        averageWeeklyL: Number,
        maxWeeklyL: Number,
        weekCount: Number
    },
    costBreakdown: {
        fixedChargeTotal: Number,
        consumptionCostTotal: Number,
        taxesTotal: Number,
        previousBalance: Number,
        totalBeforeTax: Number,
        totalAmount: Number,
        discount: Number,
        finalAmount: Number
    },
    tariffApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Tariff' },
    paymentMethod: { type: String, enum: ['BANK_TRANSFER', 'CREDIT_CARD', 'PENDING'] },
    paymentDate: Date,
    notes: String
}, { timestamps: true });

billSchema.index({ userId: 1, billingPeriodEnd: -1 });

module.exports = mongoose.model('Bill', billSchema);
