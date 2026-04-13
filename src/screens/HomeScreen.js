import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Modal, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../App';
import { saveUserData, getTodayStr, getDateStr } from '../utils/storage';
import { COLORS, GRADIENT, SHADOWS } from '../utils/theme';
import { checkBadges, BADGES } from '../utils/badges';
import { getGreeting } from '../utils/helpers';

const MODES = [
  { key: 'Flashcard',  emoji: '📖', name: 'フラッシュカード', desc: 'カードをめくって覚える' },
  { key: 'Quiz',       emoji: '❓', name: '4択クイズ',        desc: '選択肢から正解を選ぶ' },
  { key: 'Spell',      emoji: '⌨️', name: 'スペルテスト',     desc: '英単語をスペルで入力' },
  { key: 'TimeAttack', emoji: '⏱️', name: 'タイムアタック',   desc: '制限時間内に答え続ける' },
];

export default function HomeScreen({ navigation }) {
  const { user, userData, isGuest, logout, updateUserData } = useContext(AppContext);
  const [badgeModal, setBadgeModal] = useState(false);
  const [newBadges, setNewBadges]   = useState([]);

  const greeting = getGreeting(user, userData?.streak || 0, userData?.totalStudied || 0);

  useFocusEffect(
    useCallback(() => {
      if (!userData) return;
      // Streak update on focus
      const today    = getTodayStr();
      const yesterday = getDateStr(-1);
      let updated = { ...userData };
      if (updated.lastStudyDate !== today) {
        if (updated.lastStudyDate === yesterday) {
          updated.streak = (updated.streak || 0) + 1;
        } else if (updated.lastStudyDate && updated.lastStudyDate !== today) {
          updated.streak = 0;
        }
        updated.lastStudyDate = today;
        const dates = updated.studyDates || [];
        if (!dates.includes(today)) dates.push(today);
        updated.studyDates = dates;
        if (updated.streak > (updated.bestStreak || 0)) updated.bestStreak = updated.streak;

        // Badge check
        const nb = checkBadges(updated);
        if (nb.length > 0) {
          nb.forEach(b => updated.earnedBadges.push(b.id));
          setNewBadges(nb);
          setBadgeModal(true);
        }
        updateUserData(updated);
        if (!isGuest) saveUserData(user, updated);
      }
    }, [userData?.lastStudyDate])
  );

  const accuracy = userData && userData.totalStudied > 0
    ? Math.round((userData.totalKnown / userData.totalStudied) * 100) : 0;

  // 28-day calendar
  const calDays = Array.from({ length: 28 }, (_, i) => getDateStr(i - 27));
  const studySet = new Set(userData?.studyDates || []);
  const today    = getTodayStr();

  const goMode = (mode) => navigation.navigate(mode);

  return (
    <LinearGradient colors={GRADIENT} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.emoji}>{greeting.emoji}</Text>
            <View>
              <Text style={styles.username}>{user}さん</Text>
              <Text style={styles.greetText} numberOfLines={2}>{greeting.text}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => { Alert.alert('ログアウト', 'ログアウトしますか？', [
            { text: 'キャンセル' }, { text: 'はい', onPress: logout }
          ]); }} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{userData?.totalStudied || 0}</Text>
            <Text style={styles.statLabel}>学習語数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{accuracy}%</Text>
            <Text style={styles.statLabel}>正解率</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{userData?.streak || 0}🔥</Text>
            <Text style={styles.statLabel}>連続日数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{userData?.sessions || 0}</Text>
            <Text style={styles.statLabel}>セッション</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            英検2級制覇 {Math.min(userData?.totalKnown || 0, 2000)}/2000語
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min((userData?.totalKnown || 0) / 20, 100)}%` }]} />
          </View>
        </View>

        {/* Mode grid */}
        <Text style={styles.sectionTitle}>学習モードを選ぶ</Text>
        <View style={styles.modeGrid}>
          {MODES.map(m => (
            <TouchableOpacity key={m.key} style={styles.modeCard} onPress={() => goMode(m.key)} activeOpacity={0.8}>
              <Text style={styles.modeEmoji}>{m.emoji}</Text>
              <Text style={styles.modeName}>{m.name}</Text>
              <Text style={styles.modeDesc}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Calendar */}
        <Text style={styles.sectionTitle}>📅 28日間の学習記録</Text>
        <View style={styles.calCard}>
          <View style={styles.calHeader}>
            {['日','月','火','水','木','金','土'].map(d => (
              <Text key={d} style={styles.calHeaderText}>{d}</Text>
            ))}
          </View>
          <View style={styles.calGrid}>
            {/* padding for first day of week */}
            {Array.from({ length: new Date(calDays[0]).getDay() }).map((_, i) => (
              <View key={`pad-${i}`} style={styles.calDay} />
            ))}
            {calDays.map(d => {
              const isToday   = d === today;
              const isStudied = studySet.has(d);
              return (
                <View key={d} style={[
                  styles.calDay,
                  isStudied && styles.calStudied,
                  isToday   && styles.calToday,
                ]}>
                  <Text style={[styles.calDayText, (isStudied || isToday) && { color: '#fff' }]}>
                    {parseInt(d.slice(-2), 10)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Badges */}
        {(userData?.earnedBadges?.length || 0) > 0 && (
          <>
            <Text style={styles.sectionTitle}>🏅 獲得バッジ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeRow}>
              {BADGES.filter(b => userData.earnedBadges.includes(b.id)).map(b => (
                <View key={b.id} style={styles.badgeChip}>
                  <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                  <Text style={styles.badgeName}>{b.name}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* New badge modal */}
      <Modal visible={badgeModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🎉 新しいバッジ獲得！</Text>
            {newBadges.map(b => (
              <View key={b.id} style={styles.modalBadge}>
                <Text style={styles.modalBadgeEmoji}>{b.emoji}</Text>
                <View>
                  <Text style={styles.modalBadgeName}>{b.name}</Text>
                  <Text style={styles.modalBadgeDesc}>{b.desc}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setBadgeModal(false)}>
              <Text style={styles.modalCloseText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 54 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  emoji: { fontSize: 36 },
  username: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  greetText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, maxWidth: 220 },
  logoutBtn: { padding: 6 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  statNum: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },
  progressSection: { marginBottom: 20 },
  progressLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 6 },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2ECC71', borderRadius: 4 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  modeCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    ...SHADOWS.card,
  },
  modeEmoji: { fontSize: 28, marginBottom: 6 },
  modeName: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  modeDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  calCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  calHeader: { flexDirection: 'row', marginBottom: 6 },
  calHeaderText: { flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  calDayText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  calStudied: { backgroundColor: '#4A90E2', borderRadius: 100 },
  calToday: { backgroundColor: '#E74C3C', borderRadius: 100 },
  badgeRow: { marginBottom: 16 },
  badgeChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, padding: 10, alignItems: 'center',
    marginRight: 8, minWidth: 70,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  badgeEmoji: { fontSize: 22 },
  badgeName: { color: '#fff', fontSize: 10, marginTop: 4, textAlign: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    width: '80%', alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  modalBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  modalBadgeEmoji: { fontSize: 36 },
  modalBadgeName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  modalBadgeDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  modalClose: {
    marginTop: 8, backgroundColor: '#667eea',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 32,
  },
  modalCloseText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
