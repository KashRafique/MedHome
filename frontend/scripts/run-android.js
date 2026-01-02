#!/usr/bin/env node

/**
 * Wrapper script for react-native run-android that handles applicationIdSuffix
 * Builds the app and then launches it with the correct package name
 */

const { execSync } = require('child_process');

const mode = process.argv[2] || 'devDebug';
const isDev = mode.includes('dev');

// Set environment
const envScript = isDev ? 'dev' : 'prod';
console.log(`📦 Setting environment to: ${envScript.toUpperCase()}`);
try {
  execSync(`node scripts/set-env.js ${envScript}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to set environment');
  process.exit(1);
}

// Reverse port for dev
if (isDev) {
  console.log('🔗 Setting up port forwarding...');
  try {
    execSync('adb reverse tcp:5000 tcp:5000', { stdio: 'inherit' });
  } catch (error) {
    console.warn('Warning: Could not set up port forwarding');
  }
}

// Build and install
console.log(`🔨 Building and installing app (mode: ${mode})...`);
try {
  // Run react-native run-android - it will build and install, but launch may fail
  // We'll catch that and launch manually
  execSync(`react-native run-android --mode=${mode}`, { 
    stdio: 'inherit'
  });
} catch (error) {
  // React Native CLI may exit with error code 1 if launch fails
  // but the build/install might have succeeded
  console.log('⚠️  Note: Auto-launch may have failed (this is expected with applicationIdSuffix)');
}

// Always try to launch manually with correct package name
console.log('🚀 Launching app with correct package name...');
const packageName = isDev ? 'com.frontend.dev' : 'com.frontend';
const activityName = 'com.frontend.MainActivity';

try {
  execSync(`adb shell am start -n ${packageName}/${activityName} -a android.intent.action.MAIN -c android.intent.category.LAUNCHER`, { 
    stdio: 'inherit' 
  });
  console.log('✅ App launched successfully!');
} catch (error) {
  console.error('❌ Failed to launch app. Make sure the app is installed.');
  console.error('   You can try manually: adb shell am start -n', packageName + '/' + activityName);
  process.exit(1);
}

