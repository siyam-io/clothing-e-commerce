import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import path from "path";
import { fileURLToPath } from "url";
import AuditLog from "../modules/auditLog/auditLog.model.js";

// Windows DNS override for MongoDB Atlas SRV lookup
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
  // ignore
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const sampleLogs = [
  {
    userName: "System Superadmin",
    userEmail: "admin@vanguard.com",
    userRole: "superadmin",
    action: "SYSTEM",
    module: "System",
    resourceId: "SYS-BOOT-001",
    resourceName: "Kernel Initialization",
    description: "System environment bootstrapped and database connection established",
    status: "SUCCESS",
    ipAddress: "127.0.0.1",
    userAgent: "System Bootstrap CLI",
    details: { version: "3.0.0", environment: "production" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
  },
  {
    userName: "System Superadmin",
    userEmail: "admin@vanguard.com",
    userRole: "superadmin",
    action: "LOGIN",
    module: "Auth",
    resourceId: "AUTH-01",
    resourceName: "Admin Console Authentication",
    description: "Superadmin logged in successfully from secure IP address",
    status: "SUCCESS",
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    userName: "Store Operations",
    userEmail: "ops@vanguard.com",
    userRole: "admin",
    action: "CREATE",
    module: "Category",
    resourceId: "CAT-FW26-01",
    resourceName: "Autumn Trench & Outerwear",
    description: "Created new apparel category: Autumn Trench & Outerwear",
    status: "SUCCESS",
    ipAddress: "192.168.1.25",
    details: { slug: "autumn-trench-outerwear", isVisible: true },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
  },
  {
    userName: "Store Operations",
    userEmail: "ops@vanguard.com",
    userRole: "admin",
    action: "CREATE",
    module: "Product",
    resourceId: "PRD-OVR-001",
    resourceName: "Double-Breasted Wool Coat",
    description: "Created product: Double-Breasted Wool Coat with 4 size variants",
    status: "SUCCESS",
    ipAddress: "192.168.1.25",
    details: { basePrice: 12500, stock: 45, sku: "DB-WC-BLK" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30),
  },
  {
    userName: "Store Operations",
    userEmail: "ops@vanguard.com",
    userRole: "admin",
    action: "UPDATE",
    module: "Product",
    resourceId: "PRD-OVR-001",
    resourceName: "Double-Breasted Wool Coat",
    description: "Updated inventory stock levels from 45 to 60 units",
    status: "SUCCESS",
    ipAddress: "192.168.1.25",
    details: { field: "stock", previous: 45, updated: 60 },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
  },
  {
    userName: "POS Cashier 01",
    userEmail: "cashier@vanguard.com",
    userRole: "admin",
    action: "CREATE",
    module: "Order",
    resourceId: "POS-10029",
    resourceName: "Order #POS-10029",
    description: "Created in-store POS walk-in transaction for 2 items",
    status: "SUCCESS",
    ipAddress: "192.168.1.150",
    details: { totalAmount: 8500, paymentMethod: "cash", itemsCount: 2 },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
  {
    userName: "Store Operations",
    userEmail: "ops@vanguard.com",
    userRole: "admin",
    action: "STATUS_CHANGE",
    module: "Order",
    resourceId: "ORD-99120",
    resourceName: "Order #ORD-99120",
    description: "Updated order lifecycle status from 'pending' to 'processing'",
    status: "SUCCESS",
    ipAddress: "192.168.1.25",
    details: { previousStatus: "pending", newStatus: "processing" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    userName: "Store Operations",
    userEmail: "ops@vanguard.com",
    userRole: "admin",
    action: "DISPATCH",
    module: "Order",
    resourceId: "ORD-99120",
    resourceName: "Order #ORD-99120",
    description: "Dispatched parcel via Steadfast Courier with tracking ID: ST-883921",
    status: "SUCCESS",
    ipAddress: "192.168.1.25",
    details: { courier: "steadfast", trackingCode: "ST-883921", charge: 130 },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    userName: "Editorial Staff",
    userEmail: "editorial@vanguard.com",
    userRole: "admin",
    action: "CREATE",
    module: "Blog",
    resourceId: "BLG-STY-001",
    resourceName: "Winter Layering Masterclass",
    description: "Published editorial article: Winter Layering Masterclass",
    status: "SUCCESS",
    ipAddress: "192.168.1.42",
    details: { status: "PUBLISHED", tags: ["styling", "winter"] },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    userName: "System Superadmin",
    userEmail: "admin@vanguard.com",
    userRole: "superadmin",
    action: "CONFIG_UPDATE",
    module: "Settings",
    resourceId: "SET-THEME",
    resourceName: "Theme Styling Settings",
    description: "Updated system primary accent theme palette and typography",
    status: "SUCCESS",
    ipAddress: "192.168.1.10",
    details: { activeTheme: "emerald", font: "Geist" },
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    userName: "Rahim Chowdhury",
    userEmail: "rahim@example.com",
    userRole: "customer",
    action: "REGISTER",
    module: "Auth",
    resourceId: "USR-1029",
    resourceName: "Rahim Chowdhury",
    description: "New user account registered: Rahim Chowdhury (rahim@example.com)",
    status: "SUCCESS",
    ipAddress: "103.112.54.12",
    details: { email: "rahim@example.com", method: "Email & Password" },
    createdAt: new Date(Date.now() - 1000 * 60 * 35),
  },
  {
    userName: "Rahim Chowdhury",
    userEmail: "rahim@example.com",
    userRole: "customer",
    action: "CREATE",
    module: "Order",
    resourceId: "ORD-99134",
    resourceName: "Order #ORD-99134",
    description: "Customer placed order #ORD-99134 via bKash (Total: ৳4,500)",
    status: "SUCCESS",
    ipAddress: "103.112.54.12",
    details: { itemsCount: 1, totalPrice: 4500, paymentMethod: "bKash", city: "Dhaka" },
    createdAt: new Date(Date.now() - 1000 * 60 * 20),
  },
  {
    userName: "Fatima Begum",
    userEmail: "fatima@example.com",
    userRole: "customer",
    action: "CREATE",
    module: "Review",
    resourceId: "PRD-OVR-001",
    resourceName: "Double-Breasted Wool Coat",
    description: "User Fatima Begum submitted a 5-star review for product: Double-Breasted Wool Coat",
    status: "SUCCESS",
    ipAddress: "103.145.88.90",
    details: { rating: 5, comment: "Exceptional fabric and warm lining! Highly recommended." },
    createdAt: new Date(Date.now() - 1000 * 60 * 10),
  },
];

const seedAuditLogs = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGO_URI environment variable not found.");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Audit Log seeding...");

    const existingCount = await AuditLog.countDocuments();
    console.log(`Current audit log count: ${existingCount}`);

    // Insert sample logs
    const inserted = await AuditLog.insertMany(sampleLogs);
    console.log(`Successfully seeded ${inserted.length} baseline audit log records!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seeding audit logs failed:", error);
    process.exit(1);
  }
};

seedAuditLogs();

