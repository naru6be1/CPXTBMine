/**
 * Production Environment Checker
 * 
 * This script verifies that all required environment variables are properly set
 * before attempting to build and deploy the application to production.
 */

// List of required environment variables for production
const requiredVariables = [
  'DATABASE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SESSION_SECRET',
  'VITE_WEB3AUTH_CLIENT_ID',
  'BASE_RPC_API_KEY',
  'ADMIN_PRIVATE_KEY'
];

// List of optional but recommended variables
const recommendedVariables = [
  'STRIPE_SECRET_KEY',
  'VITE_STRIPE_PUBLIC_KEY',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASSWORD'
];

console.log('Checking production environment variables...');

// Check required variables
let missingRequired = [];
for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    missingRequired.push(variable);
  }
}

// Check recommended variables
let missingRecommended = [];
for (const variable of recommendedVariables) {
  if (!process.env[variable]) {
    missingRecommended.push(variable);
  }
}

// Report findings
if (missingRequired.length === 0) {
  console.log('✅ All required environment variables are set');
} else {
  console.error('❌ Missing required environment variables:');
  missingRequired.forEach(variable => console.error(`   - ${variable}`));
  console.error('\nPlease add these variables to your .env file or Replit Secrets before deploying');
  process.exit(1);
}

if (missingRecommended.length === 0) {
  console.log('✅ All recommended environment variables are set');
} else {
  console.warn('⚠️ Missing recommended environment variables:');
  missingRecommended.forEach(variable => console.warn(`   - ${variable}`));
  console.warn('\nThese variables are not required but may limit functionality if missing');
}

// Check for valid production domains
if (!process.env.BASE_URL && !process.env.PRODUCTION_DOMAIN) {
  console.warn('⚠️ No production domain specified (BASE_URL or PRODUCTION_DOMAIN)');
  console.warn('   Consider setting BASE_URL=https://cpxtbmining.com in your .env file');
}

// Validate Google OAuth callback URL configuration
if (process.env.GOOGLE_CLIENT_ID) {
  console.log('ℹ️ Google OAuth is configured. Make sure the callback URL in the Google Console includes:');
  console.log('   - https://cpxtbmining.com/api/auth/google/callback');
}

console.log('\nEnvironment check completed successfully');