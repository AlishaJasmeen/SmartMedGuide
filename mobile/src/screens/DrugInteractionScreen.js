import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL, ENDPOINTS, COLORS } from '../config';

export default function DrugInteractionScreen({ navigation }) {
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [interactionResult, setInteractionResult] = useState(null);

  const searchMedicine = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Empty Search', 'Please enter a medicine name to search');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}${ENDPOINTS.SEARCH}/${encodeURIComponent(searchQuery.trim())}`
      );

      if (response.data.success && response.data.results.length > 0) {
        setSearchResults(response.data.results);
      } else {
        setSearchResults([]);
        Alert.alert('No Results', `No medicines found for "${searchQuery}"`);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search medicines');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = (medicine) => {
    const medicineName = medicine.tablet_name || medicine.name;
    if (selectedMedicines.find(m => m.name.toLowerCase() === medicineName.toLowerCase())) {
      Alert.alert('Already Added', 'This medicine is already in your list');
      return;
    }
    setSelectedMedicines([...selectedMedicines, { name: medicineName, id: medicine.id }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const addMedicineByName = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Empty', 'Please enter a medicine name');
      return;
    }
    const medicineName = searchQuery.trim();
    if (selectedMedicines.find(m => m.name.toLowerCase() === medicineName.toLowerCase())) {
      Alert.alert('Already Added', 'This medicine is already in your list');
      return;
    }
    setSelectedMedicines([...selectedMedicines, { name: medicineName, id: null }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMedicine = (medicineName) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.name !== medicineName));
  };

  const checkInteractions = async () => {
    if (selectedMedicines.length < 2) {
      Alert.alert('Insufficient Medicines', 'Please select at least 2 medicines to check interactions');
      return;
    }

    setChecking(true);
    setInteractionResult(null);

    try {
      const response = await axios.post(
        `${API_URL}${ENDPOINTS.DRUG_INTERACTIONS}`,
        {
          medicine_names: selectedMedicines.map(m => m.name),
        }
      );

      if (response.data.success) {
        setInteractionResult(response.data);
      } else {
        Alert.alert('Error', 'Failed to check drug interactions');
      }
    } catch (error) {
      console.error('Interaction check error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to check drug interactions');
    } finally {
      setChecking(false);
    }
  };

  const renderSelectedMedicine = ({ item }) => (
    <View style={styles.selectedMedicineCard}>
      <Text style={styles.selectedMedicineName}>{item.name}</Text>
      <TouchableOpacity
        onPress={() => removeMedicine(item.name)}
        style={styles.removeButton}
      >
        <Ionicons name="close-circle" size={24} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultCard}
      onPress={() => addMedicine(item)}
    >
      <View style={styles.searchResultContent}>
        <Ionicons name="add-circle" size={24} color={COLORS.primary} />
        <View style={styles.searchResultText}>
          <Text style={styles.searchResultName}>
            {item.tablet_name || item.name || 'Unknown Medicine'}
          </Text>
          {item.description && (
            <Text style={styles.searchResultDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Search and Add Medicines</Text>
          <Text style={styles.sectionSubtitle}>
            Search for medicines in database OR type any medicine name to add directly
          </Text>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter medicine name (e.g., Paracetamol, Aspirin)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchMedicine}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={searchMedicine}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="search" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Add directly button - allows adding ANY medicine name */}
          {searchQuery.trim() && searchResults.length === 0 && !loading && (
            <TouchableOpacity
              style={styles.addDirectlyButton}
              onPress={addMedicineByName}
            >
              <Ionicons name="add-circle" size={20} color={COLORS.primary} />
              <Text style={styles.addDirectlyText}>
                Add "{searchQuery.trim()}" directly (works for any medicine)
              </Text>
            </TouchableOpacity>
          )}

          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <Text style={styles.searchResultsTitle}>Found in Database:</Text>
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>

        {/* Selected Medicines */}
        <View style={styles.selectedSection}>
          <Text style={styles.sectionTitle}>
            Selected Medicines ({selectedMedicines.length})
          </Text>
          {selectedMedicines.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="medical" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                No medicines selected. Search and add at least 2 medicines to check interactions.
              </Text>
            </View>
          ) : (
            <FlatList
              data={selectedMedicines}
              renderItem={renderSelectedMedicine}
              keyExtractor={(item, index) => item.name + index}
              scrollEnabled={false}
            />
          )}

          {selectedMedicines.length >= 2 && (
            <TouchableOpacity
              style={styles.checkButton}
              onPress={checkInteractions}
              disabled={checking}
            >
              {checking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.checkButtonText}>Check Interactions</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Interaction Results */}
        {interactionResult && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Interaction Results</Text>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{interactionResult.summary}</Text>
            </View>

            {/* AI Analysis */}
            {interactionResult.ai_analysis && (
              <View style={styles.aiAnalysisCard}>
                <View style={styles.aiAnalysisHeader}>
                  <Ionicons name="bulb" size={24} color={COLORS.accent} />
                  <Text style={styles.aiAnalysisTitle}>AI Analysis</Text>
                </View>
                <Text style={styles.aiAnalysisText}>
                  {interactionResult.ai_analysis}
                </Text>
              </View>
            )}

            {interactionResult.interactions.length > 0 && (
              <View style={styles.interactionsContainer}>
                <Text style={styles.interactionsTitle}>
                  ⚠️ Found {interactionResult.interactions.length} Interaction(s)
                </Text>
                {interactionResult.interactions.map((interaction, index) => (
                  <View key={index} style={styles.interactionCard}>
                    <View style={styles.interactionHeader}>
                      <Ionicons name="warning" size={24} color={COLORS.warning} />
                      <Text style={styles.interactionMedicines}>
                        {interaction.medicine1} + {interaction.medicine2}
                      </Text>
                    </View>
                    <Text style={styles.interactionDescription}>
                      {interaction.description}
                    </Text>
                    <Text style={styles.interactionRecommendation}>
                      💡 {interaction.recommendation}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Medicine Details */}
            <View style={styles.medicinesDetailsContainer}>
              <Text style={styles.medicinesDetailsTitle}>Medicine Details</Text>
              {interactionResult.medicines_data.map((medicine, index) => (
                <View key={index} style={styles.medicineDetailCard}>
                  <Text style={styles.medicineDetailName}>{medicine.name}</Text>
                  {medicine.uses && (
                    <Text style={styles.medicineDetailText}>
                      <Text style={styles.medicineDetailLabel}>Uses: </Text>
                      {medicine.uses}
                    </Text>
                  )}
                  {medicine.side_effects && (
                    <Text style={styles.medicineDetailText}>
                      <Text style={styles.medicineDetailLabel}>Side Effects: </Text>
                      {medicine.side_effects}
                    </Text>
                  )}
                </View>
              ))}
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
  content: {
    padding: 20,
  },
  searchSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 10,
    maxHeight: 200,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addDirectlyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight || '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addDirectlyText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  searchResultCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultText: {
    flex: 1,
    marginLeft: 10,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchResultDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  selectedSection: {
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  selectedMedicineCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  selectedMedicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  removeButton: {
    marginLeft: 10,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  resultsSection: {
    marginTop: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  aiAnalysisCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  aiAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiAnalysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  aiAnalysisText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  interactionsContainer: {
    marginBottom: 20,
  },
  interactionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginBottom: 10,
  },
  interactionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  interactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  interactionMedicines: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  interactionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  interactionRecommendation: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    lineHeight: 20,
  },
  medicinesDetailsContainer: {
    marginTop: 10,
  },
  medicinesDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  medicineDetailCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  medicineDetailName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 10,
  },
  medicineDetailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  medicineDetailLabel: {
    fontWeight: '600',
    color: '#333',
  },
});

