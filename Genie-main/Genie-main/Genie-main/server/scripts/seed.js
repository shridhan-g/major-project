/**
 * Genie — Comprehensive Seed Script
 *
 * Populates the database with realistic dummy data:
 *   - 1 Admin user
 *   - 5 Regular users
 *   - 6 Verified Service Providers (one per service category)
 *   - Reviews for each provider (2-3 per provider)
 *   - 3 Sample payments/bookings
 *   - Services and ServiceDetails (auto-seeded by server.js, but also done here)
 *
 * Usage (from the /server directory):
 *   npm run seed
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import User            from '../models/User.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Review          from '../models/Review.js';
import Payment         from '../models/Payment.js';
import Service         from '../models/Service.js';
import ServiceDetail   from '../models/ServiceDetail.js';
import { servicesData }        from '../data/servicesData.js';
import { servicesDetailsData } from '../data/servicesDetailsData.js';

const randBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const ADMIN = { first_name:'Admin', last_name:'User', email:'admin@gmail.com', phone:'9999999999', password:'admin@1234', role:'admin' };

const USERS = [
  { first_name:'Priya',  last_name:'Sharma', email:'user1@example.com', phone:'9876543001', password:'password123', role:'user' },
  { first_name:'Rahul',  last_name:'Mehta',  email:'user2@example.com', phone:'9876543002', password:'password123', role:'user' },
  { first_name:'Anita',  last_name:'Verma',  email:'user3@example.com', phone:'9876543003', password:'password123', role:'user' },
  { first_name:'Vikram', last_name:'Singh',  email:'user4@example.com', phone:'9876543004', password:'password123', role:'user' },
  { first_name:'Sneha',  last_name:'Kapoor', email:'user5@example.com', phone:'9876543005', password:'password123', role:'user' },
];

const PROVIDER_USERS = [
  { first_name:'Meena',  last_name:'Pillai',  email:'provider1@example.com', phone:'9800000001', password:'password123', role:'provider' },
  { first_name:'Arjun',  last_name:'Nair',    email:'provider2@example.com', phone:'9800000002', password:'password123', role:'provider' },
  { first_name:'Kavya',  last_name:'Reddy',   email:'provider3@example.com', phone:'9800000003', password:'password123', role:'provider' },
  { first_name:'Ravi',   last_name:'Kumar',   email:'provider4@example.com', phone:'9800000004', password:'password123', role:'provider' },
  { first_name:'Sunita', last_name:'Rao',     email:'provider5@example.com', phone:'9800000005', password:'password123', role:'provider' },
  { first_name:'Deepak', last_name:'Joshi',   email:'provider6@example.com', phone:'9800000006', password:'password123', role:'provider' },
];

const PROVIDER_PROFILES = [
  { name:'Meena Pillai',  email:'provider1@example.com', phone:'9800000001', category:"Women's Salon & Spa",              skills:['Hair cut','Facial','Manicure','Pedicure','Threading'],              experienceYears:7,  hourlyRate:600,  bio:'Expert in all aspects of women\'s grooming with 7+ years of experience. Specialises in bridal packages and skin treatments.', isVerified:true, averageRating:4.8, ratingCount:24, location:{ type:'Point', coordinates:[72.8777,19.0760], address:'Andheri West, Mumbai, Maharashtra' }, contact:{ phone:'9800000001', email:'provider1@example.com', address:'Andheri West, Mumbai' } },
  { name:'Arjun Nair',    email:'provider2@example.com', phone:'9800000002', category:"Men's Salon & Spa",                skills:['Haircut','Beard grooming','Face massage','Hair colour','De-tan'],  experienceYears:5,  hourlyRate:450,  bio:'Certified men\'s grooming expert. Known for precision cuts and relaxing massages.',              isVerified:true, averageRating:4.6, ratingCount:18, location:{ type:'Point', coordinates:[77.2090,28.6139], address:'Connaught Place, New Delhi' },           contact:{ phone:'9800000002', email:'provider2@example.com', address:'Connaught Place, New Delhi' } },
  { name:'Kavya Reddy',   email:'provider3@example.com', phone:'9800000003', category:"AC & Appliances Repair",           skills:['AC service','AC repair','Washing machine repair','Refrigerator repair','Microwave repair'], experienceYears:8, hourlyRate:800, bio:'Experienced technician for all AC brands and home appliances. Quick diagnosis and guaranteed repair.',  isVerified:true, averageRating:4.7, ratingCount:31, location:{ type:'Point', coordinates:[80.2707,13.0827], address:'Anna Nagar, Chennai, Tamil Nadu' },        contact:{ phone:'9800000003', email:'provider3@example.com', address:'Anna Nagar, Chennai' } },
  { name:'Ravi Kumar',    email:'provider4@example.com', phone:'9800000004', category:"Cleaning & Pest Control",          skills:['Home deep cleaning','Sofa cleaning','Carpet cleaning','Cockroach control','Termite control'], experienceYears:6, hourlyRate:350, bio:'Professional cleaning and pest control with eco-friendly products. Satisfaction guaranteed.',       isVerified:true, averageRating:4.5, ratingCount:20, location:{ type:'Point', coordinates:[77.5946,12.9716], address:'Indiranagar, Bangalore, Karnataka' },    contact:{ phone:'9800000004', email:'provider4@example.com', address:'Indiranagar, Bangalore' } },
  { name:'Sunita Rao',    email:'provider5@example.com', phone:'9800000005', category:"Electrician, Plumber & Carpenter", skills:['Wiring','Fan installation','Pipe repair','Tap fitting','Furniture assembly'],               experienceYears:10, hourlyRate:700, bio:'Multi-trade professional handling electrical, plumbing, and carpentry work. Available 7 days a week.', isVerified:true, averageRating:4.9, ratingCount:42, location:{ type:'Point', coordinates:[73.8567,18.5204], address:'Kothrud, Pune, Maharashtra' },              contact:{ phone:'9800000005', email:'provider5@example.com', address:'Kothrud, Pune' } },
  { name:'Deepak Joshi',  email:'provider6@example.com', phone:'9800000006', category:"Painting & Waterproofing",         skills:['Interior painting','Exterior painting','Waterproofing','Texture paint','Wall putty'],       experienceYears:9,  hourlyRate:500,  bio:'Expert painter and waterproofing specialist with 9 years of residential and commercial projects.',  isVerified:true, averageRating:4.4, ratingCount:15, location:{ type:'Point', coordinates:[72.5714,23.0225], address:'Satellite, Ahmedabad, Gujarat' },           contact:{ phone:'9800000006', email:'provider6@example.com', address:'Satellite, Ahmedabad' } },
];

const REVIEWS_TEMPLATE = [
  { rating:5, comment:'Absolutely fantastic service! Very professional and thorough.' },
  { rating:5, comment:'Highly recommend! Arrived on time and did an excellent job.' },
  { rating:4, comment:'Good work overall. Will book again next month.' },
  { rating:4, comment:'Friendly and efficient. Happy with the results.' },
  { rating:3, comment:'Decent service. Took a bit longer than expected but quality was okay.' },
  { rating:5, comment:'Exceeded my expectations! The best in the business.' },
  { rating:4, comment:'Neat work, very polite. Highly satisfied.' },
  { rating:5, comment:'Superb attention to detail. Would definitely book again.' },
  { rating:4, comment:'Very helpful and knowledgeable. Solved the problem quickly.' },
];

async function connect() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Genie';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('Connected to MongoDB at ' + uri);
  } catch {
    console.log('Local MongoDB unreachable — starting MongoMemoryServer...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    console.log('Connected to MongoMemoryServer (data will not persist after process exit)');
    console.log('Tip: Install MongoDB locally for persistent data.');
  }
}

async function seed() {
  await connect();
  console.log('\nStarting seed...\n');

  // Services
  const svcCount = await Service.countDocuments();
  if (svcCount === 0) {
    const servicesWithOrder = servicesData.map((s, i) => ({ ...s, order: i }));
    await Service.insertMany(servicesWithOrder);
    console.log('  Services seeded: ' + servicesWithOrder.length);
  } else { console.log('  Services already seeded (' + svcCount + '). Skipping.'); }

  // Service Details
  const detailCount = await ServiceDetail.countDocuments();
  if (detailCount === 0) {
    for (const [serviceName, details] of Object.entries(servicesDetailsData)) {
      const processedSubcategories = new Map();
      if (details.subcategories) {
        for (const [subCatName, subCatDetails] of Object.entries(details.subcategories)) {
          let processed = { image: subCatDetails.image };
          if (subCatDetails.serviceTypes) {
            processed.serviceTypes = new Map();
            for (const [stName, stDetails] of Object.entries(subCatDetails.serviceTypes)) {
              processed.serviceTypes.set(stName, { image: stDetails.image, categories: stDetails.categories });
            }
          }
          if (subCatDetails.categories) processed.categories = subCatDetails.categories;
          processedSubcategories.set(subCatName, processed);
        }
      }
      await new ServiceDetail({ serviceName, subcategories: processedSubcategories, services: details.services }).save();
    }
    console.log('  Service details seeded.');
  } else { console.log('  Service details already seeded (' + detailCount + '). Skipping.'); }

  // Admin
  let adminDoc = await User.findOne({ role: 'admin' });
  if (!adminDoc) {
    adminDoc = await new User(ADMIN).save();
    console.log('  Admin created: admin@gmail.com / admin@1234');
  } else { console.log('  Admin already exists. Skipping.'); }

  // Regular Users
  const savedUsers = [];
  for (const u of USERS) {
    let doc = await User.findOne({ email: u.email });
    if (!doc) { doc = await new User(u).save(); console.log('  User created: ' + u.email); }
    else { console.log('  User exists: ' + u.email); }
    savedUsers.push(doc);
  }

  // Providers
  const savedProviders = [];
  for (let i = 0; i < PROVIDER_USERS.length; i++) {
    const pu = PROVIDER_USERS[i];
    const pp = PROVIDER_PROFILES[i];
    let userDoc = await User.findOne({ email: pu.email });
    if (!userDoc) { userDoc = await new User(pu).save(); }
    let provDoc = await ServiceProvider.findOne({ email: pp.email });
    if (!provDoc) { provDoc = await new ServiceProvider({ ...pp, user: userDoc._id }).save(); console.log('  Provider created: ' + pp.name + ' (' + pp.category + ')'); }
    else { console.log('  Provider exists: ' + pp.name); }
    savedProviders.push(provDoc);
  }

  // Reviews
  let reviewTotal = 0;
  for (const provider of savedProviders) {
    for (const reviewer of savedUsers.slice(0, 2)) {
      const exists = await Review.findOne({ user: reviewer._id, provider: provider._id });
      if (!exists) {
        const t = REVIEWS_TEMPLATE[randBetween(0, REVIEWS_TEMPLATE.length - 1)];
        await new Review({ user: reviewer._id, provider: provider._id, rating: t.rating, comment: t.comment }).save();
        reviewTotal++;
      }
    }
  }
  console.log('  Reviews created: ' + reviewTotal);

  // Payments
  const payCount = await Payment.countDocuments();
  if (payCount === 0 && savedUsers.length > 0 && savedProviders.length > 0) {
    // Fetch real service IDs from DB (required by Payment schema)
    const allServices = await Service.find().lean();
    const svcId = (i) => allServices[i % allServices.length]?._id || new mongoose.Types.ObjectId();
    const bookings = [
      { user:savedUsers[0]._id, provider:savedProviders[0]._id, orderId:'order_dummy_001', paymentId:'pay_dummy_001', amount:79900, currency:'INR', status:'SERVICE_BOOKED',     method:'UPI',        items:[{ serviceId:svcId(0), title:'Haircut & Blow-dry', quantity:1, price:599, total:599, image:'assets/services/WomenSalon.svg' },{ serviceId:svcId(1), title:'Facial (Basic)', quantity:1, price:200, total:200, image:'assets/services/WomenSalon.svg' }], summary:{ subtotal:799,  tax:0, total:799,  itemCount:2 }, customerDetails:{ name:'Priya Sharma', email:'user1@example.com', phone:'9876543001' }, attempts:1 },
      { user:savedUsers[1]._id, provider:savedProviders[2]._id, orderId:'order_dummy_002', paymentId:'pay_dummy_002', amount:149900, currency:'INR', status:'PROVIDER_ASSIGNED', method:'Card',       items:[{ serviceId:svcId(2), title:'AC Service (1 Ton)', quantity:1, price:999, total:999, image:'assets/services/ACRepair.svg' },{ serviceId:svcId(3), title:'AC Gas Refill', quantity:1, price:500, total:500, image:'assets/services/ACRepair.svg' }], summary:{ subtotal:1499, tax:0, total:1499, itemCount:2 }, customerDetails:{ name:'Rahul Mehta',  email:'user2@example.com', phone:'9876543002' }, attempts:1 },
      { user:savedUsers[2]._id, provider:savedProviders[4]._id, orderId:'order_dummy_003', paymentId:'pay_dummy_003', amount:49900,  currency:'INR', status:'SERVICE_COMPLETED', method:'NetBanking', items:[{ serviceId:svcId(4), title:'Fan Installation', quantity:2, price:199, total:398, image:'assets/services/Electrician.svg' },{ serviceId:svcId(5), title:'Switch Board Repair', quantity:1, price:101, total:101, image:'assets/services/Electrician.svg' }], summary:{ subtotal:499,  tax:0, total:499,  itemCount:3 }, customerDetails:{ name:'Anita Verma',  email:'user3@example.com', phone:'9876543003' }, attempts:1 },
    ];
    for (const b of bookings) { await new Payment(b).save(); }
    console.log('  Sample bookings created: ' + bookings.length);
  } else { console.log('  Payments already seeded (' + payCount + '). Skipping.'); }

  console.log('\n==============================================');
  console.log('SEED COMPLETE!');
  console.log('==============================================');
  console.log('ADMIN:    admin@gmail.com / admin@1234');
  console.log('USERS:    user1@example.com  thru  user5@example.com / password123');
  console.log('PROVIDERS:provider1@example.com thru provider6@example.com / password123');
  console.log('ADMIN URL: http://localhost:5173/admin');
  console.log('==============================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
