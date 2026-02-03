# 🤖 Android-Only PDF Setup Guide

## Quick Setup for MedHome App

---

## ✅ Pre-Check: What You Already Have

From your `package.json`:

- ✅ `react-native-pdf@6.7.5` - Already installed!
- ✅ `react-native-orientation-locker@1.7.0` - Already installed!

---

## 📦 Step 1: Install Missing Dependency

```bash
# Only need to install this one package
npm install react-native-fs@2.20.0

# Link native module
npx react-native link react-native-fs
```

---

## 🔧 Step 2: Android Configuration

### 2.1: Update MainActivity.kt (CRITICAL for Screenshot Prevention)

**Location**: `android/app/src/main/java/com/frontend/MainActivity.kt`

**Current file structure:**
- Package: `com.frontend`
- Component name: `"frontend"`

**Replace the entire file with:**

```kotlin
package com.frontend

import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript.
   */
  override fun getMainComponentName(): String = "frontend"

  /**
   * 🔒 SCREENSHOT PREVENTION
   * Blocks ALL screenshots in the entire app
   * Must be called in onCreate() before super.onCreate()
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Prevent screenshots and screen recording
    window.setFlags(
      WindowManager.LayoutParams.FLAG_SECURE,
      WindowManager.LayoutParams.FLAG_SECURE
    )
  }

  /**
   * Returns the instance of the [ReactActivityDelegate].
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
```

**Key changes:**
- ✅ Added `import android.view.WindowManager`
- ✅ Added `FLAG_SECURE` in `onCreate()` method
- ✅ This prevents ALL screenshots app-wide (not just PDFs)

### 2.2: Verify AndroidManifest.xml

**Location**: `android/app/src/main/AndroidManifest.xml`

**You already have these permissions** (no changes needed):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

✅ All required permissions are already present!

### 2.3: Verify build.gradle

**Location**: `android/app/build.gradle`

**Check `minSdkVersion`:**

```gradle
android {
    defaultConfig {
        minSdkVersion 21  // Must be at least 21 for PDF viewer
        // ... other config
    }
}
```

If your `minSdkVersion` is less than 21, update it to 21 or higher.

### 2.4: Add PDF Viewer Dependency (if needed)

**Location**: `android/app/build.gradle`

**Check if you need to add this dependency** (usually auto-linked, but verify):

```gradle
dependencies {
    // ... existing dependencies
    
    // PDF viewer library (usually auto-linked via react-native-pdf)
    // Only add if you get build errors about missing PDF viewer
    // implementation "com.github.barteksc:android-pdf-viewer:3.2.0-beta.1"
}
```

**Note**: `react-native-pdf` usually handles this automatically via auto-linking.

---

## 📁 Step 3: Add Component Files

You'll need to create these 3 new files:

```
frontend/src/
├── config/
│   └── videoCDN.js                   ← ✅ ALREADY UPDATED
├── components/
│   └── pdf/                          ← CREATE new folder
│       ├── PDFDownloadProgress.js    ← NEW FILE
│       └── SecurePDFReader.js        ← NEW FILE
└── screens/
    └── main/
        └── PDFViewerScreen.js        ← NEW FILE
```

**Note**: The `videoCDN.js` file has already been updated with PDF support. You only need to create the 3 component files.

---

## 🎯 Step 4: Add to Navigation

**In your navigation file** (e.g., `App.js`, `App.tsx`, or wherever you have Stack.Navigator):

```javascript
import PDFViewerScreen from './src/screens/main/PDFViewerScreen';

// In your Stack.Navigator:
<Stack.Screen 
  name="PDFViewer" 
  component={PDFViewerScreen}
  options={{ 
    headerShown: false,
    gestureEnabled: false  // Prevent swipe back during download
  }}
/>
```

---

## ▶️ Step 5: Use in Your Code

### In Your Lesson/Module Screen:

```javascript
import {getLessonContentType} from '../../config/videoCDN';

// When user taps a lesson:
const handleLessonPress = (lesson) => {
  const contentType = getLessonContentType(lesson);
  
  if (contentType === 'pdf') {
    navigation.navigate('PDFViewer', {
      lesson: {
        _id: lesson._id,
        title: lesson.title,
        pdfUrl: lesson.pdfUrl,        // Full URL from backend
        ebookName: lesson.ebookName,  // Optional
      },
      courseId: courseId,
      courseTitle: courseTitle,
    });
  } 
  else if (contentType === 'video') {
    // Your existing video logic
    navigation.navigate('VideoPlayer', {
      lesson: lesson,
      courseId: courseId,
      courseTitle: courseTitle,
    });
  }
  else if (contentType === 'both') {
    // Show choice dialog
    Alert.alert(
      'Choose Content',
      'This lesson has both video and PDF',
      [
        {text: '📄 PDF', onPress: () => {
          navigation.navigate('PDFViewer', {
            lesson: lesson,
            courseId: courseId,
            courseTitle: courseTitle,
          });
        }},
        {text: '🎥 Video', onPress: () => {
          navigation.navigate('VideoPlayer', {
            lesson: lesson,
            courseId: courseId,
            courseTitle: courseTitle,
          });
        }},
        {text: 'Cancel', style: 'cancel'},
      ],
    );
  }
};
```

