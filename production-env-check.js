/**
 * Production Environment Variable Checker
 * 
 * This script checks if all required environment variables for production
 * are properly set. Run this before deploying to ensure your production
 * environment is configured correctly.
 */

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// Define required environment variables for production
const requiredVars = [
  'DATABASE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'PRODUCTION_DOMAIN',
  'SESSION_SECRET',
  'BASE_RPC_API_KEY',
  'PGHOST',
  'PGUSER',
  'PGPASSWORD',
  'PGDATABASE',
  'PGPORT'
];

// Define authentication-specific variables
const authVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SESSION_SECRET'
];

// Track missing variables
const missingVars = [];
const missingAuthVars = [];

console.log('Checking production environment variables:');
console.log('=============================================');

// Check for missing variables
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
    if (authVars.includes(varName)) {
      missingAuthVars.push(varName);
    }
    console.log(`❌ ${varName}: Missing`);
  } else {
    // Don't print the actual values for security reasons
    const value = process.env[varName];
    const sanitizedValue = value.length > 8 
      ? `${value.substring(0, 3)}...${value.substring(value.length - 3)}` 
      : '******';
    console.log(`✅ ${varName}: ${sanitizedValue}`);
  }
});

console.log('=============================================');

// Check for production domain 
if (process.env.PRODUCTION_DOMAIN) {
  console.log(`Production Domain: ${process.env.PRODUCTION_DOMAIN}`);
  
  // Verify callback URL configuration
  const expectedCallbackUrl = `https://${process.env.PRODUCTION_DOMAIN}/api/auth/google/callback`;
  console.log(`Expected Google callback URL: ${expectedCallbackUrl}`);
  console.log('Verify this matches your Google OAuth configuration');
} else {
  console.log('⚠️ PRODUCTION_DOMAIN not set - Google OAuth may not work correctly');
}

// Authentication specific checks
if (missingAuthVars.length > 0) {
  console.log('\n⚠️ AUTHENTICATION WARNING:');
  console.log('Some variables required for authentication are missing:');
  missingAuthVars.forEach(varName => console.log(`- ${varName}`));
  console.log('This may cause issues with Google OAuth in production.');
} else {
  console.log('\n✅ Authentication configuration looks good!');
}

// Summary
if (missingVars.length > 0) {
  console.log('\n⚠️ ACTION REQUIRED:');
  console.log('Please set the following environment variables before deploying:');
  missingVars.forEach(varName => console.log(`- ${varName}`));
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
  console.log('Your application is ready for production deployment.');
}