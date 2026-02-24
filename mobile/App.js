import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState({
    language: 'en',
    darkMode: false,
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    try {
      const prefs = await AsyncStorage.getItem('userPreferences');
      if (prefs) {
        setUserPreferences(JSON.parse(prefs));
      }
      // Check both isLoggedIn flag and authUser to ensure login persistence
      const logged = await AsyncStorage.getItem('isLoggedIn');
      const authUser = await AsyncStorage.getItem('authUser');
      // User is logged in if either flag is set or authUser exists
      setIsLoggedIn(logged === 'true' || authUser !== null);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  const handleLogin = async (user) => {
    try {
      await AsyncStorage.setItem('isLoggedIn', 'true');
      if (user) {
        await AsyncStorage.setItem('authUser', JSON.stringify(user));
      }
      setIsLoggedIn(true);
    } catch (e) {
      console.error('Error saving login state:', e);
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style={userPreferences.darkMode ? 'light' : 'dark'} />
      <AppNavigator
        userPreferences={userPreferences}
        setUserPreferences={setUserPreferences}
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
      />
    </NavigationContainer>
  );
}

// Simple Splash Screen Component
function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <Image
        source={require('./src/assets/logo.jpg')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.splashTitle}>SmartMedGuide</Text>
      <Text style={styles.splashTagline}>Your Smart Medicine Companion</Text>
      <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  splashTagline: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
});