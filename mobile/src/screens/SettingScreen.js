import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config';

export default function SettingsScreen({ userPreferences, setUserPreferences }) {
  const [darkMode, setDarkMode] = useState(userPreferences.darkMode);
  const [language, setLanguage] = useState(userPreferences.language);

  const toggleDarkMode = async () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    const prefs = { ...userPreferences, darkMode: newValue };
    setUserPreferences(prefs);
    await AsyncStorage.setItem('userPreferences', JSON.stringify(prefs));
  };

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    const prefs = { ...userPreferences, language: lang };
    setUserPreferences(prefs);
    await AsyncStorage.setItem('userPreferences', JSON.stringify(prefs));
  };

  const bg = darkMode ? COLORS.backgroundDark : '#f5f5f5';
  const surface = darkMode ? COLORS.surfaceDark : '#fff';
  const text = darkMode ? '#eee' : '#333';
  const subText = darkMode ? '#bbb' : '#999';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: text }]}>Appearance</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={toggleDarkMode}
        >
          <View style={styles.settingLeft}>
            <Ionicons
              name={darkMode ? 'moon' : 'sunny'}
              size={24}
              color={COLORS.primary}
            />
            <Text style={[styles.settingText, { color: text }]}>Dark Mode</Text>
          </View>
          <View
            style={[
              styles.toggle,
              darkMode && styles.toggleActive,
            ]}
          >
            <View
              style={[
                styles.toggleCircle,
                darkMode && styles.toggleCircleActive,
              ]}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: text }]}>Language</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => changeLanguage('en')}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="language" size={24} color={COLORS.secondary} />
            <Text style={[styles.settingText, { color: text }]}>English</Text>
          </View>
          {language === 'en' && (
            <Ionicons name="checkmark" size={24} color={COLORS.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => changeLanguage('hi')}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="language" size={24} color={COLORS.secondary} />
            <Text style={[styles.settingText, { color: text }]}>हिंदी (Hindi)</Text>
          </View>
          {language === 'hi' && (
            <Ionicons name="checkmark" size={24} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: text }]}>About</Text>
        
        <View style={styles.settingItem}>
          <Text style={[styles.settingText, { color: text }]}>Version</Text>
          <Text style={[styles.settingValue, { color: subText }]}>1.0.0</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={[styles.settingText, { color: text }]}>Developer</Text>
          <Text style={[styles.settingValue, { color: subText }]}>SmartMedGuide Team</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  settingValue: {
    fontSize: 16,
    color: '#999',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
});