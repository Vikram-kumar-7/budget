const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Helper to get or init appData
async function getUser(userId) {
    const user = await User.findById(userId);
    if (!user.appData) {
        user.appData = { accounts: [], txs: [], goals: [], debts: [], budgets: [], categories: [], jar: { current: 0, goal: 0 } };
    }
    if (!user.appData.accounts)    user.appData.accounts = [];
    if (!user.appData.txs)         user.appData.txs = [];
    if (!user.appData.goals)       user.appData.goals = [];
    if (!user.appData.debts)       user.appData.debts = [];
    if (!user.appData.budgets)     user.appData.budgets = [];
    if (!user.appData.categories)  user.appData.categories = [];
    if (!user.appData.jar)         user.appData.jar = { current: 0, goal: 0 };
    return user;
}

async function saveUser(user) {
    user.markModified('appData');
    await user.save();
}

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────

// GET /api/accounts
router.get('/accounts', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        res.json(user.appData.accounts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/accounts
router.post('/accounts', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        const account = { _id: uuidv4(), ...req.body, createdAt: new Date() };
        user.appData.accounts.push(account);
        // Mark user as having a linked account
        if (!user.hasLinkedAccount) {
            user.hasLinkedAccount = true;
        }
        await saveUser(user);
        res.status(201).json(account);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// PUT /api/accounts/:id
router.put('/accounts/:id', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        const idx = user.appData.accounts.findIndex(a => a._id === req.params.id);
        if (idx === -1) return res.status(404).json({ msg: 'Account not found' });
        user.appData.accounts[idx] = { ...user.appData.accounts[idx], ...req.body };
        await saveUser(user);
        res.json(user.appData.accounts[idx]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE /api/accounts/:id
router.delete('/accounts/:id', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        user.appData.accounts = user.appData.accounts.filter(a => a._id !== req.params.id);
        await saveUser(user);
        res.json({ msg: 'Account removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

// GET /api/transactions
router.get('/transactions', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        res.json(user.appData.txs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/transactions
router.post('/transactions', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        const tx = { _id: uuidv4(), ...req.body, createdAt: new Date() };
        user.appData.txs.unshift(tx); // newest first
        await saveUser(user);
        res.status(201).json(tx);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE /api/transactions/undo/last  — must come BEFORE /:id route
router.delete('/transactions/undo/last', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        if (user.appData.txs.length === 0) return res.status(404).json({ msg: 'No transactions to undo' });
        const removed = user.appData.txs.shift();
        await saveUser(user);
        res.json(removed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE /api/transactions/:id
router.delete('/transactions/:id', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        user.appData.txs = user.appData.txs.filter(t => t._id !== req.params.id);
        await saveUser(user);
        res.json({ msg: 'Transaction removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─── GOALS ────────────────────────────────────────────────────────────────────

// GET /api/goals
router.get('/goals', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        res.json(user.appData.goals);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/goals
router.post('/goals', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        const goal = { _id: uuidv4(), ...req.body, savedAmount: 0, createdAt: new Date() };
        user.appData.goals.push(goal);
        await saveUser(user);
        res.status(201).json(goal);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// PUT /api/goals/:id
router.put('/goals/:id', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        const idx = user.appData.goals.findIndex(g => g._id === req.params.id);
        if (idx === -1) return res.status(404).json({ msg: 'Goal not found' });
        user.appData.goals[idx] = { ...user.appData.goals[idx], ...req.body };
        await saveUser(user);
        res.json(user.appData.goals[idx]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE /api/goals/:id
router.delete('/goals/:id', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        user.appData.goals = user.appData.goals.filter(g => g._id !== req.params.id);
        await saveUser(user);
        res.json({ msg: 'Goal removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─── DEBTS ────────────────────────────────────────────────────────────────────

// GET /api/debts
router.get('/debts', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        res.json(user.appData.debts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/debts
router.post('/debts', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        const debt = { _id: uuidv4(), ...req.body, isPaid: false, createdAt: new Date() };
        user.appData.debts.push(debt);
        await saveUser(user);
        res.status(201).json(debt);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// PUT /api/debts/:id
router.put('/debts/:id', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        const idx = user.appData.debts.findIndex(d => d._id === req.params.id);
        if (idx === -1) return res.status(404).json({ msg: 'Debt not found' });
        user.appData.debts[idx] = { ...user.appData.debts[idx], ...req.body };
        await saveUser(user);
        res.json(user.appData.debts[idx]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE /api/debts/:id
router.delete('/debts/:id', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        user.appData.debts = user.appData.debts.filter(d => d._id !== req.params.id);
        await saveUser(user);
        res.json({ msg: 'Debt removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─── BUDGETS ─────────────────────────────────────────────────────────────────

// GET /api/budgets
router.get('/budgets', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        res.json(user.appData.budgets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/budgets
router.post('/budgets', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        const budget = { _id: uuidv4(), ...req.body, createdAt: new Date() };
        user.appData.budgets.push(budget);
        await saveUser(user);
        res.status(201).json(budget);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE /api/budgets/:id
router.delete('/budgets/:id', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        user.appData.budgets = user.appData.budgets.filter(b => b._id !== req.params.id);
        await saveUser(user);
        res.json({ msg: 'Budget removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─── JAR (Savings Jar) ────────────────────────────────────────────────────────

// GET /api/jar
router.get('/jar', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        res.json(user.appData.jar);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// PUT /api/jar
router.put('/jar', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        user.appData.jar = { ...user.appData.jar, ...req.body };
        await saveUser(user);
        res.json(user.appData.jar);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

// GET /api/categories
router.get('/categories', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        res.json(user.appData.categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/categories
router.post('/categories', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        const cat = { _id: uuidv4(), ...req.body };
        user.appData.categories.push(cat);
        await saveUser(user);
        res.status(201).json(cat);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE /api/categories/:id
router.delete('/categories/:id', auth, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        user.appData.categories = user.appData.categories.filter(c => c._id !== req.params.id);
        await saveUser(user);
        res.json({ msg: 'Category removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
