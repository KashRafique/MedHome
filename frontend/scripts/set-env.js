#!/usr/bin/env node
/**
 * Script to set environment variable for React Native builds
 * Usage: node scripts/set-env.js dev|prod
 * 
 * This script updates src/config/env.js to set the correct environment
 */

const fs = require('fs');
const path = require('path');

const env = process.argv[2] || 'dev';

if (!['dev', 'prod'].includes(env)) {
  console.error('❌ Invalid environment. Use "dev" or "prod"');
  process.exit(1);
}

const envConfigPath = path.join(__dirname, '../src/config/env.js');
let envConfig = fs.readFileSync(envConfigPath, 'utf8');

// Replace the ENV assignment line
// Match: let ENV = 'dev'; // Default to dev - Updated by build scripts
const regex = /let ENV = ['"][^'"]*['"]; \/\/ Default to dev[^;]*/;
const replacement = `let ENV = '${env}'; // Default to dev - Updated by build scripts`;

if (regex.test(envConfig)) {
  envConfig = envConfig.replace(regex, replacement);
  fs.writeFileSync(envConfigPath, envConfig, 'utf8');
  console.log(`✅ Environment set to: ${env.toUpperCase()}`);

  // Show which URL will be used
  const urls = {
    dev: 'http://localhost:5000',
    prod: 'http://uat.medhome.courses:5000',
  };
  console.log(`🔗 API URL: ${urls[env]}`);
} else {
  console.error('❌ Could not find ENV variable in env.js. File structure may have changed.');
  process.exit(1);
}

