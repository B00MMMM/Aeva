const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const redisClient = require('../config/redis');

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

// --- Search History using Redis ---

// Save a search term to user's history
router.post('/searches', auth, async (req, res) => {
    const { term } = req.body;
    if (!term) return res.status(400).json({ message: 'Search term is required' });

    try {
        const userId = req.user.id;
        const redisKey = `user_searches:${userId}`;

        // ZADD adds the term with the current timestamp as the score, handling duplicates
        await redisClient.zadd(redisKey, {
            score: Date.now(),
            member: term.trim().toLowerCase()
        });

        // ZREMRANGEBYRANK keeps only the top 10 most recent searches (-11 to negative infinity)
        // 0 is lowest score (oldest), -1 is highest score (newest)
        const totalElements = await redisClient.zcard(redisKey);
        if (totalElements > 10) {
            await redisClient.zremrangebyrank(redisKey, 0, totalElements - 11);
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error saving search to Redis:', err);
        res.status(500).json({ message: 'Server error saving search' });
    }
});

// Get recent search history
router.get('/searches', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const redisKey = `user_searches:${userId}`;

        // Get all members, sorted by score descending (newest first)
        // Upstash SDK recommends using zrange with { rev: true } instead of deprecated zrevrange
        const recentSearches = await redisClient.zrange(redisKey, 0, 9, { rev: true });

        res.json(recentSearches || []);
    } catch (err) {
        console.error('Error fetching searches from Redis:', err);
        res.status(500).json({ message: 'Server error fetching searches' });
    }
});

// Clear all search history
router.delete('/searches', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const redisKey = `user_searches:${userId}`;

        await redisClient.del(redisKey);
        res.json({ success: true });
    } catch (err) {
        console.error('Error clearing searches from Redis:', err);
        res.status(500).json({ message: 'Server error clearing searches' });
    }
});

// Clear specific search term
router.delete('/searches/item', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const redisKey = `user_searches:${userId}`;
        const { term } = req.body;

        if (!term) return res.status(400).json({ message: 'Search term is required' });

        await redisClient.zrem(redisKey, term.trim().toLowerCase());
        res.json({ success: true });
    } catch (err) {
        console.error('Error removing specific search term from Redis:', err);
        res.status(500).json({ message: 'Server error removing search term' });
    }
});

module.exports = router;
