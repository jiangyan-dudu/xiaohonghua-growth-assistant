import { Router } from 'express';
import { getSupabaseClient } from '../storage/database';

const router = Router();

/**
 * 服务端文件：server/src/routes/tasks.ts
 * 接口：GET /api/v1/tasks
 * Query 参数：category?: string
 * 功能：获取所有启用的预置任务
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const client = getSupabaseClient();
    
    let query = client
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    
    if (category) {
      query = query.eq('category', category as string);
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(`查询任务失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('获取任务列表失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/tasks.ts
 * 接口：GET /api/v1/tasks/daily/:childId
 * Path 参数：childId: string
 * 功能：获取今日随机任务（10次不重复）
 */
router.get('/daily/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    const client = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];
    
    // 1. 检查今天是否已有任务
    const { data: existingTask, error: existingError } = await client
      .from('daily_tasks')
      .select('*, tasks(*), custom_tasks(*)')
      .eq('child_id', childId)
      .eq('task_date', today)
      .maybeSingle();
    
    if (existingError) throw new Error(`查询今日任务失败: ${existingError.message}`);
    
    if (existingTask) {
      // 已有今日任务，直接返回
      return res.json({ data: existingTask });
    }
    
    // 2. 获取最近10次的任务ID（去重）
    const { data: recentHistory, error: historyError } = await client
      .from('task_history')
      .select('task_id')
      .eq('child_id', childId)
      .order('assigned_at', { ascending: false })
      .limit(10);
    
    if (historyError) throw new Error(`查询历史任务失败: ${historyError.message}`);
    
    const excludeIds = recentHistory?.map(h => h.task_id) || [];
    
    // 3. 获取所有启用的预置任务
    const { data: allTasks, error: tasksError } = await client
      .from('tasks')
      .select('*')
      .eq('is_active', true);
    
    if (tasksError) throw new Error(`查询任务库失败: ${tasksError.message}`);
    
    if (!allTasks || allTasks.length === 0) {
      return res.status(404).json({ error: '没有可用的任务' });
    }
    
    // 4. 过滤掉最近10次的任务
    let availableTasks = allTasks.filter(t => !excludeIds.includes(t.id));
    
    // 如果过滤后没有任务，重置为所有任务（避免无任务可领）
    if (availableTasks.length === 0) {
      availableTasks = allTasks;
    }
    
    // 5. 随机选择一个任务
    const randomIndex = Math.floor(Math.random() * availableTasks.length);
    const selectedTask = availableTasks[randomIndex];
    
    // 6. 创建今日任务记录
    const { data: newDailyTask, error: createError } = await client
      .from('daily_tasks')
      .insert({
        child_id: childId,
        task_id: selectedTask.id,
        task_date: today,
        status: 'pending',
        points: selectedTask.points,
      })
      .select()
      .single();
    
    if (createError) throw new Error(`创建今日任务失败: ${createError.message}`);
    
    // 7. 记录到任务历史
    await client
      .from('task_history')
      .insert({
        child_id: childId,
        task_id: selectedTask.id,
      });
    
    // 8. 返回完整任务信息
    res.json({ 
      data: {
        ...newDailyTask,
        tasks: selectedTask,
      }
    });
  } catch (err) {
    console.error('获取今日任务失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/tasks.ts
 * 接口：POST /api/v1/tasks/custom
 * Body 参数：child_id: string, title: string, points: number
 * 功能：申请自定义任务
 */
router.post('/custom', async (req, res) => {
  try {
    const { child_id, title, points } = req.body;
    
    if (!child_id || !title || !points) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('custom_tasks')
      .insert({
        child_id,
        title,
        points,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) throw new Error(`申请自定义任务失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('申请自定义任务失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/tasks.ts
 * 接口：GET /api/v1/tasks/custom/pending
 * Query 参数：parent_id: string
 * 功能：获取待审核的自定义任务
 */
router.get('/custom/pending', async (req, res) => {
  try {
    const { parent_id } = req.query;
    
    if (!parent_id) {
      return res.status(400).json({ error: '缺少家长ID' });
    }
    
    const client = getSupabaseClient();
    
    // 获取该家长下所有孩子
    const { data: children, error: childrenError } = await client
      .from('users')
      .select('id, name')
      .eq('parent_id', parent_id as string)
      .eq('role', 'child');
    
    if (childrenError) throw new Error(`查询孩子失败: ${childrenError.message}`);
    
    if (!children || children.length === 0) {
      return res.json({ data: [] });
    }
    
    const childIds = children.map(c => c.id);
    const childMap = new Map(children.map(c => [c.id, c.name]));
    
    // 获取待审核任务
    const { data: tasks, error: tasksError } = await client
      .from('custom_tasks')
      .select('*')
      .eq('status', 'pending')
      .in('child_id', childIds);
    
    if (tasksError) throw new Error(`查询待审核任务失败: ${tasksError.message}`);
    
    // 手动添加孩子名字
    const data = (tasks || []).map(task => ({
      ...task,
      users: { name: childMap.get(task.child_id) || '孩子' }
    }));
    
    res.json({ data });
  } catch (err) {
    console.error('获取待审核任务失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/tasks.ts
 * 接口：PUT /api/v1/tasks/custom/:id/review
 * Path 参数：id: number
 * Body 参数：status: 'approved' | 'rejected', reviewer_id: string, review_note?: string
 * 功能：审核自定义任务
 */
router.put('/custom/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewer_id, review_note } = req.body;
    
    if (!status || !reviewer_id) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '状态无效' });
    }
    
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('custom_tasks')
      .update({
        status,
        reviewer_id,
        review_note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) throw new Error(`审核任务失败: ${error.message}`);
    if (!data) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    res.json({ data });
  } catch (err) {
    console.error('审核任务失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/tasks.ts
 * 接口：POST /api/v1/tasks/daily/:id/complete
 * Path 参数：id: number
 * 功能：完成任务（孩子打卡）
 */
router.post('/daily/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    
    const { data: dailyTask, error: taskError } = await client
      .from('daily_tasks')
      .select('*')
      .eq('id', parseInt(id))
      .maybeSingle();
    
    if (taskError) throw new Error(`查询任务失败: ${taskError.message}`);
    if (!dailyTask) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    if (dailyTask.status === 'confirmed') {
      return res.status(400).json({ error: '任务已确认完成' });
    }
    
    // 更新任务状态为 completed
    const { data, error } = await client
      .from('daily_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) throw new Error(`完成任务失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('完成任务失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/tasks.ts
 * 接口：POST /api/v1/tasks/daily/:id/confirm
 * Path 参数：id: number
 * 功能：家长确认任务完成并发放积分
 */
router.post('/daily/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    
    // 查询任务
    const { data: dailyTask, error: taskError } = await client
      .from('daily_tasks')
      .select('*')
      .eq('id', parseInt(id))
      .maybeSingle();
    
    if (taskError) throw new Error(`查询任务失败: ${taskError.message}`);
    if (!dailyTask) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    if (dailyTask.status === 'confirmed') {
      return res.status(400).json({ error: '任务已确认完成' });
    }
    
    // 查询孩子信息
    const { data: child, error: childError } = await client
      .from('users')
      .select('id, points, streak_days, last_check_date')
      .eq('id', dailyTask.child_id)
      .maybeSingle();
    
    if (childError) throw new Error(`查询用户失败: ${childError.message}`);
    if (!child) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // 更新任务状态为 confirmed
    const { error: updateError } = await client
      .from('daily_tasks')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', parseInt(id));
    
    if (updateError) throw new Error(`确认任务失败: ${updateError.message}`);
    
    // 发放积分
    await client
      .from('points_records')
      .insert({
        child_id: child.id,
        points: dailyTask.points,
        type: 'task_reward',
        related_id: dailyTask.id,
        description: `完成任务: ${dailyTask.task_id ? '预置任务' : '自定义任务'}`,
      });
    
    // 更新用户积分
    const newPoints = child.points + dailyTask.points;
    
    // 检查连续打卡
    let newStreakDays = child.streak_days;
    const lastCheckDate = child.last_check_date ? child.last_check_date.split('T')[0] : null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (lastCheckDate === yesterday || lastCheckDate === today) {
      // 连续打卡或今天已打卡
      if (lastCheckDate !== today) {
        newStreakDays += 1;
      }
    } else {
      // 断签，重置
      newStreakDays = 1;
    }
    
    // 检查是否达到连续打卡里程碑
    const { data: milestones } = await client
      .from('streak_milestones')
      .select('*')
      .order('days', { ascending: true });
    
    let bonusPoints = 0;
    if (milestones) {
      for (const milestone of milestones) {
        if (newStreakDays === milestone.days) {
          bonusPoints = milestone.bonus_points;
          await client
            .from('points_records')
            .insert({
              child_id: child.id,
              points: bonusPoints,
              type: 'streak_bonus',
              description: `连续打卡${milestone.days}天奖励`,
            });
          break;
        }
      }
    }
    
    // 更新用户信息
    await client
      .from('users')
      .update({
        points: newPoints + bonusPoints,
        streak_days: newStreakDays,
        last_check_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('id', child.id);
    
    res.json({ 
      data: { 
        points_earned: dailyTask.points,
        bonus_points: bonusPoints,
        streak_days: newStreakDays,
      }
    });
  } catch (err) {
    console.error('确认任务失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/tasks.ts
 * 接口：GET /api/v1/tasks/history/:childId
 * Path 参数：childId: string
 * Query 参数：limit?: number
 * 功能：获取任务历史记录
 */
router.get('/history/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    const { limit = 30 } = req.query;
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('daily_tasks')
      .select('*, tasks(*), custom_tasks(*)')
      .eq('child_id', childId)
      .order('task_date', { ascending: false })
      .limit(parseInt(limit as string));
    
    if (error) throw new Error(`查询历史记录失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('获取历史记录失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

export default router;
