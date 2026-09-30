import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Set __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

process.env.JWT_SECRET = process.env.JWT_SECRET || "genie_dev_jwt_secret_key_12345";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Import routes
import userRoutes from "./routes/users.js";
import servicesRoutes from "./routes/services.js";
import razorpayRoutes from "./routes/razorpay.js";
import authRoutes from "./routes/auth.js";
import providerRoutes from "./routes/providers.js";

import AdminServices from "./routes/AdminServices.js";
import adminProvidersRoutes from "./routes/AdminProviders.js";
import adminDashboardRoutes from "./routes/AdminDashboard.js";
import adminServicesRouter from "./routes/AdminServicesRouter.js";
import { generateAllDummyProviders } from "./seed/providers_seed.js";
import adminBookingsRoutes from "./routes/AdminBookings.js";

// Initialize express app
const app = express();

//Middleware
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser());

// Serve static files & uploads
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/razorpay", razorpayRoutes);

app.use("/api/admin/providers", adminProvidersRoutes);

app.use("/api/admin/services", AdminServices);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/servicedetails", adminServicesRouter);
app.use("/api/admin/bookings", adminBookingsRoutes);

import Service from "./models/Service.js";
import ServiceDetail from "./models/ServiceDetail.js";
import User from "./models/User.js";
import ServiceProvider from "./models/ServiceProvider.js";
import Review from "./models/Review.js";
import Payment from "./models/Payment.js";
import { servicesData } from "./data/servicesData.js";
import { servicesDetailsData } from "./data/servicesDetailsData.js";


const USERS = [
  { first_name: 'Priya', last_name: 'Sharma', email: 'user1@example.com', phone: '9876543001', password: 'password123', role: 'user' },
  { first_name: 'Rahul', last_name: 'Mehta', email: 'user2@example.com', phone: '9876543002', password: 'password123', role: 'user' },
  { first_name: 'Anita', last_name: 'Verma', email: 'user3@example.com', phone: '9876543003', password: 'password123', role: 'user' },
  { first_name: 'Vikram', last_name: 'Singh', email: 'user4@example.com', phone: '9876543004', password: 'password123', role: 'user' },
  { first_name: 'Sneha', last_name: 'Kapoor', email: 'user5@example.com', phone: '9876543005', password: 'password123', role: 'user' },
];

const PROVIDER_USERS = [
  { first_name: 'Meena', last_name: 'Pillai', email: 'provider1@example.com', phone: '9800000001', password: 'password123', role: 'provider' },
  { first_name: 'Arjun', last_name: 'Nair', email: 'provider2@example.com', phone: '9800000002', password: 'password123', role: 'provider' },
  { first_name: 'Kavya', last_name: 'Reddy', email: 'provider3@example.com', phone: '9800000003', password: 'password123', role: 'provider' },
  { first_name: 'Ravi', last_name: 'Kumar', email: 'provider4@example.com', phone: '9800000004', password: 'password123', role: 'provider' },
  { first_name: 'Sunita', last_name: 'Rao', email: 'provider5@example.com', phone: '9800000005', password: 'password123', role: 'provider' },
  { first_name: 'Deepak', last_name: 'Joshi', email: 'provider6@example.com', phone: '9800000006', password: 'password123', role: 'provider' },
];

