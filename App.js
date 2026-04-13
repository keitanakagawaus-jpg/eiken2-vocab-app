import React, { createContext, useContext, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import LoginScreen   from './src/screens/LoginScreen';
import HomeScreen    from './src/screens/HomeScreen';
import FlashcardScreen from './src/screens/FlashcardScreen';
import QuizScreen    from './src/screens/QuizScreen';
import SpellScreen   from './src/screens/SpellScreen';
import WordListScreen from './src/screens/WordListScreen';
import StatsScreen   from './src/screens/StatsScreen';
import TimeAttackScreen from './src/screens/TimeAttackScreen';

export const AppContext = createContext(null);

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const tabIconMap = {
    ホーム:   'home',
    単語帳:   'book',
    統計:     'bar-chart',
  };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={(focused ? tabIconMap[route.name] : tabIconMap[route.name] + '-outline') || 'ellipse'}
            size={size}
            color={color}
          />
        ),
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="ホーム"   component={HomeStack} />
      <Tab.Screen name="単語帳"   component={WordListScreen} />
      <Tab.Screen name="統計"     component={StatsScreen} />
    </Tab.Navigator>
  );
}

const HomeStack = createNativeStackNavigator();
function HomeStack2() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain"     component={HomeScreen} />
      <HomeStack.Screen name="Flashcard"    component={FlashcardScreen} />
      <HomeStack.Screen name="Quiz"         component={QuizScreen} />
      <HomeStack.Screen name="Spell"        component={SpellScreen} />
      <HomeStack.Screen name="TimeAttack"   component={TimeAttackScreen} />
    </HomeStack.Navigator>
  );
}

// Re-export for Tab
const HomeStackScreen = HomeStack2;

export default function App() {
  const [user, setUser]         = useState(null);
  const [userData, setUserData] = useState(null);
  const [isGuest, setIsGuest]   = useState(false);

  const login = useCallback((username, data, guest = false) => {
    setUser(username);
    setUserData(data);
    setIsGuest(guest);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setUserData(null);
    setIsGuest(false);
  }, []);

  const updateUserData = useCallback((newData) => {
    setUserData(newData);
  }, []);

  return (
    <AppContext.Provider value={{ user, userData, isGuest, login, logout, updateUserData }}>
      <StatusBar style="light" />
      <NavigationContainer>
        {user ? (
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ color, size, focused }) => {
                const icons = { ホーム: 'home', 単語帳: 'book', 統計: 'bar-chart' };
                const name = icons[route.name] || 'ellipse';
                return <Ionicons name={focused ? name : name + '-outline'} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#667eea',
              tabBarInactiveTintColor: '#aaa',
              tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#eee', paddingBottom: 4, height: 60 },
              tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            })}
          >
            <Tab.Screen name="ホーム"  component={HomeStackScreen} />
            <Tab.Screen name="単語帳"  component={WordListScreen} />
            <Tab.Screen name="統計"    component={StatsScreen} />
          </Tab.Navigator>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </AppContext.Provider>
  );
}
