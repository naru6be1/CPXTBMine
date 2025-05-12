/**
 * Fix Build Path Script
 * 
 * This script addresses the issue with the production build where main.tsx cannot be found.
 * It creates a temporary copy of the main.tsx file in the correct location as expected by
 * the production build process.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting build path fix...');
console.log('Current working directory:', process.cwd());

// Set NODE_ENV to production
process.env.NODE_ENV = 'production';
console.log('Set NODE_ENV to:', process.env.NODE_ENV);

try {
  // Check for the src directory inside the project root
  const srcDir = path.join(__dirname, 'src');
  if (!fs.existsSync(srcDir)) {
    console.log('Creating src directory at project root...');
    fs.mkdirSync(srcDir, { recursive: true });
  }

  // Source and destination paths
  const sourcePath = path.join(__dirname, 'client', 'src', 'main.tsx');
  const destPath = path.join(__dirname, 'src', 'main.tsx');

  // Check if the source file exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Source file not found at ${sourcePath}`);
    process.exit(1);
  }

  // Create a symbolic link or copy the file
  console.log(`Copying main.tsx from ${sourcePath} to ${destPath}`);
  fs.copyFileSync(sourcePath, destPath);
  
  console.log('✅ Successfully created main.tsx in the root src directory');
  
  // Create an index.css file in the src directory if needed
  const sourceIndexCss = path.join(__dirname, 'client', 'src', 'index.css');
  const destIndexCss = path.join(__dirname, 'src', 'index.css');
  
  if (fs.existsSync(sourceIndexCss)) {
    console.log(`Copying index.css from ${sourceIndexCss} to ${destIndexCss}`);
    fs.copyFileSync(sourceIndexCss, destIndexCss);
    console.log('✅ Successfully created index.css in the root src directory');
  }
  
  // Create App.tsx in the src directory
  const sourceApp = path.join(__dirname, 'client', 'src', 'App.tsx');
  const destApp = path.join(__dirname, 'src', 'App.tsx');
  
  if (fs.existsSync(sourceApp)) {
    console.log(`Copying App.tsx from ${sourceApp} to ${destApp}`);
    fs.copyFileSync(sourceApp, destApp);
    console.log('✅ Successfully created App.tsx in the root src directory');
  }

  console.log('Build path fix completed successfully!');
  console.log('You can now attempt the production build.');
} catch (error) {
  console.error('Error during build path fix:', error);
  process.exit(1);
}