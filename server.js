require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const helmet = require('helmet');

const cors = require('cors');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// Security middleware
app.use(helmet({
  xPoweredBy: false,
  noCache: true,
}));

// Custom headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'PHP 7.4.3');
  next();
});

// Static assets
app.use('/public', express.static(`${process.cwd()}/public`));
app.use('/assets', express.static(`${process.cwd()}/assets`));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({ origin: '*' }));

// Main route
app.route('/').get((req, res) => {
  res.sendFile(`${process.cwd()}/views/index.html`);
});

// FCC testing routes
fccTestingRoutes(app);

// 404 handler
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// Server configuration
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
  
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (error) {
        console.error('Test validation failed:\n', error);
      }
    }, 1500);
  }
});

// Initialize WebSocket server
const socketServer = require('./socketServer.js')
socketServer(server);

module.exports = app; // For testing