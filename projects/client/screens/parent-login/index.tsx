import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, TextInput, Alert as RNAlert, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome6 } from '@expo/vector-icons';
import { createStyles } from './styles';
import { LocalDataService } from '@/services/localData';

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

export default function ParentLoginScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async () => {
    if (!password.trim()) {
      showAlert('提示', '请输入家长密码');
      return;
    }
    
    setLoading(true);
    try {
      const valid = await LocalDataService.verifyParentPassword(password);
      
      if (valid) {
        await LocalDataService.setParentAuthenticated(true);
        router.replace('/parent-dashboard');
      } else {
        showAlert('密码错误', '请输入正确的家长密码');
      }
    } catch (error) {
      console.error('验证失败:', error);
      showAlert('错误', '验证失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 4) {
      showAlert('提示', '密码至少需要4个字符');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showAlert('提示', '两次输入的密码不一致');
      return;
    }
    
    setLoading(true);
    try {
      const parent = await LocalDataService.getParent();
      if (parent) {
        await LocalDataService.updateUser(parent.id, { parent_password: newPassword });
        await LocalDataService.setParentAuthenticated(true);
        
        showAlert('设置成功', '家长密码已修改，请妥善保管', [
          { text: '确定', onPress: () => router.replace('/parent-dashboard') }
        ]);
      }
    } catch (error) {
      console.error('设置密码失败:', error);
      showAlert('错误', '设置失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <View style={styles.icon}>
            <FontAwesome6 name="user-shield" size={36} color={theme.primary} />
          </View>
        </View>

        <ThemedText style={styles.title}>家长入口</ThemedText>

        {!isFirstTime ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="请输入家长密码"
              placeholderTextColor={theme.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <ThemedText style={styles.primaryButtonText}>
                {loading ? '验证中...' : '进入管理'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setIsFirstTime(true)}
            >
              <ThemedText style={styles.secondaryButtonText}>修改密码</ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="设置新密码（至少4位）"
              placeholderTextColor={theme.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            
            <TextInput
              style={styles.input}
              placeholder="确认新密码"
              placeholderTextColor={theme.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleSetPassword}
              disabled={loading}
            >
              <ThemedText style={styles.primaryButtonText}>
                {loading ? '设置中...' : '设置密码'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setIsFirstTime(false)}
            >
              <ThemedText style={styles.secondaryButtonText}>返回登录</ThemedText>
            </TouchableOpacity>
          </>
        )}

        <ThemedText style={styles.hint}>
          默认密码：000000{'\n'}请及时修改密码，避免让孩子知晓
        </ThemedText>
      </View>
    </Screen>
  );
}
