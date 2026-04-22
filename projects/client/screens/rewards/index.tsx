import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollView, TouchableOpacity, View, Alert as RNAlert, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome6 } from '@expo/vector-icons';
import { createStyles } from './styles';
import { LocalDataService, type Reward, type LotteryItem, type User } from '@/services/localData';

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

export default function RewardsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [activeTab, setActiveTab] = useState<'rewards' | 'lottery'>('rewards');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [lotteryItems, setLotteryItems] = useState<LotteryItem[]>([]);
  const [lotteryCost, setLotteryCost] = useState(50);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 刷新用户数据
  const refreshUser = useCallback(async () => {
    const currentUser = await LocalDataService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // 页面聚焦时刷新用户数据
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  const loadData = async () => {
    try {
      // 获取当前用户
      const currentUser = await LocalDataService.getCurrentUser();
      setUser(currentUser);
      
      // 获取奖励列表
      const rewardsData = await LocalDataService.getRewards();
      setRewards(rewardsData.filter(r => r.is_active));
      
      // 获取抽奖奖池
      const lotteryData = await LocalDataService.getLotteryItems();
      setLotteryItems(lotteryData.filter(i => i.is_active));
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!user) return;
    
    console.log('[Rewards] 兑换前用户积分:', user.points, '需要积分:', reward.points_required);
    
    if (user.points < reward.points_required) {
      showAlert('积分不足', '你的积分不够兑换这个奖励哦，继续努力吧！');
      return;
    }
    
    showAlert(
      '确认兑换',
      `确定要兑换「${reward.title}」吗？\n需要 ${reward.points_required} 积分`,
      [
        { text: '取消' },
        { 
          text: '确定', 
          onPress: async () => {
            console.log('[Rewards] 开始兑换...');
            const result = await LocalDataService.redeemReward(user.id, reward.id);
            console.log('[Rewards] 兑换结果:', result);
            
            if (result.success) {
              // 更新用户积分 - 确保使用返回的剩余积分
              const updatedUser = await LocalDataService.getUserById(user.id);
              console.log('[Rewards] 更新后用户积分:', updatedUser?.points);
              if (updatedUser) {
                setUser(updatedUser);
              }
              showAlert('兑换成功', `你已成功兑换「${reward.title}」！\n快去找家长兑现吧～`);
            } else {
              showAlert('兑换失败', result.error || '未知错误');
            }
          }
        }
      ]
    );
  };

  const handleDraw = async () => {
    if (!user) return;
    
    console.log('[Rewards] 抽奖前用户积分:', user.points, '需要积分:', lotteryCost);
    
    if (user.points < lotteryCost) {
      showAlert('积分不足', '你的积分不够抽奖哦，继续努力吧！');
      return;
    }
    
    showAlert(
      '确认抽奖',
      `确定花费 ${lotteryCost} 积分抽奖吗？`,
      [
        { text: '取消' },
        { 
          text: '确定', 
          onPress: async () => {
            console.log('[Rewards] 开始抽奖...');
            const result = await LocalDataService.drawLottery(user.id, lotteryCost);
            console.log('[Rewards] 抽奖结果:', result);
            
            if (result.success && result.item) {
              // 更新用户积分
              const updatedUser = await LocalDataService.getUserById(user.id);
              console.log('[Rewards] 更新后用户积分:', updatedUser?.points);
              if (updatedUser) {
                setUser(updatedUser);
              }
              
              showAlert('恭喜你！', `你抽中了「${result.item.title}」！\n${result.item.description || ''}`);
            } else {
              showAlert('抽奖失败', result.error || '未知错误');
            }
          }
        }
      ]
    );
  };

  const getTierName = (tier: string) => {
    const map: Record<string, string> = {
      low: '小奖励',
      medium: '中等奖励',
      high: '大奖励',
    };
    return map[tier] || tier;
  };

  const getTierColor = (tier: string) => {
    const map: Record<string, string> = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#7C5CFC',
    };
    return map[tier] || theme.textSecondary;
  };

  const getRewardIcon = (tier: string) => {
    const map: Record<string, any> = {
      low: 'gift',
      medium: 'star',
      high: 'crown',
    };
    return map[tier] || 'gift';
  };

  const lowRewards = rewards.filter(r => r.tier === 'low');
  const mediumRewards = rewards.filter(r => r.tier === 'medium');
  const highRewards = rewards.filter(r => r.tier === 'high');

  const renderRewardCard = (reward: Reward) => (
    <View key={reward.id} style={styles.rewardCard}>
      <View style={styles.rewardHeader}>
        <View style={styles.rewardIcon}>
          <FontAwesome6 name={getRewardIcon(reward.tier)} size={24} color={theme.primary} />
        </View>
        <ThemedText style={styles.rewardTitle}>{reward.title}</ThemedText>
      </View>
      {reward.description && (
        <ThemedText style={styles.rewardDescription}>{reward.description}</ThemedText>
      )}
      <View style={styles.rewardFooter}>
        <View style={styles.rewardPoints}>
          <FontAwesome6 name="coins" size={18} color="#FFCB57" />
          <ThemedText style={styles.rewardPointsText}>{reward.points_required}</ThemedText>
        </View>
        <TouchableOpacity 
          style={[
            styles.primaryButton,
            (user?.points || 0) < reward.points_required && styles.disabledButton
          ]}
          onPress={() => handleRedeem(reward)}
          disabled={(user?.points || 0) < reward.points_required}
        >
          <ThemedText style={styles.primaryButtonText}>兑换</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.mainContainer}>
        {/* Tab 切换 - 固定在顶部 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'rewards' && styles.tabActive]}
            onPress={() => setActiveTab('rewards')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'rewards' && styles.tabTextActive]}>
              积分商城
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'lottery' && styles.tabActive]}
            onPress={() => setActiveTab('lottery')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'lottery' && styles.tabTextActive]}>
              幸运抽奖
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 内容区域 - 可滚动 */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            {activeTab === 'rewards' ? (
              <>
                {/* 低积分奖励 */}
                {lowRewards.length > 0 && (
                  <View style={styles.tierSection}>
                    <ThemedText style={[styles.tierTitle, styles.tierLow]}>小奖励</ThemedText>
                    {lowRewards.map(renderRewardCard)}
                  </View>
                )}
                
                {/* 中积分奖励 */}
                {mediumRewards.length > 0 && (
                  <View style={styles.tierSection}>
                    <ThemedText style={[styles.tierTitle, styles.tierMedium]}>中等奖励</ThemedText>
                    {mediumRewards.map(renderRewardCard)}
                  </View>
                )}
                
                {/* 高积分奖励 */}
                {highRewards.length > 0 && (
                  <View style={styles.tierSection}>
                    <ThemedText style={[styles.tierTitle, styles.tierHigh]}>大奖励</ThemedText>
                    {highRewards.map(renderRewardCard)}
                  </View>
                )}
              </>
            ) : (
              <>
                {/* 抽奖区域 */}
                <View style={styles.lotteryContainer}>
                  <FontAwesome6 name="wand-magic-sparkles" size={48} color="#FF8FAB" />
                  <ThemedText style={styles.lotteryTitle}>幸运抽奖</ThemedText>
                  <ThemedText style={styles.lotteryDesc}>
                    消耗积分抽取惊喜奖励{'\n'}有机会获得稀有大奖！
                  </ThemedText>
                  <TouchableOpacity 
                    style={[
                      styles.lotteryButton,
                      (user?.points || 0) < lotteryCost && { backgroundColor: theme.textMuted }
                    ]}
                    onPress={handleDraw}
                    disabled={(user?.points || 0) < lotteryCost}
                  >
                    <ThemedText style={styles.lotteryButtonText}>开始抽奖</ThemedText>
                  </TouchableOpacity>
                  <View style={styles.lotteryCost}>
                    <FontAwesome6 name="coins" size={14} color="#FFCB57" />
                    <ThemedText style={styles.lotteryCostText}>每次消耗 {lotteryCost} 积分</ThemedText>
                  </View>
                </View>

                {/* 奖池列表 */}
                <View style={styles.prizeList}>
                  <ThemedText style={styles.sectionTitle}>奖池一览</ThemedText>
                  {lotteryItems.map((item) => (
                    <View key={item.id} style={styles.prizeItem}>
                      <View style={[styles.prizeDot, { backgroundColor: getTierColor(item.tier) }]} />
                      <ThemedText style={styles.prizeText}>{item.title}</ThemedText>
                      <ThemedText style={styles.prizeChance}>
                        {Math.round(item.probability * 100)}%
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}
