import { Router } from 'express';
import { getSupabaseClient } from '../storage/database';

const router = Router();

// 抽奖消耗积分（固定值）
const LOTTERY_COST = 50;

/**
 * 服务端文件：server/src/routes/lottery.ts
 * 接口：GET /api/v1/lottery/items
 * 功能：获取抽奖奖池
 */
router.get('/items', async (req, res) => {
  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('lottery_items')
      .select('*')
      .eq('is_active', true)
      .order('probability', { ascending: false });
    
    if (error) throw new Error(`查询奖池失败: ${error.message}`);
    
    res.json({ data, cost: LOTTERY_COST });
  } catch (err) {
    console.error('获取奖池失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/lottery.ts
 * 接口：POST /api/v1/lottery/draw
 * Body 参数：child_id: string
 * 功能：抽奖
 */
router.post('/draw', async (req, res) => {
  try {
    const { child_id } = req.body;
    
    if (!child_id) {
      return res.status(400).json({ error: '缺少孩子ID' });
    }
    
    const client = getSupabaseClient();
    
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
    
    if (user.points < LOTTERY_COST) {
      return res.status(400).json({ error: '积分不足' });
    }
    
    // 获取奖池
    const { data: items, error: itemsError } = await client
      .from('lottery_items')
      .select('*')
      .eq('is_active', true);
    
    if (itemsError) throw new Error(`查询奖池失败: ${itemsError.message}`);
    if (!items || items.length === 0) {
      return res.status(404).json({ error: '奖池为空' });
    }
    
    // 根据概率抽奖
    const random = Math.random();
    let cumulative = 0;
    let selectedItem = items[0];
    
    for (const item of items) {
      cumulative += parseFloat(item.probability as string);
      if (random < cumulative) {
        selectedItem = item;
        break;
      }
    }
    
    // 创建抽奖记录
    const { data: record, error: recordError } = await client
      .from('lottery_records')
      .insert({
        child_id,
        lottery_item_id: selectedItem.id,
        points_spent: LOTTERY_COST,
      })
      .select()
      .single();
    
    if (recordError) throw new Error(`创建抽奖记录失败: ${recordError.message}`);
    
    // 扣除积分
    await client
      .from('users')
      .update({
        points: user.points - LOTTERY_COST,
        updated_at: new Date().toISOString(),
      })
      .eq('id', child_id);
    
    // 记录积分流水
    await client
      .from('points_records')
      .insert({
        child_id,
        points: -LOTTERY_COST,
        type: 'lottery',
        related_id: record.id,
        description: `抽奖: ${selectedItem.title}`,
      });
    
    res.json({ 
      data: {
        item: selectedItem,
        remaining_points: user.points - LOTTERY_COST,
      }
    });
  } catch (err) {
    console.error('抽奖失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/lottery.ts
 * 接口：GET /api/v1/lottery/records/:childId
 * Path 参数：childId: string
 * 功能：获取抽奖记录
 */
router.get('/records/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('lottery_records')
      .select('*, lottery_items(*)')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw new Error(`查询抽奖记录失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('获取抽奖记录失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

export default router;
