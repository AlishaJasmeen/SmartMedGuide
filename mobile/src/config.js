// API Configuration for SmartMedGuide

// Backend API URL - Update this with your backend server URL
export const API_URL = __DEV__ 
  ? 'http://192.168.31.238:8000'  // Development - use your local IP
  : 'https://your-production-api.com';  // Production

// API Endpoints
export const ENDPOINTS = {
  PREDICT: '/predict',
  SEARCH: '/api/medicine/search',
  MEDICINE_DETAIL: '/api/medicine',
  CHAT: '/api/chat',
  TRANSLATE: '/api/translate',
  TTS: '/api/tts',
  HEALTH: '/health',
  DRUG_INTERACTIONS: '/api/drug-interactions',
};

// Supported Languages
export const LANGUAGES = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  te: 'తెలుగు (Telugu)',
  ta: 'தமிழ் (Tamil)',
  kn: 'ಕನ್ನಡ (Kannada)',
  ml: 'മലയാളം (Malayalam)',
  mr: 'मराठी (Marathi)',
  bn: 'বাংলা (Bengali)',
  gu: 'ગુજરાતી (Gujarati)',
  pa: 'ਪੰਜਾਬੀ (Punjabi)',
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'SmartMedGuide',
  VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'en',
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  REQUEST_TIMEOUT: 30000, // 30 seconds
};

// Theme Colors
export const COLORS = {
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#C8E6C9',
  secondary: '#2196F3',
  accent: '#FF9800',
  error: '#F44336',
  warning: '#FFC107',
  success: '#4CAF50',
  info: '#2196F3',
  background: '#FFFFFF',
  backgroundDark: '#121212',
  surface: '#F5F5F5',
  surfaceDark: '#1E1E1E',
  text: '#212121',
  textDark: '#FFFFFF',
  textSecondary: '#757575',
  border: '#E0E0E0',
  disabled: '#BDBDBD',
};

export default {
  API_URL,
  ENDPOINTS,
  LANGUAGES,
  APP_CONFIG,
  COLORS,
};