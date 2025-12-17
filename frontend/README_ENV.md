# Environment Configuration Guide

This project supports multiple environments (dev/prod) with different API URLs.

## Environment Setup

### Development (Local)
- **URL**: `http://192.168.10.5:5000`
- **Use when**: Testing on local device/emulator
- **Command**: `npm run android` or `npm run android:dev`

### Production (UAT)
- **URL**: `http://uat.medhome.courses:5000`
- **Use when**: Building APK for testing/staging
- **Command**: `npm run android:prod` or `npm run android:build:prod`

## Available Commands

### Running on Device/Emulator

```bash
# Development (default) - uses localhost:5000
npm run android
# or explicitly
npm run android:dev

# Production - uses uat.medhome.courses:5000
npm run android:prod
```

### Building APK

```bash
# Build Dev APK
npm run android:build:dev

# Build Prod APK (for UAT/staging)
npm run android:build:prod
```

### Metro Bundler

```bash
# Start Metro with dev environment
npm run start:dev

# Start Metro with prod environment
npm run start:prod
```

## How It Works

1. **Environment Variable**: Set via `ENV` environment variable
   - `ENV=dev` → Uses `http://192.168.10.5:5000`
   - `ENV=prod` → Uses `http://uat.medhome.courses:5000`

2. **Build Flavors**: Android Gradle uses product flavors:
   - `dev` flavor → Development environment
   - `prod` flavor → Production environment

3. **API Configuration**: The `src/config/env.js` file reads the `ENV` variable and sets the appropriate `BASE_URL`.

## Changing API URLs

Edit `src/config/env.js` to update the URLs:

```javascript
const ENVIRONMENTS = {
  dev: {
    BASE_URL: 'http://192.168.10.5:5000', // Change this for dev
  },
  prod: {
    BASE_URL: 'http://uat.medhome.courses:5000', // Change this for prod
  },
};
```

## Notes

- The environment is determined at build time, not runtime
- After changing environment, rebuild the app
- Metro bundler needs to be restarted when switching environments









