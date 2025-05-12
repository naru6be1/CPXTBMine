
// This file is auto-generated for production deployment
// It contains optimized settings for better performance
export const DEPLOYMENT_CONFIG = {
  // Force production mode
  NODE_ENV: 'production',
  
  // Enable session security for production
  SESSION_CONFIG: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict'
  }
};
