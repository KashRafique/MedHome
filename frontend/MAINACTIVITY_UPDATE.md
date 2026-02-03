# MainActivity.kt Update - Screenshot Prevention

## File Location
`android/app/src/main/java/com/frontend/MainActivity.kt`

## Current Package & Component
- **Package**: `com.frontend`
- **Component Name**: `"frontend"`

## Required Changes

### Add Import
```kotlin
import android.view.WindowManager
```

### Add onCreate Method
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  
  // 🔒 SCREENSHOT PREVENTION - Prevents ALL screenshots in app
  window.setFlags(
    WindowManager.LayoutParams.FLAG_SECURE,
    WindowManager.LayoutParams.FLAG_SECURE
  )
}
```

## Complete Updated File

```kotlin
package com.frontend

import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "frontend"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // 🔒 SCREENSHOT PREVENTION - Prevents ALL screenshots in app
    window.setFlags(
      WindowManager.LayoutParams.FLAG_SECURE,
      WindowManager.LayoutParams.FLAG_SECURE
    )
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
```

## Important Notes

1. **App-Wide Protection**: This prevents screenshots in the ENTIRE app, not just PDFs
2. **Real Device Only**: Screenshot prevention only works on real Android devices, not emulators
3. **Testing**: After updating, rebuild the app completely:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

## Verification

After updating, test on a real Android device:
1. Open any screen in the app
2. Try to take a screenshot (Volume Down + Power)
3. Should fail with: "Can't take screenshot due to security policy"



















