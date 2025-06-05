import express from "express";
import cors from "cors";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";
import { storage } from "./storage.js";

// Configure neon for serverless
neonConfig.webSocketConstructor = ws;

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection for production
const pool = new Pool({ connectionString: process.env.RENDER_DATABASE_URL });
const db = drizzle({ client: pool, schema });

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (simplified for demo)
app.get('/api/auth/user', (req, res) => {
  // Return demo user for demonstration
  res.json({
    id: "demo-user",
    email: "admin@military.demo",
    firstName: "Admin",
    lastName: "User",
    role: "admin"
  });
});

// Base routes
app.get('/api/bases', async (req, res) => {
  try {
    const bases = await storage.getBases();
    res.json(bases);
  } catch (error) {
    console.error('Error fetching bases:', error);
    res.status(500).json({ message: "Failed to fetch bases" });
  }
});

app.post('/api/bases', async (req, res) => {
  try {
    const base = await storage.createBase(req.body);
    res.json(base);
  } catch (error) {
    console.error('Error creating base:', error);
    res.status(500).json({ message: "Failed to create base" });
  }
});

// Equipment type routes
app.get('/api/equipment-types', async (req, res) => {
  try {
    const types = await storage.getEquipmentTypes();
    res.json(types);
  } catch (error) {
    console.error('Error fetching equipment types:', error);
    res.status(500).json({ message: "Failed to fetch equipment types" });
  }
});

app.post('/api/equipment-types', async (req, res) => {
  try {
    const type = await storage.createEquipmentType(req.body);
    res.json(type);
  } catch (error) {
    console.error('Error creating equipment type:', error);
    res.status(500).json({ message: "Failed to create equipment type" });
  }
});

// Asset routes
app.get('/api/assets', async (req, res) => {
  try {
    const { baseId, equipmentTypeId } = req.query;
    const assets = await storage.getAssets(
      baseId ? Number(baseId) : undefined,
      equipmentTypeId ? Number(equipmentTypeId) : undefined
    );
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ message: "Failed to fetch assets" });
  }
});

// Purchase routes
app.get('/api/purchases', async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;
    const filters: any = {};
    
    if (baseId) filters.baseId = Number(baseId);
    if (equipmentTypeId) filters.equipmentTypeId = Number(equipmentTypeId);
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    
    const purchases = await storage.getPurchases(filters);
    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: "Failed to fetch purchases" });
  }
});

app.post('/api/purchases', async (req, res) => {
  try {
    const purchase = await storage.createPurchase(req.body);
    res.json(purchase);
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ message: "Failed to create purchase" });
  }
});

// Transfer routes
app.get('/api/transfers', async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;
    const filters: any = {};
    
    if (baseId) filters.baseId = Number(baseId);
    if (equipmentTypeId) filters.equipmentTypeId = Number(equipmentTypeId);
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    
    const transfers = await storage.getTransfers(filters);
    res.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ message: "Failed to fetch transfers" });
  }
});

app.post('/api/transfers', async (req, res) => {
  try {
    const transfer = await storage.createTransfer(req.body);
    res.json(transfer);
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ message: "Failed to create transfer" });
  }
});

// Assignment routes
app.get('/api/assignments', async (req, res) => {
  try {
    const { baseId, equipmentTypeId, status } = req.query;
    const filters: any = {};
    
    if (baseId) filters.baseId = Number(baseId);
    if (equipmentTypeId) filters.equipmentTypeId = Number(equipmentTypeId);
    if (status) filters.status = status as string;
    
    const assignments = await storage.getAssignments(filters);
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
});

app.post('/api/assignments', async (req, res) => {
  try {
    const assignment = await storage.createAssignment(req.body);
    res.json(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: "Failed to create assignment" });
  }
});

// Expenditure routes
app.get('/api/expenditures', async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;
    const filters: any = {};
    
    if (baseId) filters.baseId = Number(baseId);
    if (equipmentTypeId) filters.equipmentTypeId = Number(equipmentTypeId);
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    
    const expenditures = await storage.getExpenditures(filters);
    res.json(expenditures);
  } catch (error) {
    console.error('Error fetching expenditures:', error);
    res.status(500).json({ message: "Failed to fetch expenditures" });
  }
});

app.post('/api/expenditures', async (req, res) => {
  try {
    const expenditure = await storage.createExpenditure(req.body);
    res.json(expenditure);
  } catch (error) {
    console.error('Error creating expenditure:', error);
    res.status(500).json({ message: "Failed to create expenditure" });
  }
});

// Dashboard routes
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;
    const filters: any = {};
    
    if (baseId) filters.baseId = Number(baseId);
    if (equipmentTypeId) filters.equipmentTypeId = Number(equipmentTypeId);
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    
    const metrics = await storage.getDashboardMetrics(filters);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ message: "Failed to fetch dashboard metrics" });
  }
});

app.get('/api/dashboard/recent-activity', async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const activity = await storage.getRecentActivity(limit);
    res.json(activity);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`Military Asset Management API running on port ${PORT}`);
});