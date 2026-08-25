import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import User from "../models/User.js";
import ServiceProvider from "../models/ServiceProvider.js";
import Review from "../models/Review.js";

const dummyProviders = [
    // 1. Women's Salon & Spa (5 providers)
    {
        first_name: "Meena",
        last_name: "Pillai",
        email: "meena.salon@example.com",
        phone: "9810000001",
        category: "Women's Salon & Spa",
        skills: ["Haircut", "Bridal Facial", "Manicure", "Pedicure", "Threading", "Hair Spa"],
        experienceYears: 7,
        hourlyRate: 600,
        averageRating: 4.8,
        ratingCount: 34,
        bio: "Expert in all aspects of women's grooming with 7+ years of experience. Specialises in luxury bridal packages and skin care treatments.",
        address: "Andheri West, Mumbai, Maharashtra",
        lat: 19.076,
        lng: 72.8777,
        reviews: [
            { rating: 5, comment: "Absolutely marvelous facial! My skin feels radiant." },
            { rating: 5, comment: "Very punctual and professional therapist. Recommended!" },
            { rating: 4, comment: "Great haircut and manicure session. Clean tools." },
        ],
    },
    {
        first_name: "Ananya",
        last_name: "Sharma",
        email: "ananya.salon@example.com",
        phone: "9810000002",
        category: "Women's Salon & Spa",
        skills: ["Fruit Facial", "Waxing", "Nail Art", "Hair Colouring", "Bleach"],
        experienceYears: 4,
        hourlyRate: 400,
        averageRating: 4.5,
        ratingCount: 19,
        bio: "Certified beautician specializing in organic skin treatments and modern hair coloring techniques.",
        address: "Bandra West, Mumbai, Maharashtra",
        lat: 19.0596,
        lng: 72.8295,
        reviews: [
            { rating: 5, comment: "Nail art was super creative and long lasting!" },
            { rating: 4, comment: "Good service, very polite demeanor." },
        ],
    },
    {
        first_name: "Pooja",
        last_name: "Deshmukh",
        email: "pooja.spa@example.com",
        phone: "9810000003",
        category: "Women's Salon & Spa",
        skills: ["Aroma Therapy Massage", "Deep Tissue Massage", "KeraSmoothing", "Hair Extensions"],
        experienceYears: 11,
        hourlyRate: 850,
        averageRating: 4.9,
        ratingCount: 52,
        bio: "Master therapist & hair stylist with 11+ years at top luxury salons in India. Unmatched perfection.",
        address: "Juhu, Mumbai, Maharashtra",
        lat: 19.1075,
        lng: 72.8263,
        reviews: [
            { rating: 5, comment: "Best massage ever! Total stress buster." },
            { rating: 5, comment: "Kerasmoothing turned out amazing. 10/10." },
            { rating: 5, comment: "Worth every single rupee." },
        ],
    },
    {
        first_name: "Ritu",
        last_name: "Kapoor",
        email: "ritu.salon@example.com",
        phone: "9810000004",
        category: "Women's Salon & Spa",
        skills: ["Quick Facial", "Eyebrow Threading", "Upperlip", "Basic Haircut"],
        experienceYears: 3,
        hourlyRate: 300,
        averageRating: 4.2,
        ratingCount: 14,
        bio: "Budget-friendly quick salon care at home. Hygienic products and warm hospitality.",
        address: "Powai, Mumbai, Maharashtra",
        lat: 19.1176,
        lng: 72.906,
        reviews: [
            { rating: 4, comment: "Quick and hassle-free threading at home." },
            { rating: 4, comment: "Decent work for the price." },
        ],
    },
    {
        first_name: "Shalini",
        last_name: "Sen",
        email: "shalini.beautician@example.com",
        phone: "9810000005",
        category: "Women's Salon & Spa",
        skills: ["HydraFacial", "Korean Skin Care", "Head Massage", "Manicure Deluxe"],
        experienceYears: 8,
        hourlyRate: 700,
        averageRating: 4.7,
        ratingCount: 28,
        bio: "Dermatology-certified aesthetic cosmetologist bringing clinical grade facials to your doorstep.",
        address: "Worli, Mumbai, Maharashtra",
        lat: 19.0176,
        lng: 72.817,
        reviews: [
            { rating: 5, comment: "HydraFacial gave instant glass skin glow!" },
            { rating: 4, comment: "Very thorough and knowledgeable expert." },
        ],
    },

    // 2. Men's Salon & Spa (5 providers)
    {
        first_name: "Arjun",
        last_name: "Nair",
        email: "arjun.barber@example.com",
        phone: "9820000001",
        category: "Men's Salon & Spa",
        skills: ["Fade Haircut", "Beard Styling", "Face Massage", "Hair Colour", "De-tan"],
        experienceYears: 5,
        hourlyRate: 450,
        averageRating: 4.6,
        ratingCount: 26,
        bio: "Certified men's grooming expert. Known for razor-sharp fade cuts and relaxing head massages.",
        address: "Connaught Place, New Delhi",
        lat: 28.6139,
        lng: 77.209,
        reviews: [
            { rating: 5, comment: "Precision fade haircut! Best barber in town." },
            { rating: 4, comment: "Relaxing face massage, very fresh look." },
        ],
    },
    {
        first_name: "Vikram",
        last_name: "Rathore",
        email: "vikram.barber@example.com",
        phone: "9820000002",
        category: "Men's Salon & Spa",
        skills: ["Beard Trim & Shape", "Royal Shave", "Head Massage", "Charcoal Facial"],
        experienceYears: 9,
        hourlyRate: 650,
        averageRating: 4.9,
        ratingCount: 45,
        bio: "Celebrity stylist with 9 years of expertise in classic & trendsetting men's haircuts.",
        address: "South Extension, New Delhi",
        lat: 28.5688,
        lng: 77.2215,
        reviews: [
            { rating: 5, comment: "Top class grooming. Royal shave felt like a spa!" },
            { rating: 5, comment: "Punctual, polite, and extremely skilled." },
        ],
    },
    {
        first_name: "Karan",
        last_name: "Malhotra",
        email: "karan.grooming@example.com",
        phone: "9820000003",
        category: "Men's Salon & Spa",
        skills: ["Basic Haircut", "Shave", "Head Oil Massage", "Ear/Nose Trimming"],
        experienceYears: 2,
        hourlyRate: 250,
        averageRating: 4.3,
        ratingCount: 11,
        bio: "Fast, clean, affordable men's haircut and beard maintenance at your home.",
        address: "Lajpat Nagar, New Delhi",
        lat: 28.5693,
        lng: 77.2435,
        reviews: [
            { rating: 4, comment: "Good simple haircut at affordable price." },
            { rating: 4, comment: "Prompt service." },
        ],
    },
    {
        first_name: "Sameer",
        last_name: "Khan",
        email: "sameer.stylist@example.com",
        phone: "9820000004",
        category: "Men's Salon & Spa",
        skills: ["Hair Smoothing", "Hair Spa", "De-tan Pack", "Anti-dandruff Treatment"],
        experienceYears: 6,
        hourlyRate: 500,
        averageRating: 4.7,
        ratingCount: 31,
        bio: "Specialist in hair care treatments and relaxed grooming packages for working professionals.",
        address: "Gurugram Sector 29, Haryana",
        lat: 28.4682,
        lng: 77.0637,
        reviews: [
            { rating: 5, comment: "Anti-dandruff hair spa worked wonders." },
            { rating: 4, comment: "Clean hygienic setup." },
        ],
    },
    {
        first_name: "Aman",
        last_name: "Preet",
        email: "aman.barber@example.com",
        phone: "9820000005",
        category: "Men's Salon & Spa",
        skills: ["Buzz Cut", "Beard Coloring", "Face Scrub", "Pedicure for Men"],
        experienceYears: 12,
        hourlyRate: 800,
        averageRating: 4.8,
        ratingCount: 58,
        bio: "Senior stylist with 12 years experience. High precision grooming and premium skincare products.",
        address: "Noida Sector 18, Uttar Pradesh",
        lat: 28.5708,
        lng: 77.3261,
        reviews: [
            { rating: 5, comment: "Aman is a true master barber. Perfect beard trim." },
            { rating: 5, comment: "Great attention to detail." },
        ],
    },

    // 3. AC & Appliances Repair (5 providers)
    {
        first_name: "Kavya",
        last_name: "Reddy",
        email: "kavya.ac@example.com",
        phone: "9830000001",
        category: "AC & Appliances Repair",
        skills: ["AC Foam Service", "AC Repair", "Washing Machine Repair", "Refrigerator Repair", "Microwave Repair"],
        experienceYears: 8,
        hourlyRate: 800,
        averageRating: 4.7,
        ratingCount: 41,
        bio: "Experienced senior technician for all split & inverter AC brands. Quick diagnosis & guaranteed 30-day warranty.",
        address: "Anna Nagar, Chennai, Tamil Nadu",
        lat: 13.0827,
        lng: 80.2707,
        reviews: [
            { rating: 5, comment: "Diagnosed the AC cooling issue in 10 minutes!" },
            { rating: 4, comment: "Very clear explanation of fault. Fixed promptly." },
        ],
    },
    {
        first_name: "Suresh",
        last_name: "Babu",
        email: "suresh.repair@example.com",
        phone: "9830000002",
        category: "AC & Appliances Repair",
        skills: ["Gas Refill R32/R410", "AC Installation", "Compressor Replacement", "PCB Repair"],
        experienceYears: 14,
        hourlyRate: 950,
        averageRating: 4.9,
        ratingCount: 63,
        bio: "Master HVAC engineer with 14 years field experience. Expert in inverter PCB and heavy compressor repairs.",
        address: "T. Nagar, Chennai, Tamil Nadu",
        lat: 13.0418,
        lng: 80.2341,
        reviews: [
            { rating: 5, comment: "Saved my inverter AC compressor! Top class technician." },
            { rating: 5, comment: "Extremely skilled and honest worker." },
        ],
    },
    {
        first_name: "Ramesh",
        last_name: "Chand",
        email: "ramesh.appliances@example.com",
        phone: "9830000003",
        category: "AC & Appliances Repair",
        skills: ["Washing Machine Front Load", "Microwave Magnetron", "Water Purifier Service"],
        experienceYears: 5,
        hourlyRate: 450,
        averageRating: 4.4,
        ratingCount: 22,
        bio: "Specialist in home laundry & kitchen appliance repairs. Genuine spare parts guaranteed.",
        address: "Velachery, Chennai, Tamil Nadu",
        lat: 12.9815,
        lng: 80.218,
        reviews: [
            { rating: 4, comment: "Washing machine noise problem resolved completely." },
            { rating: 4, comment: "Fair pricing and fast service." },
        ],
    },
    {
        first_name: "Manoj",
        last_name: "Tiwari",
        email: "manoj.ac@example.com",
        phone: "9830000004",
        category: "AC & Appliances Repair",
        skills: ["Jet AC Service", "Deep Cleansing Service", "Drain Pipe Unclogging"],
        experienceYears: 3,
        hourlyRate: 350,
        averageRating: 4.3,
        ratingCount: 15,
        bio: "Affordable high-pressure jet pump AC cleaning & routine filter maintenance.",
        address: "Adyar, Chennai, Tamil Nadu",
        lat: 13.0012,
        lng: 80.2565,
        reviews: [
            { rating: 4, comment: "Clean foam jet service. Chilling cooling now." },
        ],
    },
    {
        first_name: "Pradeep",
        last_name: "Verma",
        email: "pradeep.tech@example.com",
        phone: "9830000005",
        category: "AC & Appliances Repair",
        skills: ["Double Door Refrigerator Repair", "Chimney Repair", "Geyser Service"],
        experienceYears: 10,
        hourlyRate: 750,
        averageRating: 4.8,
        ratingCount: 37,
        bio: "Multi-appliance expert. Fast response time, transparent pricing, and 100% genuine parts replacement.",
        address: "OMR, Chennai, Tamil Nadu",
        lat: 12.9352,
        lng: 80.2377,
        reviews: [
            { rating: 5, comment: "Geyser heating coil replaced effortlessly." },
            { rating: 5, comment: "Highly reliable technician." },
        ],
    },

    // 4. Cleaning & Pest Control (5 providers)
    {
        first_name: "Ravi",
        last_name: "Kumar",
        email: "ravi.cleaning@example.com",
        phone: "9840000001",
        category: "Cleaning & Pest Control",
        skills: ["Home Deep Cleaning", "Sofa Shampooing", "Carpet Cleaning", "Cockroach Control", "Termite Treatment"],
        experienceYears: 6,
        hourlyRate: 350,
        averageRating: 4.5,
        ratingCount: 29,
        bio: "Professional deep cleaning and herbal pest control. Eco-friendly, non-toxic chemicals safe for kids and pets.",
        address: "Indiranagar, Bangalore, Karnataka",
        lat: 12.9716,
        lng: 77.5946,
        reviews: [
            { rating: 5, comment: "Sofa looks brand new after vacuuming!" },
            { rating: 4, comment: "Punctual team, odorless cockroach gel." },
        ],
    },
    {
        first_name: "Ganesh",
        last_name: "Hegde",
        email: "ganesh.pest@example.com",
        phone: "9840000002",
        category: "Cleaning & Pest Control",
        skills: ["Bed Bug Heat Treatment", "Cockroach Gel Treatment", "Mosquito Control", "Rodent Control"],
        experienceYears: 10,
        hourlyRate: 600,
        averageRating: 4.9,
        ratingCount: 54,
        bio: "Government-certified pest exterminator. 100% elimination guarantee with 6-month free warranty.",
        address: "Koramangala, Bangalore, Karnataka",
        lat: 12.9352,
        lng: 77.6245,
        reviews: [
            { rating: 5, comment: "Bed bugs completely gone after 1 visit!" },
            { rating: 5, comment: "Thorough inspection and treatment." },
        ],
    },
    {
        first_name: "Lakshmi",
        last_name: "Narayanan",
        email: "lakshmi.cleaning@example.com",
        phone: "9840000003",
        category: "Cleaning & Pest Control",
        skills: ["Kitchen Deep Cleaning", "Bathroom Scrubbing", "Balcony Wash", "Window Glass Polish"],
        experienceYears: 4,
        hourlyRate: 300,
        averageRating: 4.4,
        ratingCount: 18,
        bio: "Detail-oriented kitchen and washroom deep sanitization specialist. Spotless shine guaranteed.",
        address: "Whitefield, Bangalore, Karnataka",
        lat: 12.9698,
        lng: 77.75,
        reviews: [
            { rating: 4, comment: "Kitchen oil stains scrubbed off cleanly." },
        ],
    },
    {
        first_name: "Syed",
        last_name: "Ibrahim",
        email: "syed.services@example.com",
        phone: "9840000004",
        category: "Cleaning & Pest Control",
        skills: ["Full House Move-in Cleaning", "Villa Deep Clean", "Water Tank Cleaning"],
        experienceYears: 8,
        hourlyRate: 500,
        averageRating: 4.7,
        ratingCount: 39,
        bio: "Complete house sanitization team with heavy-duty industrial vacuum cleaners & steam sanitizers.",
        address: "HSR Layout, Bangalore, Karnataka",
        lat: 12.9121,
        lng: 77.6446,
        reviews: [
            { rating: 5, comment: "Move-in deep clean was flawless. Highly recommended." },
            { rating: 4, comment: "Hardworking team." },
        ],
    },
    {
        first_name: "Venkatesh",
        last_name: "Prasad",
        email: "venky.clean@example.com",
        phone: "9840000005",
        category: "Cleaning & Pest Control",
        skills: ["Car Detailing", "Sofa Stain Removal", "Mattress Sanitization"],
        experienceYears: 5,
        hourlyRate: 400,
        averageRating: 4.6,
        ratingCount: 23,
        bio: "Upholstery stain removal expert using German dry-foam technology.",
        address: "Jayanagar, Bangalore, Karnataka",
        lat: 12.925,
        lng: 77.5938,
        reviews: [
            { rating: 5, comment: "Mattress sanitization removed stubborn old water marks." },
        ],
    },

    // 5. Electrician, Plumber & Carpenter (5 providers)
    {
        first_name: "Sunita",
        last_name: "Rao",
        email: "sunita.trades@example.com",
        phone: "9850000001",
        category: "Electrician, Plumber & Carpenter",
        skills: ["Wiring", "Fan Installation", "Pipe Repair", "Tap Fitting", "Furniture Assembly"],
        experienceYears: 10,
        hourlyRate: 700,
        averageRating: 4.9,
        ratingCount: 51,
        bio: "Multi-trade master technician. Expert in complex house wiring, leak troubleshooting, and wooden furniture repairs.",
        address: "Kothrud, Pune, Maharashtra",
        lat: 18.5204,
        lng: 73.8567,
        reviews: [
            { rating: 5, comment: "Sunita fixed all my house electrical & plumbing leaks!" },
            { rating: 5, comment: "Punctual, super capable multi-skilled technician." },
        ],
    },
    {
        first_name: "Santosh",
        last_name: "Shinde",
        email: "santosh.plumber@example.com",
        phone: "9850000002",
        category: "Electrician, Plumber & Carpenter",
        skills: ["Drainage Unclogging", "Flush Tank Repair", "Basin Installation", "Water Tank Pipeline"],
        experienceYears: 12,
        hourlyRate: 600,
        averageRating: 4.8,
        ratingCount: 42,
        bio: "24/7 emergency plumber for severe leaks, blockage clearing, and sanitary fitting installation.",
        address: "Viman Nagar, Pune, Maharashtra",
        lat: 18.5679,
        lng: 73.9143,
        reviews: [
            { rating: 5, comment: "Unclogged main drain line in 20 minutes." },
            { rating: 4, comment: "Very clean work." },
        ],
    },
    {
        first_name: "Mahesh",
        last_name: "Pawar",
        email: "mahesh.electrician@example.com",
        phone: "9850000003",
        category: "Electrician, Plumber & Carpenter",
        skills: ["MCB Tripping Repair", "Short Circuit Detection", "Chandelier Hanging", "Inverter Wiring"],
        experienceYears: 6,
        hourlyRate: 450,
        averageRating: 4.6,
        ratingCount: 27,
        bio: "Government licensed wireman. Fast short-circuit troubleshooting & heavy appliance point wiring.",
        address: "Baner, Pune, Maharashtra",
        lat: 18.559,
        lng: 73.7868,
        reviews: [
            { rating: 5, comment: "Solved MCB tripping issue quickly." },
            { rating: 4, comment: "Polite and knowledgeable." },
        ],
    },
    {
        first_name: "Dinesh",
        last_name: "Sutar",
        email: "dinesh.carpenter@example.com",
        phone: "9850000004",
        category: "Electrician, Plumber & Carpenter",
        skills: ["Door Hinge Repair", "Lock Change & Fitting", "Modular Kitchen Cabinet Repair", "Bed Frame Fixing"],
        experienceYears: 15,
        hourlyRate: 850,
        averageRating: 4.9,
        ratingCount: 62,
        bio: "Master carpenter with 15 years experience in custom woodwork, modern locks, and wardrobe assembly.",
        address: "Wakad, Pune, Maharashtra",
        lat: 18.5987,
        lng: 73.7688,
        reviews: [
            { rating: 5, comment: "Assembled 6-door wardrobe flawlessly." },
            { rating: 5, comment: "Top quality woodwork repairs." },
        ],
    },
    {
        first_name: "Anil",
        last_name: "Kadam",
        email: "anil.handyman@example.com",
        phone: "9850000005",
        category: "Electrician, Plumber & Carpenter",
        skills: ["TV Wall Mount", "Curtain Rod Fitting", "Mirror Drilling", "Minor Plumbing Leak"],
        experienceYears: 3,
        hourlyRate: 300,
        averageRating: 4.3,
        ratingCount: 16,
        bio: "Affordable handyman for all household wall mountings, hanging fixtures, and minor repairs.",
        address: "Hinjawadi, Pune, Maharashtra",
        lat: 18.5912,
        lng: 73.7389,
        reviews: [
            { rating: 4, comment: "Mounted 55 inch TV smoothly." },
        ],
    },

    // 6. Painting & Waterproofing (5 providers)
    {
        first_name: "Deepak",
        last_name: "Joshi",
        email: "deepak.paint@example.com",
        phone: "9860000001",
        category: "Painting & Waterproofing",
        skills: ["Interior Painting", "Exterior Painting", "Waterproofing", "Texture Paint", "Wall Putty"],
        experienceYears: 9,
        hourlyRate: 500,
        averageRating: 4.4,
        ratingCount: 20,
        bio: "Asian Paints certified specialist. Smooth finish, dustless sanding, and 3-layer terrace waterproofing.",
        address: "Satellite, Ahmedabad, Gujarat",
        lat: 23.0225,
        lng: 72.5714,
        reviews: [
            { rating: 5, comment: "Living room wall texture paint looks fantastic." },
            { rating: 4, comment: "Clean painting process with plastic covers." },
        ],
    },
    {
        first_name: "Harish",
        last_name: "Patel",
        email: "harish.waterproof@example.com",
        phone: "9860000002",
        category: "Painting & Waterproofing",
        skills: ["Dr. Fixit Terrace Coating", "Bathroom Seepage Repair", "Wall Crack Injection", "Dampness Treatment"],
        experienceYears: 13,
        hourlyRate: 750,
        averageRating: 4.9,
        ratingCount: 48,
        bio: "Structural waterproofing contractor. Specializes in solving stubborn dampness & roof leaks with 5-yr guarantee.",
        address: "Bodakdev, Ahmedabad, Gujarat",
        lat: 23.0373,
        lng: 72.512,
        reviews: [
            { rating: 5, comment: "Terrace leak stopped completely after monsoon!" },
            { rating: 5, comment: "Very expert diagnosis and long lasting fix." },
        ],
    },
    {
        first_name: "Nitin",
        last_name: "Shah",
        email: "nitin.colors@example.com",
        phone: "9860000003",
        category: "Painting & Waterproofing",
        skills: ["Stencil Design", "Accent Wall Paint", "Wood Polish & Polish Refinishing", "PU Coating"],
        experienceYears: 7,
        hourlyRate: 600,
        averageRating: 4.7,
        ratingCount: 30,
        bio: "Creative interior designer & wall artist. Transforms plain walls into stunning luxury accent features.",
        address: "Navrangpura, Ahmedabad, Gujarat",
        lat: 23.0366,
        lng: 72.5611,
        reviews: [
            { rating: 5, comment: "Stencil design wall is the highlight of our home now." },
        ],
    },
    {
        first_name: "Rajesh",
        last_name: "Prajapati",
        email: "rajesh.painter@example.com",
        phone: "9860000004",
        category: "Painting & Waterproofing",
        skills: ["Single Room Paint Touch-up", "Rental Property Painting", "Enamel Metal Paint"],
        experienceYears: 4,
        hourlyRate: 350,
        averageRating: 4.3,
        ratingCount: 17,
        bio: "Fast & economical repainting services for rental apartments and budget homes.",
        address: "Prahlad Nagar, Ahmedabad, Gujarat",
        lat: 23.0125,
        lng: 72.5028,
        reviews: [
            { rating: 4, comment: "Painted 2BHK flat in 2 days. Good speed." },
        ],
    },
    {
        first_name: "Bhavesh",
        last_name: "Solanki",
        email: "bhavesh.paint@example.com",
        phone: "9860000005",
        category: "Painting & Waterproofing",
        skills: ["Full Villa Exterior Paint", "Anti-Fungal Paint", "Pop False Ceiling Repair"],
        experienceYears: 10,
        hourlyRate: 650,
        averageRating: 4.8,
        ratingCount: 35,
        bio: "Commercial & residential exterior weather-proof painting expert with scaffolding machinery.",
        address: "SG Highway, Ahmedabad, Gujarat",
        lat: 23.0543,
        lng: 72.5085,
        reviews: [
            { rating: 5, comment: "Bungalow exterior paint looks fresh and vibrant!" },
        ],
    },
];

