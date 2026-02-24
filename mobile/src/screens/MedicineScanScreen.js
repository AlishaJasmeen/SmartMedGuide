import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL, ENDPOINTS, COLORS } from '../config';

export default function MedicineScanScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Sorry, we need camera roll permissions to make this work!'
          );
        }
      }
    })();
  }, []);

  // Debug: Log image state changes
  useEffect(() => {
    console.log('Image state changed:', image);
  }, [image]);

  const requestCameraPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to scan medicines.'
        );
        return false;
      }
    }
    return true;
  };

  // FIXED: Image selection with proper state management
  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select images!');
        return;
      }

      console.log('Opening image library...');
      
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Don't edit to preserve original quality
        quality: 1.0, // Maximum quality - match web
        base64: false,
        exif: false,
      });

      console.log('Image picker result:', pickerResult);

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const selectedImage = pickerResult.assets[0].uri;
        console.log('Selected image URI:', selectedImage);
        
        // Clear previous result first
        setResult(null);
        // Set image with a small delay to ensure state update
        setImage(selectedImage);
        
        // Auto-analyze after selection with delay
        setTimeout(() => {
          console.log('Starting auto-analyze for:', selectedImage);
          predictMedicine(selectedImage);
        }, 800);
      } else {
        console.log('User cancelled image picker');
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
      Alert.alert('Error', `Failed to open gallery: ${error.message || 'Unknown error'}`);
    }
  };

  // FIXED: Camera capture with proper state management
  const takePhoto = async () => {
    try {
      const hasPermission = await requestCameraPermissions();
      if (!hasPermission) return;

      console.log('Opening camera...');

      const cameraResult = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // Don't edit to preserve original quality
        quality: 1.0, // Maximum quality - match web
        base64: false,
        exif: false,
        cameraType: ImagePicker.CameraType.back,
      });

      console.log('Camera result:', cameraResult);

      if (!cameraResult.canceled && cameraResult.assets && cameraResult.assets.length > 0) {
        const capturedImage = cameraResult.assets[0].uri;
        console.log('Captured image URI:', capturedImage);
        
        // Clear previous result first
        setResult(null);
        // Set image
        setImage(capturedImage);
        
        // Auto-analyze after capture with delay
        setTimeout(() => {
          console.log('Starting auto-analyze for:', capturedImage);
          predictMedicine(capturedImage);
        }, 800);
      } else {
        console.log('User cancelled camera');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', `Failed to take photo: ${error.message || 'Unknown error'}`);
    }
  };

  const predictMedicine = async (imageUri = null) => {
    const imageToUse = imageUri || image;
    
    if (!imageToUse) {
      Alert.alert('No Image', 'Please select or capture an image first');
      return;
    }
  
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Starting prediction for image:', imageToUse);
      
      let response;
      
      if (Platform.OS === 'web') {
        const formData = new FormData();
        const res = await fetch(imageToUse);
        const blob = await res.blob();
        const mime = blob.type || 'image/jpeg';
        const ext = mime.split('/')[1] || 'jpg';
        const file = new File([blob], `medicine_${Date.now()}.${ext}`, { type: mime });
        formData.append('file', file);
        
        console.log('Web: Uploading image...');
        response = await axios.post(
          `${API_URL}${ENDPOINTS.PREDICT}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 45000,
          }
        );
      } else {
        const formData = new FormData();
        
        let fileExtension = 'jpg';
        if (imageToUse.includes('.')) {
          fileExtension = imageToUse.split('.').pop().toLowerCase();
          if (!['jpg', 'jpeg', 'png'].includes(fileExtension)) {
            fileExtension = 'jpg';
          }
        }
        
        formData.append('file', {
          uri: imageToUse,
          name: `medicine_${Date.now()}.${fileExtension}`,
          type: `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`,
        });
        
        console.log('Mobile: Uploading image...');
        
        const fetchResponse = await fetch(`${API_URL}${ENDPOINTS.PREDICT}`, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        });
        
        console.log('Fetch response status:', fetchResponse.status);
        
        if (!fetchResponse.ok) {
          let errorText;
          try {
            errorText = await fetchResponse.text();
          } catch {
            errorText = `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`;
          }
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { detail: errorText };
          }
          throw new Error(errorData.detail || `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
        }
        
        const responseData = await fetchResponse.json();
        response = { data: responseData };
      }
  
      console.log('Server response:', response.data);
  
      if (response.data.success) {
        setResult(response.data);
        
        const confidencePercent = (response.data.confidence * 100).toFixed(1);
        const medicineName = response.data.medicine_name || 
                           response.data.prediction?.replace(/_/g, ' ') || 
                           'Unknown Medicine';
        
        if (response.data.confidence < 0.4) {
          Alert.alert(
            'Low Confidence Detection',
            `Medicine: ${medicineName}\nConfidence: ${confidencePercent}%\n\n⚠️ The prediction confidence is low. Please ensure:\n• Good lighting\n• Clear image of medicine package\n• Medicine name is visible\n• No shadows or reflections\n\nConsider retaking the photo for better results.`,
            [{ text: 'OK' }]
          );
        } else if (response.data.confidence < 0.7) {
          Alert.alert(
            'Moderate Confidence Detection',
            `Medicine: ${medicineName}\nConfidence: ${confidencePercent}%\n\nℹ️ The prediction confidence is moderate. For best results:\n• Ensure good lighting\n• Make sure the package is clearly visible`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Analysis Complete',
            `Medicine: ${medicineName}\nConfidence: ${confidencePercent}%`,
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert('Analysis Failed', response.data.message || 'Failed to identify medicine');
      }
    } catch (error) {
      console.error('Prediction error:', error);
      
      let errorMessage = 'Failed to analyze medicine. Please try again.';
      
      if (error.response) {
        console.error('Server error response:', error.response.data);
        errorMessage = error.response.data?.detail || 
                      error.response.data?.message || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('Network error - no response received');
        errorMessage = 'Network Error: Unable to reach the server.\n\nPlease check:\n• Backend server is running\n• Correct API_URL in config\n• Network connection';
      } else if (error.message) {
        console.error('Error message:', error.message);
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = 'Network Error: Unable to reach the server.\n\nPlease check:\n• Backend server is running\n• Correct API_URL in config\n• Network connection';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout. Please try again with a smaller image or better network.';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('Analysis Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const viewMedicineDetails = () => {
    if (result?.medicine_id) {
      navigation.navigate('MedicineInfo', { medicineId: result.medicine_id });
    } else {
      const medicineName = result?.medicine_name || result?.prediction?.replace(/_/g, ' ') || 'this medicine';
      
      Alert.alert(
        'No Details Available',
        `Medicine "${medicineName}" was detected but detailed information is not available in the database.\n\nYou can try searching for it manually.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Search', onPress: () => navigation.navigate('Search', { initialQuery: medicineName }) }
        ]
      );
    }
  };

  const resetScan = () => {
    setImage(null);
    setResult(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* Header Info */}
        <View style={styles.headerCard}>
          <Ionicons name="scan-circle" size={32} color={COLORS.primary} />
          <Text style={styles.headerText}>
            Take a clear photo of medicine package for identification
          </Text>
        </View>

        {/* FIXED: Image Display Section with better conditional rendering */}
        <View style={styles.imageSection}>
          {image ? (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: image }} 
                style={styles.image}
                resizeMode="contain"
                onError={(error) => {
                  console.error('Image loading error:', error.nativeEvent.error);
                  Alert.alert('Image Error', 'Failed to load the selected image. Please try again.');
                }}
                onLoad={() => console.log('Image loaded successfully')}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={resetScan}
              >
                <Ionicons name="close-circle" size={32} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="camera-outline" size={80} color="#ccc" />
              <Text style={styles.placeholderText}>
                No image selected
              </Text>
              <Text style={styles.placeholderSubtext}>
                Tap a button below to get started
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {!loading && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={takePhoto}
              disabled={loading}
            >
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.buttonText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={pickImageFromGallery}
              disabled={loading}
            >
              <Ionicons name="images" size={24} color="#fff" />
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Manual Analyze Button */}
        {image && !result && !loading && (
          <TouchableOpacity
            style={[styles.button, styles.analyzeButton]}
            onPress={() => predictMedicine()}
          >
            <Ionicons name="scan" size={24} color="#fff" />
            <Text style={styles.buttonText}>Analyze Medicine</Text>
          </TouchableOpacity>
        )}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Analyzing medicine image...</Text>
            <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
          </View>
        )}

        {/* Tips Section */}
        {!image && !result && !loading && (
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={20} color={COLORS.primary} />
              <Text style={styles.tipsTitle}>Tips for Best Results</Text>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.tipText}>Ensure good, even lighting</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.tipText}>Keep medicine package flat and centered</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.tipText}>Make sure text is clear and readable</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.tipText}>Avoid shadows, glare, and reflections</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.tipText}>Fill the frame with the medicine package</Text>
              </View>
            </View>
          </View>
        )}

        {/* Results Card */}
        {result && !loading && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons 
                name={result.confidence > 0.7 ? "checkmark-circle" : "warning"} 
                size={32} 
                color={result.confidence > 0.7 ? COLORS.success : "#FFA500"} 
              />
              <Text style={styles.resultTitle}>Detection Result</Text>
            </View>
            
            <View style={styles.resultDivider} />
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Detected Medicine:</Text>
              <Text style={styles.resultValue}>
                {result.medicine_name || result.prediction?.replace(/_/g, ' ').toUpperCase() || 'Unknown'}
              </Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Confidence Level:</Text>
              <View style={styles.confidenceContainer}>
                <View
                  style={[
                    styles.confidenceBar,
                    { 
                      width: `${Math.min(result.confidence * 100, 100)}%`,
                      backgroundColor: 
                        result.confidence > 0.7 ? COLORS.success : 
                        result.confidence > 0.5 ? '#FFA500' : COLORS.error
                    },
                  ]}
                />
                <Text style={styles.confidenceText}>
                  {(result.confidence * 100).toFixed(1)}%
                </Text>
              </View>
              
              {result.confidence < 0.7 && (
                <View style={styles.warningBox}>
                  <Ionicons name="alert-circle" size={16} color="#FF9800" />
                  <Text style={styles.warningText}>
                    {result.confidence < 0.4 
                      ? 'Low confidence. Please retake photo with better lighting and clarity.'
                      : 'Moderate confidence. Consider retaking for better accuracy.'
                    }
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.resultActions}>
              {result.medicine_id ? (
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={viewMedicineDetails}
                >
                  <Text style={styles.detailsButtonText}>
                    View Full Details
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              ) : (
                <View style={styles.noInfoCard}>
                  <Ionicons name="information-circle-outline" size={24} color="#666" />
                  <Text style={styles.noInfoText}>
                    Detailed information not available
                  </Text>
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => navigation.navigate('Search', { 
                      initialQuery: result.medicine_name || result.prediction?.replace(/_/g, ' ')
                    })}
                  >
                    <Ionicons name="search" size={16} color="#fff" />
                    <Text style={styles.searchButtonText}>Search Manually</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.retryButton}
                onPress={resetScan}
              >
                <Ionicons name="refresh" size={20} color={COLORS.primary} />
                <Text style={styles.retryButtonText}>Scan Another Medicine</Text>
              </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0', // Added background color for better visibility
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  placeholderContainer: {
    height: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  placeholderSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#999',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  analyzeButton: {
    backgroundColor: COLORS.accent,
    elevation: 3,
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 10,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  resultDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 15,
  },
  resultItem: {
    marginBottom: 20,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  confidenceContainer: {
    position: 'relative',
    height: 32,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    marginBottom: 10,
  },
  confidenceBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 16,
  },
  confidenceText: {
    position: 'absolute',
    right: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#E65100',
    flex: 1,
  },
  resultActions: {
    gap: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  noInfoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noInfoText: {
    marginTop: 10,
    marginBottom: 15,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  retryButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});