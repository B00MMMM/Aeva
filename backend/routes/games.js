const express = require('express');
const axios = require('axios');
const Cache = require('../models/Cache');

const router = express.Router();
const CHEAPSHARK_API = 'https://www.cheapshark.com/api/1.0';

// Middleware to check cache
const checkCache = async (req, res, next) => {
    const key = req.originalUrl;
    try {
        const cachedData = await Cache.findOne({ key });
        if (cachedData && cachedData.expiresAt > new Date()) {
            console.log(`Cache hit for ${key}`);
            return res.json(cachedData.data);
        }
        // Delete expired cache safely
        if (cachedData) {
            await Cache.deleteOne({ key });
        }
        console.log(`Cache miss for ${key}`);
        next();
    } catch (err) {
        console.error('Cache middleware error:', err);
        next();
    }
};

// Helper to save to cache
const saveToCache = async (key, data, ttlHours = 2) => {
    try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + ttlHours);
        await Cache.findOneAndUpdate(
            { key },
            { key, data, expiresAt },
            { upsert: true, new: true }
        );
    } catch (err) {
        console.error('Error saving to cache:', err);
    }
};

// Get Trending Deals (Using Top Deals)
router.get('/trending', checkCache, async (req, res) => {
    try {
        // Fetch deals sorted by Deal Rating, Metacritic, or Savings
        const response = await axios.get(`${CHEAPSHARK_API}/deals?storeID=1&lowerPrice=0&sortBy=Deal Rating&onSale=1&pageNumber=0`);
        const deals = response.data.slice(0, 15); // Top 15 deals

        await saveToCache(req.originalUrl, deals);
        res.json(deals);
    } catch (error) {
        console.error('CheapShark API Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch trending games' });
    }
});

// Get Deals (Generic Search)
router.get('/deals', checkCache, async (req, res) => {
    try {
        const title = req.query.title || '';
        let url = `${CHEAPSHARK_API}/deals?sortBy=Deal Rating`;
        if (title) url += `&title=${encodeURIComponent(title)}`;

        const response = await axios.get(url);
        await saveToCache(req.originalUrl, response.data.slice(0, 20));
        res.json(response.data.slice(0, 20));
    } catch (error) {
        console.error('CheapShark API Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch deals' });
    }
});

// Get Info for a Specific Game by ID
router.get('/:id', checkCache, async (req, res) => {
    try {
        const gameId = req.params.id;
        const response = await axios.get(`${CHEAPSHARK_API}/games?id=${gameId}`);

        await saveToCache(req.originalUrl, response.data);
        res.json(response.data);
    } catch (error) {
        console.error('CheapShark API Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch game details' });
    }
});

// Get Stores
router.get('/stores/list', checkCache, async (req, res) => {
    try {
        const response = await axios.get(`${CHEAPSHARK_API}/stores`);
        await saveToCache(req.originalUrl, response.data, 24); // Cache stores for 24 hours
        res.json(response.data);
    } catch (error) {
        console.error('CheapShark API Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch stores' });
    }
});

module.exports = router;
