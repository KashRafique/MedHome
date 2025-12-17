# Metro Bundler Troubleshooting Guide

## Common Errors & Solutions

### 1. "Cannot find module" or "Module not found"
**Solution:**
```bash
cd D:\Programs\medhomie\frontend
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### 2. "Port 8081 already in use"
**Solution:**
```bash
# Find and kill the process using port 8081
# Windows PowerShell:
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Then restart Metro
npm start -- --reset-cache
```

### 3. "Unable to resolve module" (for native modules)
**Solution:**
- Make sure you've rebuilt the Android app after installing native modules
- Clean and rebuild:
```bash
cd android
.\gradlew.bat clean
cd ..
npm start -- --reset-cache
```

### 4. "Error: ENOENT: no such file or directory"
**Solution:**
```bash
# Clear watchman (if installed)
watchman watch-del-all

# Clear Metro cache
npm start -- --reset-cache
```

### 5. "Bundling failed" or "Transform error"
**Solution:**
```bash
# Clear all caches
rm -rf node_modules
rm -rf android/app/build
npm install
npm start -- --reset-cache
```

### 6. Issues with react-native-pdf or react-native-video
**Solution:**
- Make sure Android build is cleaned and rebuilt
- Check that native modules are properly linked
- Try removing and reinstalling:
```bash
npm uninstall react-native-pdf react-native-video rn-fetch-blob
npm install react-native-pdf@6.7.3 react-native-video@5.2.1 rn-fetch-blob@0.12.0
cd android
.\gradlew.bat clean
cd ..
npm start -- --reset-cache
```

## Manual Metro Start

If Metro isn't starting automatically:

```bash
cd D:\Programs\medhomie\frontend
npx react-native start --reset-cache
```

## Check Metro Status

Metro should show:
- "Metro waiting on port 8081"
- "Loading dependency graph, done."
- Ready to bundle your app

## Still Having Issues?

1. Check Node.js version: `node --version` (should be >= 18)
2. Check React Native version compatibility
3. Make sure all dependencies are installed: `npm install`
4. Try clearing all caches and rebuilding












