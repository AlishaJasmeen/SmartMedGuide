import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL, ENDPOINTS, COLORS, LANGUAGES } from '../config';
import { getTranslation } from '../translations';
import ChatBubble from '../components/ChatBubble';

export default function ChatScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: getTranslation('en', 'welcome'),
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        const prefs = await AsyncStorage.getItem('userPreferences');
        if (prefs) {
          const parsed = JSON.parse(prefs);
          if (parsed?.language) {
            const lang = parsed.language;
            setSelectedLanguage(lang);
            // Update welcome message with selected language
            setMessages([{
              id: '1',
              text: getTranslation(lang, 'welcome'),
              sender: 'bot',
              timestamp: new Date(),
            }]);
          }
        }
      } catch {}
    })();
  }, []);

  const changeLanguage = async (lang) => {
    setSelectedLanguage(lang);
    setShowLanguageModal(false);
    // Update welcome message
    setMessages([{
      id: '1',
      text: getTranslation(lang, 'welcome'),
      sender: 'bot',
      timestamp: new Date(),
    }]);
    // Save to preferences
    try {
      const prefs = await AsyncStorage.getItem('userPreferences');
      const parsed = prefs ? JSON.parse(prefs) : {};
      parsed.language = lang;
      await AsyncStorage.setItem('userPreferences', JSON.stringify(parsed));
    } catch {}
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}${ENDPOINTS.CHAT}`,
        {
          message: userMessage.text,
          language: selectedLanguage || 'en',
        }
      );

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: getTranslation(selectedLanguage, 'error'),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const speakMessage = (text, messageId) => {
    // Stop any ongoing speech immediately
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      // If clicking the same message that's speaking, stop it
      if (speakingMessageId === messageId) {
        return;
      }
    }

    setIsSpeaking(true);
    setSpeakingMessageId(messageId);
    
    const speechLang = selectedLanguage === 'en' ? 'en-US' : selectedLanguage;
    Speech.speak(text, {
      language: speechLang,
      pitch: 1.0,
      rate: 0.9,
      onStart: () => {
        setIsSpeaking(true);
        setSpeakingMessageId(messageId);
      },
      onDone: () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      },
      onStopped: () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      },
      onError: () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      },
    });
  };

  const renderMessage = ({ item }) => (
    <ChatBubble
      message={item}
      onSpeak={() => speakMessage(item.text, item.id)}
      isSpeaking={isSpeaking && speakingMessageId === item.id}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Language Selector Button */}
      <TouchableOpacity
        style={styles.languageButton}
        onPress={() => setShowLanguageModal(true)}
      >
        <Ionicons name="language" size={20} color={COLORS.primary} />
        <Text style={styles.languageButtonText}>
          {LANGUAGES[selectedLanguage] || 'English'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToBottom}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {getTranslation(selectedLanguage, 'loading')}
          </Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={getTranslation(selectedLanguage, 'placeholder')}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || loading) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {getTranslation(selectedLanguage, 'selectLanguage')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageOption,
                    selectedLanguage === code && styles.languageOptionActive,
                  ]}
                  onPress={() => changeLanguage(code)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      selectedLanguage === code && styles.languageOptionTextActive,
                    ]}
                  >
                    {name}
                  </Text>
                  {selectedLanguage === code && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  languageButtonText: {
    marginLeft: 8,
    marginRight: 4,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  messageList: {
    padding: 15,
    paddingBottom: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageOptionActive: {
    backgroundColor: COLORS.primaryLight,
  },
  languageOptionText: {
    fontSize: 16,
    color: '#333',
  },
  languageOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});