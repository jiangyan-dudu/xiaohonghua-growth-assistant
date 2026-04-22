import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, TouchableOpacity, TextInput, View, Modal, FlatList, Alert as RNAlert, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';
import { LocalDataService, type Task, type DailyTask } from '@/services/localData';

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

export default function TasksScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [activeTab, setActiveTab] = useState<'custom' | 'history'>('custom');
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState('10');
  const [historyLimit, setHistoryLimit] = useState(5); // 默认显示5条历史记录
  
  // 内置任务列表
  const [presetTasks, setPresetTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadPresetTasks();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadPresetTasks = async () => {
    try {
      const tasks = await LocalDataService.getTasks();
      setPresetTasks(tasks.filter(t => t.is_active));
    } catch (error) {
      console.error('加载内置任务失败:', error);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const user = await LocalDataService.getCurrentUser();
      if (!user) return;
      
      const history = await LocalDataService.getTaskHistory(user.id);
      setTasks(history);
    } catch (error) {
      console.error('加载历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPresetTask = (task: Task) => {
    setNewTaskTitle(task.title);
    setNewTaskPoints(String(task.points));
    setShowPicker(false);
  };

  const handleSubmitCustomTask = async () => {
    if (!newTaskTitle.trim()) {
      showAlert('提示', '请输入任务名称');
      return;
    }
    
    const user = await LocalDataService.getCurrentUser();
    if (!user) return;
    
    try {
      const result = await LocalDataService.createCustomTask(
        user.id,
        newTaskTitle.trim(),
        parseInt(newTaskPoints) || 10
      );
      
      if (result.error) {
        showAlert('提示', result.error);
        return;
      }
      
      setNewTaskTitle('');
      setNewTaskPoints('10');
      showAlert('成功', '申请已提交，等待家长审核！');
    } catch (error) {
      console.error('申请任务失败:', error);
      showAlert('错误', '申请失败，请重试');
    }
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

  const getCategoryName = (category: string) => {
    const map: Record<string, string> = {
      housework: '家务',
      study: '学习',
      self_discipline: '自律',
    };
    return map[category] || '自定义';
  };

  const filteredTasks = selectedCategory === 'all' 
    ? presetTasks 
    : presetTasks.filter(t => t.category === selectedCategory);
  
  // 根据限制过滤历史记录
  const displayTasks = tasks.slice(0, historyLimit);
  const hasMoreHistory = tasks.length > historyLimit;

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      {/* Tab 切换 - 固定在顶部 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'custom' && styles.tabActive]}
          onPress={() => setActiveTab('custom')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'custom' && styles.tabTextActive]}>
            申请任务
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            历史记录
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* 内容区域 - 可滚动 */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>

          {activeTab === 'custom' ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>申请任务</ThemedText>
              
              {/* 选择内置任务按钮 */}
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setShowPicker(true)}
              >
                <FontAwesome6 name="list-check" size={18} color={theme.primary} />
                <ThemedText style={styles.pickerButtonText}>从内置任务中选择</ThemedText>
                <FontAwesome6 name="chevron-right" size={14} color={theme.textSecondary} />
              </TouchableOpacity>

              {/* 自定义任务输入 */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>或自定义任务</ThemedText>
                <View style={styles.dividerLine} />
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="输入任务名称..."
                placeholderTextColor={theme.textMuted}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
              />
              
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <TextInput
                    style={styles.input}
                    placeholder="积分"
                    placeholderTextColor={theme.textMuted}
                    value={newTaskPoints}
                    onChangeText={setNewTaskPoints}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleSubmitCustomTask}>
                <ThemedText style={styles.primaryButtonText}>提交申请</ThemedText>
              </TouchableOpacity>

              <View style={{ marginTop: Spacing["2xl"] }}>
                <ThemedText style={styles.sectionTitle}>提示</ThemedText>
                <ThemedText style={{ color: theme.textSecondary, lineHeight: 24 }}>
                  你可以选择内置任务或自定义任务，提交后需要等待家长审核。审核通过后，完成任务同样可以获得积分奖励！
                </ThemedText>
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>任务历史</ThemedText>
              
              {tasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <FontAwesome6 name="clipboard-list" size={48} color={theme.textMuted} />
                  <ThemedText style={styles.emptyText}>暂无任务记录</ThemedText>
                </View>
              ) : (
                <>
                  {displayTasks.map((task) => (
                    <View key={task.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <ThemedText style={styles.cardTitle}>任务记录</ThemedText>
                        <View style={[
                          styles.cardBadge,
                          task.status === 'pending' && styles.badgePending,
                          task.status === 'confirmed' && styles.badgeApproved,
                        ]}>
                          <ThemedText style={[styles.badgeText, { color: getStatusColor(task.status) }]}>
                            {getStatusName(task.status)}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.cardInfo}>
                        <FontAwesome6 name="coins" size={14} color="#FFCB57" />
                        <ThemedText style={styles.cardPoints}>+{task.points} 积分</ThemedText>
                        <ThemedText style={styles.cardDate}>
                          {new Date(task.task_date).toLocaleDateString()}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                  {hasMoreHistory && (
                    <TouchableOpacity 
                      style={styles.loadMoreButton}
                      onPress={() => setHistoryLimit(prev => prev + 5)}
                    >
                      <ThemedText style={styles.loadMoreText}>查看更多 ({tasks.length - historyLimit}条未显示)</ThemedText>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 内置任务选择器 Modal */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <View style={styles.modalContainer}>
          <ThemedView level="root" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>选择内置任务</ThemedText>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* 分类筛选 */}
            <View style={styles.categoryFilter}>
              <TouchableOpacity 
                style={[styles.categoryTab, selectedCategory === 'all' && styles.categoryTabActive]}
                onPress={() => setSelectedCategory('all')}
              >
                <ThemedText style={[styles.categoryTabText, selectedCategory === 'all' && styles.categoryTabTextActive]}>
                  全部
                </ThemedText>
              </TouchableOpacity>
              {['housework', 'study', 'self_discipline'].map(cat => (
                <TouchableOpacity 
                  key={cat}
                  style={[styles.categoryTab, selectedCategory === cat && styles.categoryTabActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <ThemedText style={[styles.categoryTabText, selectedCategory === cat && styles.categoryTabTextActive]}>
                    {CATEGORY_NAMES[cat]}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {/* 任务列表 */}
            <FlatList
              data={filteredTasks}
              keyExtractor={(item) => String(item.id)}
              style={styles.taskList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.presetTaskItem}
                  onPress={() => handleSelectPresetTask(item)}
                >
                  <View style={styles.presetTaskInfo}>
                    <ThemedText style={styles.presetTaskTitle}>{item.title}</ThemedText>
                    <View style={styles.presetTaskMeta}>
                      <View style={[styles.categoryBadge, 
                        item.category === 'housework' && styles.categoryHousework,
                        item.category === 'study' && styles.categoryStudy,
                        item.category === 'self_discipline' && styles.categorySelfDiscipline,
                      ]}>
                        <ThemedText style={styles.categoryBadgeText}>{CATEGORY_NAMES[item.category]}</ThemedText>
                      </View>
                    </View>
                  </View>
                  <View style={styles.presetTaskPoints}>
                    <FontAwesome6 name="coins" size={14} color="#FFCB57" />
                    <ThemedText style={styles.presetTaskPointsText}>+{item.points}</ThemedText>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>暂无任务</ThemedText>
                </View>
              }
            />
          </ThemedView>
        </View>
      </Modal>
    </Screen>
  );
}
