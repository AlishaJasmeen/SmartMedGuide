import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

export default function HomeScreen({ navigation }) {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const prefs = await AsyncStorage.getItem('userPreferences');
        if (prefs) {
          const parsed = JSON.parse(prefs);
          setIsDark(parsed.darkMode || false);
        }
      } catch {}
    })();
  }, []);
  const menuItems = [
    {
      id: 1,
      title: 'Scan Medicine',
      icon: 'camera',
      color: COLORS.primary,
      screen: 'MedicineScan',
    },
    {
      id: 2,
      title: 'Voice Search',
      icon: 'mic',
      color: COLORS.secondary,
      screen: 'VoiceSearch',
    },
    {
      id: 3,
      title: 'Chat with AI',
      icon: 'chatbubbles',
      color: COLORS.accent,
      screen: 'Chat',
    },
    {
      id: 4,
      title: 'Search by Text',
      icon: 'search',
      color: '#9C27B0',
      screen: 'TextSearch',
    },
    {
      id: 5,
      title: 'Drug Interactions',
      icon: 'alert-circle',
      color: '#F44336',
      screen: 'DrugInteractions',
    },
    {
      id: 6,
      title: 'Profile',
      icon: 'person',
      color: '#795548',
      screen: 'Profile',
    },
    {
      id: 7,
      title: 'Settings',
      icon: 'settings',
      color: '#607D8B',
      screen: 'Settings',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? COLORS.backgroundDark : '#f5f5f5' }]}>
      <View style={[styles.header, { backgroundColor: isDark ? COLORS.surfaceDark : '#fff', borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
        <Text style={[styles.welcomeText, { color: isDark ? '#bbb' : '#666' }]}>Welcome to</Text>
        <Text style={[styles.appName, { color: isDark ? COLORS.primaryLight || '#90CAF9' : COLORS.primary }]}>SmartMedGuide</Text>
        <Text style={[styles.tagline, { color: isDark ? '#888' : '#999' }]}>Your Smart Medicine Companion</Text>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              { borderLeftColor: item.color, backgroundColor: isDark ? COLORS.surfaceDark : '#fff' },
            ]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={32} color="#fff" />
            </View>
            <Text style={[styles.cardTitle, { color: isDark ? '#eee' : '#333' }]}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.infoTitle, { color: isDark ? '#eee' : '#333' }]}>Quick Tips</Text>
        <View style={[styles.tipCard, { backgroundColor: isDark ? COLORS.surfaceDark : '#fff' }]}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={[styles.tipText, { color: isDark ? '#bbb' : '#666' }]}>
            Always consult a healthcare professional before taking any medication
          </Text>
        </View>
        <View style={[styles.tipCard, { backgroundColor: isDark ? COLORS.surfaceDark : '#fff' }]}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.secondary} />
          <Text style={[styles.tipText, { color: isDark ? '#bbb' : '#666' }]}>
            Check expiry dates before consuming medicines
          </Text>
        </View>
        <View style={[styles.tipCard, { backgroundColor: isDark ? COLORS.surfaceDark : '#fff' }]}>
          <Ionicons name="warning" size={24} color={COLORS.warning} />
          <Text style={[styles.tipText, { color: isDark ? '#bbb' : '#666' }]}>
            For emergencies, call 102 or 108 immediately
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginVertical: 5,
  },
  tagline: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
    paddingTop: 10,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});