const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Cache for stats with file watching
let statsCache = null;
let lastModified = null;

// Calculate comprehensive stats
function calculateStats(items) {
  if (!items || items.length === 0) {
    return {
      total: 0,
      averagePrice: 0,
      categories: {},
      priceRange: { min: 0, max: 0 }
    };
  }

  const prices = items.map(item => item.price);
  const categories = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  return {
    total: items.length,
    averagePrice: prices.reduce((sum, price) => sum + price, 0) / items.length,
    categories,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices)
    },
    lastUpdated: new Date().toISOString()
  };
}

// Check if cache is valid by comparing file modification time
async function isCacheValid() {
  try {
    const stats = await fs.stat(DATA_PATH);
    return lastModified && stats.mtime.getTime() === lastModified.getTime();
  } catch (error) {
    return false;
  }
}

// Update cache with fresh data
async function updateCache() {
  try {
    const stats = await fs.stat(DATA_PATH);
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const items = JSON.parse(raw);
    
    statsCache = calculateStats(items);
    lastModified = stats.mtime;
    
    return statsCache;
  } catch (error) {
    throw new Error(`Failed to update stats cache: ${error.message}`);
  }
}

// GET /api/stats - Cached with file watching
router.get('/', async (req, res, next) => {
  try {
    // Check if we need to update cache
    if (!statsCache || !(await isCacheValid())) {
      await updateCache();
    }

    res.json(statsCache);
  } catch (err) {
    next(err);
  }
});

module.exports = router;