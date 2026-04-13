import React, { useContext, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../../App';
import { saveUserData, defaultUserData, getTodayStr, getDateStr } from '../utils/storage';
import { GRADIENT } from '../utils/theme';
import { BADGES } from '../utils/badges';

export default function StatsScreen() {
  const { user, userData, isGuest, updateUserData } = useContext(AppContext);

  const d = userData || defaultUserData();
  const accuracy  = d.totalStudied > 0 ? Math.round((d.totalKnown / d.totalStudied) * 100) : 0;
  const today     = getTodayStr();
  const studySet  = new Set(d.studyDates || []);

  // 28-day calendar
  const calDays = Array.from({ length: 28 }, (_, i) => getDateStr(i - 27));

  const handleReset = () => {
    Alert.alert('データリセット', '本当にリセットしますか？この操作は取り消せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'リセット', style: 'destructive',
        onPress: () => {
          const fresh = defaultUserData();
          if (!isGuest) fresh.passwordHash = d.passwordHash;
          updateUserData(fresh);
          if (!isGuest) saveUserData(user, fresh);
        },
      },
    ]);
  };

  const earnedBadges = BADGES.filter(b => d.earnedBadges?.includes(b.id));
  const allBadges    = BADGES;

  return (
    <LinearGradient colors={GRADIENT} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>📊 統計</Text>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {[
            ['学習語数', d.totalStudied],
            ['習得済み', d.totalKnown],
            ['正解率',   accuracy + '%'],
            ['苦手単語', (d.weakWords || []).length],
            ['セッション', d.sessions],
            ['連続日数', d.streak + '🔥'],
            ['最大連続', (d.bestStreak || 0) + '日'],
          ].map(([label, val]) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statVal}>{val}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Progress bar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 2000語制覇への道</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min((d.totalKnown / 20), 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.min(d.totalKnown, 2000)} / 2000語習得</Text>
        </View>

        {/* 28-day calendar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 28日間の学習カレンダー</Text>
          <View style={styles.calCard}>
            <View style={styles.calHeader}>
              {['日','月','火','水','木','金','土'].map(dy => (
                <Text key={dy} style={styles.calDayHeader}>{dy}</Text>
              ))}
            </View>
            <View style={styles.calGrid}>
              {Array.from({ length: new Date(calDays[0]).getDay() }).map((_, i) => (
                <View key={`pad-${i}`} style={styles.calCell} />
              ))}
              {calDays.map(day => {
                const isToday   = day === today;
                const isStudied = studySet.has(day);
                return (
                  <View key={day} style={[
                    styles.calCell,
                    isStudied && styles.calCellStudied,
                    isToday   && styles.calCellToday,
                  ]}>
                    <Text style={[styles.calCellText, (isStudied || isToday) && { color: '#fff' }]}>
                      {parseInt(day.slice(-2), 10)}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.calLegend}>
              <View style={[styles.legendDot, { backgroundColor: '#4A90E2' }]} />
              <Text style={styles.legendText}>学習済み</Text>
              <View style={[styles.legendDot, { backgroundColor: '#E74C3C', marginLeft: 12 }]} />
              <Text style={styles.legendText}>今日</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏅 バッジ ({earnedBadges.length}/{allBadges.length})</Text>
          <View style={styles.badgeGrid}>
            {allBadges.map(b => {
              const earned = d.earnedBadges?.includes(b.id);
              return (
                <View key={b.id} style={[styles.badgeCard, !earned && styles.badgeLocked]}>
                  <Text style={[styles.badgeEmoji, !earned && styles.badgeLocked]}>{b.emoji}</Text>
                  <Text style={[styles.badgeName, !earned && { color: 'rgba(255,255,255,0.4)' }]}>{b.name}</Text>
                  {!earned && <Text style={styles.lockIcon}>🔒</Text>}
                </View>
              );
            })}
          </View>
        </View>

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>🗑️ データをリセット</Text>
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 54 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: '30%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  statVal: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  progressBar: { height: 10, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 5, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: '#2ECC71', borderRadius: 5 },
  progressText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  calCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  calHeader: { flexDirection: 'row', marginBottom: 6 },
  calDayHeader: { flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  calCellStudied: { backgroundColor: '#4A90E2', borderRadius: 100 },
  calCellToday: { backgroundColor: '#E74C3C', borderRadius: 100 },
  calCellText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  calLegend: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginLeft: 4 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeCard: {
    width: '30%', flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeCardLocked: { backgroundColor: 'rgba(255,255,255,0.06)' },
  badgeLocked: { opacity: 0.4 },
  badgeEmoji: { fontSize: 24, marginBottom: 4 },
  badgeName: { color: '#fff', fontSize: 10, textAlign: 'center' },
  lockIcon: { fontSize: 12, position: 'absolute', top: 4, right: 6 },
  resetBtn: {
    backgroundColor: 'rgba(231,76,60,0.3)',
    borderWidth: 1, borderColor: 'rgba(231,76,60,0.6)',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  resetText: { color: '#fff', fontSize: 14 },
});
