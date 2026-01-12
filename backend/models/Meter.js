const mongoose = require('mongoose');

const meterSchema = new mongoose.Schema({
    meterId: { type: String, required: true, unique: true }, // SN-001-BOLOGNA-001
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    meterType: { type: String, enum: ['DOMESTIC', 'COMMERCIAL', 'PUBLIC'], default: 'DOMESTIC' },
    location: { type: String, required: true },
    installationDate: { type: Date, default: Date.now },
    deviceType: { type: String },
    serialNumber: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'], default: 'ACTIVE' },
    lastMaintenance: { type: Date },
    communicationMethod: { type: String, enum: ['WIRELESS', 'WIRED', 'MANUAL'], default: 'WIRELESS' },
    municipality: { type: String },
    zone: { type: String },
    coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' } // [longitude, latitude]
    }
}, { timestamps: true });

module.exports = mongoose.model('Meter', meterSchema);
