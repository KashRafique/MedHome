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

    // Parse the URL
    // Example: medhomie://verify-email?token=abc123xyz
    // or: https://medhome.com/verify-email?token=abc123xyz

    try {
      const route = url.replace(/.*?:\/\//g, ''); // Remove scheme
      const routeName = route.split('?')[0]; // Get route name
      const params = route.split('?')[1]; // Get params

      console.log('📍 Route name:', routeName);
      console.log('📦 Params:', params);

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
