const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ── Email transporter (Gmail) ─────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendOtpEmail(toEmail, otp) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        // Fallback: log to console if email not configured
        console.log(`\n🔐 OTP for ${toEmail}: ${otp}\n`);
        return;
    }
    await transporter.sendMail({
        from: `"BudgetMaster" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: '🔐 Your BudgetMaster Verification Code',
        html: `
            <div style="font-family: 'Outfit', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0A0E19; color: #E8F0FE; border-radius: 16px; padding: 32px; border: 1px solid rgba(255,255,255,0.08);">
                <h2 style="color: #10E8A0; margin-bottom: 8px;">BudgetMaster</h2>
                <p style="color: #5A6A88; margin-bottom: 24px;">Your personal finance companion</p>
                <p style="font-size: 16px; margin-bottom: 16px;">Your verification code is:</p>
                <div style="background: #111827; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; border: 1px solid rgba(16,232,160,0.2);">
                    <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #10E8A0;">${otp}</span>
                </div>
                <p style="color: #5A6A88; font-size: 13px;">This code expires in <strong style="color: #FFB020;">10 minutes</strong>. Do not share it with anyone.</p>
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 24px 0;" />
                <p style="color: #5A6A88; font-size: 12px;">If you did not request this, please ignore this email.</p>
            </div>
        `,
    });
}


// Helper to generate JWT
const signToken = (userId) => new Promise((resolve, reject) => {
    jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
        if (err) reject(err);
        else resolve(token);
    });
});

// Safe user object (no password, no otp)
const safeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    age: user.age,
    monthlyIncome: user.monthlyIncome,
    currency: user.currency,
    isOnboarded: user.isOnboarded,
    hasLinkedAccount: user.hasLinkedAccount,
    dateJoined: user.dateJoined,
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/send-otp
// @desc    Generate and send (console.log) a 6-digit OTP for email verification
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Find or create a placeholder user record to store the OTP
        let user = await User.findOne({ email });
        if (user) {
            user.otp = otp;
            user.otpExpiry = otpExpiry;
            await user.save();
        } else {
            // Store OTP temporarily — user will be finalized on /register
            // We create a minimal temp record. It gets overwritten on register.
            user = new User({
                name: 'pending',
                email,
                password: 'temp_' + Math.random().toString(36),
                otp,
                otpExpiry,
                isOnboarded: false,
            });
            await user.save();
        }

        // Send OTP via email (or console.log if email not configured)
        await sendOtpEmail(email, otp);

        res.json({ success: true, message: 'OTP sent to email (check server logs)' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/verify-otp
// @desc    Verify the 6-digit OTP
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ msg: 'Email and OTP are required' });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: 'No OTP found for this email. Please request a new one.' });
        if (!user.otp || user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
        if (!user.otpExpiry || new Date() > user.otpExpiry) return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

        res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Complete registration with full user details
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    const { name, age, monthlyIncome, email, password, avatar } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Name, email, and password are required' });
    }

    try {
        // Check if email already belongs to a fully onboarded user
        let user = await User.findOne({ email, isOnboarded: true });
        if (user) {
            return res.status(400).json({ msg: 'An account with this email already exists. Please log in.' });
        }

        // Find the temp user created during OTP flow, or create fresh
        user = await User.findOne({ email });
        if (user) {
            // Update temp user with full details
            user.name = name;
            user.age = age || null;
            user.monthlyIncome = monthlyIncome || 0;
            user.password = password; // will be hashed by pre-save hook
            user.avatar = avatar || 'avatar_1';
            user.isOnboarded = true;
            user.otp = null;
            user.otpExpiry = null;
            user.appData = { accounts: [], txs: [], goals: [], debts: [], budgets: [] };
        } else {
            user = new User({
                name,
                age: age || null,
                monthlyIncome: monthlyIncome || 0,
                email,
                password,
                avatar: avatar || 'avatar_1',
                isOnboarded: true,
                appData: { accounts: [], txs: [], goals: [], debts: [], budgets: [] },
            });
        }

        await user.save();

        const token = await signToken(user.id);
        res.json({ token, user: safeUser(user) });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email, isOnboarded: true });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const token = await signToken(user.id);
        res.json({ token, user: safeUser(user) });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get current authenticated user
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp -otpExpiry');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(safeUser(user));
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/auth/user  (legacy alias for /me)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp -otpExpiry');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(safeUser(user));
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/auth/update-profile
// @desc    Update user's name
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/update-profile', auth, async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ msg: 'Name is required' });

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.name = name.trim();
        await user.save();

        res.json({ success: true, user: safeUser(user) });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/change-password
// @desc    Change user's password (verify current password first)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ msg: 'Current and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ msg: 'New password must be at least 6 characters' });

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });

        user.password = newPassword; // pre-save hook will hash it
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/auth/currency  (legacy)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.put('/currency', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.currency = req.body.currency;
        await user.save();
        res.json({ currency: user.currency });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
