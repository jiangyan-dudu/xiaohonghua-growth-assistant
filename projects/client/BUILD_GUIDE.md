# 每天一朵小红花 - 本地单机版 APK 构建指南

## 📱 版本说明

本版本已改造为**完全本地运行的单机版**，所有数据存储在手机本地（AsyncStorage），无需后端服务器支持。

### 功能清单
- ✅ 每日任务领取与打卡
- ✅ 积分获取与消费
- ✅ 积分商城兑换
- ✅ 幸运抽奖
- ✅ 家长管理后台（任务审核、奖励管理、数据统计）
- ✅ 连续打卡奖励

---

## 🔧 构建前准备

### 1. 安装必要工具

```bash
# 安装 Node.js (如果没有的话，推荐 v18+)
# 下载地址: https://nodejs.org/

# 安装 EAS CLI（Expo 构建工具）
npm install -g eas-cli

# 登录 Expo 账号（没有的话需要先注册 https://expo.dev）
eas login
```

### 2. 下载项目代码

将项目下载到本地电脑。

---

## 📦 构建 APK

### 方法一：预览版 APK（推荐，构建快）

```bash
cd client

# 构建预览版 APK（约 5-10 分钟）
eas build -p android --profile preview
```

### 方法二：生产版 APK

```bash
cd client

# 构建生产版 APK（约 10-20 分钟）
eas build -p android --profile production
```

### 方法三：本地构建（需要 Android SDK）

如果你有 Android Studio 和完整的 Android SDK：

```bash
cd client

# 生成原生项目
npx expo prebuild --platform android

# 构建 APK
cd android
./gradlew assembleRelease
```

---

## 📲 安装 APK

构建完成后：

1. 在 Expo 控制台（https://expo.dev）查看构建状态
2. 构建成功后，下载 APK 文件
3. 将 APK 传输到手机
4. 在手机上安装（可能需要开启"允许安装未知来源应用"）

---

## 🔑 默认账号信息

- **家长密码**：`000000`
- 建议首次使用后在家长后台修改密码

---

## 📊 数据存储说明

- 所有数据存储在手机本地（AsyncStorage）
- 卸载应用会清除所有数据
- 数据不会上传到服务器，完全离线可用
- 建议定期在家长后台查看统计信息

---

## ⚠️ 注意事项

1. **构建时间**：云端构建需要 5-20 分钟，请耐心等待
2. **网络要求**：构建过程需要网络连接
3. **账号要求**：需要免费的 Expo 账号
4. **应用签名**：预览版使用 Expo 默认签名，仅用于测试

---

## 🐛 常见问题

### Q: 构建失败怎么办？
A: 
1. 检查网络连接
2. 确保 EAS CLI 版本最新：`npm install -g eas-cli@latest`
3. 查看详细错误日志

### Q: 安装后闪退？
A: 
1. 确保手机系统版本满足要求（Android 6.0+）
2. 清除应用数据后重试

### Q: 数据丢失了？
A: 
本版本数据完全存储在本地，卸载重装会清空数据。请谨慎操作。

---

## 📞 技术支持

如有问题，请联系开发者。
