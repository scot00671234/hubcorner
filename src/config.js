/**
 * Application configuration
 * This allows for easier environment-specific settings
 */

// Default port for the server
const PORT = process.env.PORT || 3001;

// Database path
const DB_PATH = process.env.DB_PATH || './lynxier.db';

// Other configuration options can be added here
const config = {
  PORT,
  DB_PATH,
  // Add more config options as needed
};

module.exports = config;
