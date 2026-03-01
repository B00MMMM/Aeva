const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Toggle like on a game
router.post('/like', auth, async (req, res) => {
    const { gameID, title, thumb, steamAppID } = req.body;
    try {
        const user = await User.findById(req.user.id);
        const idx = user.likedGames.findIndex(g => g.gameID === String(gameID));
        let liked;

        if (idx > -1) {
            // Unlike
            user.likedGames.splice(idx, 1);
            liked = false;
        } else {
            // Like
            user.likedGames.push({ gameID: String(gameID), title, thumb, steamAppID });
            liked = true;
        }

        await user.save();
        res.json({ liked, likedGames: user.likedGames });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get liked games
router.get('/likes', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('likedGames');
        res.json(user.likedGames);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Set a price alert
router.post('/alert', auth, async (req, res) => {
    const { gameID, title, thumb, steamAppID, targetPrice } = req.body;
    try {
        const user = await User.findById(req.user.id);
        // Update existing or add new
        const idx = user.priceAlerts.findIndex(a => a.gameID === String(gameID));

        if (idx > -1) {
            user.priceAlerts[idx].targetPrice = targetPrice;
        } else {
            user.priceAlerts.push({ gameID: String(gameID), title, thumb, steamAppID, targetPrice });
        }

        await user.save();
        res.json({ priceAlerts: user.priceAlerts });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove a price alert
router.delete('/alert/:gameID', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.priceAlerts = user.priceAlerts.filter(a => a.gameID !== req.params.gameID);
        await user.save();
        res.json({ priceAlerts: user.priceAlerts });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all alerts
router.get('/alerts', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('priceAlerts');
        res.json(user.priceAlerts);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all tracked (liked + alerts)
router.get('/tracked', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('likedGames priceAlerts');
        res.json({ likedGames: user.likedGames, priceAlerts: user.priceAlerts });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
