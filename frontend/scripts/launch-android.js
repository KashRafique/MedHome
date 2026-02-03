#!/usr/bin/env node

/**
 * Helper script to launch Android app with correct package name
 * Accounts for applicationIdSuffix in build.gradle
 */

const { execSync } = require('child_process');

// Get build mode from command line args
const mode = process.argv[2] || 'devDebug';
const isDev = mode.includes('dev');

// Determine package name based on flavor
const packageName = isDev ? 'com.medhome.dev' : 'com.medhome';
const activityName = 'com.medhome.MainActivity';

console.log(`🚀 Launching app with package: ${packageName}`);

try {
  const command = `adb shell am start -n ${packageName}/${activityName} -a android.intent.action.MAIN -c android.intent.category.LAUNCHER`;
  execSync(command, { stdio: 'inherit' });
  console.log('✅ App launched successfully!');
} catch (error) {
  console.error('❌ Failed to launch app:', error.message);
  process.exit(1);
}