const PROVIDER_PROFILES = [
  { name: 'Meena Pillai', email: 'provider1@example.com', phone: '9800000001', category: "Women's Salon & Spa", skills: ['Hair cut', 'Facial', 'Manicure', 'Pedicure', 'Threading'], experienceYears: 7, hourlyRate: 600, bio: 'Expert in all aspects of women\'s grooming with 7+ years of experience. Specialises in bridal packages and skin treatments.', pincode: '400053', isVerified: true, averageRating: 4.8, ratingCount: 24, location: { type: 'Point', coordinates: [72.8777, 19.0760], address: 'Andheri West, Mumbai, Maharashtra', pincode: '400053' }, contact: { phone: '9800000001', email: 'provider1@example.com', address: 'Andheri West, Mumbai', pincode: '400053' } },
  { name: 'Arjun Nair', email: 'provider2@example.com', phone: '9800000002', category: "Men's Salon & Spa", skills: ['Haircut', 'Beard grooming', 'Face massage', 'Hair colour', 'De-tan'], experienceYears: 5, hourlyRate: 450, bio: 'Certified men\'s grooming expert. Known for precision cuts and relaxing massages.', pincode: '110001', isVerified: true, averageRating: 4.6, ratingCount: 18, location: { type: 'Point', coordinates: [77.2090, 28.6139], address: 'Connaught Place, New Delhi', pincode: '110001' }, contact: { phone: '9800000002', email: 'provider2@example.com', address: 'Connaught Place, New Delhi', pincode: '110001' } },
  { name: 'Kavya Reddy', email: 'provider3@example.com', phone: '9800000003', category: "AC & Appliances Repair", skills: ['AC service', 'AC repair', 'Washing machine repair', 'Refrigerator repair', 'Microwave repair'], experienceYears: 8, hourlyRate: 800, bio: 'Experienced technician for all AC brands and home appliances. Quick diagnosis and guaranteed repair.', pincode: '600040', isVerified: true, averageRating: 4.7, ratingCount: 31, location: { type: 'Point', coordinates: [80.2707, 13.0827], address: 'Anna Nagar, Chennai, Tamil Nadu', pincode: '600040' }, contact: { phone: '9800000003', email: 'provider3@example.com', address: 'Anna Nagar, Chennai', pincode: '600040' } },
  { name: 'Ravi Kumar', email: 'provider4@example.com', phone: '9800000004', category: "Cleaning & Pest Control", skills: ['Home deep cleaning', 'Sofa cleaning', 'Carpet cleaning', 'Cockroach control', 'Termite control'], experienceYears: 6, hourlyRate: 350, bio: 'Professional cleaning and pest control with eco-friendly products. Satisfaction guaranteed.', pincode: '560038', isVerified: true, averageRating: 4.5, ratingCount: 20, location: { type: 'Point', coordinates: [77.5946, 12.9716], address: 'Indiranagar, Bangalore, Karnataka', pincode: '560038' }, contact: { phone: '9800000004', email: 'provider4@example.com', address: 'Indiranagar, Bangalore', pincode: '560038' } },
  { name: 'Sunita Rao', email: 'provider5@example.com', phone: '9800000005', category: "Electrician, Plumber & Carpenter", skills: ['Wiring', 'Fan installation', 'Pipe repair', 'Tap fitting', 'Furniture assembly'], experienceYears: 10, hourlyRate: 700, bio: 'Multi-trade professional handling electrical, plumbing, and carpentry work. Available 7 days a week.', pincode: '411038', isVerified: true, averageRating: 4.9, ratingCount: 42, location: { type: 'Point', coordinates: [73.8567, 18.5204], address: 'Kothrud, Pune, Maharashtra', pincode: '411038' }, contact: { phone: '9800000005', email: 'provider5@example.com', address: 'Kothrud, Pune', pincode: '411038' } },
  { name: 'Deepak Joshi', email: 'provider6@example.com', phone: '9800000006', category: "Painting & Waterproofing", skills: ['Interior painting', 'Exterior painting', 'Waterproofing', 'Texture paint', 'Wall putty'], experienceYears: 9, hourlyRate: 500, bio: 'Expert painter and waterproofing specialist with 9 years of residential and commercial projects.', pincode: '380015', isVerified: true, averageRating: 4.4, ratingCount: 15, location: { type: 'Point', coordinates: [72.5714, 23.0225], address: 'Satellite, Ahmedabad, Gujarat', pincode: '380015' }, contact: { phone: '9800000006', email: 'provider6@example.com', address: 'Satellite, Ahmedabad', pincode: '380015' } },
];


const REVIEWS_TEMPLATE = [
  { rating: 5, comment: 'Absolutely fantastic service! Very professional and thorough.' },
  { rating: 5, comment: 'Highly recommend! Arrived on time and did an excellent job.' },
  { rating: 4, comment: 'Good work overall. Will book again next month.' },
  { rating: 4, comment: 'Friendly and efficient. Happy with the results.' },
  { rating: 3, comment: 'Decent service. Took a bit longer than expected but quality was okay.' },
  { rating: 5, comment: 'Exceeded my expectations! The best in the business.' },
  { rating: 4, comment: 'Neat work, very polite. Highly satisfied.' },
  { rating: 5, comment: 'Superb attention to detail. Would definitely book again.' },
];

