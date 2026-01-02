# Quick Fix for RNFS Error

## The Problem
The error `Cannot read property 'RNFSFileTypeRegular' of null` happens because:
1. The native module loads before JavaScript is ready, OR
2. The app needs to be fully restarted (not just reloaded) after building

## Solution Steps

### Step 1: Stop Everything
1. **Close the app completely** on your device/emulator
2. **Stop Metro bundler** (Ctrl+C in the terminal running Metro)
3. **Close any other terminals** running React Native commands

### Step 2: Clear Cache and Restart Metro
```powershell
cd frontend
npx react-native start --reset-cache
```

**Keep this terminal running!**

### Step 3: In a NEW Terminal, Rebuild and Install
```powershell
cd frontend
npm run android
```

### Step 4: Open the App Fresh
- **Don't reload** (pressing 'r' in Metro)
- **Don't shake device** and reload
- **Fully close and reopen** the app from the app drawer

## Why This Works

The native module (`RNFSManager`) is only available after:
1. ✅ The app is built with native code
2. ✅ The app is installed on the device
3. ✅ The app is **fully restarted** (not just JS reloaded)

A simple JS reload doesn't reinitialize native modules - you need a full app restart.

## If It Still Doesn't Work

Try a complete clean rebuild:

```powershell
cd frontend

# Clean everything
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force android\app\build
Remove-Item -Recurse -Force android\build
Remove-Item -Recurse -Force android\.gradle

# Reinstall
npm install

# Clean Android
cd android
.\gradlew clean
cd ..

# Rebuild
npx react-native start --reset-cache
# In another terminal:
npm run android
```

## Verification

After following these steps:
- ✅ App opens without RNFS errors
- ✅ PDF viewer screen loads
- ✅ No "frontend has not been registered" error

