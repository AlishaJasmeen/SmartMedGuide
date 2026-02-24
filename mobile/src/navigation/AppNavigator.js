import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import MedicineScanScreen from '../screens/MedicineScanScreen';
import ChatScreen from '../screens/ChatScreen';
import VoiceSearchScreen from '../screens/VoiceSearchScreen';
import TextSearchScreen from '../screens/TextSearchScreen';
import MedicineInfoScreen from '../screens/MedicineInfoScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingScreen';
import DrugInteractionScreen from '../screens/DrugInteractionScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { COLORS } from '../config';

const Stack = createStackNavigator();

export default function AppNavigator({ userPreferences, setUserPreferences, isLoggedIn, onLogin }) {
  const isDark = userPreferences.darkMode;
  
  const screenOptions = {
    headerStyle: {
      backgroundColor: isDark ? COLORS.backgroundDark : COLORS.primary,
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    cardStyle: {
      backgroundColor: isDark ? COLORS.backgroundDark : COLORS.background,
    },
  };

  if (!isLoggedIn) {
    return (
      <Stack.Navigator initialRouteName="Login" screenOptions={screenOptions}>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ title: 'Login' }}
          initialParams={{ onLogin }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ title: 'Register' }}
          initialParams={{ onLogin }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'SmartMedGuide',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="MedicineScan" 
        component={MedicineScanScreen}
        options={{ title: 'Scan Medicine' }}
      />
      <Stack.Screen 
        name="VoiceSearch" 
        component={VoiceSearchScreen}
        options={{ title: 'Voice Search' }}
      />
      <Stack.Screen 
        name="TextSearch" 
        component={TextSearchScreen}
        options={{ title: 'Search by Text' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'AI Medical Assistant' }}
      />
      <Stack.Screen 
        name="MedicineInfo" 
        component={MedicineInfoScreen}
        options={{ title: 'Medicine Details' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="Settings"
        options={{ title: 'Settings' }}
      >
        {(props) => (
          <SettingsScreen 
            {...props} 
            userPreferences={userPreferences}
            setUserPreferences={setUserPreferences}
          />
        )}
      </Stack.Screen>
      <Stack.Screen 
        name="DrugInteractions" 
        component={DrugInteractionScreen}
        options={{ title: 'Drug Interactions' }}
      />
    </Stack.Navigator>
  );
}