
// Determine if we're in production or development
const isProduction = import.meta.env.PROD;

// Export configuration variables
export const config = {
  // API base URL - use relative path in production to avoid CORS issues
  API_BASE_URL: isProduction ? '/api' : '/api',
  
  // Enable debug logging in development
  DEBUG: !isProduction
};
