import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllUsers, saveAllUsers, defaultUserData, simpleHash } from '../utils/storage';
import { AppContext } from '../../App';
import { COLORS, GRADIENT } from '../utils/theme';

export default function LoginScreen() {
  const { login } = useContext(AppContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedUsers, setSavedUsers] = useState([]);

  useEffect(() => {
    getAllUsers().then(u => setSavedUsers(Object.keys(u)));
  }, []);

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!username.trim()) { setErrorMsg('ユーザー名を入力してください'); return; }
    if (password.length < 4) { setErrorMsg('パスワードは4文字以上にしてください'); return; }

    const users = await getAllUsers();
    if (isRegister) {
      if (users[username]) { setErrorMsg('そのユーザー名はすでに使われています'); return; }
      users[username] = { ...defaultUserData(), passwordHash: simpleHash(password) };
      await saveAllUsers(users);
      login(username, users[username]);
    } else {
      if (!users[username]) { setErrorMsg('ユーザーが見つかりません'); return; }
      if (users[username].passwordHash !== simpleHash(password)) { setErrorMsg('パスワードが違います'); return; }
      login(username, users[username]);
    }
  };

  const handleGuest = () => login('ゲスト', defaultUserData(), true);

  return (
    <LinearGradient colors={GRADIENT} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>🎯</Text>
          <Text style={styles.title}>英検2級 単語マスター Pro</Text>
          <Text style={styles.sub}>2000語収録 — 合格への近道</Text>

          <View style={styles.card}>
            <Text style={styles.label}>ユーザー名</Text>
            <TextInput
              style={styles.input}
              placeholder="例: Taro"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <Text style={styles.label}>パスワード（4文字以上）</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onSubmitEditing={handleSubmit}
            />

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.loginBtn} onPress={handleSubmit}>
              <Text style={styles.loginBtnText}>
                {isRegister ? '📝 新規登録' : '🔓 ログイン'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setIsRegister(!isRegister); setErrorMsg(''); }}>
              <Text style={styles.toggle}>
                {isRegister ? 'すでにアカウントをお持ちの方は ' : 'アカウントがない方は '}
                <Text style={styles.toggleLink}>{isRegister ? 'ログイン' : '新規登録'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {savedUsers.length > 0 && (
            <View style={styles.savedSection}>
              <Text style={styles.savedTitle}>📂 保存済みユーザー</Text>
              <View style={styles.chipRow}>
                {savedUsers.map(name => (
                  <TouchableOpacity key={name} style={styles.chip} onPress={() => setUsername(name)}>
                    <Text style={styles.chipText}>👤 {name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.guestBtn} onPress={handleGuest}>
            <Text style={styles.guestText}>👤 ゲストとして入る（データは保存されません）</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 60 },
  logo: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4, textAlign: 'center' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 28, textAlign: 'center' },
  card: {
    width: '100%', maxWidth: 380,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  label: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12, padding: 13,
    color: '#fff', fontSize: 15, marginBottom: 12,
  },
  errorBox: { backgroundColor: 'rgba(231,76,60,0.3)', borderRadius: 10, padding: 10, marginBottom: 10 },
  errorText: { color: '#fff', fontSize: 13, textAlign: 'center' },
  loginBtn: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, alignItems: 'center', marginTop: 4,
  },
  loginBtnText: { color: COLORS.secondary, fontSize: 15, fontWeight: 'bold' },
  toggle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center', marginTop: 14 },
  toggleLink: { textDecorationLine: 'underline' },
  savedSection: { width: '100%', maxWidth: 380, marginTop: 20 },
  savedTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14,
  },
  chipText: { color: '#fff', fontSize: 13 },
  guestBtn: {
    marginTop: 16, width: '100%', maxWidth: 380,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  guestText: { color: '#fff', fontSize: 14 },
});
