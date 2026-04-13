import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../App';
import { saveUserData } from '../utils/storage';
import { GRADIENT, SHADOWS } from '../utils/theme';
import { checkBadges } from '../utils/badges';
import { shuffle } from '../utils/helpers';
import WORDS from '../data/words.json';

const TIMES = [60, 90, 120, 180];

export default function TimeAttackScreen({ navigation }) {
  const { user, userData, isGuest, updateUserData } = useContext(AppContext);

  const [phase,    setPhase]    = useState('setup');
  const [timeSec,  setTimeSec]  = useState(60);
  const [direction, setDir]     = useState('en2ja');

  const [words,    setWords]    = useState([]);
  const [index,    setIndex]    = useState(0);
  const [options,  setOptions]  = useState([]);
  const [score,    setScore]    = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selected, setSelected] = useState(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const timerRef = useRef(null);
  const flashAnim = useRef(new Animated.Value(1)).current;

  const buildOptions = (wordList, idx) => {
    const target = wordList[idx % wordList.length];
    const others  = wordList.filter((_, i) => i !== idx % wordList.length);
    const wrongs  = shuffle(others).slice(0, 3);
    return shuffle([target, ...wrongs]);
  };

  const startGame = () => {
    const shuffled = shuffle([...WORDS]);
    setWords(shuffled);
    setIndex(0);
    setScore(0);
    setSelected(null);
    setTimeLeft(timeSec);
    setIsNewRecord(false);
    setOptions(buildOptions(shuffled, 0));
    setPhase('game');
  };

  useEffect(() => {
    if (phase !== 'game') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const endGame = () => {
    clearInterval(timerRef.current);
    setPhase('done');
  };

  const handleAnswer = (opt) => {
    if (selected !== null) return;
    setSelected(opt);
    const w = words[index % words.length];
    const isCorrect = opt.en === w.en;

    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flash('#2ECC71');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      flash('#E74C3C');
    }

    setTimeout(() => {
      const ni = index + 1;
      setIndex(ni);
      setOptions(buildOptions(words, ni));
      setSelected(null);
    }, 400);
  };

  const flash = (color) => {
    // Simple flash via opacity
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0.3, duration: 100, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1,   duration: 200, useNativeDriver: true }),
    ]).start();
  };

  // Done: save best score
  useEffect(() => {
    if (phase !== 'done') return;
    let updated = { ...userData };
    const prev = updated.timeAttackBest || 0;
    if (score > prev) {
      updated.timeAttackBest = score;
      setIsNewRecord(true);
    }
    updated.sessions    = (updated.sessions || 0) + 1;
    updated.totalStudied = (updated.totalStudied || 0) + score;
    const nb = checkBadges(updated);
    nb.forEach(b => updated.earnedBadges.push(b.id));
    updateUserData(updated);
    if (!isGuest) saveUserData(user, updated);
  }, [phase]);

  const timeColor = timeLeft <= 10 ? '#E74C3C' : timeLeft <= 30 ? '#F39C12' : '#fff';

  if (phase === 'setup') return (
    <LinearGradient colors={GRADIENT} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⏱️ タイムアタック</Text>

        {(userData?.timeAttackBest || 0) > 0 && (
          <View style={styles.bestBox}>
            <Text style={styles.bestText}>🏆 ベストスコア: {userData.timeAttackBest}問</Text>
          </View>
        )}

        <Text style={styles.label}>制限時間</Text>
        <View style={styles.optRow}>
          {TIMES.map(t => (
            <TouchableOpacity key={t} style={[styles.opt, timeSec === t && styles.optActive]} onPress={() => setTimeSec(t)}>
              <Text style={[styles.optText, timeSec === t && styles.optTextActive]}>{t}秒</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>出題方向</Text>
        <View style={styles.optRow}>
          {[['en2ja','英語→日本語'],['ja2en','日本語→英語']].map(([k,v]) => (
            <TouchableOpacity key={k} style={[styles.opt, direction === k && styles.optActive]} onPress={() => setDir(k)}>
              <Text style={[styles.optText, direction === k && styles.optTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>スタート ▶</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );

  if (phase === 'done') {
    const emoji = score >= 50 ? '⚡' : score >= 30 ? '🎉' : '⏱️';
    return (
      <LinearGradient colors={GRADIENT} style={styles.container}>
        <View style={styles.doneWrap}>
          <Text style={styles.doneEmoji}>{emoji}</Text>
          {isNewRecord && <Text style={styles.newRecord}>🎊 新記録！</Text>}
          <Text style={styles.doneTitle}>タイムアタック終了！</Text>
          <Text style={styles.doneScore}>{score}問</Text>
          <Text style={styles.doneSub}>{timeSec}秒チャレンジ</Text>
          <Text style={styles.doneBest}>ベスト: {userData?.timeAttackBest || score}問</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={startGame}><Text style={styles.doneBtnText}>もう一度</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 8 }]} onPress={() => setPhase('setup')}><Text style={styles.doneBtnText}>設定に戻る</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 8 }]} onPress={() => navigation.goBack()}><Text style={styles.doneBtnText}>ホームへ</Text></TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const w = words[index % words.length];
  const question = direction === 'en2ja' ? w?.en : w?.ja;

  return (
    <LinearGradient colors={GRADIENT} style={styles.container}>
      <View style={styles.gameHeader}>
        <Text style={[styles.timer, { color: timeColor }]}>⏱️ {timeLeft}s</Text>
        <Text style={styles.gameScore}>✅ {score}</Text>
      </View>

      <View style={styles.timerBar}>
        <View style={[styles.timerFill, {
          width: `${(timeLeft / timeSec) * 100}%`,
          backgroundColor: timeLeft <= 10 ? '#E74C3C' : timeLeft <= 30 ? '#F39C12' : '#2ECC71',
        }]} />
      </View>

      <Animated.View style={[styles.questionCard, { opacity: flashAnim }]}>
        <Text style={styles.qWord}>{question}</Text>
        {direction === 'en2ja' && w?.phonetic && (
          <Text style={styles.qPhonetic}>{w.phonetic}</Text>
        )}
      </Animated.View>

      <View style={styles.optGrid}>
        {options.map((opt, i) => {
          let bg = 'rgba(255,255,255,0.15)';
          if (selected !== null) {
            if (opt.en === w.en) bg = '#2ECC71';
            else if (selected.en === opt.en) bg = '#E74C3C';
          }
          return (
            <TouchableOpacity
              key={i}
              style={[styles.optBtn, { backgroundColor: bg }]}
              onPress={() => handleAnswer(opt)}
              activeOpacity={0.8}
            >
              <Text style={styles.optBtnText} numberOfLines={2}>
                {direction === 'en2ja' ? opt.ja : opt.en}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingTop: 54 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { color: '#fff', fontSize: 15 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  bestBox: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.5)',
    borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center',
  },
  bestText: { color: '#FFD700', fontSize: 15, fontWeight: 'bold' },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 8, marginTop: 8 },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  opt: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16,
  },
  optActive: { backgroundColor: '#fff' },
  optText: { color: '#fff', fontSize: 13 },
  optTextActive: { color: '#667eea', fontWeight: 'bold' },
  startBtn: { backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  startBtnText: { color: '#667eea', fontSize: 16, fontWeight: 'bold' },
  gameHeader: { paddingTop: 54, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 },
  timer: { fontSize: 28, fontWeight: 'bold' },
  gameScore: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  timerBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 20, borderRadius: 3, marginBottom: 12 },
  timerFill: { height: '100%', borderRadius: 3 },
  questionCard: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 20,
    padding: 24, alignItems: 'center', minHeight: 120,
    justifyContent: 'center', marginBottom: 16, ...SHADOWS.card,
  },
  qWord: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  qPhonetic: { fontSize: 14, color: '#888', marginTop: 6 },
  optGrid: { paddingHorizontal: 20, gap: 10 },
  optBtn: {
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
  },
  optBtnText: { color: '#fff', fontSize: 15, fontWeight: '500', textAlign: 'center' },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  doneEmoji: { fontSize: 64, marginBottom: 8 },
  newRecord: { color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  doneTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  doneScore: { color: '#fff', fontSize: 48, fontWeight: 'bold' },
  doneSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4 },
  doneBest: { color: '#FFD700', fontSize: 15, fontWeight: 'bold', marginBottom: 20 },
  doneBtn: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  doneBtnText: { color: '#667eea', fontSize: 16, fontWeight: 'bold' },
});
