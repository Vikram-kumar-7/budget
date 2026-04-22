const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET api/sync
// @desc    Get user's entire app state
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user.appData || {});
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT api/sync
// @desc    Update user's entire app state
// @access  Private
router.put('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.appData = req.body;
        // Mark modified since Mixed type doesn't track deep changes automatically
        user.markModified('appData');
        await user.save();
        res.json(user.appData);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
