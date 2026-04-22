import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingBottom: Spacing["5xl"],
    },
    container: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing["2xl"],
    },
    section: {
      marginBottom: Spacing["2xl"],
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: Spacing.lg,
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
      marginBottom: Spacing.md,
    },
    inputRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    inputHalf: {
      flex: 1,
    },
    // 卡片
    card: {
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
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
      flex: 1,
    },
    cardBadge: {
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
    },
    badgePending: {
      backgroundColor: '#FFF4DD',
    },
    badgeApproved: {
      backgroundColor: '#E0F8EC',
    },
    badgeRejected: {
      backgroundColor: '#FFE8EE',
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    cardInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    cardPoints: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFCB57',
      marginLeft: Spacing.xs,
    },
    cardDate: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textSecondary,
      marginLeft: 'auto',
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
      marginTop: Spacing.md,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
    // Tab 切换 - 固定在顶部
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: '#EDE8FF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.xs,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.md,
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
    // 选择器按钮
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      borderWidth: 1.5,
      borderColor: theme.primary,
      marginBottom: Spacing.lg,
      gap: Spacing.md,
    },
    pickerButtonText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: theme.primary,
    },
    // 分割线
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    dividerText: {
      marginHorizontal: Spacing.md,
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    // Modal
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      borderTopLeftRadius: BorderRadius["2xl"],
      borderTopRightRadius: BorderRadius["2xl"],
      maxHeight: '80%',
      paddingBottom: Spacing["3xl"],
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    // 分类筛选
    categoryFilter: {
      flexDirection: 'row',
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    categoryTab: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.lg,
      backgroundColor: '#EDE8FF',
    },
    categoryTabActive: {
      backgroundColor: theme.primary,
    },
    categoryTabText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.primary,
    },
    categoryTabTextActive: {
      color: '#FFFFFF',
    },
    // 任务列表
    taskList: {
      paddingHorizontal: Spacing.lg,
    },
    presetTaskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.7)',
    },
    presetTaskInfo: {
      flex: 1,
    },
    presetTaskTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
    },
    presetTaskMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    presetTaskPoints: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    presetTaskPointsText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFCB57',
    },
    // 分类徽章
    categoryBadge: {
      borderRadius: BorderRadius.md,
      paddingVertical: 2,
      paddingHorizontal: Spacing.sm,
    },
    categoryHousework: {
      backgroundColor: '#FFF4DD',
    },
    categoryStudy: {
      backgroundColor: '#E0F8EC',
    },
    categorySelfDiscipline: {
      backgroundColor: '#EDE8FF',
    },
    categoryBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    // 查看更多按钮
    loadMoreButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    loadMoreText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
};
