// Resolves API config from committed environments + local activeEnv (gitignored).
import {ENVIRONMENTS} from './environments';
import ACTIVE_ENV from './activeEnv';

const ENV = ACTIVE_ENV;

const getEnvConfig = () => {
  const config = ENVIRONMENTS[ENV];
  if (!config) {
    console.warn(`Unknown environment: ${ENV}, falling back to dev`);
    return ENVIRONMENTS.dev;
  }
  return config;
};

export const ENV_CONFIG = getEnvConfig();

export const BASE_URL = ENV_CONFIG.BASE_URL;
export const API_BASE_URL = ENV_CONFIG.API_BASE_URL;
export const ENV_NAME = ENV_CONFIG.ENV_NAME;
export const CURRENT_ENV = ENV;

if (__DEV__) {
  console.log(`🌍 Environment: ${ENV_NAME} (${ENV})`);
  console.log(`🔗 API Base URL: ${BASE_URL}`);
}
