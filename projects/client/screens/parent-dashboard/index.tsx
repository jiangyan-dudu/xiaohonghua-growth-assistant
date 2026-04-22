import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ScrollView, TouchableOpacity, View, Alert as RNAlert, Modal, TextInput, FlatList, Platform, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome6 } from '@expo/vector-icons';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';
import { LocalDataService, type Task, type Reward, type LotteryItem, type CustomTask, type DailyTask, type User, type PointsRecord, type DepositRecord, validateRewardTier, getSuggestedRewardTier } from '@/services/localData';

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

const CATEGORY_NAMES: Record<string, string> = {
  housework: '家务',
  study: '学习',
  self_discipline: '自律',
};

const TIER_NAMES: Record<string, string> = {
  low: '小奖励',
  medium: '中奖励',
  high: '大奖励',
};

const LOTTERY_TIER_NAMES: Record<string, string> = {
  common: '普通',
  medium: '稀有',
  rare: '传说',
};

type TabType = 'tasks' | 'confirm' | 'manage' | 'stats';
type ManageTabType = 'tasks' | 'rewards' | 'lottery';
type StatsTabType = 'points' | 'deposit';

export default function ParentDashboardScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [manageTab, setManageTab] = useState<ManageTabType>('tasks');
  const [statsTab, setStatsTab] = useState<StatsTabType>('points');
  const [children, setChildren] = useState<User[]>([]);
  const [selectedChild, setSelectedChild] = useState<User | null>(null);
  const [pendingTasks, setPendingTasks] = useState<CustomTask[]>([]);
  const [pendingConfirmTasks, setPendingConfirmTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 管理数据
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allRewards, setAllRewards] = useState<Reward[]>([]);
  const [allLotteryItems, setAllLotteryItems] = useState<LotteryItem[]>([]);
  
  // 统计数据
  const [childStats, setChildStats] = useState<{
    current_points: number;
    streak_days: number;
    total_earned: number;
    total_spent: number;
    completed_tasks: number;
  } | null>(null);
  const [pointsRecords, setPointsRecords] = useState<PointsRecord[]>([]);
  const [taskRecords, setTaskRecords] = useState<DailyTask[]>([]);
  const [recordLimit, setRecordLimit] = useState(5); // 默认显示5条积分记录
  
  // 存款相关状态
  const [depositBalance, setDepositBalance] = useState(0);
  const [depositRecords, setDepositRecords] = useState<DepositRecord[]>([]);
  const [depositLimit, setDepositLimit] = useState(5); // 默认显示5条存款记录
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [depositForm, setDepositForm] = useState({
    amount: '',
    description: '',
    isIncome: true,
  });
  
  // Modal 状态
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Task | Reward | LotteryItem | null>(null);
  const [itemType, setItemType] = useState<'task' | 'reward' | 'lottery'>('task');
  
  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    category: 'housework',
    points: 10,
    points_required: 50,
    tier: 'low',
    probability: '0.1',
    description: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authenticated = await LocalDataService.isParentAuthenticated();
    if (!authenticated) {
      router.replace('/parent-login');
      return;
    }
    loadData();
  };

  const loadData = async () => {
    try {
      // 获取孩子列表
      const childrenData = await LocalDataService.getChildren();
      setChildren(childrenData);
      
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
      
      // 获取待审核任务
      const pendingData = await LocalDataService.getPendingCustomTasks();
      setPendingTasks(pendingData);
      
      // 获取待确认的任务
      const completedData = await LocalDataService.getCompletedTasks();
      setPendingConfirmTasks(completedData);
      
      // 加载管理数据
      await loadManageData();
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadManageData = async () => {
    try {
      const [tasks, rewards, lotteryItems] = await Promise.all([
        LocalDataService.getTasks(),
        LocalDataService.getRewards(),
        LocalDataService.getLotteryItems(),
      ]);
      
      setAllTasks(tasks);
      setAllRewards(rewards);
      setAllLotteryItems(lotteryItems);
    } catch (error) {
      console.error('加载管理数据失败:', error);
    }
  };

  const loadChildStats = useCallback(async (childId: string) => {
    try {
      const [stats, records, tasks, balance, depRecords] = await Promise.all([
        LocalDataService.getChildStats(childId),
        LocalDataService.getPointsRecords(childId, 30),
        LocalDataService.getChildTaskRecords(childId),
        LocalDataService.getDepositBalance(),
        LocalDataService.getDepositRecords(),
      ]);
      
      setChildStats(stats);
      setPointsRecords(records);
      setTaskRecords(tasks);
      setDepositBalance(balance);
      setDepositRecords(depRecords);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedChild && activeTab === 'stats') {
      loadChildStats(selectedChild.id);
    }
  }, [selectedChild, activeTab]);

  // 任务审核操作
  const handleApproveTask = async (taskId: number) => {
    try {
      const result = await LocalDataService.reviewCustomTask(taskId, 'approved');
      if (result.pointsAwarded) {
        showAlert('审核通过', `已发放 ${result.pointsAwarded} 积分`);
      } else {
        showAlert('成功', '任务已通过审核');
      }
      loadData();
    } catch (error) {
      console.error('审核失败:', error);
      showAlert('错误', '审核失败');
    }
  };

  const handleRejectTask = async (taskId: number) => {
    try {
      await LocalDataService.reviewCustomTask(taskId, 'rejected', '不符合要求');
      showAlert('成功', '任务已拒绝');
      loadData();
    } catch (error) {
      console.error('审核失败:', error);
      showAlert('错误', '审核失败');
    }
  };

  const handleConfirmTask = async (taskId: number) => {
    try {
      const result = await LocalDataService.confirmDailyTask(taskId);
      
      if (result.success) {
        showAlert('确认成功', `已发放 ${result.pointsEarned} 积分${result.bonusPoints > 0 ? `，连续打卡奖励 ${result.bonusPoints} 积分` : ''}`);
        loadData();
      }
    } catch (error) {
      console.error('确认失败:', error);
      showAlert('错误', '确认失败');
    }
  };

  // 管理操作
  const openAddModal = (type: 'task' | 'reward' | 'lottery') => {
    setItemType(type);
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'housework',
      points: 10,
      points_required: 50,
      tier: 'low',
      probability: '0.1',
      description: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (item: Task | Reward | LotteryItem, type: 'task' | 'reward' | 'lottery') => {
    setItemType(type);
    setEditingItem(item);
    
    if (type === 'task') {
      const task = item as Task;
      setFormData({
        title: task.title,
        category: task.category,
        points: task.points,
        points_required: 50,
        tier: 'low',
        probability: '0.1',
        description: '',
      });
    } else if (type === 'reward') {
      const reward = item as Reward;
      setFormData({
        title: reward.title,
        category: 'housework',
        points: 10,
        points_required: reward.points_required,
        tier: reward.tier,
        probability: '0.1',
        description: reward.description || '',
      });
    } else {
      const lottery = item as LotteryItem;
      setFormData({
        title: lottery.title,
        category: 'housework',
        points: 10,
        points_required: 50,
        tier: lottery.tier,
        probability: String(lottery.probability),
        description: lottery.description || '',
      });
    }
    
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showAlert('提示', '请输入名称');
      return;
    }
    
    try {
      if (itemType === 'task') {
        if (editingItem) {
          await LocalDataService.updateTask((editingItem as Task).id, {
            title: formData.title,
            category: formData.category as Task['category'],
            points: formData.points,
          });
        } else {
          await LocalDataService.createTask({
            title: formData.title,
            category: formData.category as Task['category'],
            points: formData.points,
            is_active: true,
          });
        }
      } else if (itemType === 'reward') {
        // 验证积分与等级是否匹配
        const validation = validateRewardTier(formData.points_required, formData.tier as Reward['tier']);
        if (!validation.valid) {
          showAlert('提示', validation.message || '积分与等级不匹配');
          return;
        }
        
        if (editingItem) {
          await LocalDataService.updateReward((editingItem as Reward).id, {
            title: formData.title,
            description: formData.description,
            points_required: formData.points_required,
            tier: formData.tier as Reward['tier'],
          });
        } else {
          await LocalDataService.createReward({
            title: formData.title,
            description: formData.description,
            points_required: formData.points_required,
            tier: formData.tier as Reward['tier'],
            is_active: true,
          });
        }
      } else {
        // 抽奖奖品 - 概率由系统自动计算，不需要传递
        if (editingItem) {
          await LocalDataService.updateLotteryItem((editingItem as LotteryItem).id, {
            title: formData.title,
            description: formData.description,
            tier: formData.tier as LotteryItem['tier'],
          });
        } else {
          await LocalDataService.createLotteryItem({
            title: formData.title,
            description: formData.description,
            tier: formData.tier as LotteryItem['tier'],
            is_active: true,
          });
        }
      }
      
      setModalVisible(false);
      loadManageData();
      showAlert('成功', editingItem ? '修改成功' : '添加成功');
    } catch (error) {
      console.error('保存失败:', error);
      showAlert('错误', '保存失败');
    }
  };

  const handleDelete = async (type: 'task' | 'reward' | 'lottery', id: number) => {
    showAlert('确认删除', '确定要删除吗？', [
      { text: '取消' },
      { 
        text: '确定', 
        onPress: async () => {
          try {
            if (type === 'task') {
              await LocalDataService.deleteTask(id);
            } else if (type === 'reward') {
              await LocalDataService.deleteReward(id);
            } else {
              await LocalDataService.deleteLotteryItem(id);
            }
            loadManageData();
            showAlert('成功', '删除成功');
          } catch (error) {
            console.error('删除失败:', error);
          }
        }
      }
    ]);
  };

  const handleLogout = async () => {
    await LocalDataService.setParentAuthenticated(false);
    showAlert('已退出', '已退出家长管理后台', [
      { text: '确定', onPress: () => router.replace('/') }
    ]);
  };

  // 存款操作
  const handleDepositSubmit = async () => {
    const amount = parseFloat(depositForm.amount);
    if (isNaN(amount) || amount <= 0) {
      showAlert('提示', '请输入有效金额');
      return;
    }
    
    const actualAmount = depositForm.isIncome ? amount : -amount;
    await LocalDataService.addDepositRecord(actualAmount, depositForm.description || (depositForm.isIncome ? '存入' : '取出'));
    
    setDepositModalVisible(false);
    setDepositForm({ amount: '', description: '', isIncome: true });
    
    // 刷新存款数据
    if (selectedChild) {
      loadChildStats(selectedChild.id);
    }
    showAlert('成功', depositForm.isIncome ? '存入成功' : '取出成功');
  };

  // 重置所有数据
  const handleResetData = () => {
    showAlert('确认重置', '确定要重置所有数据吗？\n\n这将清空所有任务记录、积分记录、兑换记录、抽奖记录和存款记录，且无法恢复！', [
      { text: '取消' },
      { 
        text: '确定重置', 
        onPress: async () => {
          try {
            await LocalDataService.resetAllData();
            showAlert('重置成功', '所有数据已重置，密码已恢复为默认密码 000000', [
              { text: '确定', onPress: () => router.replace('/') }
            ]);
          } catch (error) {
            console.error('重置失败:', error);
            showAlert('错误', '重置失败');
          }
        }
      }
    ]);
  };

  const getCategoryStyle = (category: string) => {
    const map: Record<string, object> = {
      housework: styles.categoryHousework,
      study: styles.categoryStudy,
      self_discipline: styles.categorySelfDiscipline,
    };
    return map[category] || styles.categoryHousework;
  };

  const renderTaskItem = (task: Task) => (
    <View key={task.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardTitle}>{task.title}</ThemedText>
        <View style={[styles.categoryBadge, getCategoryStyle(task.category)]}>
          <ThemedText style={[styles.badgeText, { color: theme.textPrimary }]}>
            {CATEGORY_NAMES[task.category]}
          </ThemedText>
        </View>
      </View>
      <View style={styles.cardInfo}>
        <FontAwesome6 name="coins" size={14} color="#FFCB57" />
        <ThemedText style={styles.cardPoints}>+{task.points}</ThemedText>
        {!task.is_active && (
          <ThemedText style={[styles.badgeText, { color: '#EF4444', marginLeft: 8 }]}>已禁用</ThemedText>
        )}
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => openEditModal(task, 'task')}
        >
          <ThemedText style={styles.editButtonText}>修改</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDelete('task', task.id)}
        >
          <ThemedText style={styles.deleteButtonText}>删除</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRewardItem = (reward: Reward) => (
    <View key={reward.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardTitle}>{reward.title}</ThemedText>
        <View style={[styles.categoryBadge, getCategoryStyle(reward.tier)]}>
          <ThemedText style={[styles.badgeText, { color: theme.textPrimary }]}>
            {TIER_NAMES[reward.tier]}
          </ThemedText>
        </View>
      </View>
      {reward.description && (
        <ThemedText style={styles.cardSubtitle}>{reward.description}</ThemedText>
      )}
      <View style={styles.cardInfo}>
        <FontAwesome6 name="coins" size={14} color="#FFCB57" />
        <ThemedText style={styles.cardPoints}>{reward.points_required} 积分</ThemedText>
        {!reward.is_active && (
          <ThemedText style={[styles.badgeText, { color: '#EF4444', marginLeft: 8 }]}>已禁用</ThemedText>
        )}
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => openEditModal(reward, 'reward')}
        >
          <ThemedText style={styles.editButtonText}>修改</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDelete('reward', reward.id)}
        >
          <ThemedText style={styles.deleteButtonText}>删除</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLotteryItem = (item: LotteryItem) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
        <View style={[styles.categoryBadge, getCategoryStyle(item.tier)]}>
          <ThemedText style={[styles.badgeText, { color: theme.textPrimary }]}>
            {LOTTERY_TIER_NAMES[item.tier]}
          </ThemedText>
        </View>
      </View>
      {item.description && (
        <ThemedText style={styles.cardSubtitle}>{item.description}</ThemedText>
      )}
      <View style={styles.cardInfo}>
        <FontAwesome6 name="percent" size={14} color={theme.primary} />
        <ThemedText style={[styles.cardPoints, { color: theme.primary }]}>
          {(item.probability * 100).toFixed(1)}%
        </ThemedText>
        {!item.is_active && (
          <ThemedText style={[styles.badgeText, { color: '#EF4444', marginLeft: 8 }]}>已禁用</ThemedText>
        )}
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => openEditModal(item, 'lottery')}
        >
          <ThemedText style={styles.editButtonText}>修改</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDelete('lottery', item.id)}
        >
          <ThemedText style={styles.deleteButtonText}>删除</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.mainContainer}>
        {/* Header - 固定 */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>家长管理后台</ThemedText>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <ThemedText style={styles.logoutText}>退出</ThemedText>
          </TouchableOpacity>
        </View>

        {/* 主Tab 切换 - 固定 */}
        <View style={styles.tabWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainerContent}>
            <View style={styles.tabScroll}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'tasks' && styles.tabActive]}
                onPress={() => setActiveTab('tasks')}
              >
                <ThemedText style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>
                  任务审核 ({pendingTasks.length})
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'confirm' && styles.tabActive]}
                onPress={() => setActiveTab('confirm')}
              >
                <ThemedText style={[styles.tabText, activeTab === 'confirm' && styles.tabTextActive]}>
                  完成确认 ({pendingConfirmTasks.length})
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'manage' && styles.tabActive]}
                onPress={() => setActiveTab('manage')}
              >
                <ThemedText style={[styles.tabText, activeTab === 'manage' && styles.tabTextActive]}>
                  内容管理
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
                onPress={() => setActiveTab('stats')}
              >
                <ThemedText style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
                  数据统计
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* 内容管理二级Tab - 固定 */}
        {activeTab === 'manage' && (
          <View style={styles.manageTabFixed}>
            <TouchableOpacity 
              style={[styles.tab, manageTab === 'tasks' && styles.tabActive]}
              onPress={() => {
                setManageTab('tasks');
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              }}
            >
              <ThemedText style={[styles.tabText, manageTab === 'tasks' && styles.tabTextActive]}>
                任务管理
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, manageTab === 'rewards' && styles.tabActive]}
              onPress={() => {
                setManageTab('rewards');
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              }}
            >
              <ThemedText style={[styles.tabText, manageTab === 'rewards' && styles.tabTextActive]}>
                奖励管理
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, manageTab === 'lottery' && styles.tabActive]}
              onPress={() => {
                setManageTab('lottery');
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              }}
            >
              <ThemedText style={[styles.tabText, manageTab === 'lottery' && styles.tabTextActive]}>
                抽奖管理
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* 内容区域 - 可滚动 */}
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            {/* 任务审核 */}
            {activeTab === 'tasks' && (
              <>
                {pendingTasks.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <FontAwesome6 name="circle-check" size={48} color="#5ED6A0" />
                    <ThemedText style={styles.emptyText}>暂无待审核任务</ThemedText>
                  </View>
                ) : (
                  pendingTasks.map((task) => (
                    <View key={task.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <ThemedText style={styles.cardTitle}>{task.title}</ThemedText>
                      </View>
                      <View style={styles.cardInfo}>
                        <FontAwesome6 name="coins" size={14} color="#FFCB57" style={{ marginLeft: 16 }} />
                        <ThemedText style={styles.cardPoints}>+{task.points}</ThemedText>
                      </View>
                      <View style={styles.buttonRow}>
                        <TouchableOpacity 
                          style={styles.approveButton}
                          onPress={() => handleApproveTask(task.id)}
                        >
                          <ThemedText style={styles.approveButtonText}>通过</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.rejectButton}
                          onPress={() => handleRejectTask(task.id)}
                        >
                          <ThemedText style={styles.rejectButtonText}>拒绝</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {/* 完成确认 */}
            {activeTab === 'confirm' && (
              <>
                {pendingConfirmTasks.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <FontAwesome6 name="clipboard-check" size={48} color={theme.textMuted} />
                    <ThemedText style={styles.emptyText}>暂无待确认任务</ThemedText>
                  </View>
                ) : (
                  pendingConfirmTasks.map((task) => (
                    <View key={task.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <ThemedText style={styles.cardTitle}>任务记录</ThemedText>
                        <View style={[styles.cardBadge, styles.badgeApproved]}>
                          <ThemedText style={[styles.badgeText, { color: '#10B981' }]}>
                            待确认
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.cardInfo}>
                        <FontAwesome6 name="coins" size={14} color="#FFCB57" />
                        <ThemedText style={styles.cardPoints}>+{task.points}</ThemedText>
                        <ThemedText style={styles.cardDate}>
                          {new Date(task.task_date).toLocaleDateString()}
                        </ThemedText>
                      </View>
                      <TouchableOpacity 
                        style={styles.primaryButton}
                        onPress={() => handleConfirmTask(task.id)}
                      >
                        <ThemedText style={styles.primaryButtonText}>确认完成并发放积分</ThemedText>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </>
            )}

            {/* 内容管理 */}
            {activeTab === 'manage' && (
              <>
                {/* 添加按钮 */}
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => openAddModal(manageTab === 'tasks' ? 'task' : manageTab === 'rewards' ? 'reward' : 'lottery')}
                >
                  <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.addButtonText}>添加{manageTab === 'tasks' ? '任务' : manageTab === 'rewards' ? '奖励' : '奖品'}</ThemedText>
                </TouchableOpacity>

                {/* 列表 */}
                {manageTab === 'tasks' && allTasks.map(renderTaskItem)}
                {manageTab === 'rewards' && allRewards.map(renderRewardItem)}
                {manageTab === 'lottery' && allLotteryItems.map(renderLotteryItem)}
              </>
            )}

          {/* 数据统计 */}
          {activeTab === 'stats' && (
            <>
              {/* 孩子选择 */}
              {children.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {children.map((child) => (
                    <TouchableOpacity
                      key={child.id}
                      style={[
                        styles.childSelector,
                        selectedChild?.id === child.id && { borderColor: theme.primary, borderWidth: 2 },
                      ]}
                      onPress={() => setSelectedChild(child)}
                    >
                      <View style={styles.childAvatar}>
                        <FontAwesome6 name="child" size={18} color={theme.primary} />
                      </View>
                      <ThemedText style={styles.childName}>{child.name}</ThemedText>
                      <ThemedText style={styles.childPoints}>{child.points} 积分</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {selectedChild && childStats && (
                <>
                  {/* 统计卡片 */}
                  <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                      <FontAwesome6 name="coins" size={24} color="#FFCB57" />
                      <ThemedText style={styles.statValue}>{childStats.current_points}</ThemedText>
                      <ThemedText style={styles.statLabel}>当前积分</ThemedText>
                    </View>
                    <View style={styles.statCard}>
                      <FontAwesome6 name="fire" size={24} color="#FF8FAB" />
                      <ThemedText style={styles.statValue}>{childStats.streak_days}</ThemedText>
                      <ThemedText style={styles.statLabel}>连续打卡</ThemedText>
                    </View>
                    <View style={styles.statCard}>
                      <FontAwesome6 name="circle-check" size={24} color="#5ED6A0" />
                      <ThemedText style={styles.statValue}>{childStats.completed_tasks}</ThemedText>
                      <ThemedText style={styles.statLabel}>完成任务</ThemedText>
                    </View>
                  </View>

                  {/* 收支统计 */}
                  <View style={styles.card}>
                    <ThemedText style={[styles.cardTitle, { marginBottom: 12 }]}>积分收支</ThemedText>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                      <View style={{ alignItems: 'center' }}>
                        <ThemedText style={[styles.statValue, { color: '#10B981' }]}>+{childStats.total_earned}</ThemedText>
                        <ThemedText style={styles.statLabel}>累计获得</ThemedText>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <ThemedText style={[styles.statValue, { color: '#EF4444' }]}>-{childStats.total_spent}</ThemedText>
                        <ThemedText style={styles.statLabel}>累计消耗</ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* 存款管理 */}
                  <View style={[styles.card, { marginTop: 16 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <ThemedText style={styles.cardTitle}>存款管理</ThemedText>
                      <TouchableOpacity 
                        style={styles.depositButton}
                        onPress={() => setDepositModalVisible(true)}
                      >
                        <FontAwesome6 name="plus" size={14} color="#FFFFFF" />
                        <ThemedText style={styles.depositButtonText}>记账</ThemedText>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}>
                      <View style={{ alignItems: 'center' }}>
                        <ThemedText style={[styles.statValue, { color: '#3B82F6' }]}>¥{depositBalance.toFixed(2)}</ThemedText>
                        <ThemedText style={styles.statLabel}>当前存款</ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* 明细Tab切换 */}
                  <View style={styles.statsTabContainer}>
                    <TouchableOpacity 
                      style={[styles.statsTab, statsTab === 'points' && styles.statsTabActive]}
                      onPress={() => setStatsTab('points')}
                    >
                      <ThemedText style={[styles.statsTabText, statsTab === 'points' && styles.statsTabTextActive]}>
                        积分记录
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.statsTab, statsTab === 'deposit' && styles.statsTabActive]}
                      onPress={() => setStatsTab('deposit')}
                    >
                      <ThemedText style={[styles.statsTabText, statsTab === 'deposit' && styles.statsTabTextActive]}>
                        存款明细
                      </ThemedText>
                    </TouchableOpacity>
                  </View>

                  {/* 积分记录 */}
                  {statsTab === 'points' && (
                    <>
                      {pointsRecords.length === 0 ? (
                        <ThemedText style={styles.emptyText}>暂无积分记录</ThemedText>
                      ) : (
                        <>
                          {pointsRecords.slice(0, recordLimit).map((record) => (
                            <View key={record.id} style={styles.recordItem}>
                              <View style={{ flex: 1 }}>
                                <ThemedText style={styles.recordTitle}>{record.description}</ThemedText>
                                <ThemedText style={styles.recordDate}>
                                  {new Date(record.created_at).toLocaleString()}
                                </ThemedText>
                              </View>
                              <ThemedText style={[
                                styles.recordPoints,
                                record.points > 0 ? { color: '#10B981' } : { color: '#EF4444' }
                              ]}>
                                {record.points > 0 ? '+' : ''}{record.points}
                              </ThemedText>
                            </View>
                          ))}
                          
                          {/* 查看更多按钮 */}
                          {pointsRecords.length > recordLimit && (
                            <TouchableOpacity 
                              style={styles.loadMoreButton}
                              onPress={() => setRecordLimit(prev => prev + 5)}
                            >
                              <ThemedText style={styles.loadMoreText}>查看更多</ThemedText>
                              <FontAwesome6 name="chevron-down" size={14} color={theme.primary} />
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* 存款明细 */}
                  {statsTab === 'deposit' && (
                    <>
                      {depositRecords.length === 0 ? (
                        <ThemedText style={styles.emptyText}>暂无存款记录</ThemedText>
                      ) : (
                        <>
                          {depositRecords.slice(0, depositLimit).map((record) => (
                            <View key={record.id} style={styles.recordItem}>
                              <View style={{ flex: 1 }}>
                                <ThemedText style={styles.recordTitle}>{record.description}</ThemedText>
                                <ThemedText style={styles.recordDate}>
                                  {new Date(record.created_at).toLocaleString()}
                                </ThemedText>
                              </View>
                              <ThemedText style={[
                                styles.recordPoints,
                                record.amount > 0 ? { color: '#10B981' } : { color: '#EF4444' }
                              ]}>
                                {record.amount > 0 ? '+' : ''}¥{record.amount.toFixed(2)}
                              </ThemedText>
                            </View>
                          ))}
                          {depositRecords.length > depositLimit && (
                            <TouchableOpacity 
                              style={styles.loadMoreButton}
                              onPress={() => setDepositLimit(prev => prev + 5)}
                            >
                              <ThemedText style={styles.loadMoreText}>查看更多</ThemedText>
                              <FontAwesome6 name="chevron-down" size={14} color={theme.primary} />
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                    </>
                  )}
                  
                  {/* 回到初始状态按钮 */}
                  <TouchableOpacity 
                    style={styles.resetButton}
                    onPress={handleResetData}
                  >
                    <FontAwesome6 name="rotate-left" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.resetButtonText}>回到初始状态</ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* 编辑/添加 Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {editingItem ? '编辑' : '添加'}{itemType === 'task' ? '任务' : itemType === 'reward' ? '奖励' : '奖品'}
              </ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={styles.formLabel}>名称</ThemedText>
              <TextInput
                style={styles.formInput}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="输入名称"
                placeholderTextColor={theme.textMuted}
              />

              {itemType === 'task' && (
                <>
                  <ThemedText style={styles.formLabel}>分类</ThemedText>
                  <View style={styles.pickerRow}>
                    {['housework', 'study', 'self_discipline'].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.pickerOption, formData.category === cat && styles.pickerOptionActive]}
                        onPress={() => setFormData({ ...formData, category: cat })}
                      >
                        <ThemedText style={formData.category === cat ? styles.pickerOptionTextActive : styles.pickerOptionText}>
                          {CATEGORY_NAMES[cat]}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <ThemedText style={styles.formLabel}>积分</ThemedText>
                  <TextInput
                    style={styles.formInput}
                    value={String(formData.points)}
                    onChangeText={(text) => setFormData({ ...formData, points: parseInt(text) || 0 })}
                    keyboardType="numeric"
                    placeholder="积分"
                    placeholderTextColor={theme.textMuted}
                  />
                </>
              )}

              {itemType === 'reward' && (
                <>
                  <ThemedText style={styles.formLabel}>描述</ThemedText>
                  <TextInput
                    style={styles.formInput}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="描述"
                    placeholderTextColor={theme.textMuted}
                  />

                  <View style={styles.formLabelRow}>
                    <ThemedText style={styles.formLabel}>所需积分</ThemedText>
                    <TouchableOpacity 
                      style={styles.helpIcon}
                      onPress={() => showAlert('积分与等级说明', '小奖励: 1-50积分\n中奖励: 51-200积分\n大奖励: 201+积分\n\n输入积分后会自动设置对应等级')}
                    >
                      <FontAwesome6 name="circle-question" size={16} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={String(formData.points_required)}
                    onChangeText={(text) => {
                      const points = parseInt(text) || 0;
                      const suggestedTier = getSuggestedRewardTier(points);
                      setFormData({ ...formData, points_required: points, tier: suggestedTier });
                    }}
                    keyboardType="numeric"
                    placeholder="所需积分"
                    placeholderTextColor={theme.textMuted}
                  />

                  <ThemedText style={styles.formLabel}>等级（根据积分自动设置）</ThemedText>
                  <View style={styles.pickerRow}>
                    {['low', 'medium', 'high'].map((tier) => (
                      <TouchableOpacity
                        key={tier}
                        style={[styles.pickerOption, formData.tier === tier && styles.pickerOptionActive]}
                        onPress={() => setFormData({ ...formData, tier })}
                      >
                        <ThemedText style={formData.tier === tier ? styles.pickerOptionTextActive : styles.pickerOptionText}>
                          {TIER_NAMES[tier]}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {itemType === 'lottery' && (
                <>
                  <ThemedText style={styles.formLabel}>描述</ThemedText>
                  <TextInput
                    style={styles.formInput}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="描述"
                    placeholderTextColor={theme.textMuted}
                  />

                  <View style={styles.formLabelRow}>
                    <ThemedText style={styles.formLabel}>等级</ThemedText>
                    <TouchableOpacity 
                      style={styles.helpIcon}
                      onPress={() => showAlert('奖品等级与概率说明', '普通奖品: 总概率80%\n稀有奖品: 总概率17%\n传说奖品: 总概率3%\n\n概率会在保存后自动分配，同等级奖品均分该等级概率')}
                    >
                      <FontAwesome6 name="circle-question" size={16} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.pickerRow}>
                    {['common', 'medium', 'rare'].map((tier) => (
                      <TouchableOpacity
                        key={tier}
                        style={[styles.pickerOption, formData.tier === tier && styles.pickerOptionActive]}
                        onPress={() => setFormData({ ...formData, tier })}
                      >
                        <ThemedText style={formData.tier === tier ? styles.pickerOptionTextActive : styles.pickerOptionText}>
                          {LOTTERY_TIER_NAMES[tier]}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <ThemedText style={styles.cancelButtonText}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <ThemedText style={styles.saveButtonText}>保存</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 存款管理 Modal */}
      <Modal visible={depositModalVisible} transparent animationType="slide" onRequestClose={() => setDepositModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>存款记账</ThemedText>
              <TouchableOpacity onPress={() => setDepositModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* 类型选择 */}
              <ThemedText style={styles.formLabel}>类型</ThemedText>
              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={[styles.pickerOption, depositForm.isIncome && styles.pickerOptionActive]}
                  onPress={() => setDepositForm({ ...depositForm, isIncome: true })}
                >
                  <ThemedText style={depositForm.isIncome ? styles.pickerOptionTextActive : styles.pickerOptionText}>
                    存入
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pickerOption, !depositForm.isIncome && styles.pickerOptionActive]}
                  onPress={() => setDepositForm({ ...depositForm, isIncome: false })}
                >
                  <ThemedText style={!depositForm.isIncome ? styles.pickerOptionTextActive : styles.pickerOptionText}>
                    取出
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <ThemedText style={styles.formLabel}>金额</ThemedText>
              <TextInput
                style={styles.formInput}
                value={depositForm.amount}
                onChangeText={(text) => setDepositForm({ ...depositForm, amount: text })}
                keyboardType="decimal-pad"
                placeholder="输入金额"
                placeholderTextColor={theme.textMuted}
              />

              <ThemedText style={styles.formLabel}>备注</ThemedText>
              <TextInput
                style={styles.formInput}
                value={depositForm.description}
                onChangeText={(text) => setDepositForm({ ...depositForm, description: text })}
                placeholder="备注（可选）"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDepositModalVisible(false)}>
                <ThemedText style={styles.cancelButtonText}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleDepositSubmit}>
                <ThemedText style={styles.saveButtonText}>确定</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </Screen>
  );
}