// Auto seed helper
async function seedIfNeeded() {
  try {
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.log("Seeding default admin user...");
      const newAdmin = new User({
        first_name: "Admin",
        last_name: "User",
        email: "admin@gmail.com",
        phone: "9999999999",
        password: "admin@1234",
        role: "admin",
      });
      await newAdmin.save();
      console.log("Admin user seeded successfully.");
    }

    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      console.log("Seeding services...");
      const servicesWithOrder = servicesData.map((service, index) => ({
        ...service,
        order: index,
      }));
      await Service.insertMany(servicesWithOrder);
      console.log("Services seeded successfully.");
    }

    const detailCount = await ServiceDetail.countDocuments();
    if (detailCount === 0) {
      console.log("Seeding service details...");
      for (const [serviceName, details] of Object.entries(servicesDetailsData)) {
        const processedSubcategories = new Map();
        if (details.subcategories) {
          for (const [subCatName, subCatDetails] of Object.entries(details.subcategories)) {
            let processedSubCategory = { image: subCatDetails.image };
            if (subCatDetails.serviceTypes) {
              processedSubCategory.serviceTypes = new Map();
              for (const [serviceTypeName, serviceTypeDetails] of Object.entries(subCatDetails.serviceTypes)) {
                processedSubCategory.serviceTypes.set(serviceTypeName, {
                  image: serviceTypeDetails.image,
                  categories: serviceTypeDetails.categories,
                });
              }
            }
            if (subCatDetails.categories) {
              processedSubCategory.categories = subCatDetails.categories;
            }
            processedSubcategories.set(subCatName, processedSubCategory);
          }
        }
        const serviceDetailData = {
          serviceName,
          subcategories: processedSubcategories,
          services: details.services,
        };
        const serviceDetail = new ServiceDetail(serviceDetailData);
        await serviceDetail.save();
      }
      console.log("Service details seeded successfully.");
    }

    // Seed regular users
    const savedUsers = [];
    for (const u of USERS) {
      let doc = await User.findOne({ $or: [{ email: u.email }, { phone: u.phone }] });
      if (!doc) { doc = await new User(u).save(); }
      savedUsers.push(doc);
    }

    // Seed providers (30 providers per service category = 180 total)
    const { users: dummyUsers, profiles: dummyProfiles } = generateAllDummyProviders();
    const savedProviders = [];

    const existingProvCount = await ServiceProvider.countDocuments();
    if (existingProvCount < dummyProfiles.length) {
      console.log(`Seeding ${dummyProfiles.length} dummy service providers (30 per service category)...`);
      for (let i = 0; i < dummyProfiles.length; i++) {
        const pu = dummyUsers[i];
        const pp = dummyProfiles[i];
        let userDoc = await User.findOne({ $or: [{ email: pu.email }, { phone: pu.phone }] });
        if (!userDoc) { userDoc = await new User(pu).save(); }
        let provDoc = await ServiceProvider.findOne({ $or: [{ email: pp.email }, { phone: pp.phone }] });
        if (!provDoc) {
          provDoc = await new ServiceProvider({ ...pp, user: userDoc._id }).save();
        }
        savedProviders.push(provDoc);
      }
      console.log(`Seeded ${savedProviders.length} service providers successfully (30 in each service).`);
    } else {
      const allP = await ServiceProvider.find().limit(20);
      savedProviders.push(...allP);
    }

    // Seed reviews
    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0 && savedProviders.length > 0 && savedUsers.length > 0) {
      for (const provider of savedProviders) {
        for (const reviewer of savedUsers.slice(0, 2)) {
          const t = REVIEWS_TEMPLATE[Math.floor(Math.random() * REVIEWS_TEMPLATE.length)];
          await new Review({ user: reviewer._id, provider: provider._id, rating: t.rating, comment: t.comment }).save();
        }
      }
    }

    // Seed sample bookings
    const payCount = await Payment.countDocuments();
    if (payCount === 0 && savedUsers.length > 0 && savedProviders.length > 0) {
      const allServices = await Service.find().lean();
      const svcId = (i) => allServices[i % allServices.length]?._id || new mongoose.Types.ObjectId();
      const bookings = [
        { user: savedUsers[0]._id, provider: savedProviders[0]._id, orderId: 'order_dummy_001', paymentId: 'pay_dummy_001', amount: 79900, currency: 'INR', status: 'SERVICE_BOOKED', method: 'UPI', items: [{ serviceId: svcId(0), title: 'Haircut & Blow-dry', quantity: 1, price: 599, total: 599, image: 'assets/services/WomenSalon.svg' }, { serviceId: svcId(1), title: 'Facial (Basic)', quantity: 1, price: 200, total: 200, image: 'assets/services/WomenSalon.svg' }], summary: { subtotal: 799, tax: 0, total: 799, itemCount: 2 }, customerDetails: { name: 'Priya Sharma', email: 'user1@example.com', phone: '9876543001' }, attempts: 1 },
        { user: savedUsers[1]._id, provider: savedProviders[2]._id, orderId: 'order_dummy_002', paymentId: 'pay_dummy_002', amount: 149900, currency: 'INR', status: 'PROVIDER_ASSIGNED', method: 'Card', items: [{ serviceId: svcId(2), title: 'AC Service (1 Ton)', quantity: 1, price: 999, total: 999, image: 'assets/services/ACRepair.svg' }, { serviceId: svcId(3), title: 'AC Gas Refill', quantity: 1, price: 500, total: 500, image: 'assets/services/ACRepair.svg' }], summary: { subtotal: 1499, tax: 0, total: 1499, itemCount: 2 }, customerDetails: { name: 'Rahul Mehta', email: 'user2@example.com', phone: '9876543002' }, attempts: 1 },
        { user: savedUsers[2]._id, provider: savedProviders[4]._id, orderId: 'order_dummy_003', paymentId: 'pay_dummy_003', amount: 49900, currency: 'INR', status: 'SERVICE_COMPLETED', method: 'NetBanking', items: [{ serviceId: svcId(4), title: 'Fan Installation', quantity: 2, price: 199, total: 398, image: 'assets/services/Electrician.svg' }, { serviceId: svcId(5), title: 'Switch Board Repair', quantity: 1, price: 101, total: 101, image: 'assets/services/Electrician.svg' }], summary: { subtotal: 499, tax: 0, total: 499, itemCount: 3 }, customerDetails: { name: 'Anita Verma', email: 'user3@example.com', phone: '9876543003' }, attempts: 1 },
      ];
      for (const b of bookings) { await new Payment(b).save(); }
      console.log("Sample bookings & providers seeded successfully.");
    }
  } catch (err) {
    console.error("Error auto-seeding database:", err);
  }
}

