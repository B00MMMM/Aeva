const express = require('express');
const axios = require('axios');
const redisClient = require('../config/redis');

const router = express.Router();
const CHEAPSHARK_API = 'https://www.cheapshark.com/api/1.0';

// Middleware to check Redis cache
const checkCache = async (req, res, next) => {
    const key = req.originalUrl;
    try {
        const cachedData = await redisClient.get(key);
        if (cachedData) {
            console.log(`Redis Cache hit for ${key}`);
            return res.json(cachedData);
        }
        console.log(`Redis Cache miss for ${key}`);
        next();
    } catch (err) {
        console.error('Redis cache middleware error:', err);
        next();
    }
};

// Helper to save to Redis cache
const saveToCache = async (key, data, ttlHours = 2) => {
    try {
        // Set data with expiration in seconds (ttlHours * 60 * 60)
        await redisClient.setex(key, ttlHours * 60 * 60, data);
    } catch (err) {
        console.error('Error saving to Redis cache:', err);
    }
};

// Get Trending Deals (Using Top Deals)
router.get('/trending', checkCache, async (req, res) => {
    try {
        const response = await axios.get(`${CHEAPSHARK_API}/deals?storeID=1&lowerPrice=0&sortBy=Deal Rating&onSale=1&pageNumber=0`);
        let deals = response.data.slice(0, 15);

        const enrichedDeals = deals.map((deal) => {
            if (deal.steamAppID) {
                const appId = deal.steamAppID;
                return {
                    ...deal,
                    steamImages: {
                        header: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
                        capsule: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`,
                        hero: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_hero.jpg`,
                        background: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/page_bg_generated_v6b.jpg`,
                    }
                };
            }
            return deal;
        });

        await saveToCache(req.originalUrl, enrichedDeals);
        res.json(enrichedDeals);
    } catch (error) {
        console.error('CheapShark API Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch trending games' });
    }
});

// Steam Search — returns unique games (no duplicate deals)
router.get('/search', checkCache, async (req, res) => {
    try {
        const term = req.query.term || '';
        // Use CheapShark's games endpoint which groups by game (no duplicates)
        const response = await axios.get(`${CHEAPSHARK_API}/games?title=${encodeURIComponent(term)}&limit=20&exact=0`);
        const games = response.data;

        // Fetch extra Steam metadata (like screenshots) ONLY for the top match to keep search fast
        if (games.length > 0 && games[0].steamAppID) {
            try {
                const steamResponse = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${games[0].steamAppID}`);
                const steamData = steamResponse.data[games[0].steamAppID];
                if (steamData && steamData.success && steamData.data.screenshots) {
                    games[0].steamScreenshots = steamData.data.screenshots;
                }
            } catch (steamError) {
                console.error('Steam API Error during search:', steamError.message);
            }
        }

        // Enrich with Steam CDN images
        const enrichedGames = games.map((game) => {
            if (game.steamAppID) {
                const appId = game.steamAppID;
                return {
                    ...game,
                    steamImages: {
                        header: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
                        capsule: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`,
                        hero: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_hero.jpg`,
                        screenshots: game.steamScreenshots || []
                    }
                };
            }
            return game;
        });

        await saveToCache(req.originalUrl, enrichedGames);
        res.json(enrichedGames);
    } catch (error) {
        console.error('Search Error:', error.message);
        res.status(500).json({ message: 'Failed to search games' });
    }
});

// Get Deals (Generic Search — used internally)
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

// Get Info for a Specific Game by CheapShark ID
router.get('/:id', checkCache, async (req, res) => {
    try {
        const gameId = req.params.id;
        const response = await axios.get(`${CHEAPSHARK_API}/games?id=${gameId}`);

        let gameData = response.data;

        // Fetch extra metadata from Steam if steamAppID exists
        if (gameData.info && gameData.info.steamAppID) {
            try {
                const steamResponse = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${gameData.info.steamAppID}`);
                const steamData = steamResponse.data[gameData.info.steamAppID];
                if (steamData && steamData.success) {
                    gameData.steamInfo = steamData.data;
                }
            } catch (steamError) {
                console.error('Steam API Error:', steamError.message);
            }
        }

        await saveToCache(req.originalUrl, gameData);
        res.json(gameData);
    } catch (error) {
        console.error('CheapShark API Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch game details' });
    }
});

// Get Stores
router.get('/stores/list', checkCache, async (req, res) => {
    try {
        const response = await axios.get(`${CHEAPSHARK_API}/stores`);
        await saveToCache(req.originalUrl, response.data, 24);
        res.json(response.data);
    } catch (error) {
        console.error('CheapShark API Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch stores' });
    }
});

module.exports = router;
