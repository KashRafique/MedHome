/**
 * API URLs per environment. Committed to git — update here when hosts change.
 * Run `node scripts/set-env.js dev|uat|prod` before release builds.
 */
export const ENVIRONMENTS = {
  dev: {
    ENV_NAME: 'development',
    BASE_URL: 'http://localhost:5000',
    API_BASE_URL: 'http://localhost:5000/api',
  },
  uat: {
    ENV_NAME: 'uat',
    BASE_URL: 'https://uat.medhome.courses',
    API_BASE_URL: 'https://uat.medhome.courses/api',
  },
  prod: {
    ENV_NAME: 'production',
    BASE_URL: 'https://uat.medhome.courses',
    API_BASE_URL: 'https://uat.medhome.courses/api',
  },
};
