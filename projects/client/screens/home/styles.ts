import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingBottom: Spacing["5xl"],
    },
    // Hero 区域
    hero: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius["4xl"],
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.md,
      paddingVertical: Spacing["3xl"],
      paddingHorizontal: Spacing.xl,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.25)',
      // 黏土阴影
      shadowColor: '#5A3ED9',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 10,
    },
    heroTitle: {
      color: '#FFCB57',
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: Spacing.sm,
    },
    heroTaskTitle: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: Spacing.sm,
    },
    heroPoints: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 14,
      fontWeight: '500',
      marginTop: Spacing.sm,
    },
    // 数据卡片区域
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.xl,
      gap: Spacing.md,
    },
    statCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius["2xl"],
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.7)',
      shadowColor: '#7C5CFC',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
    },
    statIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.xl,
      backgroundColor: '#EDE8FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.7)',
      shadowColor: '#7C5CFC',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
      marginTop: Spacing.xs,
    },
    // 任务卡片
    taskSection: {
      marginTop: Spacing.xl,
      paddingHorizontal: Spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: Spacing.lg,
    },
    taskCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius["2xl"],
      padding: Spacing.xl,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.7)',
      shadowColor: '#7C5CFC',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
    },
    taskHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    taskCategoryBadge: {
      backgroundColor: '#EDE8FF',
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      marginRight: Spacing.sm,
    },
    taskCategoryText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },
    taskStatusBadge: {
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
    },
    taskStatusPending: {
      backgroundColor: '#FFF4DD',
    },
    taskStatusCompleted: {
      backgroundColor: '#E0F8EC',
    },
    taskStatusConfirmed: {
      backgroundColor: '#E8E3F8',
    },
    taskStatusText: {
      fontSize: 12,
      fontWeight: '700',
    },
    taskTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    taskPoints: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    taskPointsText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFCB57',
      marginLeft: Spacing.xs,
    },
    // 按钮样式
    buttonContainer: {
      marginTop: Spacing.xl,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
    },
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
    },
    secondaryButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    // 空状态
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: Spacing["4xl"],
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textSecondary,
      marginTop: Spacing.lg,
    },
    // 加载中
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing["4xl"],
    },
  });
};
