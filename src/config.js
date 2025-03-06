/**
 * Application configuration
 * This allows for easier environment-specific settings
 */

// Default port for the server - use CloudPanel's configured port (3000) as default
const PORT = process.env.PORT || 3000;

// Database path - store in the home directory for persistence
const DB_PATH = process.env.DB_PATH || '/home/run-lynxier/data/lynxier.db';

// Other configuration options can be added here
const config = {
  PORT,
  DB_PATH,
  // Add more config options as needed
};

module.exports = config;
