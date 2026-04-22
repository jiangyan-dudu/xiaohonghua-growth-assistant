import { Router } from 'express';
import { getSupabaseClient } from '../storage/database';

const router = Router();

/**
 * 服务端文件：server/src/routes/points.ts
 * 接口：GET /api/v1/points/:childId
 * Path 参数：childId: string
 * Query 参数：limit?: number
 * 功能：获取积分流水
 */
router.get('/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    const { limit = 50 } = req.query;
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('points_records')
      .select('*')
      .eq('child_id', childId)
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
 * 服务端文件：server/src/routes/points.ts
 * 接口：GET /api/v1/points/:childId/summary
 * Path 参数：childId: string
 * 功能：获取积分汇总
 */
router.get('/:childId/summary', async (req, res) => {
  try {
    const { childId } = req.params;
    const client = getSupabaseClient();
    
    // 获取用户信息
    const { data: user, error: userError } = await client
      .from('users')
      .select('points, streak_days, last_check_date')
      .eq('id', childId)
      .maybeSingle();
    
    if (userError) throw new Error(`查询用户失败: ${userError.message}`);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 获取总获得积分
    const { data: earnedRecords } = await client
      .from('points_records')
      .select('points')
      .eq('child_id', childId)
      .gt('points', 0);
    
    const totalEarned = earnedRecords?.reduce((sum, r) => sum + r.points, 0) || 0;
    
    // 获取总消耗积分
    const { data: spentRecords } = await client
      .from('points_records')
      .select('points')
      .eq('child_id', childId)
      .lt('points', 0);
    
    const totalSpent = Math.abs(spentRecords?.reduce((sum, r) => sum + r.points, 0) || 0);
    
    // 获取完成任务数
    const { count: completedTasks } = await client
      .from('daily_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
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
    console.error('获取积分汇总失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

export default router;
