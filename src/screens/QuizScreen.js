import React, { useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../App';
import { saveUserData } from '../utils/storage';
import { GRADIENT, SHADOWS } from '../utils/theme';
import { checkBadges } from '../utils/badges';
import { shuffle, posLabel } from '../utils/helpers';
import WORDS from '../data/words.json';

const COUNTS   = [10, 20, 30, 50];
const POS_LIST = ['all','noun','verb','adj','adv','phrase'];
const POS_LBL  = { all:'全て', noun:'名詞', verb:'動詞', adj:'形容詞', adv:'副詞', phrase:'熟語' };

export default function QuizScreen({ navigation }) {
  const { user, userData, isGuest, updateUserData } = useContext(AppContext);

  const [phase, setPhase]     = useState('setup');
  const [count, setCount]     = useState(20);
  const [pos,   setPos]       = useState('all');
  const [direction, setDir]   = useState('en2ja'); // en2ja | ja2en

  const [words,    setWords]    = useState([]);
  const [index,    setIndex]    = useState(0);
  const [options,  setOptions]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [correct,  setCorrect]  = useState(0);
  const [answered, setAnswered] = useState(0);

  const buildOptions = (wordList, idx) => {
    const target = wordList[idx];
    const others = wordList.filter((_, i) => i !== idx);
    const wrongs = shuffle(others).slice(0, 3);
    return shuffle([target, ...wrongs]);
  };

  const startQuiz = () => {
    let pool = pos === 'all' ? [...WORDS] : WORDS.filter(w => w.pos === pos);
    const shuffled = shuffle(pool).slice(0, count);
    setWords(shuffled);
    setIndex(0);
    setSelected(null);
    setCorrect(0);
    setAnswered(0);
    setOptions(buildOptions(shuffled, 0));
    setPhase('quiz');
  };

  const speak = (text) => Speech.speak(text, { language: 'en-US', rate: 0.9 });

  const handleAnswer = (opt) => {
    if (selected !== null) return;
    setSelected(opt);
    const isCorrect = opt.en === words[index].en;
    const w = words[index];
    let updated = { ...userData };
    updated.totalStudied = (updated.totalStudied || 0) + 1;
    if (isCorrect) {
      updated.totalKnown = (updated.totalKnown || 0) + 1;
      updated.weakWords  = (updated.weakWords || []).filter(id => id !== w.en);
      setCorrect(c => c + 1);
    } else {
      if (!updated.weakWords.includes(w.en)) updated.weakWords.push(w.en);
    }
    setAnswered(a => a + 1);
    const nb = checkBadges(updated);
    nb.forEach(b => updated.earnedBadges.push(b.id));
    updateUserData(updated);
    if (!isGuest) saveUserData(user, updated);

    setTimeout(() => {
      if (index + 1 >= words.length) {
        updated.sessions = (updated.sessions || 0) + 1;
        updateUserData(updated);
        if (!isGuest) saveUserData(user, updated);
        setPhase('done');
      } else {
        setIndex(i => {
          const ni = i + 1;
          setOptions(buildOptions(words, ni));
          return ni;
        });
        setSelected(null);
      }
    }, 700);
  };

  if (phase === 'setup') return (
    <LinearGradient colors={GRADIENT} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>❓ 4択クイズ</Text>

        <Text style={styles.label}>出題方向</Text>
        <View style={styles.optRow}>
          {[['en2ja','英語→日本語'],['ja2en','日本語→英語']].map(([k,v]) => (
            <TouchableOpacity key={k} style={[styles.opt, direction === k && styles.optActive]} onPress={() => setDir(k)}>
              <Text style={[styles.optText, direction === k && styles.optTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>問題数</Text>
        <View style={styles.optRow}>
          {COUNTS.map(c => (
            <TouchableOpacity key={c} style={[styles.opt, count === c && styles.optActive]} onPress={() => setCount(c)}>
              <Text style={[styles.optText, count === c && styles.optTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>品詞フィルター</Text>
        <View style={styles.optRow}>
          {POS_LIST.map(p => (
            <TouchableOpacity key={p} style={[styles.opt, pos === p && styles.optActive]} onPress={() => setPos(p)}>
              <Text style={[styles.optText, pos === p && styles.optTextActive]}>{POS_LBL[p]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={startQuiz}>
          <Text style={styles.startBtnText}>スタート ▶</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );

  if (phase === 'done') {
    const pct   = Math.round((correct / words.length) * 100);
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '📚' : '💪';
    return (
      <LinearGradient colors={GRADIENT} style={styles.container}>
        <View style={styles.doneWrap}>
          <Text style={styles.doneEmoji}>{emoji}</Text>
          <Text style={styles.doneTitle}>クイズ終了！</Text>
          <Text style={styles.doneScore}>{correct} / {words.length}</Text>
          <Text style={styles.donePct}>正解率 {pct}%</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={startQuiz}>
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
  const question = direction === 'en2ja' ? w?.en    : w?.ja;
  const qNote    = direction === 'en2ja' ? w?.phonetic : posLabel(w?.pos);

  return (
    <LinearGradient colors={GRADIENT} style={styles.container}>
      <View style={styles.quizHeader}>
        <TouchableOpacity onPress={() => Alert.alert('終了', 'クイズを終了しますか？', [
          { text: 'キャンセル' }, { text: '終了', onPress: () => setPhase('setup') }
        ])}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.progWrap}>
          <Text style={styles.progText}>{index + 1} / {words.length}  ✅{correct}</Text>
          <View style={styles.progBar}>
            <View style={[styles.progFill, { width: `${((index + 1) / words.length) * 100}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.qWord}>{question}</Text>
        {qNote ? <Text style={styles.qNote}>{qNote}</Text> : null}
        {direction === 'en2ja' && (
          <TouchableOpacity onPress={() => speak(w?.en)} style={styles.speakBtn}>
            <Ionicons name="volume-high-outline" size={22} color="#667eea" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.optionsWrap}>
        {options.map((opt, i) => {
          const isCorrectOpt = opt.en === w.en;
          let bg = 'rgba(255,255,255,0.15)';
          if (selected !== null) {
            if (isCorrectOpt) bg = '#2ECC71';
            else if (selected.en === opt.en) bg = '#E74C3C';
          }
          return (
            <TouchableOpacity
              key={i}
              style={[styles.optBtn, { backgroundColor: bg }]}
              onPress={() => handleAnswer(opt)}
              activeOpacity={0.8}
            >
              <Text style={styles.optBtnText}>
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
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
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
  quizHeader: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 8 },
  progWrap: { marginTop: 6 },
  progText: { color: '#fff', fontSize: 13, textAlign: 'right', marginBottom: 4 },
  progBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  progFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  questionCard: {
    margin: 20, backgroundColor: '#fff', borderRadius: 20,
    padding: 28, alignItems: 'center', minHeight: 130,
    justifyContent: 'center', ...SHADOWS.card,
  },
  qWord: { fontSize: 30, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 6 },
  qNote: { fontSize: 15, color: '#888', marginBottom: 8 },
  speakBtn: { backgroundColor: '#EEF2FF', borderRadius: 24, padding: 8 },
  optionsWrap: { paddingHorizontal: 20, gap: 10 },
  optBtn: {
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
  },
  optBtnText: { color: '#fff', fontSize: 16, fontWeight: '500', textAlign: 'center' },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  doneEmoji: { fontSize: 64, marginBottom: 12 },
  doneTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  doneScore: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  donePct: { color: 'rgba(255,255,255,0.8)', fontSize: 18, marginBottom: 24 },
  doneBtn: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  doneBtnText: { color: '#667eea', fontSize: 16, fontWeight: 'bold' },
});
