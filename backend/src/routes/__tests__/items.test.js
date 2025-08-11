const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const itemsRouter = require('../items');

// Create test app with error handling
const app = express();
app.use(express.json());
app.use('/api/items', itemsRouter);

// Add error handling middleware for tests
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    message,
    status: statusCode
  });
});

// Mock data path for testing
const TEST_DATA_PATH = path.join(__dirname, '../../../../data/items.json');

// Sample test data
const testData = [
  { id: 1, name: "Laptop Pro", category: "Electronics", price: 2499 },
  { id: 2, name: "Noise Cancelling Headphones", category: "Electronics", price: 399 },
  { id: 3, name: "Ultra-Wide Monitor", category: "Electronics", price: 999 },
  { id: 4, name: "Ergonomic Chair", category: "Furniture", price: 799 },
  { id: 5, name: "Standing Desk", category: "Furniture", price: 1199 }
];

// Backup original data and restore after tests
let originalData;

beforeAll(async () => {
  try {
    const data = await fs.readFile(TEST_DATA_PATH, 'utf8');
    originalData = JSON.parse(data);
  } catch (error) {
    originalData = [];
  }
});

afterAll(async () => {
  // Restore original data
  try {
    await fs.writeFile(TEST_DATA_PATH, JSON.stringify(originalData, null, 2));
  } catch (error) {
    console.warn('Could not restore original data:', error.message);
  }
});

beforeEach(async () => {
  // Reset to test data before each test
  await fs.writeFile(TEST_DATA_PATH, JSON.stringify(testData, null, 2));
});

describe('GET /api/items', () => {
  it('should return all items with pagination info', async () => {
    const response = await request(app)
      .get('/api/items')
      .expect(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.items).toHaveLength(5);
    expect(response.body.pagination.total).toBe(5);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.totalPages).toBe(1);
  });

  it('should support pagination with limit and page', async () => {
    const response = await request(app)
      .get('/api/items?limit=2&page=2')
      .expect(200);

    expect(response.body.items).toHaveLength(2);
    expect(response.body.pagination.page).toBe(2);
    expect(response.body.pagination.pageSize).toBe(2);
    expect(response.body.pagination.totalPages).toBe(3);
    expect(response.body.pagination.hasNext).toBe(true);
    expect(response.body.pagination.hasPrev).toBe(true);
  });

  it('should support search by name', async () => {
    const response = await request(app)
      .get('/api/items?q=laptop')
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].name).toBe('Laptop Pro');
  });

  it('should support search by category', async () => {
    const response = await request(app)
      .get('/api/items?q=electronics')
      .expect(200);

    expect(response.body.items).toHaveLength(3);
    expect(response.body.items.every(item => item.category === 'Electronics')).toBe(true);
  });

  it('should return empty results for non-matching search', async () => {
    const response = await request(app)
      .get('/api/items?q=nonexistent')
      .expect(200);

    expect(response.body.items).toHaveLength(0);
    expect(response.body.pagination.total).toBe(0);
  });

  it('should handle pagination beyond available pages', async () => {
    const response = await request(app)
      .get('/api/items?page=10')
      .expect(200);

    expect(response.body.items).toHaveLength(0);
    expect(response.body.pagination.page).toBe(10);
    expect(response.body.pagination.hasNext).toBe(false);
  });
});

describe('GET /api/items/:id', () => {
  it('should return a specific item by ID', async () => {
    const response = await request(app)
      .get('/api/items/1')
      .expect(200);

    expect(response.body).toEqual(testData[0]);
  });

  it('should return 404 for non-existent item', async () => {
    const response = await request(app)
      .get('/api/items/999')
      .expect(404);

    expect(response.body).toHaveProperty('message');
  });

  it('should return 400 for invalid item ID', async () => {
    const response = await request(app)
      .get('/api/items/invalid')
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });

  it('should handle string IDs that can be parsed to numbers', async () => {
    const response = await request(app)
      .get('/api/items/1')
      .expect(200);

    expect(response.body.id).toBe(1);
  });
});

describe('POST /api/items', () => {
  it('should create a new item successfully', async () => {
    const newItem = {
      name: 'Test Item',
      category: 'Test Category',
      price: 100
    };

    const response = await request(app)
      .post('/api/items')
      .send(newItem)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(newItem.name);
    expect(response.body.category).toBe(newItem.category);
    expect(response.body.price).toBe(newItem.price);

    // Verify item was added to data
    const getResponse = await request(app)
      .get('/api/items')
      .expect(200);
    
    expect(getResponse.body.pagination.total).toBe(6);
  });

  it('should validate required fields', async () => {
    const invalidItem = {
      name: 'Test Item'
      // missing category and price
    };

    await request(app)
      .post('/api/items')
      .send(invalidItem)
      .expect(400);
  });

  it('should validate price is a number', async () => {
    const invalidItem = {
      name: 'Test Item',
      category: 'Test Category',
      price: 'invalid'
    };

    await request(app)
      .post('/api/items')
      .send(invalidItem)
      .expect(400);
  });

  it('should validate price is positive', async () => {
    const invalidItem = {
      name: 'Test Item',
      category: 'Test Category',
      price: -100
    };

    await request(app)
      .post('/api/items')
      .send(invalidItem)
      .expect(400);
  });

  it('should trim whitespace from name and category', async () => {
    const newItem = {
      name: '  Test Item  ',
      category: '  Test Category  ',
      price: 100
    };

    const response = await request(app)
      .post('/api/items')
      .send(newItem)
      .expect(201);

    expect(response.body.name).toBe('Test Item');
    expect(response.body.category).toBe('Test Category');
  });

  it('should handle empty request body', async () => {
    await request(app)
      .post('/api/items')
      .send({})
      .expect(400);
  });
});

describe('Error Handling', () => {
  it('should handle file read errors gracefully', async () => {
    // Temporarily move the data file to simulate read error
    const tempPath = TEST_DATA_PATH + '.backup';
    await fs.rename(TEST_DATA_PATH, tempPath);

    try {
      await request(app)
        .get('/api/items')
        .expect(500);
    } finally {
      // Restore the file
      await fs.rename(tempPath, TEST_DATA_PATH);
    }
  });
});
