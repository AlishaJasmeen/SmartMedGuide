import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';

export default function LoginScreen({ navigation, route }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const onLogin = route.params?.onLogin;

  useEffect(() => {
    // If user already logged in, skip
    (async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        const auth = await AsyncStorage.getItem('authUser');
        if ((isLoggedIn === 'true' || auth) && onLogin) {
          if (auth) {
            onLogin(JSON.parse(auth));
          } else {
            // If isLoggedIn is true but no authUser, still allow login
            onLogin(null);
          }
        }
      } catch (e) {
        console.error('Error checking login status:', e);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter username and password.');
      return;
    }
    try {
      const saved = await AsyncStorage.getItem('authUser');
      if (!saved) {
        Alert.alert('Not Registered', 'Please register first.');
        return;
      }
      const user = JSON.parse(saved);
      if (user.username === username.trim() && user.password === password) {
        await AsyncStorage.setItem('isLoggedIn', 'true');
        onLogin && onLogin(user);
      } else {
        Alert.alert('Invalid Credentials', 'Username or password is incorrect.');
      }
    } catch (e) {
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.replace('Register', { onLogin })}
          style={styles.linkBtn}
        >
          <Text style={styles.link}>New user? Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 2 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.primary, marginBottom: 15, textAlign: 'center' },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
  linkBtn: { marginTop: 12, alignItems: 'center' },
  link: { color: COLORS.secondary, fontWeight: '600' },
});

