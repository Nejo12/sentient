import { Tabs } from 'expo-router';
import { History, Home, User } from 'lucide-react-native';

import { strings } from '../../src/constants/strings';
import { colors } from '../../src/theme/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.oxblood,
        tabBarInactiveTintColor: colors.ink40,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: strings.history.tabs.home,
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size ?? 22} strokeWidth={1.9} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: strings.history.tabs.history,
          tabBarIcon: ({ color, size }) => (
            <History color={color} size={size ?? 22} strokeWidth={1.9} />
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: strings.history.tabs.you,
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size ?? 22} strokeWidth={1.9} />
          ),
        }}
      />
    </Tabs>
  );
}
