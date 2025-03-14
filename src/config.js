
const path = require('path');
const fs = require('fs');

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

module.exports = {
  // Use environment variable for port or default to 3000
  PORT: process.env.PORT || 3000,
  
  // Database path - store in data directory
  DB_PATH: path.join(dataDir, 'hubcorner.sqlite3'),
  
  // API base URL - use relative path in production to avoid CORS issues
  API_BASE_URL: isProduction ? '/api' : 'http://localhost:3000/api',
  
  // Enable debug logging in development
  DEBUG: !isProduction
};
