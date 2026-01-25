import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

// Firebase Import
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';

// Screen Imports
import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import CameraScreen from './src/screens/CameraScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import ChatScreen from './src/screens/ChatScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SecuritySettingScreen from './src/screens/SecuritySettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);

  // 1. LISTEN FOR FIREBASE SESSION ON APP LOAD
  // We still need this so Firebase has time to restore the session 
  // before the user reaches the Home screen.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      // Once Firebase finishes checking, we stop the loading spinner.
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  // 2. SHOW QUICK LOADING SPINNER ON STARTUP
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7F9' }}>
        <ActivityIndicator size="large" color="#3D5A80" />
      </View>
    );
  }

  // 3. RENDER NAVIGATION (ALWAYS STARTS AT WELCOME)
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Welcome" // <--- Hardcoded so everyone sees this first
        screenOptions={{ headerShown: false, animation: 'none' }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Community" component={CommunityScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="SecuritySettings" component={SecuritySettingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}