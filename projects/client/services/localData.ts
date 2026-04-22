/**
 * 本地数据服务层
 * 使用 AsyncStorage 存储所有数据，替代后端API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============ 类型定义 ============

export interface User {
  id: string;
  name: string;
  role: 'parent' | 'child';
  points: number;
  streak_days: number;
  parent_id?: string;
  parent_password?: string;
}

export interface Task {
  id: number;
  title: string;
  category: 'housework' | 'study' | 'self_discipline';
  points: number;
  is_active: boolean;
}

export interface CustomTask {
  id: number;
  title: string;
  points: number;
  status: 'pending' | 'approved' | 'rejected';
  child_id: string;
  created_at: string;
  review_note?: string;
}

export interface DailyTask {
  id: number;
  task_date: string;
  status: 'pending' | 'completed' | 'confirmed';
  points: number;
  task_id?: number;
  custom_task_id?: number;
  child_id: string;
  created_at: string;
}

export interface Reward {
  id: number;
  title: string;
  description?: string;
  points_required: number;
  tier: 'low' | 'medium' | 'high';
  is_active: boolean;
}

export interface LotteryItem {
  id: number;
  title: string;
  description?: string;
  probability: number;
  tier: 'common' | 'medium' | 'rare';
  is_active: boolean;
}

export interface PointsRecord {
  id: number;
  user_id: string;
  points: number;
  type: 'task_reward' | 'streak_bonus' | 'redemption' | 'lottery';
  description: string;
  created_at: string;
}

export interface Redemption {
  id: number;
  child_id: string;
  reward_id: number;
  points_spent: number;
  status: 'pending' | 'fulfilled';
  created_at: string;
}

export interface LotteryDraw {
  id: number;
  child_id: string;
  item_id: number;
  points_spent: number;
  created_at: string;
}

// 存款记录类型
export interface DepositRecord {
  id: number;
  amount: number;  // 正数为存入，负数为取出
  balance: number; // 操作后余额
  description: string;
  created_at: string;
}

// ============ 存储键 ============

// 数据版本号 - 修改此值会触发数据重新初始化
const DATA_VERSION = '6';

const KEYS = {
  DATA_VERSION: 'local_data_version',
  USERS: 'local_users',
  TASKS: 'local_tasks',
  CUSTOM_TASKS: 'local_custom_tasks',
  DAILY_TASKS: 'local_daily_tasks',
  REWARDS: 'local_rewards',
  LOTTERY_ITEMS: 'local_lottery_items',
  POINTS_RECORDS: 'local_points_records',
  REDEMPTIONS: 'local_redemptions',
  LOTTERY_DRAWS: 'local_lottery_draws',
  CURRENT_USER_ID: 'userId',
  PARENT_ID: 'parentId',
  PARENT_AUTHENTICATED: 'parentAuthenticated',
  LAST_TASK_DATE: 'last_task_date',
  // 存款相关
  DEPOSIT_BALANCE: 'local_deposit_balance',
  DEPOSIT_RECORDS: 'local_deposit_records',
};

// ============ 辅助函数 ============

const generateId = () => Math.random().toString(36).substring(2, 15);
const generateNumericId = () => Date.now();

const getItem = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setItem = async <T>(key: string, value: T): Promise<void> => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

const getToday = () => new Date().toISOString().split('T')[0];

// ============ 初始化默认数据 ============

const DEFAULT_TASKS: Task[] = [
  // 家务 (housework)
  { id: 1, title: '倒垃圾', category: 'housework', points: 5, is_active: true },
  { id: 2, title: '洗袜子', category: 'housework', points: 3, is_active: true },
  { id: 3, title: '洗内裤', category: 'housework', points: 3, is_active: true },
  { id: 4, title: '喂仓鼠', category: 'housework', points: 3, is_active: true },
  { id: 5, title: '帮忙洗菜', category: 'housework', points: 8, is_active: true },
  { id: 6, title: '帮忙拿碗筷', category: 'housework', points: 3, is_active: true },
  { id: 7, title: '整理书包', category: 'housework', points: 5, is_active: true },
  { id: 8, title: '擦桌子', category: 'housework', points: 3, is_active: true },
  { id: 9, title: '给植物浇水', category: 'housework', points: 3, is_active: true },
  { id: 10, title: '扫地', category: 'housework', points: 8, is_active: true },
  { id: 11, title: '拖地', category: 'housework', points: 8, is_active: true },
  { id: 12, title: '洗碗', category: 'housework', points: 8, is_active: true },
  { id: 13, title: '整理衣服', category: 'housework', points: 8, is_active: true },
  { id: 14, title: '整理房间', category: 'housework', points: 8, is_active: true },
  // 自律 (self_discipline)
  { id: 15, title: '21点半前上床', category: 'self_discipline', points: 3, is_active: true },
  { id: 16, title: '8点前出门', category: 'self_discipline', points: 3, is_active: true },
  { id: 17, title: '自己梳头', category: 'self_discipline', points: 5, is_active: true },
  { id: 18, title: '不挑食吃饭', category: 'self_discipline', points: 5, is_active: true },
  { id: 19, title: '主动整理玩具', category: 'self_discipline', points: 3, is_active: true },
  { id: 20, title: '在学校完成作业', category: 'self_discipline', points: 3, is_active: true },
  // 学习 (study)
  { id: 21, title: '练字 10 分钟', category: 'study', points: 5, is_active: true },
  { id: 22, title: '数学每日一练', category: 'study', points: 5, is_active: true },
  { id: 23, title: '英语单词打卡', category: 'study', points: 3, is_active: true },
  { id: 24, title: '复习当日功课', category: 'study', points: 5, is_active: true },
  { id: 25, title: '阅读 20 分钟', category: 'study', points: 5, is_active: true },
  { id: 26, title: '背诵 1 首古诗', category: 'study', points: 3, is_active: true },
  { id: 27, title: '学英语', category: 'study', points: 5, is_active: true },
  { id: 28, title: '完成一张卷子', category: 'study', points: 8, is_active: true },
];

const DEFAULT_REWARDS: Reward[] = [
  // 小奖励 (low)
  { id: 1, title: '玩狼人杀10分钟', points_required: 20, tier: 'low', is_active: true },
  { id: 2, title: '看 10 分钟电视', points_required: 30, tier: 'low', is_active: true },
  { id: 3, title: '陪玩拼豆 15 分钟', points_required: 30, tier: 'low', is_active: true },
  { id: 4, title: '现金5元', points_required: 40, tier: 'low', is_active: true },
  { id: 5, title: '晚睡 15 分钟', points_required: 50, tier: 'low', is_active: true },
  // 中奖励 (medium)
  { id: 6, title: '零食有鸣10元内', points_required: 70, tier: 'medium', is_active: true },
  { id: 7, title: '下五子棋20分钟', points_required: 80, tier: 'medium', is_active: true },
  { id: 8, title: '陪做小手工20分钟', points_required: 90, tier: 'medium', is_active: true },
  { id: 9, title: '心仪10元小文具 / 玩具', points_required: 100, tier: 'medium', is_active: true },
  // 大奖励 (high)
  { id: 10, title: '电影观影券', points_required: 200, tier: 'high', is_active: true },
  { id: 11, title: '时光甜品一次', points_required: 250, tier: 'high', is_active: true },
  { id: 12, title: '全天自由娱乐时间', points_required: 300, tier: 'high', is_active: true },
  { id: 13, title: '短途出游', points_required: 500, tier: 'high', is_active: true },
];

// 概率分配规则：普通80%、稀有17%、传说3%
const TIER_PROBABILITY_MAP: Record<string, number> = {
  common: 0.80,   // 普通奖品总概率
  medium: 0.17,   // 稀有奖品总概率
  rare: 0.03,     // 传说奖品总概率
};

// 奖励积分与等级的关系
export const REWARD_TIER_LIMITS = {
  low: { min: 1, max: 50 },      // 小奖励：1-50积分
  medium: { min: 51, max: 200 }, // 中奖励：51-200积分
  high: { min: 201, max: Infinity }, // 大奖励：201+积分
};

// 根据积分获取建议的奖励等级
export function getSuggestedRewardTier(points: number): 'low' | 'medium' | 'high' {
  if (points <= 50) return 'low';
  if (points <= 200) return 'medium';
  return 'high';
}

// 验证积分与等级是否匹配
export function validateRewardTier(points: number, tier: 'low' | 'medium' | 'high'): { valid: boolean; message?: string } {
  const limits = REWARD_TIER_LIMITS[tier];
  if (points < limits.min || points > limits.max) {
    const tierNames: Record<string, string> = { low: '小奖励', medium: '中奖励', high: '大奖励' };
    return { 
      valid: false, 
      message: `${tierNames[tier]}的积分范围是 ${limits.min}-${limits.max === Infinity ? '以上' : limits.max} 积分` 
    };
  }
  return { valid: true };
}

// 重新计算抽奖奖品概率（根据等级分配）
async function recalculateLotteryProbabilities(items: LotteryItem[]): Promise<LotteryItem[]> {
  const activeItems = items.filter(i => i.is_active);
  
  // 按等级分组
  const tierGroups: Record<string, LotteryItem[]> = {
    common: [],
    medium: [],
    rare: [],
  };
  
  activeItems.forEach(item => {
    if (tierGroups[item.tier]) {
      tierGroups[item.tier].push(item);
    }
  });
  
  // 重新计算每个奖品的概率
  const updatedItems = items.map(item => {
    if (!item.is_active) return item;
    
    const group = tierGroups[item.tier];
    if (group && group.length > 0) {
      const tierProbability = TIER_PROBABILITY_MAP[item.tier] || 0.80;
      const probabilityPerItem = tierProbability / group.length;
      return { ...item, probability: Math.round(probabilityPerItem * 10000) / 10000 }; // 保留4位小数
    }
    return item;
  });
  
  return updatedItems;
}

const DEFAULT_LOTTERY_ITEMS: LotteryItem[] = [
  // 普通 (common) - 总概率80%，每个奖品约26.67%
  { id: 1, title: '10 分钟手机娱乐', probability: 0.2667, tier: 'common', is_active: true },
  { id: 2, title: '10元内小礼品', probability: 0.2667, tier: 'common', is_active: true },
  { id: 3, title: '亲子小游戏 10 分钟', probability: 0.2666, tier: 'common', is_active: true },
  // 稀有 (medium) - 总概率17%，每个奖品约5.67%
  { id: 4, title: '10元内小零食一份', probability: 0.0567, tier: 'medium', is_active: true },
  { id: 5, title: '免学习英语', probability: 0.0567, tier: 'medium', is_active: true },
  { id: 6, title: '免做一张卷子', probability: 0.0566, tier: 'medium', is_active: true },
  // 传说 (rare) - 总概率3%，每个奖品1.5%
  { id: 7, title: '时光甜品一次', probability: 0.015, tier: 'rare', is_active: true },
  { id: 8, title: '烤肉一次', probability: 0.015, tier: 'rare', is_active: true },
];

// ============ 导出服务 ============

export const LocalDataService = {
  // ---------- 初始化 ----------
  
  async initialize(): Promise<{ userId: string; parentId: string }> {
    console.log('开始初始化本地数据服务...');
    
    // 检查数据版本，如果不匹配则重新初始化
    const currentVersion = await AsyncStorage.getItem(KEYS.DATA_VERSION);
    console.log('当前数据版本:', currentVersion, '目标版本:', DATA_VERSION);
    
    if (currentVersion !== DATA_VERSION) {
      // 版本不匹配，清除所有旧数据
      console.log('数据版本更新，清除旧数据...');
      try {
        await AsyncStorage.multiRemove([
          KEYS.USERS,
          KEYS.TASKS,
          KEYS.CUSTOM_TASKS,
          KEYS.DAILY_TASKS,
          KEYS.REWARDS,
          KEYS.LOTTERY_ITEMS,
          KEYS.POINTS_RECORDS,
          KEYS.REDEMPTIONS,
          KEYS.LOTTERY_DRAWS,
          KEYS.CURRENT_USER_ID,
          KEYS.PARENT_ID,
          KEYS.PARENT_AUTHENTICATED,
        ]);
      } catch (e) {
        console.log('清除数据时出错:', e);
      }
    }
    
    // 检查是否已初始化
    let users = await getItem<User[]>(KEYS.USERS, []);
    console.log('现有用户数量:', users.length);
    
    if (users.length === 0) {
      console.log('创建默认用户...');
      // 创建默认家长账号
      const parentId = generateId();
      const parentUser: User = {
        id: parentId,
        name: '家长',
        role: 'parent',
        points: 0,
        streak_days: 0,
        parent_password: '000000',
      };
      
      // 创建默认孩子账号
      const childId = generateId();
      const childUser: User = {
        id: childId,
        name: '小朋友',
        role: 'child',
        points: 0,
        streak_days: 0,
        parent_id: parentId,
      };
      
      users = [parentUser, childUser];
      
      console.log('保存用户数据...', { parentId, childId });
      await setItem(KEYS.USERS, users);
      await AsyncStorage.setItem(KEYS.CURRENT_USER_ID, childId);
      await AsyncStorage.setItem(KEYS.PARENT_ID, parentId);
      
      // 初始化默认数据
      console.log('保存默认任务数据...');
      await setItem(KEYS.TASKS, DEFAULT_TASKS);
      await setItem(KEYS.REWARDS, DEFAULT_REWARDS);
      await setItem(KEYS.LOTTERY_ITEMS, DEFAULT_LOTTERY_ITEMS);
      await setItem(KEYS.CUSTOM_TASKS, []);
      await setItem(KEYS.DAILY_TASKS, []);
      await setItem(KEYS.POINTS_RECORDS, []);
      await setItem(KEYS.REDEMPTIONS, []);
      await setItem(KEYS.LOTTERY_DRAWS, []);
      
      // 保存数据版本号
      await AsyncStorage.setItem(KEYS.DATA_VERSION, DATA_VERSION);
      console.log('初始化完成!');
      
      return { userId: childId, parentId };
    }
    
    // 已有用户，获取当前用户ID
    let userId = await AsyncStorage.getItem(KEYS.CURRENT_USER_ID);
    let parentId = await AsyncStorage.getItem(KEYS.PARENT_ID);
    
    // 如果没有保存用户ID，从用户列表中获取
    if (!userId && users.length > 0) {
      const child = users.find(u => u.role === 'child');
      const parent = users.find(u => u.role === 'parent');
      if (child) {
        userId = child.id;
        await AsyncStorage.setItem(KEYS.CURRENT_USER_ID, userId);
      }
      if (parent) {
        parentId = parent.id;
        await AsyncStorage.setItem(KEYS.PARENT_ID, parentId);
      }
    }
    
    // 保存数据版本号
    await AsyncStorage.setItem(KEYS.DATA_VERSION, DATA_VERSION);
    console.log('初始化完成! userId:', userId);
    
    return { userId: userId || '', parentId: parentId || '' };
  },

  // ---------- 用户相关 ----------
  
  async getCurrentUser(): Promise<User | null> {
    const userId = await AsyncStorage.getItem(KEYS.CURRENT_USER_ID);
    if (!userId) return null;
    
    const users = await getItem<User[]>(KEYS.USERS, []);
    return users.find(u => u.id === userId) || null;
  },
  
  async getUserById(userId: string): Promise<User | null> {
    const users = await getItem<User[]>(KEYS.USERS, []);
    const user = users.find(u => u.id === userId) || null;
    console.log('[LocalData] getUserById, userId:', userId, '找到用户:', user ? { id: user.id, points: user.points } : null);
    return user;
  },
  
  async getParent(): Promise<User | null> {
    const parentId = await AsyncStorage.getItem(KEYS.PARENT_ID);
    if (!parentId) return null;
    
    const users = await getItem<User[]>(KEYS.USERS, []);
    return users.find(u => u.id === parentId) || null;
  },
  
  async getChildren(): Promise<User[]> {
    const parentId = await AsyncStorage.getItem(KEYS.PARENT_ID);
    const users = await getItem<User[]>(KEYS.USERS, []);
    return users.filter(u => u.parent_id === parentId);
  },
  
  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    console.log('[LocalData] updateUser 开始, userId:', userId, 'updates:', updates);
    const users = await getItem<User[]>(KEYS.USERS, []);
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) {
      console.log('[LocalData] updateUser 未找到用户');
      return null;
    }
    
    users[index] = { ...users[index], ...updates };
    console.log('[LocalData] updateUser 更新后用户数据:', users[index]);
    await setItem(KEYS.USERS, users);
    console.log('[LocalData] updateUser 完成');
    return users[index];
  },
  
  async verifyParentPassword(password: string): Promise<boolean> {
    const parent = await this.getParent();
    return parent?.parent_password === password;
  },
  
  async setParentAuthenticated(authenticated: boolean): Promise<void> {
    if (authenticated) {
      await AsyncStorage.setItem(KEYS.PARENT_AUTHENTICATED, 'true');
    } else {
      await AsyncStorage.removeItem(KEYS.PARENT_AUTHENTICATED);
    }
  },
  
  async isParentAuthenticated(): Promise<boolean> {
    return await AsyncStorage.getItem(KEYS.PARENT_AUTHENTICATED) === 'true';
  },

  // ---------- 内置任务相关 ----------
  
  async getTasks(): Promise<Task[]> {
    return await getItem<Task[]>(KEYS.TASKS, DEFAULT_TASKS);
  },
  
  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    const tasks = await this.getTasks();
    const newTask: Task = {
      ...task,
      id: generateNumericId(),
    };
    tasks.push(newTask);
    await setItem(KEYS.TASKS, tasks);
    return newTask;
  },
  
  async updateTask(taskId: number, updates: Partial<Task>): Promise<Task | null> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    
    if (index === -1) return null;
    
    tasks[index] = { ...tasks[index], ...updates };
    await setItem(KEYS.TASKS, tasks);
    return tasks[index];
  },
  
  async deleteTask(taskId: number): Promise<void> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    await setItem(KEYS.TASKS, filtered);
  },

  // ---------- 自定义任务相关 ----------
  
  async getCustomTasks(): Promise<CustomTask[]> {
    return await getItem<CustomTask[]>(KEYS.CUSTOM_TASKS, []);
  },
  
  async getPendingCustomTasks(): Promise<CustomTask[]> {
    const tasks = await this.getCustomTasks();
    return tasks.filter(t => t.status === 'pending');
  },
  
  async createCustomTask(childId: string, title: string, points: number): Promise<{ task: CustomTask; error?: string }> {
    const tasks = await this.getCustomTasks();
    
    // 检查当天已申请的任务数量
    const today = getToday();
    const todayTasks = tasks.filter(t => {
      const taskDate = new Date(t.created_at).toISOString().split('T')[0];
      return t.child_id === childId && taskDate === today;
    });
    
    if (todayTasks.length >= 10) {
      return { 
        task: null as any, 
        error: '每天最多只能申请10个任务，明天再来吧！' 
      };
    }
    
    const newTask: CustomTask = {
      id: generateNumericId(),
      title,
      points,
      status: 'pending',
      child_id: childId,
      created_at: new Date().toISOString(),
    };
    tasks.push(newTask);
    await setItem(KEYS.CUSTOM_TASKS, tasks);
    return { task: newTask };
  },
  
  async reviewCustomTask(taskId: number, status: 'approved' | 'rejected', reviewNote?: string): Promise<{ task: CustomTask | null; pointsAwarded?: number }> {
    const tasks = await this.getCustomTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    
    if (index === -1) return { task: null };
    
    const task = tasks[index];
    tasks[index] = { 
      ...task, 
      status,
      review_note: reviewNote,
    };
    await setItem(KEYS.CUSTOM_TASKS, tasks);
    
    // 审核通过时发放积分
    if (status === 'approved') {
      const child = await this.getUserById(task.child_id);
      if (child) {
        // 更新用户积分
        const newPoints = (child.points || 0) + task.points;
        await this.updateUser(task.child_id, { points: newPoints });
        
        // 记录积分
        await this.addPointsRecord(task.child_id, task.points, 'task_reward', `申请任务通过：${task.title}`);
        
        // 创建一条已确认的 DailyTask 记录
        const dailyTasks = await getItem<DailyTask[]>(KEYS.DAILY_TASKS, []);
        dailyTasks.push({
          id: generateNumericId(),
          task_date: getToday(),
          status: 'confirmed',
          points: task.points,
          custom_task_id: task.id,
          child_id: task.child_id,
          created_at: new Date().toISOString(),
        });
        await setItem(KEYS.DAILY_TASKS, dailyTasks);
        
        return { task: tasks[index], pointsAwarded: task.points };
      }
    }
    
    return { task: tasks[index] };
  },

  // ---------- 每日任务相关 ----------
  
  async getTodayTask(childId: string): Promise<DailyTask | null> {
    const today = getToday();
    const tasks = await getItem<DailyTask[]>(KEYS.DAILY_TASKS, []);
    return tasks.find(t => t.child_id === childId && t.task_date === today) || null;
  },
  
  async assignTodayTask(childId: string): Promise<DailyTask> {
    const today = getToday();
    const dailyTasks = await getItem<DailyTask[]>(KEYS.DAILY_TASKS, []);
    
    // 检查今天是否已有任务
    const existing = dailyTasks.find(t => t.child_id === childId && t.task_date === today);
    if (existing) return existing;
    
    // 随机选择一个任务
    const tasks = await this.getTasks();
    const activeTasks = tasks.filter(t => t.is_active);
    const randomTask = activeTasks[Math.floor(Math.random() * activeTasks.length)];
    
    const newDailyTask: DailyTask = {
      id: generateNumericId(),
      task_date: today,
      status: 'pending',
      points: randomTask.points,
      task_id: randomTask.id,
      child_id: childId,
      created_at: new Date().toISOString(),
    };
    
    dailyTasks.push(newDailyTask);
    await setItem(KEYS.DAILY_TASKS, dailyTasks);
    return newDailyTask;
  },
  
  async completeDailyTask(taskId: number): Promise<DailyTask | null> {
    const tasks = await getItem<DailyTask[]>(KEYS.DAILY_TASKS, []);
    const index = tasks.findIndex(t => t.id === taskId);
    
    if (index === -1) return null;
    
    tasks[index].status = 'completed';
    await setItem(KEYS.DAILY_TASKS, tasks);
    return tasks[index];
  },
  
  async confirmDailyTask(taskId: number): Promise<{ success: boolean; pointsEarned: number; bonusPoints: number }> {
    const dailyTasks = await getItem<DailyTask[]>(KEYS.DAILY_TASKS, []);
    const index = dailyTasks.findIndex(t => t.id === taskId);
    
    if (index === -1) return { success: false, pointsEarned: 0, bonusPoints: 0 };
    
    const task = dailyTasks[index];
    task.status = 'confirmed';
    await setItem(KEYS.DAILY_TASKS, dailyTasks);
    
    // 计算连续打卡
    const child = await this.getUserById(task.child_id);
    let streakDays = child?.streak_days || 0;
    let bonusPoints = 0;
    
    // 检查是否连续打卡
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const yesterdayTask = dailyTasks.find(t => 
      t.child_id === task.child_id && 
      t.task_date === yesterdayStr && 
      t.status === 'confirmed'
    );
    
    if (yesterdayTask) {
      streakDays += 1;
      // 连续打卡奖励
      if (streakDays >= 7) {
        bonusPoints = 20;
      } else if (streakDays >= 3) {
        bonusPoints = 5;
      }
    } else {
      streakDays = 1;
    }
    
    // 更新用户积分
    const totalPoints = task.points + bonusPoints;
    await this.updateUser(task.child_id, { 
      points: (child?.points || 0) + totalPoints,
      streak_days: streakDays,
    });
    
    // 记录积分
    await this.addPointsRecord(task.child_id, task.points, 'task_reward', `完成任务获得 ${task.points} 积分`);
    if (bonusPoints > 0) {
      await this.addPointsRecord(task.child_id, bonusPoints, 'streak_bonus', `连续打卡 ${streakDays} 天奖励`);
    }
    
    return { success: true, pointsEarned: task.points, bonusPoints };
  },
  
  async getCompletedTasks(): Promise<DailyTask[]> {
    const tasks = await getItem<DailyTask[]>(KEYS.DAILY_TASKS, []);
    return tasks.filter(t => t.status === 'completed');
  },
  
  async getTaskHistory(childId: string, limit?: number): Promise<DailyTask[]> {
    const tasks = await getItem<DailyTask[]>(KEYS.DAILY_TASKS, []);
    let history = tasks
      .filter(t => t.child_id === childId)
      .sort((a, b) => new Date(b.task_date).getTime() - new Date(a.task_date).getTime());
    
    if (limit) {
      history = history.slice(0, limit);
    }
    
    return history;
  },

  // ---------- 奖励相关 ----------
  
  async getRewards(): Promise<Reward[]> {
    return await getItem<Reward[]>(KEYS.REWARDS, DEFAULT_REWARDS);
  },
  
  async createReward(reward: Omit<Reward, 'id'>): Promise<Reward> {
    const rewards = await this.getRewards();
    const newReward: Reward = {
      ...reward,
      id: generateNumericId(),
    };
    rewards.push(newReward);
    await setItem(KEYS.REWARDS, rewards);
    return newReward;
  },
  
  async updateReward(rewardId: number, updates: Partial<Reward>): Promise<Reward | null> {
    const rewards = await this.getRewards();
    const index = rewards.findIndex(r => r.id === rewardId);
    
    if (index === -1) return null;
    
    rewards[index] = { ...rewards[index], ...updates };
    await setItem(KEYS.REWARDS, rewards);
    return rewards[index];
  },
  
  async deleteReward(rewardId: number): Promise<void> {
    const rewards = await this.getRewards();
    const filtered = rewards.filter(r => r.id !== rewardId);
    await setItem(KEYS.REWARDS, filtered);
  },
  
  async redeemReward(childId: string, rewardId: number): Promise<{ success: boolean; remainingPoints?: number; error?: string }> {
    console.log('[LocalData] redeemReward 开始, childId:', childId, 'rewardId:', rewardId);
    const child = await this.getUserById(childId);
    const rewards = await this.getRewards();
    const reward = rewards.find(r => r.id === rewardId);
    
    console.log('[LocalData] 用户当前积分:', child?.points, '奖励需要积分:', reward?.points_required);
    
    if (!child || !reward) {
      return { success: false, error: '数据不存在' };
    }
    
    if (child.points < reward.points_required) {
      return { success: false, error: '积分不足' };
    }
    
    // 扣除积分
    const newPoints = child.points - reward.points_required;
    console.log('[LocalData] 扣除后积分:', newPoints);
    await this.updateUser(childId, { points: newPoints });
    
    // 记录兑换
    const redemptions = await getItem<Redemption[]>(KEYS.REDEMPTIONS, []);
    redemptions.push({
      id: generateNumericId(),
      child_id: childId,
      reward_id: rewardId,
      points_spent: reward.points_required,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    await setItem(KEYS.REDEMPTIONS, redemptions);
    
    // 记录积分
    await this.addPointsRecord(childId, -reward.points_required, 'redemption', `兑换奖励：${reward.title}`);
    
    console.log('[LocalData] redeemReward 完成, 剩余积分:', newPoints);
    return { success: true, remainingPoints: newPoints };
  },

  // ---------- 抽奖相关 ----------
  
  async getLotteryItems(): Promise<LotteryItem[]> {
    return await getItem<LotteryItem[]>(KEYS.LOTTERY_ITEMS, DEFAULT_LOTTERY_ITEMS);
  },
  
  async createLotteryItem(item: Omit<LotteryItem, 'id' | 'probability'>): Promise<LotteryItem> {
    let items = await this.getLotteryItems();
    const newItem: LotteryItem = {
      ...item,
      id: generateNumericId(),
      probability: 0, // 先设为0，后续会自动计算
    };
    items.push(newItem);
    // 重新计算所有奖品的概率
    items = await recalculateLotteryProbabilities(items);
    await setItem(KEYS.LOTTERY_ITEMS, items);
    return items.find(i => i.id === newItem.id) || newItem;
  },
  
  async updateLotteryItem(itemId: number, updates: Partial<LotteryItem>): Promise<LotteryItem | null> {
    let items = await this.getLotteryItems();
    const index = items.findIndex(i => i.id === itemId);
    
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    // 如果更新了等级或状态，需要重新计算概率
    if (updates.tier !== undefined || updates.is_active !== undefined) {
      items = await recalculateLotteryProbabilities(items);
    }
    await setItem(KEYS.LOTTERY_ITEMS, items);
    return items[index];
  },
  
  async deleteLotteryItem(itemId: number): Promise<void> {
    let items = await this.getLotteryItems();
    const filtered = items.filter(i => i.id !== itemId);
    // 重新计算所有奖品的概率
    items = await recalculateLotteryProbabilities(filtered);
    await setItem(KEYS.LOTTERY_ITEMS, items);
  },
  
  async drawLottery(childId: string, cost: number = 50): Promise<{ success: boolean; item?: LotteryItem; remainingPoints?: number; error?: string }> {
    console.log('[LocalData] drawLottery 开始, childId:', childId, 'cost:', cost);
    const child = await this.getUserById(childId);
    
    console.log('[LocalData] 用户当前积分:', child?.points);
    
    if (!child) {
      return { success: false, error: '用户不存在' };
    }
    
    if (child.points < cost) {
      return { success: false, error: '积分不足' };
    }
    
    const items = await this.getLotteryItems();
    const activeItems = items.filter(i => i.is_active);
    
    // 按概率抽奖
    const random = Math.random();
    let cumulative = 0;
    let selectedItem: LotteryItem | null = null;
    
    for (const item of activeItems) {
      cumulative += item.probability;
      if (random < cumulative) {
        selectedItem = item;
        break;
      }
    }
    
    if (!selectedItem) {
      selectedItem = activeItems[0]; // 兜底
    }
    
    console.log('[LocalData] 抽中奖品:', selectedItem.title);
    
    // 扣除积分
    const newPoints = child.points - cost;
    console.log('[LocalData] 扣除后积分:', newPoints);
    await this.updateUser(childId, { points: newPoints });
    
    // 记录抽奖
    const draws = await getItem<LotteryDraw[]>(KEYS.LOTTERY_DRAWS, []);
    draws.push({
      id: generateNumericId(),
      child_id: childId,
      item_id: selectedItem.id,
      points_spent: cost,
      created_at: new Date().toISOString(),
    });
    await setItem(KEYS.LOTTERY_DRAWS, draws);
    
    // 记录积分
    await this.addPointsRecord(childId, -cost, 'lottery', `抽奖：${selectedItem.title}`);
    
    console.log('[LocalData] drawLottery 完成, 剩余积分:', newPoints);
    return { success: true, item: selectedItem, remainingPoints: newPoints };
  },

  // ---------- 积分记录相关 ----------
  
  async addPointsRecord(userId: string, points: number, type: PointsRecord['type'], description: string): Promise<void> {
    const records = await getItem<PointsRecord[]>(KEYS.POINTS_RECORDS, []);
    records.push({
      id: generateNumericId(),
      user_id: userId,
      points,
      type,
      description,
      created_at: new Date().toISOString(),
    });
    await setItem(KEYS.POINTS_RECORDS, records);
  },
  
  async getPointsRecords(userId: string, limit?: number): Promise<PointsRecord[]> {
    const records = await getItem<PointsRecord[]>(KEYS.POINTS_RECORDS, []);
    let filtered = records
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    if (limit) {
      filtered = filtered.slice(0, limit);
    }
    
    return filtered;
  },
  
  async getPointsSummary(userId: string): Promise<{
    currentPoints: number;
    streakDays: number;
    totalEarned: number;
    totalSpent: number;
    completedTasks: number;
  }> {
    const user = await this.getUserById(userId);
    const records = await this.getPointsRecords(userId);
    const dailyTasks = await getItem<DailyTask[]>(KEYS.DAILY_TASKS, []);
    
    const totalEarned = records
      .filter(r => r.points > 0)
      .reduce((sum, r) => sum + r.points, 0);
    
    const totalSpent = records
      .filter(r => r.points < 0)
      .reduce((sum, r) => sum + Math.abs(r.points), 0);
    
    const completedTasks = dailyTasks.filter(t => 
      t.child_id === userId && t.status === 'confirmed'
    ).length;
    
    return {
      currentPoints: user?.points || 0,
      streakDays: user?.streak_days || 0,
      totalEarned,
      totalSpent,
      completedTasks,
    };
  },

  // ---------- 统计相关 ----------
  
  async getChildStats(childId: string): Promise<{
    current_points: number;
    streak_days: number;
    last_check_date: string | null;
    total_earned: number;
    total_spent: number;
    completed_tasks: number;
  }> {
    const user = await this.getUserById(childId);
    const summary = await this.getPointsSummary(childId);
    const dailyTasks = await getItem<DailyTask[]>(KEYS.DAILY_TASKS, []);
    
    const lastConfirmed = dailyTasks
      .filter(t => t.child_id === childId && t.status === 'confirmed')
      .sort((a, b) => new Date(b.task_date).getTime() - new Date(a.task_date).getTime())[0];
    
    return {
      current_points: summary.currentPoints,
      streak_days: summary.streakDays,
      last_check_date: lastConfirmed?.task_date || null,
      total_earned: summary.totalEarned,
      total_spent: summary.totalSpent,
      completed_tasks: summary.completedTasks,
    };
  },
  
  async getChildTaskRecords(childId: string): Promise<DailyTask[]> {
    const tasks = await getItem<DailyTask[]>(KEYS.DAILY_TASKS, []);
    return tasks
      .filter(t => t.child_id === childId)
      .sort((a, b) => new Date(b.task_date).getTime() - new Date(a.task_date).getTime());
  },

  // ---------- 辅助方法 ----------
  
  async getTaskById(taskId: number): Promise<Task | null> {
    const tasks = await this.getTasks();
    return tasks.find(t => t.id === taskId) || null;
  },
  
  async getCustomTaskById(taskId: number): Promise<CustomTask | null> {
    const tasks = await this.getCustomTasks();
    return tasks.find(t => t.id === taskId) || null;
  },

  // ---------- 存款相关 ----------
  
  async getDepositBalance(): Promise<number> {
    const balance = await AsyncStorage.getItem(KEYS.DEPOSIT_BALANCE);
    return balance ? parseFloat(balance) : 0;
  },
  
  async setDepositBalance(balance: number): Promise<void> {
    await AsyncStorage.setItem(KEYS.DEPOSIT_BALANCE, String(balance));
  },
  
  async getDepositRecords(limit?: number): Promise<DepositRecord[]> {
    const records = await getItem<DepositRecord[]>(KEYS.DEPOSIT_RECORDS, []);
    let sorted = records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (limit) {
      sorted = sorted.slice(0, limit);
    }
    return sorted;
  },
  
  async addDepositRecord(amount: number, description: string): Promise<DepositRecord> {
    const currentBalance = await this.getDepositBalance();
    const newBalance = currentBalance + amount;
    await this.setDepositBalance(newBalance);
    
    const records = await getItem<DepositRecord[]>(KEYS.DEPOSIT_RECORDS, []);
    const newRecord: DepositRecord = {
      id: generateNumericId(),
      amount,
      balance: newBalance,
      description,
      created_at: new Date().toISOString(),
    };
    records.push(newRecord);
    await setItem(KEYS.DEPOSIT_RECORDS, records);
    
    return newRecord;
  },
  
  async getDepositSummary(): Promise<{
    balance: number;
    totalIn: number;
    totalOut: number;
  }> {
    const balance = await this.getDepositBalance();
    const records = await this.getDepositRecords();
    
    const totalIn = records
      .filter(r => r.amount > 0)
      .reduce((sum, r) => sum + r.amount, 0);
    
    const totalOut = records
      .filter(r => r.amount < 0)
      .reduce((sum, r) => sum + Math.abs(r.amount), 0);
    
    return { balance, totalIn, totalOut };
  },

  // ---------- 重置功能 ----------
  
  async resetAllData(): Promise<void> {
    console.log('[LocalData] 开始重置所有数据...');
    
    // 清除所有数据
    await AsyncStorage.multiRemove([
      KEYS.USERS,
      KEYS.TASKS,
      KEYS.CUSTOM_TASKS,
      KEYS.DAILY_TASKS,
      KEYS.REWARDS,
      KEYS.LOTTERY_ITEMS,
      KEYS.POINTS_RECORDS,
      KEYS.REDEMPTIONS,
      KEYS.LOTTERY_DRAWS,
      KEYS.DEPOSIT_BALANCE,
      KEYS.DEPOSIT_RECORDS,
      KEYS.PARENT_AUTHENTICATED,
    ]);
    
    // 重新初始化默认数据
    const parentId = generateId();
    const parentUser: User = {
      id: parentId,
      name: '家长',
      role: 'parent',
      points: 0,
      streak_days: 0,
      parent_password: '000000',
    };
    
    const childId = generateId();
    const childUser: User = {
      id: childId,
      name: '小朋友',
      role: 'child',
      points: 0,
      streak_days: 0,
      parent_id: parentId,
    };
    
    await setItem(KEYS.USERS, [parentUser, childUser]);
    await AsyncStorage.setItem(KEYS.CURRENT_USER_ID, childId);
    await AsyncStorage.setItem(KEYS.PARENT_ID, parentId);
    
    await setItem(KEYS.TASKS, DEFAULT_TASKS);
    await setItem(KEYS.REWARDS, DEFAULT_REWARDS);
    await setItem(KEYS.LOTTERY_ITEMS, DEFAULT_LOTTERY_ITEMS);
    await setItem(KEYS.CUSTOM_TASKS, []);
    await setItem(KEYS.DAILY_TASKS, []);
    await setItem(KEYS.POINTS_RECORDS, []);
    await setItem(KEYS.REDEMPTIONS, []);
    await setItem(KEYS.LOTTERY_DRAWS, []);
    await setItem(KEYS.DEPOSIT_RECORDS, []);
    await AsyncStorage.setItem(KEYS.DEPOSIT_BALANCE, '0');
    
    console.log('[LocalData] 重置完成!');
  },
};
