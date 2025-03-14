
// Determine if we're in production or development
const isProduction = import.meta.env.PROD;

// Export configuration variables
export const config = {
  // API base URL - use full URL in development to avoid CORS issues
  API_BASE_URL: isProduction ? '/api' : 'http://localhost:3000/api',
  
  // Enable debug logging in development
  DEBUG: !isProduction
};