// Start server function with fallback
const PORT = process.env.PORT || 5000;

async function startServer() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/Genie";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`Connected to MongoDB at ${uri}`);
  } catch (err) {
    console.log("Local MongoDB server not reachable. Starting Persistent Embedded MongoDB for development environment...");
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const fs = await import("fs");
      const dbPath = process.env.MONGOMS_DB_PATH || path.join(__dirname, "data", "db");
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      const mongoServer = await MongoMemoryServer.create({
        instance: {
          dbPath,
          dbName: "Genie",
          storageEngine: "wiredTiger",
        },
      });
      const memUri = mongoServer.getUri("Genie");
      await mongoose.connect(memUri);
      console.log(`Connected to Persistent Embedded MongoDB at ${memUri} (Data saved to: ${dbPath})`);

      const cleanExit = async () => {
        try {
          await mongoose.disconnect();
          await mongoServer.stop({ doCleanup: false });
        } catch (e) {}
        process.exit(0);
      };
      process.on("SIGINT", cleanExit);
      process.on("SIGTERM", cleanExit);
    } catch (memErr) {
      console.error("Failed to initialize MongoMemoryServer:", memErr);
      process.exit(1);
    }
  }

  await seedIfNeeded();

  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

// Global error-handling middleware — must be registered AFTER all routes
if (process.env.NODE_ENV === "development") {
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  });
}

startServer();

