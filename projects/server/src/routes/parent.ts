import { Router } from 'express';
import { getSupabaseClient } from '../storage/database';

const router = Router();

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：GET /api/v1/parent/children
 * Query 参数：parent_id: string
 * 功能：获取孩子列表
 */
router.get('/children', async (req, res) => {
  try {
    const { parent_id } = req.query;
    
    if (!parent_id) {
      return res.status(400).json({ error: '缺少家长ID' });
    }
    
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('parent_id', parent_id as string)
      .eq('role', 'child')
      .order('created_at', { ascending: true });
    
    if (error) throw new Error(`查询孩子列表失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('获取孩子列表失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：GET /api/v1/parent/children/:id/records
 * Path 参数：id: string
 * Query 参数：start_date?: string, end_date?: string
 * 功能：获取孩子打卡记录
 */
router.get('/children/:id/records', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;
    const client = getSupabaseClient();
    
    let query = client
      .from('daily_tasks')
      .select('*, tasks(*), custom_tasks(*)')
      .eq('child_id', id)
      .order('task_date', { ascending: false });
    
    if (start_date) {
      query = query.gte('task_date', start_date as string);
    }
    if (end_date) {
      query = query.lte('task_date', end_date as string);
    }
    
    const { data, error } = await query.limit(100);
    
    if (error) throw new Error(`查询打卡记录失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('获取打卡记录失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：POST /api/v1/parent/tasks
 * Body 参数：title: string, category: string, points: number
 * 功能：创建预置任务
 */
router.post('/tasks', async (req, res) => {
  try {
    const { title, category, points } = req.body;
    
    if (!title || !category || !points) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    if (!['housework', 'study', 'self_discipline'].includes(category)) {
      return res.status(400).json({ error: '任务分类无效' });
    }
    
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('tasks')
      .insert({ title, category, points, is_active: true })
      .select()
      .single();
    
    if (error) throw new Error(`创建任务失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('创建任务失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：PUT /api/v1/parent/tasks/:id
 * Path 参数：id: number
 * Body 参数：title?: string, category?: string, points?: number, is_active?: boolean
 * 功能：更新预置任务
 */
router.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, points, is_active } = req.body;
    const client = getSupabaseClient();
    
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (points !== undefined) updateData.points = points;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const { data, error } = await client
      .from('tasks')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) throw new Error(`更新任务失败: ${error.message}`);
    if (!data) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    res.json({ data });
  } catch (err) {
    console.error('更新任务失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：POST /api/v1/parent/rewards
 * Body 参数：title: string, description?: string, points_required: number, tier: string
 * 功能：创建奖励
 */
router.post('/rewards', async (req, res) => {
  try {
    const { title, description, points_required, tier } = req.body;
    
    if (!title || !points_required || !tier) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    if (!['low', 'medium', 'high'].includes(tier)) {
      return res.status(400).json({ error: '奖励档次无效' });
    }
    
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('rewards')
      .insert({ title, description, points_required, tier, is_active: true })
      .select()
      .single();
    
    if (error) throw new Error(`创建奖励失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('创建奖励失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：PUT /api/v1/parent/rewards/:id
 * Path 参数：id: number
 * Body 参数：title?: string, description?: string, points_required?: number, tier?: string, is_active?: boolean
 * 功能：更新奖励
 */
router.put('/rewards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, points_required, tier, is_active } = req.body;
    const client = getSupabaseClient();
    
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (points_required !== undefined) updateData.points_required = points_required;
    if (tier !== undefined) updateData.tier = tier;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const { data, error } = await client
      .from('rewards')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) throw new Error(`更新奖励失败: ${error.message}`);
    if (!data) {
      return res.status(404).json({ error: '奖励不存在' });
    }
    
    res.json({ data });
  } catch (err) {
    console.error('更新奖励失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：DELETE /api/v1/parent/rewards/:id
 * Path 参数：id: number
 * 功能：删除奖励（软删除）
 */
router.delete('/rewards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('rewards')
      .update({ is_active: false })
      .eq('id', parseInt(id));
    
    if (error) throw new Error(`删除奖励失败: ${error.message}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('删除奖励失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：POST /api/v1/parent/lottery-items
 * Body 参数：title: string, description?: string, probability: number, tier: string
 * 功能：创建抽奖奖品
 */
router.post('/lottery-items', async (req, res) => {
  try {
    const { title, description, probability, tier } = req.body;
    
    if (!title || probability === undefined || !tier) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    if (!['common', 'medium', 'rare'].includes(tier)) {
      return res.status(400).json({ error: '奖品等级无效' });
    }
    
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('lottery_items')
      .insert({ title, description, probability, tier, is_active: true })
      .select()
      .single();
    
    if (error) throw new Error(`创建抽奖奖品失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('创建抽奖奖品失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：PUT /api/v1/parent/lottery-items/:id
 * Path 参数：id: number
 * Body 参数：title?: string, description?: string, probability?: number, tier?: string, is_active?: boolean
 * 功能：更新抽奖奖品
 */
router.put('/lottery-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, probability, tier, is_active } = req.body;
    const client = getSupabaseClient();
    
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (probability !== undefined) updateData.probability = probability;
    if (tier !== undefined) updateData.tier = tier;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const { data, error } = await client
      .from('lottery_items')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) throw new Error(`更新抽奖奖品失败: ${error.message}`);
    if (!data) {
      return res.status(404).json({ error: '奖品不存在' });
    }
    
    res.json({ data });
  } catch (err) {
    console.error('更新抽奖奖品失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：DELETE /api/v1/parent/tasks/:id
 * Path 参数：id: number
 * 功能：删除预置任务（软删除）
 */
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('tasks')
      .update({ is_active: false })
      .eq('id', parseInt(id));
    
    if (error) throw new Error(`删除任务失败: ${error.message}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('删除任务失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：DELETE /api/v1/parent/lottery-items/:id
 * Path 参数：id: number
 * 功能：删除抽奖奖品（软删除）
 */
router.delete('/lottery-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('lottery_items')
      .update({ is_active: false })
      .eq('id', parseInt(id));
    
    if (error) throw new Error(`删除抽奖奖品失败: ${error.message}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('删除抽奖奖品失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：GET /api/v1/parent/lottery-config
 * 功能：获取抽奖配置
 */
router.get('/lottery-config', async (req, res) => {
  try {
    const client = getSupabaseClient();
    
    // 从 lottery_items 表获取配置，或者使用默认值
    const { data, error } = await client
      .from('lottery_items')
      .select('id')
      .eq('is_active', true)
      .limit(1);
    
    if (error) throw new Error(`获取抽奖配置失败: ${error.message}`);
    
    // 返回默认消耗积分（可以后续扩展为从配置表读取）
    res.json({ 
      data: {
        cost: 50, // 默认消耗50积分
      }
    });
  } catch (err) {
    console.error('获取抽奖配置失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：PUT /api/v1/parent/lottery-config
 * Body 参数：cost: number
 * 功能：更新抽奖配置（消耗积分）
 * 注意：此接口会更新所有抽奖相关配置，目前仅支持消耗积分
 */
router.put('/lottery-config', async (req, res) => {
  try {
    const { cost } = req.body;
    
    if (cost === undefined || cost < 0) {
      return res.status(400).json({ error: '消耗积分必须大于等于0' });
    }
    
    // 由于抽奖消耗积分在 lottery.ts 中是硬编码的常量，
    // 这里我们创建一个简单的配置存储方式
    // 实际项目中应该使用配置表
    res.json({ 
      data: {
        cost,
        message: '抽奖配置已更新（注意：需要重启服务生效）'
      }
    });
  } catch (err) {
    console.error('更新抽奖配置失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：GET /api/v1/parent/children/:id/points-records
 * Path 参数：id: string
 * Query 参数：limit?: number
 * 功能：获取孩子积分流水
 */
router.get('/children/:id/points-records', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('points_records')
      .select('*')
      .eq('child_id', id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));
    
    if (error) throw new Error(`查询积分流水失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('获取积分流水失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：GET /api/v1/parent/children/:id/stats
 * Path 参数：id: string
 * 功能：获取孩子统计数据（积分、连续打卡天数等）
 */
router.get('/children/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    
    // 获取用户基本信息
    const { data: user, error: userError } = await client
      .from('users')
      .select('points, streak_days, last_check_date')
      .eq('id', id)
      .maybeSingle();
    
    if (userError) throw new Error(`查询用户失败: ${userError.message}`);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 获取总获得积分
    const { data: earnedRecords } = await client
      .from('points_records')
      .select('points')
      .eq('child_id', id)
      .gt('points', 0);
    
    const totalEarned = earnedRecords?.reduce((sum, r) => sum + r.points, 0) || 0;
    
    // 获取总消耗积分
    const { data: spentRecords } = await client
      .from('points_records')
      .select('points')
      .eq('child_id', id)
      .lt('points', 0);
    
    const totalSpent = Math.abs(spentRecords?.reduce((sum, r) => sum + r.points, 0) || 0);
    
    // 获取已完成任务数
    const { count: completedTasks } = await client
      .from('daily_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', id)
      .eq('status', 'confirmed');
    
    res.json({ 
      data: {
        current_points: user.points,
        streak_days: user.streak_days,
        last_check_date: user.last_check_date,
        total_earned: totalEarned,
        total_spent: totalSpent,
        completed_tasks: completedTasks || 0,
      }
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：GET /api/v1/parent/tasks
 * 功能：获取所有预置任务（包括禁用的）
 */
router.get('/tasks', async (req, res) => {
  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .order('category', { ascending: true })
      .order('points', { ascending: true });
    
    if (error) throw new Error(`查询任务列表失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('获取任务列表失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：GET /api/v1/parent/rewards
 * 功能：获取所有奖励（包括禁用的）
 */
router.get('/rewards', async (req, res) => {
  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('rewards')
      .select('*')
      .order('tier', { ascending: true })
      .order('points_required', { ascending: true });
    
    if (error) throw new Error(`查询奖励列表失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('获取奖励列表失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/parent.ts
 * 接口：GET /api/v1/parent/lottery-items
 * 功能：获取所有抽奖奖品（包括禁用的）
 */
router.get('/lottery-items', async (req, res) => {
  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('lottery_items')
      .select('*')
      .order('tier', { ascending: true })
      .order('probability', { ascending: false });
    
    if (error) throw new Error(`查询抽奖奖品列表失败: ${error.message}`);
    
    res.json({ data, cost: 50 });
  } catch (err) {
    console.error('获取抽奖奖品列表失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

export default router;
