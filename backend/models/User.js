const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    // Core identity
    username: {
        type: String,
        sparse: true
    },
    name: {
        type: String,
        required: true,
        default: 'User'
    },
    age: {
        type: Number,
        default: null
    },
    monthlyIncome: {
        type: Number,
        default: 0
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // Profile
    avatar: {
        type: String,
        default: 'avatar_1'
    },
    currency: {
        type: String,
        default: '₹'
    },
    // Onboarding status
    isOnboarded: {
        type: Boolean,
        default: false
    },
    // Account tracking
    hasLinkedAccount: {
        type: Boolean,
        default: false
    },
    // OTP fields (temporary, for email verification)
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    dateJoined: {
        type: Date,
        default: Date.now
    },
    // Contains the entire BudgetMaster app state for this user
    appData: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            pin: null,
            pinSet: false,
            accounts: [],
            txs: [],
            goals: [],
            debts: [],
            budgets: []
        }
    }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
