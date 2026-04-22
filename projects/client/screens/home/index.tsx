import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollView, TouchableOpacity, ActivityIndicator, View, Alert as RNAlert, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { createStyles } from './styles';
import { LocalDataService, type User, type DailyTask, type Task } from '@/services/localData';

// 兼容 Web 端的 Alert
const showAlert = (title: string, message?: string, buttons?: { text: string; onPress?: () => void }[]) => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(`${title}\n${message || ''}`);
    if (confirmed && buttons && buttons[1]?.onPress) {
      buttons[1].onPress();
    } else if (!confirmed && buttons && buttons[0]?.onPress && buttons[0].text === '取消') {
      // 取消按钮不做任何事
    } else if (buttons && buttons[0]?.onPress) {
      buttons[0].onPress();
    }
  } else {
    RNAlert.alert(title, message, buttons as any);
  }
};

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [user, setUser] = useState<User | null>(null);
  const [todayTask, setTodayTask] = useState<DailyTask | null>(null);
  const [taskInfo, setTaskInfo] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAndLoadData();
  }, []);

  const initializeAndLoadData = async () => {
    try {
      console.log('[Home] 开始初始化...');
      setLoading(true);
      
      // 初始化本地数据
      const { userId } = await LocalDataService.initialize();
      console.log('[Home] 初始化完成，用户ID:', userId);
      
      if (!userId) {
        console.error('[Home] 用户ID为空，无法继续');
        setLoading(false);
        return;
      }
      
      // 直接用返回的用户ID获取用户
      const currentUser = await LocalDataService.getUserById(userId);
      console.log('[Home] 获取到用户:', currentUser?.name, currentUser?.id);
      
      if (!currentUser) {
        console.error('[Home] 用户数据为空');
        setLoading(false);
        return;
      }
      
      // 先设置用户，再加载其他数据
      setUser(currentUser);
      
      // 获取今日任务
      const dailyTask = await LocalDataService.getTodayTask(currentUser.id);
      console.log('[Home] 今日任务:', dailyTask);
      if (dailyTask) {
        setTodayTask(dailyTask);
        // 获取任务详情
        if (dailyTask.task_id) {
          const task = await LocalDataService.getTaskById(dailyTask.task_id);
          setTaskInfo(task);
        }
      }
      
      console.log('[Home] 初始化完成，用户状态已设置');
    } catch (error) {
      console.error('[Home] 初始化失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // 获取当前用户
      const currentUser = await LocalDataService.getCurrentUser();
      console.log('loadData - 当前用户:', currentUser?.id);
      if (!currentUser) return;
      
      setUser(currentUser);

      // 获取今日任务
      const dailyTask = await LocalDataService.getTodayTask(currentUser.id);
      if (dailyTask) {
        setTodayTask(dailyTask);
        // 获取任务详情
        if (dailyTask.task_id) {
          const task = await LocalDataService.getTaskById(dailyTask.task_id);
          setTaskInfo(task);
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleGetTask = async () => {
    console.log('[Home] handleGetTask called, user:', user?.id);
    
    // 如果用户不存在，先重新初始化
    if (!user) {
      console.log('[Home] 用户不存在，重新初始化...');
      showAlert('提示', '用户数据未加载，正在重新加载...');
      await initializeAndLoadData();
      return;
    }
    
    try {
      console.log('[Home] Assigning today task for user:', user.id);
      const dailyTask = await LocalDataService.assignTodayTask(user.id);
      console.log('[Home] Task assigned:', dailyTask);
      setTodayTask(dailyTask);
      
      // 获取任务详情
      if (dailyTask.task_id) {
        const task = await LocalDataService.getTaskById(dailyTask.task_id);
        console.log('[Home] Task info:', task);
        setTaskInfo(task);
      }
      
      showAlert('成功', '今日任务已领取！');
    } catch (error) {
      console.error('[Home] 领取任务失败:', error);
      showAlert('错误', '领取任务失败，请重试');
    }
  };

  const handleCompleteTask = async () => {
    console.log('[Home] handleCompleteTask called, todayTask:', todayTask?.id, 'user:', user?.id);
    
    if (!todayTask || !user) {
      console.log('[Home] No task or user');
      showAlert('提示', '请先领取今日任务');
      return;
    }
    
    try {
      const updated = await LocalDataService.completeDailyTask(todayTask.id);
      console.log('[Home] Task completed:', updated);
      if (updated) {
        setTodayTask(updated);
        showAlert('打卡成功', '任务已完成，等待家长确认后获得积分！');
      }
    } catch (error) {
      console.error('[Home] 完成任务失败:', error);
      showAlert('错误', '完成任务失败，请重试');
    }
  };

  const getCategoryName = (category: string) => {
    const map: Record<string, string> = {
      housework: '家务',
      study: '学习',
      self_discipline: '自律',
    };
    return map[category] || category;
  };

  const getStatusName = (status: string) => {
    const map: Record<string, string> = {
      pending: '待完成',
      completed: '待确认',
      confirmed: '已完成',
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: '#F59E0B',
      completed: '#10B981',
      confirmed: '#7C5CFC',
    };
    return map[status] || theme.textSecondary;
  };

  // 刷新用户数据
  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    const updatedUser = await LocalDataService.getUserById(user.id);
    if (updatedUser) {
      setUser(updatedUser);
    }
  }, [user?.id]);

  // 页面聚焦时刷新数据
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  // 定时刷新作为备选
  useEffect(() => {
    const timer = setInterval(() => {
      refreshUser();
    }, 10000); // 每10秒刷新一次

    return () => clearInterval(timer);
  }, [refreshUser]);

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  const displayTitle = taskInfo?.title || '今日任务';
  const displayPoints = todayTask?.points || taskInfo?.points || 0;
  const displayCategory = taskInfo?.category || '自定义';

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero 区域 */}
        <View style={styles.hero}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome6 name="star" size={14} color="#FFCB57" />
            <ThemedText style={styles.heroTitle}>今日任务</ThemedText>
          </View>
          {todayTask ? (
            <>
              <ThemedText style={styles.heroTaskTitle}>{displayTitle}</ThemedText>
              <ThemedText style={styles.heroPoints}>完成任务可获得 {displayPoints} 积分</ThemedText>
            </>
          ) : (
            <ThemedText style={styles.heroTaskTitle}>点击下方领取今日任务</ThemedText>
          )}
        </View>

        {/* 数据卡片 */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <FontAwesome6 name="coins" size={24} color="#FFCB57" />
            </View>
            <ThemedText style={styles.statValue}>{user?.points || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>我的积分</ThemedText>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <FontAwesome6 name="fire" size={24} color="#FF8FAB" />
            </View>
            <ThemedText style={styles.statValue}>{user?.streak_days || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>连续打卡</ThemedText>
          </View>
        </View>

        {/* 任务卡片 */}
        <View style={styles.taskSection}>
          <ThemedText style={styles.sectionTitle}>任务详情</ThemedText>
          
          {todayTask ? (
            <View style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={styles.taskCategoryBadge}>
                  <ThemedText style={styles.taskCategoryText}>
                    {getCategoryName(displayCategory)}
                  </ThemedText>
                </View>
                <View style={[styles.taskStatusBadge, 
                  todayTask.status === 'pending' && styles.taskStatusPending,
                  todayTask.status === 'completed' && styles.taskStatusCompleted,
                  todayTask.status === 'confirmed' && styles.taskStatusConfirmed,
                ]}>
                  <ThemedText style={[styles.taskStatusText, { color: getStatusColor(todayTask.status) }]}>
                    {getStatusName(todayTask.status)}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.taskTitle}>{displayTitle}</ThemedText>
              <View style={styles.taskPoints}>
                <FontAwesome6 name="coins" size={16} color="#FFCB57" />
                <ThemedText style={styles.taskPointsText}>
                  +{displayPoints} 积分
                </ThemedText>
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="clipboard-list" size={48} color={theme.textMuted} />
              <ThemedText style={styles.emptyText}>还没有领取今日任务</ThemedText>
            </View>
          )}
        </View>

        {/* 按钮区域 */}
        <View style={styles.buttonContainer}>
          {!todayTask && (
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleGetTask}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.primaryButtonText}>领取今日任务</ThemedText>
            </TouchableOpacity>
          )}
          
          {todayTask?.status === 'pending' && (
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleCompleteTask}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.primaryButtonText}>完成任务打卡</ThemedText>
            </TouchableOpacity>
          )}
          
          {todayTask?.status === 'completed' && (
            <TouchableOpacity 
              style={styles.secondaryButton}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.secondaryButtonText}>等待家长确认</ThemedText>
            </TouchableOpacity>
          )}
          
          {todayTask?.status === 'confirmed' && (
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleGetTask}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.primaryButtonText}>完成！查看明日任务</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
