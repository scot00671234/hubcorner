
const path = require('path');
const fs = require('fs');

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Get application port from environment or use default
const PORT = process.env.PORT || 3000;

// Ensure data directory exists with absolute path
const dataDir = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory at ${dataDir}`);
}

// Verify permissions on data directory
try {
  const testFilePath = path.join(dataDir, '.permission_test');
  fs.writeFileSync(testFilePath, 'test');
  fs.unlinkSync(testFilePath);
  console.log('Data directory is writable');
} catch (e) {
  console.error('Warning: Data directory is not writable:', e.message);
  console.error('Please check permissions on:', dataDir);
}

module.exports = {
  // Use environment variable for port or default to 3000
  PORT,
  
  // Database path - store in data directory with absolute path
  DB_PATH: path.join(dataDir, 'hubcorner.sqlite3'),
  
  // API base URL - use relative path in production to avoid CORS issues
  API_BASE_URL: '/api',
  
  // Enable debug logging in development
  DEBUG: !isProduction
};
