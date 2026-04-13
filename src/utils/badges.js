export const BADGES = [
  { id: 'first_study',    emoji: '🌱', name: '初回学習',    desc: 'はじめて学習した',           check: u => u.totalStudied >= 1 },
  { id: 'studied_50',     emoji: '📗', name: '50語達成',    desc: '50語以上学習した',           check: u => u.totalStudied >= 50 },
  { id: 'studied_100',    emoji: '📖', name: '100語学習',   desc: '100語以上学習した',          check: u => u.totalStudied >= 100 },
  { id: 'studied_500',    emoji: '📚', name: '500語学習',   desc: '500語以上学習した',          check: u => u.totalStudied >= 500 },
  { id: 'studied_1000',   emoji: '🎓', name: '1000語学習',  desc: '1000語以上学習した',         check: u => u.totalStudied >= 1000 },
  { id: 'studied_2000',   emoji: '🏆', name: '全語制覇',    desc: '2000語すべて学習した',       check: u => u.totalStudied >= 2000 },
  { id: 'known_100',      emoji: '💡', name: '100語習得',   desc: '100語を覚えた',             check: u => u.totalKnown >= 100 },
  { id: 'known_500',      emoji: '🌟', name: '500語習得',   desc: '500語を覚えた',             check: u => u.totalKnown >= 500 },
  { id: 'accuracy_70',    emoji: '🎯', name: '正確さ70%',   desc: '正解率70%以上を達成',        check: u => u.totalStudied >= 10 && (u.totalKnown / u.totalStudied) >= 0.7 },
  { id: 'accuracy_90',    emoji: '💎', name: '正確さ90%',   desc: '正解率90%以上を達成',        check: u => u.totalStudied >= 10 && (u.totalKnown / u.totalStudied) >= 0.9 },
  { id: 'streak_3',       emoji: '🔥', name: '3日連続',     desc: '3日連続で学習した',          check: u => u.streak >= 3 },
  { id: 'streak_7',       emoji: '⚡', name: '1週間連続',   desc: '7日連続で学習した',          check: u => u.streak >= 7 },
  { id: 'streak_14',      emoji: '🌙', name: '2週間連続',   desc: '14日連続で学習した',         check: u => u.streak >= 14 },
  { id: 'streak_30',      emoji: '🌟', name: '1ヶ月連続',   desc: '30日連続で学習した',         check: u => u.streak >= 30 },
  { id: 'weak_zero',      emoji: '💪', name: '苦手克服',    desc: '苦手単語を0にした',          check: u => u.totalStudied >= 10 && u.weakWords.length === 0 },
  { id: 'spell_master',   emoji: '⌨️', name: 'スペル名人',  desc: 'スペルテストで10問連続正解', check: u => u.spellStreak >= 10 },
  { id: 'time_attack_30', emoji: '⏰', name: 'スピード★',  desc: 'タイムアタックで30問以上',   check: u => (u.timeAttackBest || 0) >= 30 },
  { id: 'time_attack_50', emoji: '⏱️', name: '時間の達人',  desc: 'タイムアタックで50問以上',   check: u => (u.timeAttackBest || 0) >= 50 },
  { id: 'pron_good',      emoji: '🎙️', name: '発音上手',    desc: '発音テストで80点以上を5回',  check: u => (u.pronGoodCount || 0) >= 5 },
  { id: 'session_10',     emoji: '🗓️', name: '10回学習',    desc: '学習セッション10回達成',     check: u => u.sessions >= 10 },
  { id: 'session_30',     emoji: '📅', name: '30回学習',    desc: '学習セッション30回達成',     check: u => u.sessions >= 30 },
  { id: 'session_50',     emoji: '🎖️', name: '50回学習',    desc: '学習セッション50回達成',     check: u => u.sessions >= 50 },
];

export const checkBadges = (userData) => {
  const earned = userData.earnedBadges || [];
  const newBadges = [];
  BADGES.forEach(b => {
    if (!earned.includes(b.id) && b.check(userData)) {
      newBadges.push(b);
    }
  });
  return newBadges;
};
