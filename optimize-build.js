/**
 * Optimize Build
 * 
 * This script creates an optimized build configuration for production deployment.
 * It modifies various files as needed to improve build performance.
 */

import * as fs from 'fs';
import { exec } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we're in production mode
process.env.NODE_ENV = 'production';

// Create a temporary deployment configuration file
console.log('Creating deployment configuration...');
const deploymentsConfigContent = `
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
`;

fs.writeFileSync(path.join(__dirname, 'deployment-config.js'), deploymentsConfigContent);
console.log('✅ Created deployment-config.js');

// Make sure environment variables are set
console.log('Setting NODE_ENV to production...');
process.env.NODE_ENV = 'production';

// Create optimization hints file for the build process
console.log('Creating optimization hints...');
const optimizationHints = `
# Build optimization hints
# This file is read by the build process to optimize the build

# Use production mode
NODE_ENV=production

# Ensure proper authentication in production
PRODUCTION_DOMAIN=cpxtbmining.com
`;

fs.writeFileSync(path.join(__dirname, '.build-optimization'), optimizationHints);
console.log('✅ Created .build-optimization file');

// Check if we're ready for production
console.log('Checking production readiness...');
exec('node production-env-check.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Production environment check failed: ${error.message}`);
    process.exit(1);
  }
  
  if (stderr) {
    console.error(`❌ Error during environment check: ${stderr}`);
    process.exit(1);
  }
  
  console.log(stdout);
  console.log('✅ Production environment check passed!');
  console.log('\nOptimizations complete! Ready for production deployment.');
  console.log('To deploy:');
  console.log('1. Click the "Deploy" button in the Replit UI');
  console.log('2. Ensure all environment variables are properly set in production');
  console.log('3. Monitor the deployment logs for any issues');
});