import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = 'eiken2_users';

export const getAllUsers = async () => {
  try {
    const data = await AsyncStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
};

export const saveAllUsers = async (users) => {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getUserData = async (username) => {
  const users = await getAllUsers();
  return users[username] || defaultUserData();
};

export const saveUserData = async (username, data) => {
  if (!username) return;
  const users = await getAllUsers();
  users[username] = data;
  await saveAllUsers(users);
};

export const defaultUserData = () => ({
  totalStudied: 0,
  totalKnown: 0,
  weakWords: [],
  sessions: 0,
  earnedBadges: [],
  studyDates: [],
  streak: 0,
  bestStreak: 0,
  lastStudyDate: null,
  spellStreak: 0,
  timeAttackBest: 0,
  pronGoodCount: 0,
});

export const simpleHash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
};

export const getTodayStr = () => new Date().toISOString().slice(0, 10);

export const getDateStr = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
