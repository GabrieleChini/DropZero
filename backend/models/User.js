const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // Will be hashed
    userType: { type: String, enum: ['PRIVATE', 'ADMIN'], default: 'PRIVATE' },
    firstName: { type: String, required: function () { return this.userType === 'PRIVATE'; } },
    lastName: { type: String, required: function () { return this.userType === 'PRIVATE'; } },
    codiceFiscale: { type: String, unique: true, sparse: true },
    address: { type: String },
    phoneNumber: { type: String },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'DELETED'], default: 'ACTIVE' },
    roles: { type: [String], default: ['user'] },
    lastLogin: { type: Date },
    lastLoginIP: { type: String },
    preferences: {
        notificationChannels: { type: [String], enum: ['PUSH', 'EMAIL', 'IN_APP'], default: ['EMAIL'] },
        language: { type: String, default: 'it' },
        theme: { type: String, default: 'LIGHT' }
    }
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

// Password verification method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
