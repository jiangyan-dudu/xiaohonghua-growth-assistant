import { Router } from 'express';
import { getSupabaseClient } from '../storage/database';

const router = Router();

/**
 * 服务端文件：server/src/routes/users.ts
 * 接口：GET /api/v1/users/:id
 * Path 参数：id: string
 * 功能：获取用户信息
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw new Error(`查询用户失败: ${error.message}`);
    if (!data) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ data });
  } catch (err) {
    console.error('获取用户失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/users.ts
 * 接口：POST /api/v1/users
 * Body 参数：name: string, role: 'child' | 'parent', parent_id?: string, parent_password?: string
 * 功能：创建用户
 */
router.post('/', async (req, res) => {
  try {
    const { name, role, parent_id, parent_password } = req.body;
    
    if (!name || !role) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    if (!['child', 'parent'].includes(role)) {
      return res.status(400).json({ error: '角色类型无效' });
    }
    
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('users')
      .insert({
        name,
        role,
        parent_id: role === 'child' ? parent_id : null,
        parent_password: role === 'parent' ? parent_password : null,
        points: 0,
        streak_days: 0,
      })
      .select()
      .single();
    
    if (error) throw new Error(`创建用户失败: ${error.message}`);
    
    res.json({ data });
  } catch (err) {
    console.error('创建用户失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/users.ts
 * 接口：PUT /api/v1/users/:id
 * Path 参数：id: string
 * Body 参数：name?: string, parent_password?: string
 * 功能：更新用户信息
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_password } = req.body;
    
    const client = getSupabaseClient();
    
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (parent_password) updateData.parent_password = parent_password;
    
    const { data, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`更新用户失败: ${error.message}`);
    if (!data) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ data });
  } catch (err) {
    console.error('更新用户失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

/**
 * 服务端文件：server/src/routes/users.ts
 * 接口：POST /api/v1/users/verify-parent
 * Body 参数：child_id: string, password: string
 * 功能：验证家长密码
 */
router.post('/verify-parent', async (req, res) => {
  try {
    const { child_id, password } = req.body;
    
    if (!child_id || !password) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const client = getSupabaseClient();
    
    // 获取孩子的家长信息
    const { data: child, error: childError } = await client
      .from('users')
      .select('parent_id')
      .eq('id', child_id)
      .maybeSingle();
    
    if (childError) throw new Error(`查询孩子失败: ${childError.message}`);
    if (!child || !child.parent_id) {
      return res.status(404).json({ error: '未找到家长信息' });
    }
    
    // 验证家长密码
    const { data: parent, error: parentError } = await client
      .from('users')
      .select('parent_password')
      .eq('id', child.parent_id)
      .maybeSingle();
    
    if (parentError) throw new Error(`查询家长失败: ${parentError.message}`);
    if (!parent) {
      return res.status(404).json({ error: '家长不存在' });
    }
    
    const isValid = parent.parent_password === password;
    
    res.json({ valid: isValid });
  } catch (err) {
    console.error('验证家长密码失败:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '服务器错误' });
  }
});

export default router;
