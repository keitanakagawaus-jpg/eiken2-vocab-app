import React, { useState, useContext, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../App';
import { saveUserData } from '../utils/storage';
import { GRADIENT, COLORS, SHADOWS } from '../utils/theme';
import { checkBadges } from '../utils/badges';
import { shuffle, posLabel } from '../utils/helpers';
import WORDS from '../data/words.json';

const POS_LIST  = ['all','noun','verb','adj','adv','phrase'];
const POS_LABEL = { all:'全て', noun:'名詞', verb:'動詞', adj:'形容詞', adv:'副詞', phrase:'熟語' };
const COUNTS    = [10, 20, 30, 50, 100, 0]; // 0 = all

export default function FlashcardScreen({ navigation }) {
  const { user, userData, isGuest, updateUserData } = useContext(AppContext);

  // Setup state
  const [phase, setPhase]  = useState('setup'); // setup | study | done
  const [count, setCount]  = useState(20);
  const [pos,   setPos]    = useState('all');

  // Study state
  const [words,   setWords]   = useState([]);
  const [index,   setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known,   setKnown]   = useState(0);
  const [unknown, setUnknown] = useState(0);

  // Flip animation
  const flipAnim = useRef(new Animated.Value(0)).current;

  const startStudy = () => {
    let pool = pos === 'all' ? [...WORDS] : WORDS.filter(w => w.pos === pos);
    // Prioritize weak words
    const weak = new Set(userData?.weakWords || []);
    pool.sort((a, b) => (weak.has(b.en) ? 1 : 0) - (weak.has(a.en) ? 1 : 0));
    const shuffled = shuffle(pool);
    const selected = count === 0 ? shuffled : shuffled.slice(0, count);
    setWords(selected);
    setIndex(0);
    setFlipped(false);
    setKnown(0);
    setUnknown(0);
    flipAnim.setValue(0);
    setPhase('study');
  };

  const doFlip = () => {
    Animated.spring(flipAnim, {
      toValue: flipped ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
    setFlipped(!flipped);
  };

  const speak = () => {
    const w = words[index];
    if (!w) return;
    Speech.speak(w.en, { language: 'en-US', rate: 0.9 });
  };

  const answer = (correct) => {
    const w = words[index];
    let updated = { ...userData };
    updated.totalStudied = (updated.totalStudied || 0) + 1;
    if (correct) {
      updated.totalKnown = (updated.totalKnown || 0) + 1;
      updated.weakWords  = (updated.weakWords || []).filter(id => id !== w.en);
      setKnown(k => k + 1);
    } else {
      if (!updated.weakWords.includes(w.en)) updated.weakWords.push(w.en);
      setUnknown(u => u + 1);
    }
    const nb = checkBadges(updated);
    nb.forEach(b => updated.earnedBadges.push(b.id));
    updateUserData(updated);
    if (!isGuest) saveUserData(user, updated);

    if (index + 1 >= words.length) {
      updated.sessions = (updated.sessions || 0) + 1;
      updateUserData(updated);
      if (!isGuest) saveUserData(user, updated);
      setPhase('done');
    } else {
      flipAnim.setValue(0);
      setFlipped(false);
      setIndex(i => i + 1);
    }
  };

  const frontInterp = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backInterp  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  if (phase === 'setup') return (
    <LinearGradient colors={GRADIENT} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📖 フラッシュカード</Text>
        <Text style={styles.sectionLabel}>問題数</Text>
        <View style={styles.optRow}>
          {COUNTS.map(c => (
            <TouchableOpacity key={c} style={[styles.opt, count === c && styles.optActive]} onPress={() => setCount(c)}>
              <Text style={[styles.optText, count === c && styles.optTextActive]}>{c === 0 ? '全問' : c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sectionLabel}>品詞フィルター</Text>
        <View style={styles.optRow}>
          {POS_LIST.map(p => (
            <TouchableOpacity key={p} style={[styles.opt, pos === p && styles.optActive]} onPress={() => setPos(p)}>
              <Text style={[styles.optText, pos === p && styles.optTextActive]}>{POS_LABEL[p]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.startBtn} onPress={startStudy}>
          <Text style={styles.startBtnText}>学習スタート ▶</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );

  if (phase === 'done') {
    const total = known + unknown;
    const pct   = total > 0 ? Math.round((known / total) * 100) : 0;
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '📚' : '💪';
    return (
      <LinearGradient colors={GRADIENT} style={styles.container}>
        <View style={styles.doneWrap}>
          <Text style={styles.doneEmoji}>{emoji}</Text>
          <Text style={styles.doneTitle}>フラッシュカード完了！</Text>
          <Text style={styles.doneScore}>正解率 {pct}%</Text>
          <Text style={styles.doneSub}>覚えた: {known}語 ／ 要復習: {unknown}語</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={startStudy}>
            <Text style={styles.doneBtnText}>もう一度</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 8 }]} onPress={() => setPhase('setup')}>
            <Text style={styles.doneBtnText}>設定に戻る</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 8 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>ホームへ</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const w = words[index];
  const weak = (userData?.weakWords || []).includes(w?.en);

  return (
    <LinearGradient colors={GRADIENT} style={styles.container}>
      <View style={styles.studyHeader}>
        <TouchableOpacity onPress={() => { Alert.alert('終了', 'フラッシュカードを終了しますか？', [
          { text: 'キャンセル' }, { text: '終了', onPress: () => setPhase('setup') }
        ]); }}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.progress}>{index + 1} / {words.length}</Text>
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBarFill, { width: `${((index + 1) / words.length) * 100}%` }]} />
        </View>
      </View>

      <TouchableOpacity style={styles.cardWrap} onPress={doFlip} activeOpacity={0.95}>
        {/* Front */}
        <Animated.View style={[styles.card, styles.cardFront, { transform: [{ rotateY: frontInterp }] }]}>
          {weak && <Text style={styles.weakBadge}>⚠️ 苦手</Text>}
          <Text style={styles.posTag}>{posLabel(w?.pos)}</Text>
          <Text style={styles.wordEn}>{w?.en}</Text>
          <Text style={styles.phonetic}>{w?.phonetic}</Text>
          <TouchableOpacity onPress={speak} style={styles.speakBtn}>
            <Ionicons name="volume-high-outline" size={22} color="#667eea" />
          </TouchableOpacity>
          <Text style={styles.flipHint}>タップで意味を確認</Text>
        </Animated.View>

        {/* Back */}
        <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backInterp }] }]}>
          <Text style={styles.posTag}>{posLabel(w?.pos)}</Text>
          <Text style={styles.wordJa}>{w?.ja}</Text>
          <Text style={styles.exampleText}>{w?.ex}</Text>
          <Text style={styles.flipHint}>答えたらボタンを押す</Text>
        </Animated.View>
      </TouchableOpacity>

      {flipped && (
        <View style={styles.answerRow}>
          <TouchableOpacity style={[styles.ansBtn, styles.ansBtnBad]} onPress={() => answer(false)}>
            <Text style={styles.ansBtnText}>😓 要復習</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ansBtn, styles.ansBtnGood]} onPress={() => answer(true)}>
            <Text style={styles.ansBtnText}>✅ 覚えた！</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.scoreRow}>
        <Text style={styles.scoreText}>✅ {known}  😓 {unknown}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingTop: 54 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { color: '#fff', fontSize: 15 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
  sectionLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 8, marginTop: 8 },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  opt: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16,
  },
  optActive: { backgroundColor: '#fff' },
  optText: { color: '#fff', fontSize: 13 },
  optTextActive: { color: '#667eea', fontWeight: 'bold' },
  startBtn: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 16,
  },
  startBtnText: { color: '#667eea', fontSize: 16, fontWeight: 'bold' },
  studyHeader: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 8 },
  progress: { color: '#fff', fontSize: 13, textAlign: 'right', marginBottom: 4 },
  progressBarWrap: { height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  cardWrap: { flex: 1, margin: 20, marginTop: 16 },
  card: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff', borderRadius: 24,
    padding: 28, alignItems: 'center', justifyContent: 'center',
    backfaceVisibility: 'hidden',
    ...SHADOWS.card,
  },
  cardFront: {},
  cardBack:  {},
  weakBadge: {
    position: 'absolute', top: 14, right: 14,
    backgroundColor: '#FFF3CD', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
    fontSize: 12,
  },
  posTag: {
    backgroundColor: '#EEF2FF', color: '#667eea',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
    fontSize: 12, fontWeight: '600', marginBottom: 10,
  },
  wordEn: { fontSize: 36, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 6 },
  phonetic: { fontSize: 16, color: '#888', marginBottom: 12 },
  speakBtn: {
    backgroundColor: '#EEF2FF', borderRadius: 24,
    padding: 10, marginBottom: 12,
  },
  flipHint: { color: '#aaa', fontSize: 12, position: 'absolute', bottom: 18 },
  wordJa: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 12 },
  exampleText: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18 },
  answerRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  ansBtn: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  ansBtnBad: { backgroundColor: '#E74C3C' },
  ansBtnGood: { backgroundColor: '#2ECC71' },
  ansBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  scoreRow: { paddingBottom: 20, alignItems: 'center' },
  scoreText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  doneEmoji: { fontSize: 64, marginBottom: 12 },
  doneTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  doneScore: { color: '#fff', fontSize: 40, fontWeight: 'bold', marginBottom: 8 },
  doneSub: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginBottom: 24 },
  doneBtn: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 40, width: '100%', alignItems: 'center',
  },
  doneBtnText: { color: '#667eea', fontSize: 16, fontWeight: 'bold' },
});
