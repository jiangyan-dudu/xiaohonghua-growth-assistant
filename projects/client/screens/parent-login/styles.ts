import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing["4xl"],
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: Spacing["2xl"],
    },
    // 输入框
    input: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      fontSize: 16,
      fontWeight: '500',
      color: theme.textPrimary,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.7)',
      shadowColor: '#7C5CFC',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      marginBottom: Spacing.lg,
    },
    // 按钮
    primaryButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing["2xl"],
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.3)',
      shadowColor: '#5A3ED9',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
      marginTop: Spacing.lg,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
    secondaryButton: {
      backgroundColor: '#EDE8FF',
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing["2xl"],
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.7)',
      shadowColor: '#7C5CFC',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 3,
      marginTop: Spacing.md,
    },
    secondaryButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    // 提示
    hint: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.xl,
    },
    // 图标
    iconContainer: {
      alignItems: 'center',
      marginBottom: Spacing["2xl"],
    },
    icon: {
      width: 80,
      height: 80,
      borderRadius: BorderRadius.full,
      backgroundColor: '#EDE8FF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.7)',
      shadowColor: '#7C5CFC',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 6,
    },
  });
};
