import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config';

export default function ChatBubble({ message, onSpeak, isSpeaking = false }) {
  const isBot = message.sender === 'bot';
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View
      style={[
        styles.container,
        isBot ? styles.botContainer : styles.userContainer,
      ]}
    >
      {isBot && (
        <View style={styles.botAvatar}>
          <Ionicons name="medical" size={20} color="#fff" />
        </View>
      )}
      
      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            isBot ? styles.botBubble : styles.userBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isBot ? styles.botText : styles.userText,
            ]}
          >
            {message.text}
          </Text>
          
          <View style={styles.footer}>
            <Text
              style={[
                styles.timestamp,
                isBot ? styles.botTimestamp : styles.userTimestamp,
              ]}
            >
              {formatTime(message.timestamp)}
            </Text>
            
            {isBot && (
              <TouchableOpacity
                style={styles.speakButton}
                onPress={onSpeak}
              >
                <Ionicons
                  name={isSpeaking ? 'stop-circle' : 'volume-medium'}
                  size={16}
                  color={isSpeaking ? COLORS.error : COLORS.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      
      {!isBot && (
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={20} color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  botContainer: {
    justifyContent: 'flex-start',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  bubbleWrapper: {
    maxWidth: '75%',
  },
  bubble: {
    borderRadius: 16,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  botText: {
    color: '#333',
  },
  userText: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  timestamp: {
    fontSize: 11,
  },
  botTimestamp: {
    color: '#999',
  },
  userTimestamp: {
    color: '#e8f5e9',
  },
  speakButton: {
    padding: 4,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});