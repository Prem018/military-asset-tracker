import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("logistics_officer"), // admin, base_commander, logistics_officer
  baseId: integer("base_id"), // null for admin, specific base for commanders
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Military bases
export const bases = pgTable("bases", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  location: varchar("location"),
  commanderId: varchar("commander_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Equipment types/categories
export const equipmentTypes = pgTable("equipment_types", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // vehicles, weapons, ammunition, communications
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual assets/equipment items
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // M4A1 Carbine, HMMWV, etc.
  equipmentTypeId: integer("equipment_type_id").notNull(),
  serialNumber: varchar("serial_number"),
  baseId: integer("base_id").notNull(),
  status: varchar("status").notNull().default("available"), // available, assigned, expended, transferred
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase records
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  equipmentTypeId: integer("equipment_type_id").notNull(),
  itemName: varchar("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  baseId: integer("base_id").notNull(),
  purchaseOrderNumber: varchar("purchase_order_number"),
  purchaseDate: timestamp("purchase_date").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transfer records
export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  transferNumber: varchar("transfer_number").notNull(),
  equipmentTypeId: integer("equipment_type_id").notNull(),
  itemName: varchar("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  fromBaseId: integer("from_base_id").notNull(),
  toBaseId: integer("to_base_id").notNull(),
  transferDate: timestamp("transfer_date").notNull(),
  reason: text("reason"),
  status: varchar("status").notNull().default("pending"), // pending, in_transit, completed, cancelled
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Personnel assignments
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  personnelId: varchar("personnel_id").notNull(),
  personnelName: varchar("personnel_name").notNull(),
  assetId: integer("asset_id"),
  equipmentTypeId: integer("equipment_type_id").notNull(),
  itemName: varchar("item_name").notNull(),
  serialNumber: varchar("serial_number"),
  baseId: integer("base_id").notNull(),
  assignmentDate: timestamp("assignment_date").notNull(),
  expectedReturnDate: timestamp("expected_return_date"),
  actualReturnDate: timestamp("actual_return_date"),
  status: varchar("status").notNull().default("active"), // active, returned, overdue
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenditure records
export const expenditures = pgTable("expenditures", {
  id: serial("id").primaryKey(),
  equipmentTypeId: integer("equipment_type_id").notNull(),
  itemName: varchar("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  baseId: integer("base_id").notNull(),
  reason: text("reason").notNull(),
  expenditureDate: timestamp("expenditure_date").notNull(),
  authorizedBy: varchar("authorized_by").notNull(),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit log for all transactions
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  action: varchar("action").notNull(), // purchase, transfer, assignment, expenditure
  entityType: varchar("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  userId: varchar("user_id").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  base: one(bases, {
    fields: [users.baseId],
    references: [bases.id],
  }),
}));

export const basesRelations = relations(bases, ({ one, many }) => ({
  commander: one(users, {
    fields: [bases.commanderId],
    references: [users.id],
  }),
  assets: many(assets),
  purchases: many(purchases),
  transfersFrom: many(transfers, { relationName: "fromBase" }),
  transfersTo: many(transfers, { relationName: "toBase" }),
  assignments: many(assignments),
  expenditures: many(expenditures),
}));

export const equipmentTypesRelations = relations(equipmentTypes, ({ many }) => ({
  assets: many(assets),
  purchases: many(purchases),
  transfers: many(transfers),
  assignments: many(assignments),
  expenditures: many(expenditures),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  equipmentType: one(equipmentTypes, {
    fields: [assets.equipmentTypeId],
    references: [equipmentTypes.id],
  }),
  base: one(bases, {
    fields: [assets.baseId],
    references: [bases.id],
  }),
  assignments: many(assignments),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  equipmentType: one(equipmentTypes, {
    fields: [purchases.equipmentTypeId],
    references: [equipmentTypes.id],
  }),
  base: one(bases, {
    fields: [purchases.baseId],
    references: [bases.id],
  }),
  createdByUser: one(users, {
    fields: [purchases.createdBy],
    references: [users.id],
  }),
}));

export const transfersRelations = relations(transfers, ({ one }) => ({
  equipmentType: one(equipmentTypes, {
    fields: [transfers.equipmentTypeId],
    references: [equipmentTypes.id],
  }),
  fromBase: one(bases, {
    fields: [transfers.fromBaseId],
    references: [bases.id],
    relationName: "fromBase",
  }),
  toBase: one(bases, {
    fields: [transfers.toBaseId],
    references: [bases.id],
    relationName: "toBase",
  }),
  createdByUser: one(users, {
    fields: [transfers.createdBy],
    references: [users.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  asset: one(assets, {
    fields: [assignments.assetId],
    references: [assets.id],
  }),
  equipmentType: one(equipmentTypes, {
    fields: [assignments.equipmentTypeId],
    references: [equipmentTypes.id],
  }),
  base: one(bases, {
    fields: [assignments.baseId],
    references: [bases.id],
  }),
  createdByUser: one(users, {
    fields: [assignments.createdBy],
    references: [users.id],
  }),
}));

export const expendituresRelations = relations(expenditures, ({ one }) => ({
  equipmentType: one(equipmentTypes, {
    fields: [expenditures.equipmentTypeId],
    references: [equipmentTypes.id],
  }),
  base: one(bases, {
    fields: [expenditures.baseId],
    references: [bases.id],
  }),
  authorizedByUser: one(users, {
    fields: [expenditures.authorizedBy],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [expenditures.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBaseSchema = createInsertSchema(bases).omit({
  id: true,
  createdAt: true,
});

export const insertEquipmentTypeSchema = createInsertSchema(equipmentTypes).omit({
  id: true,
  createdAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
});

export const insertTransferSchema = createInsertSchema(transfers).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
});

export const insertExpenditureSchema = createInsertSchema(expenditures).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Base = typeof bases.$inferSelect;
export type EquipmentType = typeof equipmentTypes.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type Transfer = typeof transfers.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Expenditure = typeof expenditures.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;

export type InsertBase = z.infer<typeof insertBaseSchema>;
export type InsertEquipmentType = z.infer<typeof insertEquipmentTypeSchema>;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type InsertExpenditure = z.infer<typeof insertExpenditureSchema>;
export type InsertAuditLogEntry = z.infer<typeof insertAuditLogSchema>;
