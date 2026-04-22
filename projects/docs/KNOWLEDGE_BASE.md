# 《每天一朵小红花》项目知识集

> 本文档专注于常见问题与解决方案，帮助快速定位和解决问题

---

## 一、🔥 常见问题与解决方案

### 1.1 Web端 Alert 弹窗兼容性

**问题**：Web端使用 `Alert.alert()` 无效或报错

**原因**：`Alert.alert` 是 React Native 原生组件，在 Web 端不可用

**解决方案**：使用 `Platform.OS === 'web'` 判断，Web端使用 `window.confirm()`

```typescript
import { Alert as RNAlert, Platform } from 'react-native';

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
```

**⚠️ 注意**：
- `window.confirm()` 只支持确定/取消两个按钮
- 按钮逻辑需要手动处理：confirmed=true 执行第二个按钮，confirmed=false 执行第一个按钮
- 按钮数组第一个是取消按钮，第二个是确定按钮

**已应用页面**（所有页面都使用此模式）：
- home/index.tsx
- tasks/index.tsx
- rewards/index.tsx
- profile/index.tsx
- parent-login/index.tsx
- parent-dashboard/index.tsx

---

### 1.2 Tab切换后滚动位置不重置

**问题**：切换Tab后再回来，滚动位置没有回到顶部

**原因**：页面使用了 ScrollView/FlatList，但未在 Tab 切换时重置滚动位置

**解决方案**：使用 `useRef` 获取滚动组件引用，在 `useFocusEffect` 中重置

```typescript
import { useRef } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';

const scrollRef = useRef<ScrollView>(null);

useFocusEffect(
  useCallback(() => {
    // 切换回来时重置滚动位置
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [])
);
```

**已应用场景**：
- 家长后台 - 内容管理Tab（切换后滚动回到顶部）
- 任务页 - 历史记录Tab

---

### 1.3 页面数据不刷新（useEffect不触发）

**问题**：从其他页面返回后，数据没有更新

**原因**：`useEffect` 在 Expo Router 中只在组件首次挂载时执行，页面返回时组件保留在栈中不卸载

**解决方案**：使用 `useFocusEffect` 替代 `useEffect`

```typescript
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

useFocusEffect(
  useCallback(() => {
    loadData();
    return () => {
      // 清理函数（可选）
    };
  }, [依赖项])
);
```

**⚠️ 注意**：
- 必须使用 `useCallback` 包装回调函数
- 依赖数组要包含所有需要监听的值
- 不要在回调中直接调用未声明的函数，应在回调内部定义或添加为依赖

**已应用页面**：
- home/index.tsx
- tasks/index.tsx
- rewards/index.tsx
- profile/index.tsx
- parent-dashboard/index.tsx

---

### 1.4 数据预置修改不生效

**问题**：修改了 `localData.ts` 中的 `DEFAULT_TASKS`、`DEFAULT_REWARDS` 等预置数据，但APP显示的还是旧数据

**原因**：数据版本号 `DATA_VERSION` 未更新，APP 检测到版本一致就直接读取缓存数据

**解决方案**：
1. 修改 `client/services/localData.ts` 中的 `DATA_VERSION`
2. 重新启动 APP（清除 AsyncStorage 缓存）
3. 或者调用 `LocalDataService.resetAllData()` 重置

```typescript
// client/services/localData.ts
const DATA_VERSION = '6';  // 改为 '7' 即可触发重新初始化
```

**⚠️ 注意**：
- 修改预置数据后必须更新版本号
- 版本号可以是任意字符串，只需与上次不同

---

### 1.5 Tab固定在页面顶部（不随内容滚动）

**问题**：页面内的顶部Tab（分类切换）会随内容一起滚动，用户看不到

**解决方案**：将 Tab 组件放在 ScrollView 外部，使用独立容器

```typescript
// ❌ 错误：Tab 在 ScrollView 内部
<ScrollView>
  <View style={styles.tabs}>  {/* Tab会随滚动消失 */}
    <Tab1 />
    <Tab2 />
  </View>
  <Content />
</ScrollView>

// ✅ 正确：Tab 在 ScrollView 外部
<View style={styles.container}>
  <View style={styles.tabs}>  {/* Tab固定在顶部 */}
    <Tab1 />
    <Tab2 />
  </View>
  <ScrollView>
    <Content />
  </ScrollView>
</View>
```

**已应用场景**：
- 任务页（申请任务/历史记录）
- 奖励页（商城/抽奖）
- 我的页（积分明细/收支明细）
- 家长后台（任务审核/完成确认/内容管理/数据统计）

---

### 1.6 Tab切换后内容保持但状态错误

**问题**：Tab 切换后，内容虽然显示了，但状态没有重置（如列表没有清空、分页计数错误）

**解决方案**：在 `useFocusEffect` 中根据当前 Tab 状态加载对应数据

```typescript
useFocusEffect(
  useCallback(() => {
    if (activeTab === 'history') {
      setHistoryLimit(5);  // 重置分页
      loadHistory();
    } else {
      loadData();
    }
  }, [activeTab])  // 依赖 activeTab
);
```

---

### 1.7 列表分页不生效

**问题**：点击"查看更多"后，新数据没有追加到列表

**原因**：没有正确使用 `setList(prev => [...prev, ...newItems])` 模式

