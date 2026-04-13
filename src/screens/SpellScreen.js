import React, { useState, useContext, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
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

const COUNTS = [10, 20, 30, 50];
const HINTS  = ['first', 'length', 'none'];
const HINT_LBL = { first: '最初の文字', length: '文字数のみ', none: 'ヒントなし' };

export default function SpellScreen({ navigation }) {
  const { user, userData, isGuest, updateUserData } = useContext(AppContext);

  const [phase,  setPhase]  = useState('setup');
  const [count,  setCount]  = useState(20);
  const [hint,   setHint]   = useState('first');

  const [words,    setWords]    = useState([]);
  const [index,    setIndex]    = useState(0);
  const [input,    setInput]    = useState('');
  const [result,   setResult]   = useState(null); // null | 'correct' | 'wrong'
  const [correct,  setCorrect]  = useState(0);
  const [combo,    setCombo]    = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  const inputRef = useRef(null);

  const startSpell = () => {
    const pool = shuffle([...WORDS]).slice(0, count);
    setWords(pool);
    setIndex(0);
    setInput('');
    setResult(null);
    setCorrect(0);
    setCombo(0);
    setMaxCombo(0);
    setPhase('spell');
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const speak = () => {
    const w = words[index];
    if (!w) return;
    Speech.speak(w.en, { language: 'en-US', rate: 0.85 });
  };

  const getHint = (word) => {
    if (hint === 'first')  return word[0] + '_ '.repeat(word.length - 1).trim();
    if (hint === 'length') return `${word.length}文字`;
    return '';
  };

  const submit = () => {
    if (result !== null) {
      next();
      return;
    }
    const w = words[index];
    const ans = input.trim().toLowerCase();
    const isCorrect = ans === w.en.toLowerCase();
    setResult(isCorrect ? 'correct' : 'wrong');

    let updated = { ...userData };
    updated.totalStudied = (updated.totalStudied || 0) + 1;

    if (isCorrect) {
      updated.totalKnown = (updated.totalKnown || 0) + 1;
      updated.weakWords  = (updated.weakWords || []).filter(id => id !== w.en);
      const newCombo = combo + 1;
      const newMax   = Math.max(maxCombo, newCombo);
      setCorrect(c => c + 1);
      setCombo(newCombo);
      setMaxCombo(newMax);
      updated.spellStreak = Math.max(updated.spellStreak || 0, newCombo);
    } else {
      if (!updated.weakWords.includes(w.en)) updated.weakWords.push(w.en);
      setCombo(0);
    }

    const nb = checkBadges(updated);
    nb.forEach(b => updated.earnedBadges.push(b.id));
    updateUserData(updated);
    if (!isGuest) saveUserData(user, updated);
  };

  const next = () => {
    if (index + 1 >= words.length) {
      let updated = { ...userData };
      updated.sessions = (updated.sessions || 0) + 1;
      updateUserData(updated);
      if (!isGuest) saveUserData(user, updated);
      setPhase('done');
    } else {
      setIndex(i => i + 1);
      setInput('');
      setResult(null);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  };

  // Diff highlight
  const renderDiff = (answer, correct) => {
    return answer.split('').map((ch, i) => ({
      ch, ok: ch.toLowerCase() === (correct[i] || '').toLowerCase(),
    }));
  };

  if (phase === 'setup') return (
    <LinearGradient colors={GRADIENT} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⌨️ スペルテスト</Text>

        <Text style={styles.label}>問題数</Text>
        <View style={styles.optRow}>
          {COUNTS.map(c => (
            <TouchableOpacity key={c} style={[styles.opt, count === c && styles.optActive]} onPress={() => setCount(c)}>
              <Text style={[styles.optText, count === c && styles.optTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>ヒント</Text>
        <View style={styles.optRow}>
          {HINTS.map(h => (
            <TouchableOpacity key={h} style={[styles.opt, hint === h && styles.optActive]} onPress={() => setHint(h)}>
              <Text style={[styles.optText, hint === h && styles.optTextActive]}>{HINT_LBL[h]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={startSpell}>
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
          <Text style={styles.doneTitle}>スペルテスト完了！</Text>
          <Text style={styles.doneScore}>{correct} / {words.length}</Text>
          <Text style={styles.donePct}>正解率 {pct}%</Text>
          <Text style={styles.doneCombo}>最大コンボ: {maxCombo}🔥</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={startSpell}><Text style={styles.doneBtnText}>もう一度</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 8 }]} onPress={() => setPhase('setup')}><Text style={styles.doneBtnText}>設定に戻る</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 8 }]} onPress={() => navigation.goBack()}><Text style={styles.doneBtnText}>ホームへ</Text></TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const w   = words[index];
  const hintStr = getHint(w?.en || '');
  const diff    = result === 'wrong' ? renderDiff(input.trim(), w?.en || '') : null;

  return (
    <LinearGradient colors={GRADIENT} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.spellHeader}>
          <TouchableOpacity onPress={() => Alert.alert('終了', 'スペルテストを終了しますか？', [
            { text: 'キャンセル' }, { text: '終了', onPress: () => setPhase('setup') }
          ])}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.progText}>{index + 1} / {words.length}</Text>
          {combo >= 3 && <Text style={styles.comboText}>🔥 {combo}コンボ！</Text>}
        </View>

        <ScrollView contentContainerStyle={styles.spellBody}>
          <View style={styles.questionCard}>
            <Text style={styles.posTag}>{posLabel(w?.pos)}</Text>
            <Text style={styles.meaningText}>{w?.ja}</Text>
            <Text style={styles.exText}>{w?.ex}</Text>
            {hintStr ? <Text style={styles.hintText}>ヒント: {hintStr}</Text> : null}
            <TouchableOpacity onPress={speak} style={styles.speakBtn}>
              <Ionicons name="volume-high-outline" size={20} color="#667eea" />
              <Text style={styles.speakText}>音声を聞く</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            ref={inputRef}
            style={[styles.inputBox, result === 'correct' && styles.inputCorrect, result === 'wrong' && styles.inputWrong]}
            value={input}
            onChangeText={t => result === null && setInput(t)}
            placeholder="英単語を入力..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={submit}
          />

          {result === 'correct' && (
            <View style={styles.resultBox}>
              <Text style={styles.resultCorrect}>✅ 正解！ {w?.en}</Text>
            </View>
          )}
          {result === 'wrong' && (
            <View style={styles.resultBox}>
              <Text style={styles.resultWrong}>❌ 不正解</Text>
              <Text style={styles.correctAnswer}>正解: {w?.en}</Text>
              <View style={styles.diffRow}>
                {diff?.map((d, i) => (
                  <Text key={i} style={[styles.diffChar, d.ok ? styles.diffOk : styles.diffBad]}>{d.ch}</Text>
                ))}
                {/* extra chars in correct answer */}
                {(w?.en || '').slice(input.trim().length).split('').map((ch, i) => (
                  <Text key={`extra-${i}`} style={[styles.diffChar, styles.diffMissing]}>{ch}</Text>
                ))}
              </View>
            </View>
          )}

          {result !== null && (
            <TouchableOpacity style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextBtnText}>{index + 1 >= words.length ? '結果を見る' : '次へ ▶'}</Text>
            </TouchableOpacity>
          )}
          {result === null && (
            <TouchableOpacity style={styles.submitBtn} onPress={submit}>
              <Text style={styles.submitBtnText}>答える</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  spellHeader: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  comboText: { color: '#F39C12', fontSize: 14, fontWeight: 'bold' },
  spellBody: { padding: 20 },
  questionCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    alignItems: 'center', marginBottom: 16, ...SHADOWS.card,
  },
  posTag: {
    backgroundColor: '#EEF2FF', color: '#667eea',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
    fontSize: 12, fontWeight: '600', marginBottom: 10,
  },
  meaningText: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  exText: { fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 18, marginBottom: 10 },
  hintText: { fontSize: 13, color: '#667eea', fontWeight: '600', marginBottom: 8 },
  speakBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  speakText: { color: '#667eea', fontSize: 13 },
  inputBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 14, padding: 14,
    color: '#fff', fontSize: 18, textAlign: 'center',
    marginBottom: 12,
  },
  inputCorrect: { borderColor: '#2ECC71', backgroundColor: 'rgba(46,204,113,0.2)' },
  inputWrong:   { borderColor: '#E74C3C', backgroundColor: 'rgba(231,76,60,0.2)' },
  resultBox: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, alignItems: 'center' },
  resultCorrect: { color: '#2ECC71', fontSize: 16, fontWeight: 'bold' },
  resultWrong:   { color: '#E74C3C', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  correctAnswer: { color: '#333', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  diffRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  diffChar: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 1 },
  diffOk:   { color: '#2ECC71' },
  diffBad:  { color: '#E74C3C', textDecorationLine: 'underline' },
  diffMissing: { color: '#aaa' },
  submitBtn: { backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center' },
  submitBtnText: { color: '#667eea', fontSize: 16, fontWeight: 'bold' },
  nextBtn: { backgroundColor: '#2ECC71', borderRadius: 14, padding: 14, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  doneEmoji: { fontSize: 64, marginBottom: 12 },
  doneTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  doneScore: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  donePct: { color: 'rgba(255,255,255,0.8)', fontSize: 18, marginBottom: 4 },
  doneCombo: { color: '#F39C12', fontSize: 15, fontWeight: 'bold', marginBottom: 20 },
  doneBtn: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  doneBtnText: { color: '#667eea', fontSize: 16, fontWeight: 'bold' },
});
