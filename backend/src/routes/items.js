const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Utility to read data asynchronously
async function readData() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to read data: ${error.message}`);
  }
}

// Utility to write data asynchronously
async function writeData(data) {
  try {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`Failed to write data: ${error.message}`);
  }
}

// GET /api/items - Enhanced with pagination and search
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { limit, page = 1, q } = req.query;
    let results = data;

    // Server-side search
    if (q) {
      const searchTerm = q.toLowerCase().trim();
      results = results.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
      );
    }

    // Pagination
    const pageSize = limit ? parseInt(limit) : 50; // Default page size
    const pageNumber = parseInt(page);
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedResults = results.slice(startIndex, endIndex);
    
    res.json({
      items: paginatedResults,
      pagination: {
        total: results.length,
        page: pageNumber,
        pageSize: pageSize,
        totalPages: Math.ceil(results.length / pageSize),
        hasNext: endIndex < results.length,
        hasPrev: pageNumber > 1
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const itemId = parseInt(req.params.id);
    
    if (isNaN(itemId)) {
      const err = new Error('Invalid item ID');
      err.status = 400;
      throw err;
    }
    
    const item = data.find(i => i.id === itemId);
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    // Validate payload
    const { name, category, price } = req.body;
    
    if (!name || !category || typeof price !== 'number') {
      const err = new Error('Invalid payload. Name, category, and price are required.');
      err.status = 400;
      throw err;
    }
    
    if (price < 0) {
      const err = new Error('Price must be a positive number.');
      err.status = 400;
      throw err;
    }
    
    const data = await readData();
    const item = {
      id: Date.now(),
      name: name.trim(),
      category: category.trim(),
      price: parseFloat(price)
    };
    
    data.push(item);
    await writeData(data);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;