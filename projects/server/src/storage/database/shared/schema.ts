import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, numeric, index, serial } from "drizzle-orm/pg-core";

// 保留系统表（禁止删除）
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户表（区分儿童和家长）
export const users = pgTable(
	"users",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 128 }).notNull(),
		role: varchar("role", { length: 20 }).notNull().default('child'), // child | parent
		parent_id: varchar("parent_id", { length: 36 }),
		points: integer("points").notNull().default(0),
		streak_days: integer("streak_days").notNull().default(0),
		last_check_date: timestamp("last_check_date", { withTimezone: true }),
		parent_password: varchar("parent_password", { length: 128 }), // 家长管理密码
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("users_parent_id_idx").on(table.parent_id),
		index("users_role_idx").on(table.role),
	]
);

// 预置任务库表
export const tasks = pgTable(
	"tasks",
	{
		id: serial().primaryKey(),
		title: varchar("title", { length: 256 }).notNull(),
		category: varchar("category", { length: 50 }).notNull(), // housework | study | self_discipline
		points: integer("points").notNull(),
		is_active: boolean("is_active").notNull().default(true),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("tasks_category_idx").on(table.category),
		index("tasks_is_active_idx").on(table.is_active),
	]
);

// 自定义任务表（孩子申请，家长审核）
export const customTasks = pgTable(
	"custom_tasks",
	{
		id: serial().primaryKey(),
		child_id: varchar("child_id", { length: 36 }).notNull().references(() => users.id),
		title: varchar("title", { length: 256 }).notNull(),
		points: integer("points").notNull(),
		status: varchar("status", { length: 20 }).notNull().default('pending'), // pending | approved | rejected
		reviewer_id: varchar("reviewer_id", { length: 36 }).references(() => users.id),
		review_note: text("review_note"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("custom_tasks_child_id_idx").on(table.child_id),
		index("custom_tasks_status_idx").on(table.status),
	]
);

// 每日任务记录表
export const dailyTasks = pgTable(
	"daily_tasks",
	{
		id: serial().primaryKey(),
		child_id: varchar("child_id", { length: 36 }).notNull().references(() => users.id),
		task_id: integer("task_id").references(() => tasks.id),
		custom_task_id: integer("custom_task_id").references(() => customTasks.id),
		task_date: timestamp("task_date", { withTimezone: true }).notNull(),
		status: varchar("status", { length: 20 }).notNull().default('pending'), // pending | completed | confirmed
		points: integer("points").notNull(),
		completed_at: timestamp("completed_at", { withTimezone: true }),
		confirmed_at: timestamp("confirmed_at", { withTimezone: true }),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("daily_tasks_child_id_idx").on(table.child_id),
		index("daily_tasks_task_date_idx").on(table.task_date),
		index("daily_tasks_status_idx").on(table.status),
	]
);

// 积分流水表
export const pointsRecords = pgTable(
	"points_records",
	{
		id: serial().primaryKey(),
		child_id: varchar("child_id", { length: 36 }).notNull().references(() => users.id),
		points: integer("points").notNull(), // 正数为获得，负数为消耗
		type: varchar("type", { length: 50 }).notNull(), // task_reward | streak_bonus | redemption | lottery
		related_id: integer("related_id"),
		description: text("description"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("points_records_child_id_idx").on(table.child_id),
		index("points_records_created_at_idx").on(table.created_at),
	]
);

// 奖励商城表（直兑）
export const rewards = pgTable(
	"rewards",
	{
		id: serial().primaryKey(),
		title: varchar("title", { length: 256 }).notNull(),
		description: text("description"),
		points_required: integer("points_required").notNull(),
		tier: varchar("tier", { length: 20 }).notNull(), // low | medium | high
		is_active: boolean("is_active").notNull().default(true),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("rewards_tier_idx").on(table.tier),
		index("rewards_is_active_idx").on(table.is_active),
	]
);

// 抽奖奖池表
export const lotteryItems = pgTable(
	"lottery_items",
	{
		id: serial().primaryKey(),
		title: varchar("title", { length: 256 }).notNull(),
		description: text("description"),
		probability: numeric("probability", { precision: 5, scale: 4 }).notNull(), // 0.0001 - 1.0000
		tier: varchar("tier", { length: 20 }).notNull(), // common | medium | rare
		is_active: boolean("is_active").notNull().default(true),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("lottery_items_tier_idx").on(table.tier),
		index("lottery_items_is_active_idx").on(table.is_active),
	]
);

// 兑换记录表
export const redemptions = pgTable(
	"redemptions",
	{
		id: serial().primaryKey(),
		child_id: varchar("child_id", { length: 36 }).notNull().references(() => users.id),
		reward_id: integer("reward_id").notNull().references(() => rewards.id),
		points_spent: integer("points_spent").notNull(),
		status: varchar("status", { length: 20 }).notNull().default('pending'), // pending | fulfilled
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("redemptions_child_id_idx").on(table.child_id),
		index("redemptions_status_idx").on(table.status),
	]
);

// 抽奖记录表
export const lotteryRecords = pgTable(
	"lottery_records",
	{
		id: serial().primaryKey(),
		child_id: varchar("child_id", { length: 36 }).notNull().references(() => users.id),
		lottery_item_id: integer("lottery_item_id").notNull().references(() => lotteryItems.id),
		points_spent: integer("points_spent").notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("lottery_records_child_id_idx").on(table.child_id),
		index("lottery_records_created_at_idx").on(table.created_at),
	]
);

// 任务历史记录（用于实现连续10次不重复）
export const taskHistory = pgTable(
	"task_history",
	{
		id: serial().primaryKey(),
		child_id: varchar("child_id", { length: 36 }).notNull().references(() => users.id),
		task_id: integer("task_id").notNull().references(() => tasks.id),
		assigned_at: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("task_history_child_id_idx").on(table.child_id),
		index("task_history_assigned_at_idx").on(table.assigned_at),
	]
);

// 连续打卡里程碑配置表
export const streakMilestones = pgTable(
	"streak_milestones",
	{
		id: serial().primaryKey(),
		days: integer("days").notNull(),
		bonus_points: integer("bonus_points").notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	}
);
