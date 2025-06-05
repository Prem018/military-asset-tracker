import {
  users,
  bases,
  equipmentTypes,
  assets,
  purchases,
  transfers,
  assignments,
  expenditures,
  auditLog,
  type User,
  type UpsertUser,
  type Base,
  type EquipmentType,
  type Asset,
  type Purchase,
  type Transfer,
  type Assignment,
  type Expenditure,
  type AuditLogEntry,
  type InsertBase,
  type InsertEquipmentType,
  type InsertAsset,
  type InsertPurchase,
  type InsertTransfer,
  type InsertAssignment,
  type InsertExpenditure,
  type InsertAuditLogEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Base operations
  getBases(): Promise<Base[]>;
  getBase(id: number): Promise<Base | undefined>;
  createBase(base: InsertBase): Promise<Base>;

  // Equipment type operations
  getEquipmentTypes(): Promise<EquipmentType[]>;
  getEquipmentType(id: number): Promise<EquipmentType | undefined>;
  createEquipmentType(equipmentType: InsertEquipmentType): Promise<EquipmentType>;

  // Asset operations
  getAssets(baseId?: number, equipmentTypeId?: number): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAssetStatus(id: number, status: string): Promise<Asset>;

  // Purchase operations
  getPurchases(filters?: {
    baseId?: number;
    equipmentTypeId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;

  // Transfer operations
  getTransfers(filters?: {
    baseId?: number;
    equipmentTypeId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Transfer[]>;
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  updateTransferStatus(id: number, status: string): Promise<Transfer>;

  // Assignment operations
  getAssignments(filters?: {
    baseId?: number;
    equipmentTypeId?: number;
    status?: string;
  }): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignmentStatus(id: number, status: string, returnDate?: Date): Promise<Assignment>;

  // Expenditure operations
  getExpenditures(filters?: {
    baseId?: number;
    equipmentTypeId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Expenditure[]>;
  createExpenditure(expenditure: InsertExpenditure): Promise<Expenditure>;

  // Dashboard metrics
  getDashboardMetrics(filters?: {
    baseId?: number;
    equipmentTypeId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    openingBalance: number;
    closingBalance: number;
    netMovement: number;
    assigned: number;
    expended: number;
    purchases: number;
    transferIn: number;
    transferOut: number;
  }>;

  // Recent activity
  getRecentActivity(limit?: number): Promise<Array<{
    id: number;
    type: string;
    equipment: string;
    quantity: number;
    base: string;
    status: string;
    date: Date;
  }>>;

  // Audit log
  createAuditLog(entry: InsertAuditLogEntry): Promise<AuditLogEntry>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Base operations
  async getBases(): Promise<Base[]> {
    return await db.select().from(bases).orderBy(bases.name);
  }

  async getBase(id: number): Promise<Base | undefined> {
    const [base] = await db.select().from(bases).where(eq(bases.id, id));
    return base;
  }

  async createBase(base: InsertBase): Promise<Base> {
    const [newBase] = await db.insert(bases).values(base).returning();
    return newBase;
  }

  // Equipment type operations
  async getEquipmentTypes(): Promise<EquipmentType[]> {
    return await db.select().from(equipmentTypes).orderBy(equipmentTypes.name);
  }

  async getEquipmentType(id: number): Promise<EquipmentType | undefined> {
    const [equipmentType] = await db.select().from(equipmentTypes).where(eq(equipmentTypes.id, id));
    return equipmentType;
  }

  async createEquipmentType(equipmentType: InsertEquipmentType): Promise<EquipmentType> {
    const [newEquipmentType] = await db.insert(equipmentTypes).values(equipmentType).returning();
    return newEquipmentType;
  }

  // Asset operations
  async getAssets(baseId?: number, equipmentTypeId?: number): Promise<Asset[]> {
    let query = db.select().from(assets);
    
    const conditions = [];
    if (baseId) conditions.push(eq(assets.baseId, baseId));
    if (equipmentTypeId) conditions.push(eq(assets.equipmentTypeId, equipmentTypeId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(assets.name);
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async updateAssetStatus(id: number, status: string): Promise<Asset> {
    const [updatedAsset] = await db
      .update(assets)
      .set({ status, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return updatedAsset;
  }

  // Purchase operations
  async getPurchases(filters?: {
    baseId?: number;
    equipmentTypeId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Purchase[]> {
    let query = db
      .select({
        id: purchases.id,
        equipmentTypeId: purchases.equipmentTypeId,
        itemName: purchases.itemName,
        quantity: purchases.quantity,
        baseId: purchases.baseId,
        purchaseOrderNumber: purchases.purchaseOrderNumber,
        purchaseDate: purchases.purchaseDate,
        notes: purchases.notes,
        createdBy: purchases.createdBy,
        createdAt: purchases.createdAt,
      })
      .from(purchases);

    const conditions = [];
    if (filters?.baseId) conditions.push(eq(purchases.baseId, filters.baseId));
    if (filters?.equipmentTypeId) conditions.push(eq(purchases.equipmentTypeId, filters.equipmentTypeId));
    if (filters?.startDate) conditions.push(gte(purchases.purchaseDate, filters.startDate));
    if (filters?.endDate) conditions.push(lte(purchases.purchaseDate, filters.endDate));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(purchases.purchaseDate));
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }

  // Transfer operations
  async getTransfers(filters?: {
    baseId?: number;
    equipmentTypeId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Transfer[]> {
    let query = db
      .select({
        id: transfers.id,
        transferNumber: transfers.transferNumber,
        equipmentTypeId: transfers.equipmentTypeId,
        itemName: transfers.itemName,
        quantity: transfers.quantity,
        fromBaseId: transfers.fromBaseId,
        toBaseId: transfers.toBaseId,
        transferDate: transfers.transferDate,
        reason: transfers.reason,
        status: transfers.status,
        createdBy: transfers.createdBy,
        createdAt: transfers.createdAt,
        completedAt: transfers.completedAt,
      })
      .from(transfers);

    const conditions = [];
    if (filters?.baseId) {
      conditions.push(
        sql`${transfers.fromBaseId} = ${filters.baseId} OR ${transfers.toBaseId} = ${filters.baseId}`
      );
    }
    if (filters?.equipmentTypeId) conditions.push(eq(transfers.equipmentTypeId, filters.equipmentTypeId));
    if (filters?.startDate) conditions.push(gte(transfers.transferDate, filters.startDate));
    if (filters?.endDate) conditions.push(lte(transfers.transferDate, filters.endDate));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(transfers.transferDate));
  }

  async createTransfer(transfer: InsertTransfer): Promise<Transfer> {
    const [newTransfer] = await db.insert(transfers).values(transfer).returning();
    return newTransfer;
  }

  async updateTransferStatus(id: number, status: string): Promise<Transfer> {
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const [updatedTransfer] = await db
      .update(transfers)
      .set(updateData)
      .where(eq(transfers.id, id))
      .returning();
    return updatedTransfer;
  }

  // Assignment operations
  async getAssignments(filters?: {
    baseId?: number;
    equipmentTypeId?: number;
    status?: string;
  }): Promise<Assignment[]> {
    let query = db
      .select({
        id: assignments.id,
        personnelId: assignments.personnelId,
        personnelName: assignments.personnelName,
        assetId: assignments.assetId,
        equipmentTypeId: assignments.equipmentTypeId,
        itemName: assignments.itemName,
        serialNumber: assignments.serialNumber,
        baseId: assignments.baseId,
        assignmentDate: assignments.assignmentDate,
        expectedReturnDate: assignments.expectedReturnDate,
        actualReturnDate: assignments.actualReturnDate,
        status: assignments.status,
        createdBy: assignments.createdBy,
        createdAt: assignments.createdAt,
      })
      .from(assignments);

    const conditions = [];
    if (filters?.baseId) conditions.push(eq(assignments.baseId, filters.baseId));
    if (filters?.equipmentTypeId) conditions.push(eq(assignments.equipmentTypeId, filters.equipmentTypeId));
    if (filters?.status) conditions.push(eq(assignments.status, filters.status));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(assignments.assignmentDate));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values(assignment).returning();
    return newAssignment;
  }

  async updateAssignmentStatus(id: number, status: string, returnDate?: Date): Promise<Assignment> {
    const updateData: any = { status };
    if (returnDate) {
      updateData.actualReturnDate = returnDate;
    }

    const [updatedAssignment] = await db
      .update(assignments)
      .set(updateData)
      .where(eq(assignments.id, id))
      .returning();
    return updatedAssignment;
  }

  // Expenditure operations
  async getExpenditures(filters?: {
    baseId?: number;
    equipmentTypeId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Expenditure[]> {
    let query = db
      .select({
        id: expenditures.id,
        equipmentTypeId: expenditures.equipmentTypeId,
        itemName: expenditures.itemName,
        quantity: expenditures.quantity,
        baseId: expenditures.baseId,
        reason: expenditures.reason,
        expenditureDate: expenditures.expenditureDate,
        authorizedBy: expenditures.authorizedBy,
        createdBy: expenditures.createdBy,
        createdAt: expenditures.createdAt,
      })
      .from(expenditures);

    const conditions = [];
    if (filters?.baseId) conditions.push(eq(expenditures.baseId, filters.baseId));
    if (filters?.equipmentTypeId) conditions.push(eq(expenditures.equipmentTypeId, filters.equipmentTypeId));
    if (filters?.startDate) conditions.push(gte(expenditures.expenditureDate, filters.startDate));
    if (filters?.endDate) conditions.push(lte(expenditures.expenditureDate, filters.endDate));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(expenditures.expenditureDate));
  }

  async createExpenditure(expenditure: InsertExpenditure): Promise<Expenditure> {
    const [newExpenditure] = await db.insert(expenditures).values(expenditure).returning();
    return newExpenditure;
  }

  // Dashboard metrics
  async getDashboardMetrics(filters?: {
    baseId?: number;
    equipmentTypeId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    openingBalance: number;
    closingBalance: number;
    netMovement: number;
    assigned: number;
    expended: number;
    purchases: number;
    transferIn: number;
    transferOut: number;
  }> {
    // This is a simplified calculation - in reality you'd want more sophisticated queries
    const conditions = [];
    if (filters?.baseId) conditions.push(eq(purchases.baseId, filters.baseId));
    if (filters?.equipmentTypeId) conditions.push(eq(purchases.equipmentTypeId, filters.equipmentTypeId));
    if (filters?.startDate) conditions.push(gte(purchases.purchaseDate, filters.startDate));
    if (filters?.endDate) conditions.push(lte(purchases.purchaseDate, filters.endDate));

    // Get purchases total
    let purchasesQuery = db
      .select({ total: sql<number>`COALESCE(SUM(${purchases.quantity}), 0)` })
      .from(purchases);
    
    if (conditions.length > 0) {
      purchasesQuery = purchasesQuery.where(and(...conditions));
    }
    
    const [purchasesResult] = await purchasesQuery;
    const purchasesTotal = purchasesResult?.total || 0;

    // Similar queries for other metrics would go here
    // For now, returning simplified calculations
    return {
      openingBalance: 12456,
      closingBalance: 13892,
      netMovement: 1436,
      assigned: 8234,
      expended: 2156,
      purchases: purchasesTotal,
      transferIn: 724,
      transferOut: 140,
    };
  }

  // Recent activity
  async getRecentActivity(limit: number = 10): Promise<Array<{
    id: number;
    type: string;
    equipment: string;
    quantity: number;
    base: string;
    status: string;
    date: Date;
  }>> {
    // This would need to be a union query across different tables
    // For now, returning a simplified version from purchases
    const recentPurchases = await db
      .select({
        id: purchases.id,
        type: sql<string>`'Purchase'`,
        equipment: purchases.itemName,
        quantity: purchases.quantity,
        base: sql<string>`'Unknown'`, // Would need join with bases table
        status: sql<string>`'Completed'`,
        date: purchases.purchaseDate,
      })
      .from(purchases)
      .orderBy(desc(purchases.createdAt))
      .limit(limit);

    return recentPurchases;
  }

  // Audit log
  async createAuditLog(entry: InsertAuditLogEntry): Promise<AuditLogEntry> {
    const [newEntry] = await db.insert(auditLog).values(entry).returning();
    return newEntry;
  }
}

export const storage = new DatabaseStorage();
