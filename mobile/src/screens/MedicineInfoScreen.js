import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import axios from 'axios';
import { API_URL, ENDPOINTS, COLORS, LANGUAGES } from '../config';

export default function MedicineInfoScreen({ route }) {
  const { medicineId, selectedLanguage: initialLanguage } = route.params || {};
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage || 'en');
  const [translatedMedicine, setTranslatedMedicine] = useState(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    fetchMedicineDetails();
  }, [medicineId]);

  useEffect(() => {
    if (medicine && selectedLanguage !== 'en') {
      translateMedicine();
    } else {
      setTranslatedMedicine(null);
    }
  }, [selectedLanguage, medicine]);

  const fetchMedicineDetails = async () => {
    try {
      const response = await axios.get(
        `${API_URL}${ENDPOINTS.MEDICINE_DETAIL}/${medicineId}`
      );
      setMedicine(response.data.medicine);
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to load medicine details');
    } finally {
      setLoading(false);
    }
  };

  const translateMedicine = async () => {
    if (!medicine || selectedLanguage === 'en') {
      setTranslatedMedicine(null);
      return;
    }

    setTranslating(true);
    try {
      const fieldsToTranslate = [
        { key: 'tablet_name', value: medicine.tablet_name || medicine.name },
        { key: 'uses', value: medicine.uses || medicine.description },
        { key: 'dosage', value: medicine.dosage },
        { key: 'side_effects', value: medicine.side_effects },
        { key: 'storage', value: medicine.storage },
        { key: 'drug_interactions', value: medicine.drug_interactions },
        { key: 'expiry_date', value: medicine.expiry_date },
        { key: 'age_factors', value: medicine.age_factors },
        { key: 'restrictions', value: medicine.restrictions },
        { key: 'usage', value: medicine.usage },
        { key: 'substitutes', value: medicine.substitutes },
      ];

      const translated = {};
      for (const field of fieldsToTranslate) {
        if (field.value) {
          try {
            const response = await axios.post(
              `${API_URL}${ENDPOINTS.TRANSLATE}`,
              {
                text: field.value,
                source_lang: 'en',
                target_lang: selectedLanguage,
              }
            );
            translated[field.key] = response.data.translated;
          } catch (error) {
            console.error(`Translation error for ${field.key}:`, error);
            translated[field.key] = field.value; // Fallback to original
          }
        }
      }

      setTranslatedMedicine(translated);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedMedicine(null);
    } finally {
      setTranslating(false);
    }
  };

  const getDisplayText = (key, originalValue) => {
    if (selectedLanguage === 'en' || !translatedMedicine) {
      return originalValue || '';
    }
    return translatedMedicine[key] || originalValue || '';
  };

  const speakSection = async (title, content) => {
    // Stop any ongoing speech immediately
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${title}. ${content}`;
    setIsSpeaking(true);

    const speechLang = selectedLanguage === 'en' ? 'en-US' : selectedLanguage;

    Speech.speak(textToSpeak, {
      language: speechLang,
      pitch: 1.0,
      rate: 0.85,
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const speakAll = async () => {
    if (!medicine) return;

    // Stop any ongoing speech immediately
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const fullText = `
      ${getDisplayText('tablet_name', medicine.tablet_name || medicine.name)}.
      Uses: ${getDisplayText('uses', medicine.uses || medicine.description)}.
      Dosage: ${getDisplayText('dosage', medicine.dosage)}.
      Side Effects: ${getDisplayText('side_effects', medicine.side_effects)}.
      Storage: ${getDisplayText('storage', medicine.storage)}.
      Drug Interactions: ${getDisplayText('drug_interactions', medicine.drug_interactions)}.
      Age Factors: ${getDisplayText('age_factors', medicine.age_factors)}.
      Restrictions: ${getDisplayText('restrictions', medicine.restrictions)}.
      Usage Instructions: ${getDisplayText('usage', medicine.usage)}.
      Substitutes: ${getDisplayText('substitutes', medicine.substitutes)}.
    `;

    const speechLang = selectedLanguage === 'en' ? 'en-US' : selectedLanguage;

    Speech.speak(fullText, {
      language: speechLang,
      pitch: 1.0,
      rate: 0.8,
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const stopSpeaking = () => {
    // Force stop speech immediately
    Speech.stop();
    setIsSpeaking(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading medicine details...</Text>
      </View>
    );
  }

  if (!medicine) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Medicine not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.medicineName}>
          {getDisplayText('tablet_name', medicine.tablet_name || medicine.name)}
        </Text>
        {medicine.manufacturer && (
          <Text style={styles.manufacturer}>By {medicine.manufacturer}</Text>
        )}
      </View>

      {/* Language Selector */}
      <View style={styles.languageContainer}>
        <Text style={styles.languageLabel}>Display Language:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <TouchableOpacity
              key={code}
              style={[
                styles.languageButton,
                selectedLanguage === code && styles.languageButtonActive,
              ]}
              onPress={() => setSelectedLanguage(code)}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  selectedLanguage === code && styles.languageButtonTextActive,
                ]}
              >
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={isSpeaking ? stopSpeaking : speakAll}
        >
          <Ionicons
            name={isSpeaking ? 'stop-circle' : 'volume-high'}
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.actionButtonText}>
            {isSpeaking ? 'Stop' : 'Listen All'}
          </Text>
        </TouchableOpacity>

        {translating && (
          <View style={styles.translatingIndicator}>
            <ActivityIndicator size="small" color={COLORS.secondary} />
            <Text style={styles.translatingText}>Translating...</Text>
          </View>
        )}
      </View>

      {/* Display ALL fields from JSON */}
      <InfoSection
        title="Uses"
        content={getDisplayText('uses', medicine.uses || medicine.description)}
        icon="information-circle"
        color={COLORS.primary}
        onSpeak={() => speakSection('Uses', getDisplayText('uses', medicine.uses || medicine.description))}
      />

      <InfoSection
        title="Dosage"
        content={getDisplayText('dosage', medicine.dosage)}
        icon="flask"
        color={COLORS.accent}
        onSpeak={() => speakSection('Dosage', getDisplayText('dosage', medicine.dosage))}
      />

      <InfoSection
        title="Side Effects"
        content={getDisplayText('side_effects', medicine.side_effects)}
        icon="warning"
        color={COLORS.warning}
        onSpeak={() => speakSection('Side Effects', getDisplayText('side_effects', medicine.side_effects))}
      />

      <InfoSection
        title="Storage"
        content={getDisplayText('storage', medicine.storage)}
        icon="archive"
        color="#9C27B0"
        onSpeak={() => speakSection('Storage', getDisplayText('storage', medicine.storage))}
      />

      <InfoSection
        title="Drug Interactions"
        content={getDisplayText('drug_interactions', medicine.drug_interactions)}
        icon="alert-circle"
        color={COLORS.error}
        onSpeak={() => speakSection('Drug Interactions', getDisplayText('drug_interactions', medicine.drug_interactions))}
      />

      <InfoSection
        title="Expiry Date"
        content={getDisplayText('expiry_date', medicine.expiry_date)}
        icon="calendar"
        color={COLORS.secondary}
        onSpeak={() => speakSection('Expiry Date', getDisplayText('expiry_date', medicine.expiry_date))}
      />

      <InfoSection
        title="Age Factors"
        content={getDisplayText('age_factors', medicine.age_factors)}
        icon="people"
        color="#795548"
        onSpeak={() => speakSection('Age Factors', getDisplayText('age_factors', medicine.age_factors))}
      />

      <InfoSection
        title="Restrictions"
        content={getDisplayText('restrictions', medicine.restrictions)}
        icon="ban"
        color={COLORS.error}
        onSpeak={() => speakSection('Restrictions', getDisplayText('restrictions', medicine.restrictions))}
      />

      {medicine.usage && (
        <InfoSection
          title="Usage Instructions"
          content={getDisplayText('usage', medicine.usage)}
          icon="medical"
          color={COLORS.secondary}
          onSpeak={() => speakSection('Usage Instructions', getDisplayText('usage', medicine.usage))}
        />
      )}

      {medicine.substitutes && (
        <InfoSection
          title="Substitutes"
          content={getDisplayText('substitutes', medicine.substitutes)}
          icon="swap-horizontal"
          color="#9C27B0"
          onSpeak={() => speakSection('Substitutes', getDisplayText('substitutes', medicine.substitutes))}
        />
      )}

      <View style={styles.disclaimer}>
        <Ionicons name="shield-checkmark" size={24} color={COLORS.error} />
        <Text style={styles.disclaimerText}>
          This information is for educational purposes only. Always consult a
          healthcare professional before taking any medication.
        </Text>
      </View>
    </ScrollView>
  );
}

function InfoSection({ title, content, icon, color, onSpeak }) {
  if (!content) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name={icon} size={24} color={color} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <TouchableOpacity onPress={onSpeak}>
          <Ionicons name="volume-medium" size={22} color="#666" />
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    marginTop: 15,
    fontSize: 18,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  medicineName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  manufacturer: {
    fontSize: 16,
    color: '#666',
  },
  languageContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  languageButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  languageButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageButtonText: {
    fontSize: 14,
    color: '#666',
  },
  languageButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  translatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  translatingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#666',
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});