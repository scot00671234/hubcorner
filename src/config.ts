
// Determine if we're in production or development
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';

// Export configuration variables
export const config = {
  // API base URL - different handling for production vs development
  API_BASE_URL: isProduction 
    ? window.location.origin + '/api' 
    : 'http://localhost:3000/api',
  
  // Enable debug logging in development
  DEBUG: !isProduction
};