---

## 🔨 Step 6: Build & Test

```bash
# Clean build
cd android
./gradlew clean
cd ..

# Start metro with cache reset
npx react-native start --reset-cache

# Build and install (in another terminal)
npx react-native run-android

# Or if on real device:
npx react-native run-android --device
```

---

## 🧪 Testing Checklist

### Test Download Progress:

- [ ] Navigate to lesson with PDF
- [ ] Download screen shows immediately
- [ ] Progress bar animates 0% → 100%
- [ ] Shows: %, file size, speed (KB/s), time left
- [ ] Transitions to PDF reader automatically

### Test PDF Reader:

- [ ] PDF displays correctly
- [ ] Page counter shows (e.g., "1/45")
- [ ] Can scroll through pages
- [ ] Back button works
- [ ] Security badge shows at bottom

### Test Screenshot Prevention:

- [ ] Build on **REAL Android device** (not emulator!)
- [ ] Open any screen in app
- [ ] Try screenshot (Volume Down + Power)
- [ ] Should fail or show black screen
- [ ] Android shows: "Can't take screenshot due to security policy"

**⚠️ IMPORTANT**: Screenshot prevention ONLY works on real devices, not emulators!

---

## 🐛 Quick Troubleshooting

### "Cannot find module 'react-native-fs'"

```bash
npm install react-native-fs@2.20.0
npx react-native link react-native-fs
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

### Screenshot prevention not working

1. **Check `MainActivity.kt`** has `FLAG_SECURE` in `onCreate()`
2. **Rebuild completely**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```
3. **MUST test on REAL DEVICE** (doesn't work on emulator!)
4. **Verify package name** is `com.frontend` (not `com.medhome`)

### PDF won't download

1. Check PDF URL in backend response
2. Test URL in browser
3. Check internet connection
4. Check console logs for errors
5. Verify `pdfUrl` field exists in lesson object

### App crashes

```bash
# Complete reset:
npm install
cd android
./gradlew clean
cd ..
npx react-native start --reset-cache
npx react-native run-android
```

### Build errors with react-native-fs

```bash
# If auto-linking fails:
cd android
./gradlew clean
cd ..
npx react-native unlink react-native-fs
npx react-native link react-native-fs
cd android && ./gradlew clean && cd ..
```

---

## ✅ Final Checklist

Before you're done:

- [ ] `react-native-fs@2.20.0` installed
- [ ] `MainActivity.kt` updated with `FLAG_SECURE` (Kotlin syntax)
- [ ] All 3 component files created (PDFDownloadProgress, SecurePDFReader, PDFViewerScreen)
- [ ] PDFViewer added to navigation
- [ ] Built and tested on real Android device
- [ ] Screenshot prevention verified
- [ ] Download progress works
- [ ] PDF displays correctly
- [ ] Package name verified: `com.frontend`
- [ ] Component name verified: `"frontend"`

---

## 📊 What Your Backend Should Return

Your lesson objects should have:

```json
{
  "_id": "lesson123",
  "title": "Gynecology Chapter 1",
  "description": "Introduction to gynecology",
  "order": 1,
  "duration": 30,
  
  // PDF fields
  "pdfUrl": "https://medhome.b-cdn.net/documents/file.pdf",
  "ebookName": "Gynecology Chapter 1",  // Optional
  
  // Video fields (if also has video)
  "video": "video-id-123",
  "videoSource": "bunnycdn",
  
  // Other fields
  "isPreview": false,
  "attachments": []
}
```

The code automatically detects:
- **Has PDF?** → `pdfUrl` exists and is valid HTTPS URL
- **Has Video?** → `video` exists AND `videoSource` === 'bunnycdn'
- **Has Both?** → Both exist

---

## 🎉 You're Done!

That's it! Your Android app now has:

- ✅ Beautiful PDF download progress
- ✅ Secure PDF viewer
- ✅ Screenshot prevention (entire app)
- ✅ Zero breaking changes to existing code
- ✅ Works with your backend structure
- ✅ Kotlin-compatible setup

**Total time**: ~15 minutes

**Questions?** Check the troubleshooting section above.

---

## 📝 Notes

- **Package Name**: `com.frontend` (not `com.medhome`)
- **Component Name**: `"frontend"` (not `"MedHome"`)
- **Language**: Kotlin (not Java)
- **Screenshot Prevention**: Works app-wide, not just PDFs
- **Testing**: Must use real Android device for screenshot prevention



















