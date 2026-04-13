// 配列シャッフル
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// 編集距離ベースの類似度（発音テスト用）
export const similarity = (a, b) => {
  if (a === b) return 100;
  const la = a.length, lb = b.length;
  const dp = Array.from({ length: la + 1 }, (_, i) =>
    Array.from({ length: lb + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return Math.max(0, Math.round((1 - dp[la][lb] / Math.max(la, lb)) * 100));
};

// 今日の挨拶
export const getGreeting = (username, streak, totalStudied) => {
  const h = new Date().getHours();
  let emoji, text;
  if (h < 6)       { emoji = '🌙'; text = '深夜の学習！集中力が高い時間帯ですね'; }
  else if (h < 10) { emoji = '☀️'; text = 'おはようございます！朝の学習は記憶に残りやすいですよ'; }
  else if (h < 13) { emoji = '🌤️'; text = 'こんにちは！今日も単語を覚えましょう'; }
  else if (h < 17) { emoji = '⛅'; text = 'こんにちは！午後の学習で英語力アップ'; }
  else if (h < 21) { emoji = '🌆'; text = 'こんばんは！夕方の復習で記憶を定着させましょう'; }
  else             { emoji = '🌙'; text = 'こんばんは！就寝前の学習で記憶が定着しやすいですよ'; }

  if (streak >= 7) text += ` 🔥${streak}日連続記録中！`;
  else if (streak >= 3) text += ` ${streak}日連続中！`;
  if (totalStudied === 0) text = `${username}さん、今日から英検2級の単語を学習しましょう！`;

  return { emoji, text };
};

// 品詞ラベル
export const posLabel = (pos) =>
  ({ noun: '名詞', verb: '動詞', adj: '形容詞', adv: '副詞', phrase: '熟語' }[pos] || pos);

export const posShort = (pos) =>
  ({ noun: '名', verb: '動', adj: '形', adv: '副', phrase: '熟' }[pos] || pos);
