// Environment configuration
// This file determines which API URL to use based on build type
// The set-env.js script updates this file before building

// ⚠️ DO NOT EDIT THIS LINE MANUALLY - It's updated by scripts/set-env.js
let ENV = 'dev'; // Default to dev - Updated by build scripts;

const ENVIRONMENTS = {
  dev: {
    ENV_NAME: 'development',
    BASE_URL: 'http://localhost:5000',
    API_BASE_URL: 'http://localhost:5000/api',
  },
  prod: {
    ENV_NAME: 'production',
    BASE_URL: 'http://uat.medhome.courses:5000',
    API_BASE_URL: 'http://uat.medhome.courses:5000/api',
  },
};

// Get current environment config
const getEnvConfig = () => {
  const config = ENVIRONMENTS[ENV];
  if (!config) {
    console.warn(`Unknown environment: ${ENV}, falling back to dev`);
    return ENVIRONMENTS.dev;
  }
  return config;
};

export const ENV_CONFIG = getEnvConfig();

// Export individual values for convenience
export const BASE_URL = ENV_CONFIG.BASE_URL;
export const API_BASE_URL = ENV_CONFIG.API_BASE_URL;
export const ENV_NAME = ENV_CONFIG.ENV_NAME;
export const CURRENT_ENV = ENV;

// Log current environment (only in dev mode)
if (__DEV__) {
  console.log(`🌍 Environment: ${ENV_NAME} (${ENV})`);
  console.log(`🔗 API Base URL: ${BASE_URL}`);
}

