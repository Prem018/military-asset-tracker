import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertPurchaseSchema,
  insertTransferSchema,
  insertAssignmentSchema,
  insertExpenditureSchema,
  insertBaseSchema,
  insertEquipmentTypeSchema,
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Base routes
  app.get('/api/bases', isAuthenticated, async (req: any, res) => {
    try {
      const bases = await storage.getBases();
      res.json(bases);
    } catch (error) {
      console.error("Error fetching bases:", error);
      res.status(500).json({ message: "Failed to fetch bases" });
    }
  });

  app.post('/api/bases', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const baseData = insertBaseSchema.parse(req.body);
      const base = await storage.createBase(baseData);
      
      await storage.createAuditLog({
        action: 'create_base',
        entityType: 'base',
        entityId: base.id,
        userId: req.user.claims.sub,
        details: { baseData },
      });

      res.json(base);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating base:", error);
      res.status(500).json({ message: "Failed to create base" });
    }
  });

  // Equipment type routes
  app.get('/api/equipment-types', isAuthenticated, async (req: any, res) => {
    try {
      const equipmentTypes = await storage.getEquipmentTypes();
      res.json(equipmentTypes);
    } catch (error) {
      console.error("Error fetching equipment types:", error);
      res.status(500).json({ message: "Failed to fetch equipment types" });
    }
  });

  app.post('/api/equipment-types', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const equipmentTypeData = insertEquipmentTypeSchema.parse(req.body);
      const equipmentType = await storage.createEquipmentType(equipmentTypeData);
      
      await storage.createAuditLog({
        action: 'create_equipment_type',
        entityType: 'equipment_type',
        entityId: equipmentType.id,
        userId: req.user.claims.sub,
        details: { equipmentTypeData },
      });

      res.json(equipmentType);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating equipment type:", error);
      res.status(500).json({ message: "Failed to create equipment type" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      // Apply role-based filtering
      const filters: any = {};
      if (user?.role === 'base_commander' && user.baseId) {
        filters.baseId = user.baseId;
      }
      
      // Apply query filters
      if (req.query.baseId && user?.role === 'admin') {
        filters.baseId = parseInt(req.query.baseId as string);
      }
      if (req.query.equipmentTypeId) {
        filters.equipmentTypeId = parseInt(req.query.equipmentTypeId as string);
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const metrics = await storage.getDashboardMetrics(filters);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/dashboard/recent-activity', isAuthenticated, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activity = await storage.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Purchase routes
  app.get('/api/purchases', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      const filters: any = {};
      if (user?.role === 'base_commander' && user.baseId) {
        filters.baseId = user.baseId;
      }
      
      if (req.query.baseId && user?.role === 'admin') {
        filters.baseId = parseInt(req.query.baseId as string);
      }
      if (req.query.equipmentTypeId) {
        filters.equipmentTypeId = parseInt(req.query.equipmentTypeId as string);
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const purchases = await storage.getPurchases(filters);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.post('/api/purchases', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'base_commander', 'logistics_officer'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const purchaseData = {
        ...insertPurchaseSchema.parse(req.body),
        createdBy: req.user.claims.sub,
      };

      // Role-based validation
      if (user.role === 'base_commander' && user.baseId && purchaseData.baseId !== user.baseId) {
        return res.status(403).json({ message: "Cannot create purchases for other bases" });
      }

      const purchase = await storage.createPurchase(purchaseData);
      
      await storage.createAuditLog({
        action: 'purchase',
        entityType: 'purchase',
        entityId: purchase.id,
        userId: req.user.claims.sub,
        details: { purchaseData },
      });

      res.json(purchase);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating purchase:", error);
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  // Transfer routes
  app.get('/api/transfers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      const filters: any = {};
      if (user?.role === 'base_commander' && user.baseId) {
        filters.baseId = user.baseId;
      }
      
      if (req.query.baseId && user?.role === 'admin') {
        filters.baseId = parseInt(req.query.baseId as string);
      }
      if (req.query.equipmentTypeId) {
        filters.equipmentTypeId = parseInt(req.query.equipmentTypeId as string);
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const transfers = await storage.getTransfers(filters);
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      res.status(500).json({ message: "Failed to fetch transfers" });
    }
  });

  app.post('/api/transfers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'base_commander', 'logistics_officer'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const transferData = {
        ...insertTransferSchema.parse(req.body),
        transferNumber: `TR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        createdBy: req.user.claims.sub,
      };

      // Role-based validation
      if (user.role === 'base_commander' && user.baseId) {
        if (transferData.fromBaseId !== user.baseId && transferData.toBaseId !== user.baseId) {
          return res.status(403).json({ message: "Cannot create transfers for other bases" });
        }
      }

      const transfer = await storage.createTransfer(transferData);
      
      await storage.createAuditLog({
        action: 'transfer',
        entityType: 'transfer',
        entityId: transfer.id,
        userId: req.user.claims.sub,
        details: { transferData },
      });

      res.json(transfer);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating transfer:", error);
      res.status(500).json({ message: "Failed to create transfer" });
    }
  });

  app.patch('/api/transfers/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'base_commander', 'logistics_officer'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const transferId = parseInt(req.params.id);
      const { status } = req.body;

      const transfer = await storage.updateTransferStatus(transferId, status);
      
      await storage.createAuditLog({
        action: 'update_transfer_status',
        entityType: 'transfer',
        entityId: transfer.id,
        userId: req.user.claims.sub,
        details: { status },
      });

      res.json(transfer);
    } catch (error) {
      console.error("Error updating transfer status:", error);
      res.status(500).json({ message: "Failed to update transfer status" });
    }
  });

  // Assignment routes
  app.get('/api/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      const filters: any = {};
      if (user?.role === 'base_commander' && user.baseId) {
        filters.baseId = user.baseId;
      }
      
      if (req.query.baseId && user?.role === 'admin') {
        filters.baseId = parseInt(req.query.baseId as string);
      }
      if (req.query.equipmentTypeId) {
        filters.equipmentTypeId = parseInt(req.query.equipmentTypeId as string);
      }
      if (req.query.status) {
        filters.status = req.query.status as string;
      }

      const assignments = await storage.getAssignments(filters);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post('/api/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'base_commander'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const assignmentData = {
        ...insertAssignmentSchema.parse(req.body),
        createdBy: req.user.claims.sub,
      };

      // Role-based validation
      if (user.role === 'base_commander' && user.baseId && assignmentData.baseId !== user.baseId) {
        return res.status(403).json({ message: "Cannot create assignments for other bases" });
      }

      const assignment = await storage.createAssignment(assignmentData);
      
      await storage.createAuditLog({
        action: 'assignment',
        entityType: 'assignment',
        entityId: assignment.id,
        userId: req.user.claims.sub,
        details: { assignmentData },
      });

      res.json(assignment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.patch('/api/assignments/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'base_commander'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const assignmentId = parseInt(req.params.id);
      const { status, returnDate } = req.body;

      const assignment = await storage.updateAssignmentStatus(
        assignmentId, 
        status, 
        returnDate ? new Date(returnDate) : undefined
      );
      
      await storage.createAuditLog({
        action: 'update_assignment_status',
        entityType: 'assignment',
        entityId: assignment.id,
        userId: req.user.claims.sub,
        details: { status, returnDate },
      });

      res.json(assignment);
    } catch (error) {
      console.error("Error updating assignment status:", error);
      res.status(500).json({ message: "Failed to update assignment status" });
    }
  });

  // Expenditure routes
  app.get('/api/expenditures', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      const filters: any = {};
      if (user?.role === 'base_commander' && user.baseId) {
        filters.baseId = user.baseId;
      }
      
      if (req.query.baseId && user?.role === 'admin') {
        filters.baseId = parseInt(req.query.baseId as string);
      }
      if (req.query.equipmentTypeId) {
        filters.equipmentTypeId = parseInt(req.query.equipmentTypeId as string);
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const expenditures = await storage.getExpenditures(filters);
      res.json(expenditures);
    } catch (error) {
      console.error("Error fetching expenditures:", error);
      res.status(500).json({ message: "Failed to fetch expenditures" });
    }
  });

  app.post('/api/expenditures', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'base_commander'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const expenditureData = {
        ...insertExpenditureSchema.parse(req.body),
        authorizedBy: req.user.claims.sub,
        createdBy: req.user.claims.sub,
      };

      // Role-based validation
      if (user.role === 'base_commander' && user.baseId && expenditureData.baseId !== user.baseId) {
        return res.status(403).json({ message: "Cannot create expenditures for other bases" });
      }

      const expenditure = await storage.createExpenditure(expenditureData);
      
      await storage.createAuditLog({
        action: 'expenditure',
        entityType: 'expenditure',
        entityId: expenditure.id,
        userId: req.user.claims.sub,
        details: { expenditureData },
      });

      res.json(expenditure);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating expenditure:", error);
      res.status(500).json({ message: "Failed to create expenditure" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
