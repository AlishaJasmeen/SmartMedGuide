import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import axios from 'axios';
import { API_URL, ENDPOINTS, COLORS } from '../config';

export default function VoiceSearchScreen({ navigation }) {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    // Cleanup speech on unmount
    return () => {
      Speech.stop();
    };
  }, []);

  const startListening = async () => {
    try {
      setError('');
      setRecognizedText('');
      
      if (Platform.OS === 'web') {
        // Web: Use browser's speech recognition
        startWebSpeechRecognition();
      } else {
        // Mobile: Show options for voice input
        showMobileVoiceOptions();
      }
    } catch (error) {
      console.error('Error starting recognition:', error);
      setError('Failed to start voice recognition');
      Alert.alert('Error', 'Failed to start voice recognition. Please use text input instead.');
    }
  };

  const startWebSpeechRecognition = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
          setError('');
        };

        recognition.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setRecognizedText(finalTranscript.trim());
            setIsListening(false);
            searchMedicine(finalTranscript.trim());
            recognition.stop();
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setError(event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            Alert.alert('Microphone Access Required', 'Please allow microphone access in your browser settings to use voice search.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } else {
        setError('Speech recognition not supported in this browser');
        Alert.alert('Not Supported', 'Voice search is not supported in your browser. Please use Chrome, Edge, or Safari.');
      }
    }
  };

  const showMobileVoiceOptions = () => {
    Alert.alert(
      'Voice Search Options',
      'Choose how you want to input voice:',
      [
        {
          text: 'Use Keyboard Voice Input',
          onPress: () => {
            setShowManualInput(true);
            setTimeout(() => {
              Alert.alert(
                'Keyboard Voice Input',
                'Tap the text field below, then tap the microphone icon on your keyboard to use voice-to-text.'
              );
            }, 500);
          }
        },
        {
          text: 'Paste from Clipboard',
          onPress: pasteFromClipboard
        },
        {
          text: 'Manual Typing',
          onPress: () => setShowManualInput(true)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setRecognizedText(text);
        setManualInput(text);
        Alert.alert(
          'Pasted from Clipboard',
          `Search for: "${text}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Search', onPress: () => searchMedicine(text) }
          ]
        );
      } else {
        Alert.alert('Clipboard Empty', 'No text found in clipboard.');
      }
    } catch (error) {
      console.error('Clipboard error:', error);
      Alert.alert('Error', 'Failed to read from clipboard.');
    }
  };

  const stopListening = () => {
    setIsListening(false);
    // In web, the recognition will stop automatically when speech ends
  };

  const searchMedicine = async (query) => {
    const searchQuery = query || manualInput || recognizedText;
    
    if (!searchQuery || !searchQuery.trim()) {
      Alert.alert('No Input', 'Please enter or speak a medicine name to search.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Searching for:', searchQuery);
      const response = await axios.get(
        `${API_URL}${ENDPOINTS.SEARCH}/${encodeURIComponent(searchQuery.trim())}`
      );

      console.log('Search response:', response.data);
      setSearchResults(response.data.results || []);
      
      // Speak results
      if (response.data.results && response.data.results.length > 0) {
        const resultCount = response.data.results.length;
        const firstResult = response.data.results[0];
        speakResult(`Found ${resultCount} medicine${resultCount > 1 ? 's' : ''}. First result: ${firstResult.tablet_name || firstResult.name}`);
      } else {
        speakResult('No medicines found for your search. Please try a different name.');
      }
    } catch (error) {
      console.error('Search error:', error);
      let errorMessage = 'Failed to search medicines. ';
      
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage += 'Please check your internet connection and ensure the backend server is running.';
      } else {
        errorMessage += 'Server error occurred.';
      }
      
      setError(errorMessage);
      Alert.alert('Search Failed', errorMessage);
      speakResult('Search failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const speakResult = (text) => {
    if (!Speech.isSpeakingAsync()) {
      setIsSpeaking(true);
      Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const viewDetails = (medicine) => {
    navigation.navigate('MedicineInfo', { medicineId: medicine.id });
  };

  const clearSearch = () => {
    setRecognizedText('');
    setManualInput('');
    setSearchResults([]);
    setError('');
    setShowManualInput(false);
    Speech.stop();
  };

  const handleManualSearch = () => {
    if (manualInput.trim()) {
      setRecognizedText(manualInput);
      searchMedicine(manualInput);
      Keyboard.dismiss();
    } else {
      Alert.alert('No Input', 'Please enter a medicine name to search.');
    }
  };

  // Quick search suggestions
  const quickSuggestions = [
    'Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Vitamin C', 
    'Metformin', 'Aspirin', 'Cetirizine', 'Omeprazole'
  ];

  const searchSuggestion = (suggestion) => {
    setManualInput(suggestion);
    setRecognizedText(suggestion);
    searchMedicine(suggestion);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerCard}>
          <Ionicons name="mic" size={32} color={COLORS.primary} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Medicine Voice Search
            </Text>
            <Text style={styles.headerSubtitle}>
              {Platform.OS === 'web' 
                ? 'Speak the medicine name or type below'
                : 'Use voice input or type medicine name'
              }
            </Text>
          </View>
        </View>

        {/* Voice Input Section */}
        <View style={styles.micSection}>
          <TouchableOpacity
            style={[
              styles.micButton,
              isListening && styles.micButtonActive,
            ]}
            onPress={isListening ? stopListening : startListening}
            disabled={loading}
          >
            {isListening ? (
              <View style={styles.pulseContainer}>
                <View style={[styles.pulse, styles.pulse1]} />
                <View style={[styles.pulse, styles.pulse2]} />
                <View style={[styles.pulse, styles.pulse3]} />
                <Ionicons name="mic" size={48} color="#fff" />
              </View>
            ) : (
              <Ionicons name="mic" size={48} color="#fff" />
            )}
          </TouchableOpacity>
          
          <Text style={styles.instructionText}>
            {isListening
              ? 'Listening... Speak now'
              : 'Tap to start voice search'
            }
          </Text>

          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="warning" size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Manual Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Search Medicine</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={manualInput}
              onChangeText={setManualInput}
              placeholder="Type medicine name here..."
              placeholderTextColor="#999"
              onSubmitEditing={handleManualSearch}
              returnKeyType="search"
            />
            {manualInput ? (
              <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
                <Ionicons name="close-circle" size={24} color="#999" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          <TouchableOpacity
            style={[
              styles.searchButton,
              (!manualInput.trim() || loading) && styles.searchButtonDisabled
            ]}
            onPress={handleManualSearch}
            disabled={!manualInput.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="search" size={20} color="#fff" />
            )}
            <Text style={styles.searchButtonText}>
              {loading ? 'Searching...' : 'Search Medicine'}
            </Text>
          </TouchableOpacity>

          {/* Quick Suggestions */}
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Quick Search:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.suggestionsList}>
                {quickSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => searchSuggestion(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Recognized Text Display */}
        {recognizedText ? (
          <View style={styles.recognizedCard}>
            <View style={styles.recognizedHeader}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.recognizedLabel}>Ready to search:</Text>
            </View>
            <Text style={styles.recognizedText}>"{recognizedText}"</Text>
            <TouchableOpacity 
              style={styles.searchNowButton}
              onPress={() => searchMedicine(recognizedText)}
            >
              <Text style={styles.searchNowText}>Search Now</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Searching medicines database...</Text>
          </View>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                Found {searchResults.length} Medicine{searchResults.length > 1 ? 's' : ''}
              </Text>
              <View style={styles.resultActions}>
                {isSpeaking ? (
                  <TouchableOpacity
                    style={styles.stopSpeakButton}
                    onPress={stopSpeaking}
                  >
                    <Ionicons name="stop-circle" size={20} color={COLORS.error} />
                    <Text style={styles.stopSpeakText}>Stop</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.speakButton}
                    onPress={() => speakResult(`Found ${searchResults.length} medicines. Tap on any result to view details.`)}
                  >
                    <Ionicons name="volume-high" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.clearResultsButton}
                  onPress={clearSearch}
                >
                  <Ionicons name="refresh" size={18} color="#666" />
                  <Text style={styles.clearResultsText}>New Search</Text>
                </TouchableOpacity>
              </View>
            </View>

            {searchResults.map((medicine, index) => (
              <TouchableOpacity
                key={medicine.id || index}
                style={styles.resultCard}
                onPress={() => viewDetails(medicine)}
              >
                <View style={styles.resultContent}>
                  <Text style={styles.medicineName}>
                    {medicine.tablet_name || medicine.name || 'Unknown Medicine'}
                  </Text>
                  <Text style={styles.medicineDescription} numberOfLines={2}>
                    {medicine.description || medicine.uses || 'No description available'}
                  </Text>
                  {medicine.manufacturer && (
                    <Text style={styles.manufacturer}>
                      By {medicine.manufacturer}
                    </Text>
                  )}
                  {medicine.match_score && (
                    <Text style={styles.matchScore}>
                      Match: {medicine.match_score}%
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* No Results State */}
        {!loading && searchResults.length === 0 && recognizedText && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <Text style={styles.noResultsText}>
              No medicines found for "{recognizedText}"
            </Text>
            <Text style={styles.noResultsSubtext}>
              Try a different medicine name or check the spelling
            </Text>
            <TouchableOpacity
              style={styles.tryAgainButton}
              onPress={clearSearch}
            >
              <Text style={styles.tryAgainText}>Try Another Search</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!loading && searchResults.length === 0 && !recognizedText && (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={80} color="#e0e0e0" />
            <Text style={styles.emptyTitle}>Search Medicines</Text>
            <Text style={styles.emptyText}>
              Use voice search or type medicine names to find information
            </Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="mic-outline" size={24} color={COLORS.primary} />
                <Text style={styles.featureText}>Voice search with microphone</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="text-outline" size={24} color={COLORS.primary} />
                <Text style={styles.featureText}>Manual text input</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="volume-high-outline" size={24} color={COLORS.primary} />
                <Text style={styles.featureText}>Voice feedback for results</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  micSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  micButtonActive: {
    backgroundColor: COLORS.error,
    transform: [{ scale: 1.05 }],
  },
  pulseContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#fff',
    opacity: 0.5,
  },
  pulse1: {
    transform: [{ scale: 1.2 }],
  },
  pulse2: {
    transform: [{ scale: 1.4 }],
  },
  pulse3: {
    transform: [{ scale: 1.6 }],
  },
  instructionText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe5e5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.error,
    flex: 1,
  },
  inputSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  suggestionsList: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  recognizedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  recognizedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recognizedLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  recognizedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  searchNowButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  searchNowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  resultsSection: {
    marginTop: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  resultActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stopSpeakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#ffe5e5',
    borderRadius: 8,
  },
  stopSpeakText: {
    marginLeft: 4,
    color: COLORS.error,
    fontWeight: '600',
    fontSize: 12,
  },
  speakButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  clearResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  clearResultsText: {
    marginLeft: 4,
    color: '#666',
    fontWeight: '600',
    fontSize: 12,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  resultContent: {
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  medicineDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  manufacturer: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  matchScore: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  tryAgainButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  tryAgainText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  featureList: {
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});