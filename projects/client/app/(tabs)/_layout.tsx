import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0,
        // 黏土阴影
        shadowColor: '#7C5CFC',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        // 移动端：标准高度 50px + 底部安全区
        height: Platform.OS === 'web' ? 60 : 50 + insets.bottom,
        paddingBottom: Platform.OS === 'web' ? 0 : insets.bottom,
      },
      tabBarActiveTintColor: theme.primary,
      tabBarInactiveTintColor: '#C5C0DB',
      tabBarItemStyle: {
        height: Platform.OS === 'web' ? 60 : undefined,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '700',
      },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={20} color={color} solid />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: '任务',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="clipboard-list" size={20} color={color} solid />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: '奖励',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="gift" size={20} color={color} solid />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user" size={20} color={color} solid />
          ),
        }}
      />
    </Tabs>
  );
}
