import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollView, TouchableOpacity, View, Alert as RNAlert, Platform, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome6 } from '@expo/vector-icons';
import { createStyles } from './styles';
import { LocalDataService, type User, type PointsRecord, type DepositRecord } from '@/services/localData';

// 兼容 Web 端的 Alert
const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message || ''}`);
  } else {
    RNAlert.alert(title, message);
  }
};

type DetailTabType = 'points' | 'deposit';

export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<{
    currentPoints: number;
    streakDays: number;
    totalEarned: number;
    totalSpent: number;
    completedTasks: number;
  } | null>(null);
  const [records, setRecords] = useState<PointsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordLimit, setRecordLimit] = useState(5); // 默认显示5条
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  
  // 存款相关状态
  const [depositBalance, setDepositBalance] = useState(0);
  const [depositRecords, setDepositRecords] = useState<DepositRecord[]>([]);
  const [depositLimit, setDepositLimit] = useState(5); // 默认显示5条
  const [hasMoreDeposit, setHasMoreDeposit] = useState(false);
  
  // Tab 状态
  const [detailTab, setDetailTab] = useState<DetailTabType>('points');

  const loadData = useCallback(async () => {
    try {
      // 获取用户信息
      const currentUser = await LocalDataService.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        // 获取积分汇总
        const summaryData = await LocalDataService.getPointsSummary(currentUser.id);
        setSummary(summaryData);
        
        // 获取积分流水（按当前限制）
        const allRecords = await LocalDataService.getPointsRecords(currentUser.id);
        setRecords(allRecords.slice(0, recordLimit));
        setHasMoreRecords(allRecords.length > recordLimit);
        
        // 获取存款数据
        const balance = await LocalDataService.getDepositBalance();
        setDepositBalance(balance);
        
        const allDepositRecords = await LocalDataService.getDepositRecords();
        setDepositRecords(allDepositRecords.slice(0, depositLimit));
        setHasMoreDeposit(allDepositRecords.length > depositLimit);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [recordLimit, depositLimit]);

  // 初始加载
  useEffect(() => {
    loadData();
  }, []);

  // 页面聚焦时刷新数据
  useFocusEffect(
    useCallback(() => {
      console.log('[Profile] 页面聚焦，刷新数据');
      loadData();
    }, [loadData])
  );

  // 加载更多积分记录
  const handleLoadMorePoints = () => {
    setRecordLimit(prev => prev + 5);
  };
  
  // 加载更多存款记录
  const handleLoadMoreDeposit = () => {
    setDepositLimit(prev => prev + 5);
  };

  const getTypeIcon = (type: string) => {
    const map: Record<string, string> = {
      task_reward: 'circle-check',
      streak_bonus: 'fire',
      redemption: 'gift',
      lottery: 'wand-magic-sparkles',
    };
    return map[type] || 'coins';
  };

  const getTypeIconColor = (type: string) => {
    const map: Record<string, string> = {
      task_reward: '#5ED6A0',
      streak_bonus: '#FF8FAB',
      redemption: '#7C5CFC',
      lottery: '#FFCB57',
    };
    return map[type] || '#7C5CFC';
  };

  const getTypeName = (type: string) => {
    const map: Record<string, string> = {
      task_reward: '任务奖励',
      streak_bonus: '连续打卡奖励',
      redemption: '兑换奖励',
      lottery: '抽奖',
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {/* 用户卡片 */}
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <FontAwesome6 name="child-reaching" size={36} color={theme.primary} />
            </View>
            <ThemedText style={styles.userName}>{user?.name || '小朋友'}</ThemedText>
            <View style={styles.userPointsRow}>
              <View style={styles.userPoints}>
                <FontAwesome6 name="coins" size={18} color="#FFCB57" />
                <ThemedText style={styles.userPointsText}>{user?.points || 0} 积分</ThemedText>
              </View>
              <View style={styles.userDeposit}>
                <FontAwesome6 name="piggy-bank" size={18} color="#3B82F6" />
                <ThemedText style={styles.userDepositText}>¥{depositBalance.toFixed(2)}</ThemedText>
              </View>
            </View>
          </View>

          {/* 统计卡片 */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <FontAwesome6 name="fire" size={24} color="#FF8FAB" />
              </View>
              <ThemedText style={styles.statValue}>{summary?.streakDays || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>连续打卡</ThemedText>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <FontAwesome6 name="circle-check" size={24} color="#5ED6A0" />
              </View>
              <ThemedText style={styles.statValue}>{summary?.completedTasks || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>完成任务</ThemedText>
            </View>
          </View>

          {/* 功能菜单 */}
          <View style={styles.menuSection}>
            <ThemedText style={styles.sectionTitle}>功能</ThemedText>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/parent-login')}
            >
              <View style={styles.menuIcon}>
                <FontAwesome6 name="user-shield" size={20} color={theme.primary} />
              </View>
              <ThemedText style={styles.menuText}>家长入口</ThemedText>
              <FontAwesome6 name="chevron-right" size={16} style={styles.menuArrow} />
            </TouchableOpacity>
          </View>

          {/* 积分明细 / 收支明细 Tab */}
          <View style={styles.menuSection}>
            <View style={styles.detailTabContainer}>
              <TouchableOpacity 
                style={[styles.detailTab, detailTab === 'points' && styles.detailTabActive]}
                onPress={() => setDetailTab('points')}
              >
                <ThemedText style={[styles.detailTabText, detailTab === 'points' && styles.detailTabTextActive]}>
                  积分明细
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.detailTab, detailTab === 'deposit' && styles.detailTabActive]}
                onPress={() => setDetailTab('deposit')}
              >
                <ThemedText style={[styles.detailTabText, detailTab === 'deposit' && styles.detailTabTextActive]}>
                  收支明细
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            {detailTab === 'points' ? (
              <>
                {records.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <FontAwesome6 name="receipt" size={48} color={theme.textMuted} />
                    <ThemedText style={styles.emptyText}>暂无积分记录</ThemedText>
                  </View>
                ) : (
                  <>
                    {records.map((record) => (
                      <View key={record.id} style={styles.recordItem}>
                        <View style={[styles.recordIcon, { backgroundColor: getTypeIconColor(record.type) + '20' }]}>
                          <FontAwesome6 
                            name={getTypeIcon(record.type) as any} 
                            size={20} 
                            color={getTypeIconColor(record.type)} 
                          />
                        </View>
                        <View style={styles.recordInfo}>
                          <ThemedText style={styles.recordTitle}>
                            {record.description || getTypeName(record.type)}
                          </ThemedText>
                          <ThemedText style={styles.recordDate}>
                            {new Date(record.created_at).toLocaleString()}
                          </ThemedText>
                        </View>
                        <ThemedText style={[
                          styles.recordPoints,
                          record.points > 0 ? styles.pointsPositive : styles.pointsNegative
                        ]}>
                          {record.points > 0 ? '+' : ''}{record.points}
                        </ThemedText>
                      </View>
                    ))}
                    
                    {/* 查看更多按钮 */}
                    {hasMoreRecords && (
                      <TouchableOpacity 
                        style={styles.loadMoreButton}
                        onPress={handleLoadMorePoints}
                      >
                        <ThemedText style={styles.loadMoreText}>查看更多</ThemedText>
                        <FontAwesome6 name="chevron-down" size={14} color={theme.primary} />
                      </TouchableOpacity>
                    )}
                    
                    {/* 积分统计 */}
                    {summary && (
                      <View style={styles.recordItem}>
                        <View style={[styles.recordIcon, { backgroundColor: '#5ED6A020' }]}>
                          <FontAwesome6 name="arrow-trend-up" size={20} color="#5ED6A0" />
                        </View>
                        <View style={styles.recordInfo}>
                          <ThemedText style={styles.recordTitle}>累计获得积分</ThemedText>
                        </View>
                        <ThemedText style={[styles.recordPoints, styles.pointsPositive]}>
                          {summary.totalEarned}
                        </ThemedText>
                      </View>
                    )}
                    
                    {summary && (
                      <View style={styles.recordItem}>
                        <View style={[styles.recordIcon, { backgroundColor: '#FF8FAB20' }]}>
                          <FontAwesome6 name="arrow-trend-down" size={20} color="#FF8FAB" />
                        </View>
                        <View style={styles.recordInfo}>
                          <ThemedText style={styles.recordTitle}>累计消耗积分</ThemedText>
                        </View>
                        <ThemedText style={[styles.recordPoints, styles.pointsNegative]}>
                          -{summary.totalSpent}
                        </ThemedText>
                      </View>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {depositRecords.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <FontAwesome6 name="piggy-bank" size={48} color={theme.textMuted} />
                    <ThemedText style={styles.emptyText}>暂无收支记录</ThemedText>
                  </View>
                ) : (
                  <>
                    {depositRecords.map((record) => (
                      <View key={record.id} style={styles.recordItem}>
                        <View style={[styles.recordIcon, { backgroundColor: record.amount > 0 ? '#10B98120' : '#EF444420' }]}>
                          <FontAwesome6 
                            name={record.amount > 0 ? 'arrow-down' : 'arrow-up'} 
                            size={20} 
                            color={record.amount > 0 ? '#10B981' : '#EF4444'} 
                          />
                        </View>
                        <View style={styles.recordInfo}>
                          <ThemedText style={styles.recordTitle}>{record.description}</ThemedText>
                          <ThemedText style={styles.recordDate}>
                            {new Date(record.created_at).toLocaleString()}
                          </ThemedText>
                        </View>
                        <ThemedText style={[
                          styles.recordPoints,
                          record.amount > 0 ? styles.pointsPositive : styles.pointsNegative
                        ]}>
                          {record.amount > 0 ? '+' : ''}¥{record.amount.toFixed(2)}
                        </ThemedText>
                      </View>
                    ))}
                    
                    {/* 查看更多按钮 */}
                    {hasMoreDeposit && (
                      <TouchableOpacity 
                        style={styles.loadMoreButton}
                        onPress={handleLoadMoreDeposit}
                      >
                        <ThemedText style={styles.loadMoreText}>查看更多</ThemedText>
                        <FontAwesome6 name="chevron-down" size={14} color={theme.primary} />
                      </TouchableOpacity>
                    )}
                    
                    {/* 存款统计 */}
                    <View style={styles.recordItem}>
                      <View style={[styles.recordIcon, { backgroundColor: '#3B82F620' }]}>
                        <FontAwesome6 name="wallet" size={20} color="#3B82F6" />
                      </View>
                      <View style={styles.recordInfo}>
                        <ThemedText style={styles.recordTitle}>当前存款</ThemedText>
                      </View>
                      <ThemedText style={[styles.recordPoints, { color: '#3B82F6' }]}>
                        ¥{depositBalance.toFixed(2)}
                      </ThemedText>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
