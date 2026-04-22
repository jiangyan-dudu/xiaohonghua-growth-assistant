import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    mainContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: Spacing["5xl"],
    },
    container: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing["2xl"],
    },
    // Tab 切换
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: '#EDE8FF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.xs,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing["2xl"],
      marginBottom: Spacing.md,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      borderRadius: BorderRadius.lg,
    },
    tabActive: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#7C5CFC',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    tabTextActive: {
      color: theme.primary,
    },
    // 区块标题
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: Spacing.lg,
    },
    // 奖励卡片
    rewardCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius["2xl"],
      padding: Spacing.xl,
      marginBottom: Spacing.md,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.7)',
      shadowColor: '#7C5CFC',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
    },
    rewardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    rewardIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.xl,
      backgroundColor: '#EDE8FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.7)',
    },
    rewardTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    rewardDescription: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textSecondary,
      marginTop: Spacing.sm,
      lineHeight: 20,
    },
    rewardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.lg,
    },
    rewardPoints: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rewardPointsText: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFCB57',
      marginLeft: Spacing.xs,
    },
    // 按钮
    primaryButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.3)',
      shadowColor: '#5A3ED9',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    disabledButton: {
      backgroundColor: theme.textMuted,
    },
    // 抽奖区域
    lotteryContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius["3xl"],
      padding: Spacing["2xl"],
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.7)',
      shadowColor: '#7C5CFC',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 8,
    },
    lotteryTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.textPrimary,
      marginTop: Spacing.lg,
    },
    lotteryDesc: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textSecondary,
      marginTop: Spacing.sm,
      textAlign: 'center',
    },
    lotteryButton: {
      backgroundColor: '#FF8FAB',
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing["3xl"],
      alignItems: 'center',
      marginTop: Spacing.xl,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.3)',
      shadowColor: '#FF6B8A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    lotteryButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '800',
    },
    lotteryCost: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    lotteryCostText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textSecondary,
      marginLeft: Spacing.xs,
    },
    // 奖池列表
    prizeList: {
      marginTop: Spacing.xl,
    },
    prizeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EDE8FF',
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    prizeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: Spacing.md,
    },
    prizeText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    prizeChance: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    // 档次标签
    tierSection: {
      marginBottom: Spacing.xl,
    },
    tierTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: Spacing.md,
    },
    tierLow: { color: '#10B981' },
    tierMedium: { color: '#F59E0B' },
    tierHigh: { color: '#7C5CFC' },
  });
};
