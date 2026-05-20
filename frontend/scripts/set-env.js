#!/usr/bin/env node
/**
 * Set the active API environment for React Native builds.
 * Usage: node scripts/set-env.js dev|uat|prod
 *
 * Writes src/config/activeEnv.js (gitignored). URLs live in environments.js.
 */

const fs = require('fs');
const path = require('path');

const env = process.argv[2] || 'dev';

const urls = {
  dev: 'http://localhost:5000',
  uat: 'https://uat.medhome.courses',
  prod: 'https://uat.medhome.courses',
};

if (!Object.keys(urls).includes(env)) {
  console.error('❌ Invalid environment. Use "dev", "uat", or "prod"');
  process.exit(1);
}

const activeEnvPath = path.join(__dirname, '../src/config/activeEnv.js');
const content = `export default '${env}';\n`;

fs.writeFileSync(activeEnvPath, content, 'utf8');
console.log(`✅ Environment set to: ${env.toUpperCase()}`);
console.log(`🔗 API URL: ${urls[env]}`);
