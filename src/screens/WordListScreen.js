import React, { useState, useMemo, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Modal, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../App';
import { GRADIENT, SHADOWS } from '../utils/theme';
import { posLabel, posShort, shuffle } from '../utils/helpers';
import WORDS from '../data/words.json';

const POS_LIST = ['all','noun','verb','adj','adv','phrase','weak'];
const POS_LBL  = { all:'全て', noun:'名詞', verb:'動詞', adj:'形容詞', adv:'副詞', phrase:'熟語', weak:'苦手' };
const SORTS    = ['default','az','za','difficulty'];
const SORT_LBL = { default:'デフォルト', az:'A→Z', za:'Z→A', difficulty:'難易度' };
const PAGE_SIZE = 50;

export default function WordListScreen() {
  const { userData } = useContext(AppContext);
  const [query,   setQuery]   = useState('');
  const [pos,     setPos]     = useState('all');
  const [sort,    setSort]    = useState('default');
  const [page,    setPage]    = useState(0);
  const [modal,   setModal]   = useState(null); // selected word

  const weak = new Set(userData?.weakWords || []);

  const filtered = useMemo(() => {
    let list = [...WORDS];
    if (pos === 'weak') list = list.filter(w => weak.has(w.en));
    else if (pos !== 'all') list = list.filter(w => w.pos === pos);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(w => w.en.toLowerCase().includes(q) || w.ja.includes(q));
    }
    if (sort === 'az') list.sort((a, b) => a.en.localeCompare(b.en));
    if (sort === 'za') list.sort((a, b) => b.en.localeCompare(a.en));
    if (sort === 'difficulty') list.sort((a, b) => (weak.has(b.en) ? 1 : 0) - (weak.has(a.en) ? 1 : 0));
    return list;
  }, [query, pos, sort, userData?.weakWords]);

  const paged  = filtered.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = paged.length < filtered.length;

  const speak = (word) => Speech.speak(word, { language: 'en-US', rate: 0.85 });

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.wordRow, weak.has(item.en) && styles.wordRowWeak]}
      onPress={() => setModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.wordLeft}>
        <Text style={styles.wordEn}>{item.en}</Text>
        <Text style={styles.wordJa} numberOfLines={1}>{item.ja}</Text>
      </View>
      <View style={styles.wordRight}>
        <Text style={styles.posChip}>{posShort(item.pos)}</Text>
        {weak.has(item.en) && <Text style={styles.weakDot}>⚠️</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={GRADIENT} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📚 単語帳</Text>
        <Text style={styles.countText}>{filtered.length}語</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="英語 / 日本語で検索..."
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={query}
        onChangeText={t => { setQuery(t); setPage(0); }}
      />

      {/* Sort */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow} contentContainerStyle={styles.sortContent}>
        {SORTS.map(s => (
          <TouchableOpacity key={s} style={[styles.chip, sort === s && styles.chipActive]} onPress={() => setSort(s)}>
            <Text style={[styles.chipText, sort === s && styles.chipTextActive]}>{SORT_LBL[s]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* POS filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.posRow} contentContainerStyle={styles.sortContent}>
        {POS_LIST.map(p => (
          <TouchableOpacity key={p} style={[styles.chip, pos === p && styles.chipActive]} onPress={() => { setPos(p); setPage(0); }}>
            <Text style={[styles.chipText, pos === p && styles.chipTextActive]}>{POS_LBL[p]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={paged}
        keyExtractor={item => item.en}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={hasMore ? (
          <TouchableOpacity style={styles.loadMore} onPress={() => setPage(p => p + 1)}>
            <Text style={styles.loadMoreText}>さらに{Math.min(PAGE_SIZE, filtered.length - paged.length)}語を表示</Text>
          </TouchableOpacity>
        ) : null}
      />

      {/* Word Detail Modal */}
      <Modal visible={!!modal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setModal(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalEn}>{modal?.en}</Text>
              <TouchableOpacity onPress={() => speak(modal?.en || '')} style={styles.speakBtn}>
                <Ionicons name="volume-high-outline" size={22} color="#667eea" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalPhonetic}>{modal?.phonetic}</Text>
            <Text style={styles.modalPos}>{posLabel(modal?.pos)}</Text>
            <Text style={styles.modalJa}>{modal?.ja}</Text>
            <Text style={styles.modalEx}>{modal?.ex}</Text>
            {weak.has(modal?.en) && (
              <View style={styles.weakBadge}>
                <Text style={styles.weakBadgeText}>⚠️ 苦手単語に登録されています</Text>
              </View>
            )}
            <TouchableOpacity style={styles.modalClose} onPress={() => setModal(null)}>
              <Text style={styles.modalCloseText}>閉じる</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 54, paddingBottom: 8 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  countText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  search: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12, padding: 12,
    color: '#fff', fontSize: 14,
  },
  sortRow: { marginBottom: 4 },
  posRow: { marginBottom: 8 },
  sortContent: { paddingHorizontal: 16, gap: 6 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: '#fff' },
  chipText: { color: '#fff', fontSize: 12 },
  chipTextActive: { color: '#667eea', fontWeight: 'bold' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  wordRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  wordRowWeak: { borderColor: 'rgba(231,76,60,0.5)', backgroundColor: 'rgba(231,76,60,0.1)' },
  wordLeft: { flex: 1 },
  wordEn: { color: '#fff', fontSize: 15, fontWeight: '600' },
  wordJa: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  wordRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  posChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
    color: '#fff', fontSize: 11,
  },
  weakDot: { fontSize: 14 },
  loadMore: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12,
    padding: 12, alignItems: 'center', marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  loadMoreText: { color: '#fff', fontSize: 13 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modalEn: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  speakBtn: { backgroundColor: '#EEF2FF', borderRadius: 20, padding: 8 },
  modalPhonetic: { fontSize: 15, color: '#888', marginBottom: 6 },
  modalPos: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF', color: '#667eea',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
    fontSize: 12, fontWeight: '600', marginBottom: 10,
  },
  modalJa: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalEx: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 12 },
  weakBadge: { backgroundColor: '#FFF3CD', borderRadius: 10, padding: 10, marginBottom: 12 },
  weakBadgeText: { color: '#856404', fontSize: 13 },
  modalClose: {
    backgroundColor: '#667eea', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  modalCloseText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