async function runSeed() {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Genie";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    // Fetch existing regular users to link reviews to
    let reviewers = await User.find({ role: "user" });
    if (reviewers.length === 0) {
        // Create 2 test regular users if none exist
        const u1 = await new User({ first_name: "Priya", last_name: "Sharma", email: "user1@example.com", phone: "9876543001", password: "password123", role: "user" }).save();
        const u2 = await new User({ first_name: "Rahul", last_name: "Mehta", email: "user2@example.com", phone: "9876543002", password: "password123", role: "user" }).save();
        reviewers = [u1, u2];
    }

    // Clean existing providers & provider user accounts to avoid duplicate clutter
    await ServiceProvider.deleteMany({});
    await User.deleteMany({ role: "provider" });
    await Review.deleteMany({});

    console.log("\nSeeding 30 Providers (5 per category)...");

    for (const p of dummyProviders) {
        // 1. Create provider User account
        const userDoc = await new User({
            first_name: p.first_name,
            last_name: p.last_name,
            email: p.email,
            phone: p.phone,
            password: "password123",
            role: "provider",
        }).save();

        // 2. Create ServiceProvider document
        const provDoc = await new ServiceProvider({
            user: userDoc._id,
            name: `${p.first_name} ${p.last_name}`,
            email: p.email,
            phone: p.phone,
            category: p.category,
            skills: p.skills,
            experienceYears: p.experienceYears,
            hourlyRate: p.hourlyRate,
            bio: p.bio,
            isVerified: true,
            averageRating: p.averageRating,
            ratingCount: p.ratingCount,
            location: {
                type: "Point",
                coordinates: [p.lng, p.lat],
                address: p.address,
            },
            contact: {
                phone: p.phone,
                email: p.email,
                address: p.address,
            },
        }).save();

        // 3. Create real Review documents for this provider
        for (let i = 0; i < p.reviews.length; i++) {
            const revData = p.reviews[i];
            const reviewerUser = reviewers[i % reviewers.length];
            await new Review({
                user: reviewerUser._id,
                provider: provDoc._id,
                rating: revData.rating,
                comment: revData.comment,
            }).save();
        }

        console.log(`  ✓ ${provDoc.name} | ${provDoc.category} | ${provDoc.experienceYears} yrs | ₹${provDoc.hourlyRate}/hr | ${provDoc.averageRating}★ (${p.reviews.length} reviews)`);
    }

    const totalProviders = await ServiceProvider.countDocuments();
    const totalReviews = await Review.countDocuments();

    console.log("\n=========================================");
    console.log(`SEED COMPLETED SUCCESSFULLY!`);
    console.log(`Total Providers: ${totalProviders} (5 per category across 6 departments)`);
    console.log(`Total Reviews:   ${totalReviews}`);
    console.log("=========================================\n");

    await mongoose.disconnect();
}

runSeed().catch((err) => {
    console.error("Seed error:", err);
    mongoose.disconnect();
});