**解决方案**：
```typescript
const [list, setList] = useState([]);
const [limit, setLimit] = useState(5);

const loadMore = () => {
  const newLimit = limit + 5;
  setLimit(newLimit);
  // 重新加载，带新的limit参数
  loadData(newLimit);
};

const loadData = async (currentLimit: number) => {
  const allData = await fetchData();
  setList(allData.slice(0, currentLimit));
};
```

---

### 1.8 Hook 在循环中调用报错

**问题**：FlatList 的 renderItem 中调用 Hook 报错：`Rendered more hooks than during the previous render`

**原因**：列表数据长度变化时，Hook 调用次数也随之变化，违反 React Hooks 固定调用顺序规则

**解决方案**：将渲染逻辑抽离为独立的 React 组件，定义在文件顶层

```typescript
// ✅ 正确：CardItem 是独立组件，定义在父组件外部
function CardItem({ item, onPress }) {
  const animatedStyle = useAnimatedStyle(() => ({...}));
  return <TouchableOpacity onPress={onPress}><Text>{item.title}</Text></TouchableOpacity>;
}

// 父组件
export default function Page() {
  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <CardItem item={item} onPress={() => {}} />}
    />
  );
}

// ❌ 错误：在 renderItem 中直接调用 Hook
renderItem={({ item }) => {
  const [state, setState] = useState(false);  // 报错
  return <View />;
}}
```

---

### 1.9 Storage 异步问题

**问题**：数据读取后发现是 `null` 或默认值

**原因**：AsyncStorage 是异步操作，有时序问题

**解决方案**：
1. 使用 `async/await` 确保操作完成
2. 在数据加载完成前显示 loading 状态
3. 使用 `initialize()` 方法确保数据结构完整

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  const init = async () => {
    setLoading(true);
    await LocalDataService.initialize();
    const data = await LocalDataService.getData();
    setData(data);
    setLoading(false);
  };
  init();
}, []);
```

---

### 1.10 Platform.OS 判断逻辑

**问题**：某些平台特定代码在错误的平台上执行

**常用判断**：
```typescript
import { Platform } from 'react-native';

// 方法1：直接判断
if (Platform.OS === 'web') { ... }
if (Platform.OS === 'ios') { ... }
if (Platform.OS === 'android') { ... }

// 方法2：判断是否为移动端
const isMobile = Platform.OS !== 'web';

// 方法3：条件样式
const tabBarHeight = Platform.select({
  ios: 50 + insets.bottom,
  android: 50 + insets.bottom,
  web: 60,
});
```

---

## 二、🔥 问题描述标准用语

### 2.1 页面术语

| 我会说的 | 对应文件路径 |
|----------|--------------|
| "首页" | client/screens/home/index.tsx |
| "任务页" | client/screens/tasks/index.tsx |
| "奖励页" | client/screens/rewards/index.tsx |
| "我的页面" | client/screens/profile/index.tsx |
| "家长后台" | client/screens/parent-dashboard/index.tsx |
| "家长登录页" | client/screens/parent-login/index.tsx |

### 2.2 组件术语

| 我会说的 | 含义 |
|----------|------|
| "顶部Tab" | 页面内的分类切换（如奖励页的商城/抽奖） |
| "底部Tab" | 底部导航栏 |
| "弹窗" | Modal组件 |
| "卡片" | 带圆角和阴影的容器 |
| "Hero区域" | 首页的今日任务展示区 |
| "数据卡片" | 显示积分、打卡天数的统计卡片 |

### 2.3 功能术语

| 我会说的 | 含义 |
|----------|------|
| "打卡" | 完成每日任务并等待家长确认 |
| "领取任务" | 从首页领取内置任务（每日1个） |
| "申请任务" | 在任务页申请自定义任务（每日最多10个） |
| "兑换奖励" | 用积分换取奖励 |
| "抽奖" | 消耗50积分进行抽奖 |
| "存款" | 将积分存入虚拟银行 |
| "预置数据" | DEFAULT_TASKS/DEFAULT_REWARDS 等默认数据 |
| "数据版本" | DATA_VERSION，用于触发数据重新初始化 |

### 2.4 问题描述模板

```
【页面名称】
【问题现象】
【期望行为】

示例1：
【奖励页】
点击兑换按钮没有反应
期望弹出确认弹窗

示例2：
【任务页】
历史记录没有分页，每次加载全部数据
期望默认显示5条，点击查看更多再加载5条

示例3：
【家长后台】
存款明细金额超过50元会换行显示
期望金额不换行，用省略号或缩小字体处理

示例4：
【首页】
修改了 DEFAULT_TASKS 中的任务，但APP显示还是旧数据
期望更新数据版本号后自动加载新数据
```

---

## 三、快速参考

### 3.1 修改预置数据
编辑 `client/services/localData.ts` 中的：
- `DEFAULT_TASKS` - 内置任务（28个）
- `DEFAULT_REWARDS` - 奖励列表（13个）
- `DEFAULT_LOTTERY_ITEMS` - 抽奖奖品（8个）
- ⚠️ **修改后记得更新 `DATA_VERSION`**

### 3.2 修改UI样式
编辑 `client/constants/theme.ts`

### 3.3 添加新页面
1. 在 `client/screens/` 创建目录和 `index.tsx`
2. 在 `client/app/(tabs)/` 或 `client/app/` 创建路由文件
3. 在对应的 `_layout.tsx` 添加 Screen 配置

### 3.4 重置所有数据
家长后台 → 数据统计 → 回到初始状态

---

*本文档用于快速定位和解决问题，详细的需求和设计说明请查看 `PRODUCT_SPEC.md`*
