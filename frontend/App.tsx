// App.tsx
import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegistrationScreen from './src/screens/auth/RegistrationScreen';
import EmailVerificationScreen from './src/screens/auth/EmailVerificationScreen';
import EmailVerifiedScreen from './src/screens/auth/EmailVerifiedScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';

// Main Screens
import HomeScreen from './src/screens/main/HomeScreen';
import CourseDetailScreen from './src/screens/main/CourseDetailScreen';
import VideoPlayerScreen from './src/screens/main/VideoPlayerScreen';
import PDFViewerScreen from './src/screens/main/PDFViewerScreen';
import QuizScreen from './src/screens/main/QuizScreen';
import QuizResultsScreen from './src/screens/main/QuizResultsScreen';
import MyCoursesScreen from './src/screens/main/MyCoursesScreen';
import PaymentsScreen from './src/screens/drawer/PaymentsScreen';
import CustomDrawerContent from './src/navigation/CustomDrawerContent';
import { COLORS } from './src/constants/colors';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
        },
      }}>
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: 'All Courses' }} />
      <Drawer.Screen name="MyCourses" component={MyCoursesScreen} options={{ title: 'My Courses' }} />
      <Drawer.Screen name="Payments" component={PaymentsScreen} options={{ title: 'Payments' }} />
    </Drawer.Navigator>
  );
}

function App() {
  const navigationRef = React.useRef<any>(null);

  useEffect(() => {
    // Handle deep links when app is already open
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // Handle deep links when app is opened from closed state
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      linkingSubscription.remove();
    };
  }, []);

  const handleDeepLink = ({ url }: { url: string }) => {
    console.log('🔗 Deep link received:', url);

    if (!url) return;

    try {
      // Handle HTTPS App Links (from email)
      if (url.startsWith('https://uat.medhome.courses')) {
        console.log('🌐 HTTPS App Link detected');
        
        // Parse URL: https://uat.medhome.courses/auth/reset-password/{token}
        // or: https://uat.medhome.courses/verify-email/{token}
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        
        console.log('📍 Path parts:', pathParts);
        
        // Handle reset-password
        if (pathParts[0] === 'auth' && pathParts[1] === 'reset-password' && pathParts[2]) {
          const token = pathParts[2];
          console.log('🔐 Extracted reset token from App Link:', token ? token.substring(0, 10) + '...' : 'null');
          
          if (token && navigationRef.current) {
            navigationRef.current.navigate('ResetPassword', { token });
          }
          return; // Don't process custom scheme logic for HTTPS links
        }
        
        // Handle verify-email
        if (pathParts[0] === 'verify-email' && pathParts[1]) {
          const token = pathParts[1];
          console.log('🔐 Extracted verify token from App Link:', token ? token.substring(0, 10) + '...' : 'null');
          
          if (token && navigationRef.current) {
            navigationRef.current.navigate('EmailVerified', { token });
          }
          return; // Don't process custom scheme logic for HTTPS links
        }
        
        return; // Don't process custom scheme logic for HTTPS links
      }
      
      // Handle custom scheme (medhomie://)
      if (url.startsWith('medhomie://')) {
        console.log('📱 Custom scheme deep link detected');
        
        const route = url.replace(/.*?:\/\//g, ''); // Remove scheme
        const routeName = route.split('?')[0].split('/')[0]; // Get route name (first part)
        const params = route.split('?')[1]; // Get query params
        const pathParts = route.split('/'); // Get path parts

        console.log('📍 Route name:', routeName);
        console.log('📦 Params:', params);
        console.log('🛤️ Path parts:', pathParts);

        // Handle verify-email route
        if (
          routeName === 'verify-email' ||
          routeName.includes('verify-email')
        ) {
          // Extract token from params
          const token = params
            ? params.split('token=')[1]?.split('&')[0]
            : null;

          console.log('🔐 Extracted token:', token);

          if (token && navigationRef.current) {
            // Navigate to EmailVerified screen with token
            navigationRef.current.navigate('EmailVerified', { token });
          }
        }

        // Handle reset-password route
        if (
          routeName === 'reset-password' ||
          routeName.includes('reset-password')
        ) {
          let token = null;

          // Try to extract token from path: medhomie://reset-password/:token
          if (pathParts.length > 1 && pathParts[1]) {
            token = pathParts[1].split('?')[0]; // Get token from path, remove query params if any
          }

          // If not found in path, try query params: medhomie://reset-password?token=:token
          if (!token && params) {
            token = params.split('token=')[1]?.split('&')[0];
          }

          console.log('🔐 Extracted reset token:', token ? token.substring(0, 10) + '...' : 'null');

          if (token && navigationRef.current) {
            // Navigate to ResetPassword screen with token
            navigationRef.current.navigate('ResetPassword', { token });
          } else {
            console.error('❌ No token found in reset-password deep link');
          }
        }

        // Handle login route
        if (
          routeName === 'login' ||
          routeName.includes('login')
        ) {
          console.log('🔐 Navigating to Login screen');
          if (navigationRef.current) {
            // Navigate to Login screen
            navigationRef.current.navigate('Login');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error parsing deep link:', error);
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}>
        {/* Auth Stack */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registration" component={RegistrationScreen} />
        <Stack.Screen
          name="EmailVerification"
          component={EmailVerificationScreen}
        />
        <Stack.Screen
          name="EmailVerified"
          component={EmailVerifiedScreen}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
        />
        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
        />

        {/* Main App Stack */}
        <Stack.Screen name="Drawer" component={DrawerNavigator} />
        {/* <Stack.Screen name="Home" component={HomeScreen} /> - Replaced by Drawer */}
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
        <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
        <Stack.Screen 
          name="PDFViewer" 
          component={PDFViewerScreen}
          options={{
            gestureEnabled: false, // Prevent swipe back during PDF loading
          }}
        />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="QuizResults" component={QuizResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
