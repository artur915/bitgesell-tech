const express = require('express');
const path = require('path');
const morgan = require('morgan');
const itemsRouter = require('./routes/items');
const statsRouter = require('./routes/stats');
const cors = require('cors');
const { getCookie, notFound } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
// Basic middleware
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/items', itemsRouter);
app.use('/api/stats', statsRouter);

// Not Found
app.use('*', notFound);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    message,
    status: statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

getCookie();

app.listen(port, () => console.log('Backend running on http://localhost:' + port));