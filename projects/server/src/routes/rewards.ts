import { Router } from 'express';
import { getSupabaseClient } from '../storage/database';

const router = Router();

/**
 * 服务端文件：server/src/routes/rewards.ts
 * 接口：GET /api/v1/rewards
 * Query 参数：tier?: string
 * 功能：获取奖励商城列表
 */
router.get('/', async (req, res) => {
  try {
    const { tier } = req.query;
    const client = getSupabaseClient();
    
    let query = client
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .order('points_required', { ascending: true });
    
    if (tier) {
      query = query.eq('tier', tier as string);
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(`查询奖励失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('获取奖励列表失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/rewards.ts
 * 接口：POST /api/v1/rewards/:id/redeem
 * Path 参数：id: number
 * Body 参数：child_id: string
 * 功能：兑换奖励
 */
router.post('/:id/redeem', async (req, res) => {
  try {
    const { id } = req.params;
    const { child_id } = req.body;
    
    if (!child_id) {
      return res.status(400).json({ error: '缺少孩子ID' });
    }
    
    const client = getSupabaseClient();
    
    // 获取奖励信息
    const { data: reward, error: rewardError } = await client
      .from('rewards')
      .select('*')
      .eq('id', parseInt(id))
      .eq('is_active', true)
      .maybeSingle();
    
    if (rewardError) throw new Error(`查询奖励失败: ${rewardError.message}`);
    if (!reward) {
      return res.status(404).json({ error: '奖励不存在或已下架' });
    }
    
    // 获取用户积分
    const { data: user, error: userError } = await client
      .from('users')
      .select('points')
      .eq('id', child_id)
      .maybeSingle();
    
    if (userError) throw new Error(`查询用户失败: ${userError.message}`);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    if (user.points < reward.points_required) {
      return res.status(400).json({ error: '积分不足' });
    }
    
    // 创建兑换记录
    const { data: redemption, error: redemptionError } = await client
      .from('redemptions')
      .insert({
        child_id,
        reward_id: reward.id,
        points_spent: reward.points_required,
        status: 'pending',
      })
      .select()
      .single();
    
    if (redemptionError) throw new Error(`创建兑换记录失败: ${redemptionError.message}`);
    
    // 扣除积分
    await client
      .from('users')
      .update({
        points: user.points - reward.points_required,
        updated_at: new Date().toISOString(),
      })
      .eq('id', child_id);
    
    // 记录积分流水
    await client
      .from('points_records')
      .insert({
        child_id,
        points: -reward.points_required,
        type: 'redemption',
        related_id: redemption.id,
        description: `兑换奖励: ${reward.title}`,
      });
    
    res.json({ 
      data: {
        redemption,
        remaining_points: user.points - reward.points_required,
      }
    });
  } catch (err) {
    console.error('兑换奖励失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/rewards.ts
 * 接口：GET /api/v1/rewards/redemptions/:childId
 * Path 参数：childId: string
 * 功能：获取兑换记录
 */
router.get('/redemptions/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('redemptions')
      .select('*, rewards(*)')
      .eq('child_id', childId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`查询兑换记录失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('获取兑换记录失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

export default router;
