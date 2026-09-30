// server/seed/providers_seed.js
// 30 distinct realistic service providers for each of the 6 service categories (180 total)
// With distinct ratings (3.7 - 5.0), diverse wages (₹199 - ₹1200), experience (1 - 20 yrs), locations across India, and rich skills

export const INDIAN_LOCATIONS = [
  { address: "Andheri West, Mumbai", city: "Mumbai", district: "Mumbai Suburban", state: "Maharashtra", pincode: "400053", coordinates: [72.8277, 19.1363] },
  { address: "Bandra West, Mumbai", city: "Mumbai", district: "Mumbai Suburban", state: "Maharashtra", pincode: "400050", coordinates: [72.8335, 19.0596] },
  { address: "Powai, Mumbai", city: "Mumbai", district: "Mumbai Suburban", state: "Maharashtra", pincode: "400076", coordinates: [72.9051, 19.1176] },
  { address: "Borivali West, Mumbai", city: "Mumbai", district: "Mumbai Suburban", state: "Maharashtra", pincode: "400092", coordinates: [72.8567, 19.2307] },
  { address: "Colaba, South Mumbai", city: "Mumbai", district: "Mumbai City", state: "Maharashtra", pincode: "400005", coordinates: [72.8258, 18.9067] },
  { address: "Thane West, Thane", city: "Thane", district: "Thane", state: "Maharashtra", pincode: "400601", coordinates: [72.9781, 19.2183] },
  { address: "Vashi, Navi Mumbai", city: "Navi Mumbai", district: "Thane", state: "Maharashtra", pincode: "400703", coordinates: [72.9982, 19.0771] },
  { address: "Kothrud, Pune", city: "Pune", district: "Pune", state: "Maharashtra", pincode: "411038", coordinates: [73.8123, 18.5074] },
  { address: "Hinjewadi Phase 1, Pune", city: "Pune", district: "Pune", state: "Maharashtra", pincode: "411057", coordinates: [73.7297, 18.5913] },
  { address: "Viman Nagar, Pune", city: "Pune", district: "Pune", state: "Maharashtra", pincode: "411014", coordinates: [73.9143, 18.5679] },
  { address: "Wakad, Pune", city: "Pune", district: "Pune", state: "Maharashtra", pincode: "411057", coordinates: [73.7663, 18.5987] },
  { address: "Connaught Place, Central Delhi", city: "New Delhi", district: "New Delhi", state: "Delhi", pincode: "110001", coordinates: [77.2197, 28.6315] },
  { address: "Hauz Khas, South Delhi", city: "New Delhi", district: "South Delhi", state: "Delhi", pincode: "110016", coordinates: [77.2065, 28.5494] },
  { address: "Dwarka Sector 12, West Delhi", city: "New Delhi", district: "South West Delhi", state: "Delhi", pincode: "110075", coordinates: [77.0425, 28.5921] },
  { address: "Rohini Sector 7, North Delhi", city: "Delhi", district: "North West Delhi", state: "Delhi", pincode: "110085", coordinates: [77.1192, 28.7145] },
  { address: "DLF Phase 3, Gurgaon", city: "Gurgaon", district: "Gurugram", state: "Haryana", pincode: "122002", coordinates: [77.0988, 28.4907] },
  { address: "Sector 62, Noida", city: "Noida", district: "Gautam Buddha Nagar", state: "Uttar Pradesh", pincode: "201309", coordinates: [77.3639, 28.6280] },
  { address: "Indiranagar, East Bangalore", city: "Bangalore", district: "Bangalore Urban", state: "Karnataka", pincode: "560038", coordinates: [77.6412, 12.9719] },
  { address: "Koramangala 5th Block, Bangalore", city: "Bangalore", district: "Bangalore Urban", state: "Karnataka", pincode: "560034", coordinates: [77.6271, 12.9352] },
  { address: "Whitefield Main Road, Bangalore", city: "Bangalore", district: "Bangalore Urban", state: "Karnataka", pincode: "560066", coordinates: [77.7499, 12.9698] },
  { address: "Jayanagar 4th Block, Bangalore", city: "Bangalore", district: "Bangalore Urban", state: "Karnataka", pincode: "560041", coordinates: [77.5838, 12.9250] },
  { address: "HSR Layout Sector 2, Bangalore", city: "Bangalore", district: "Bangalore Urban", state: "Karnataka", pincode: "560102", coordinates: [77.6519, 12.9121] },
  { address: "Electronic City Phase 1, Bangalore", city: "Bangalore", district: "Bangalore Urban", state: "Karnataka", pincode: "560100", coordinates: [77.6762, 12.8399] },
  { address: "Anna Nagar East, Chennai", city: "Chennai", district: "Chennai", state: "Tamil Nadu", pincode: "600040", coordinates: [80.2090, 13.0850] },
  { address: "T. Nagar, Chennai", city: "Chennai", district: "Chennai", state: "Tamil Nadu", pincode: "600017", coordinates: [80.2337, 13.0418] },
  { address: "Velachery Main Road, Chennai", city: "Chennai", district: "Chennai", state: "Tamil Nadu", pincode: "600042", coordinates: [80.2176, 12.9750] },
  { address: "Banjara Hills Road No. 1, Hyderabad", city: "Hyderabad", district: "Hyderabad", state: "Telangana", pincode: "500034", coordinates: [78.4357, 17.4156] },
  { address: "Hitec City, Cyberabad, Hyderabad", city: "Hyderabad", district: "Hyderabad", state: "Telangana", pincode: "500081", coordinates: [78.3727, 17.4435] },
  { address: "Gachibowli, Hyderabad", city: "Hyderabad", district: "Hyderabad", state: "Telangana", pincode: "500032", coordinates: [78.3489, 17.4401] },
  { address: "Satellite, Ahmedabad", city: "Ahmedabad", district: "Ahmedabad", state: "Gujarat", pincode: "380015", coordinates: [72.5186, 23.0287] }
];

// Specific spreads of rating, rates and experience for each of the 30 providers
const PROVIDER_METRICS = [
  { rating: 5.0, rate: 850, exp: 12, count: 68 },
  { rating: 4.9, rate: 650, exp: 9,  count: 54 },
  { rating: 4.8, rate: 500, exp: 7,  count: 42 },
  { rating: 4.8, rate: 950, exp: 15, count: 85 },
  { rating: 4.7, rate: 450, exp: 5,  count: 31 },
  { rating: 4.7, rate: 700, exp: 8,  count: 47 },
  { rating: 4.6, rate: 350, exp: 4,  count: 26 },
  { rating: 4.6, rate: 600, exp: 6,  count: 39 },
  { rating: 4.5, rate: 400, exp: 5,  count: 22 },
  { rating: 4.5, rate: 800, exp: 11, count: 59 },
  { rating: 4.4, rate: 300, exp: 3,  count: 18 },
  { rating: 4.4, rate: 550, exp: 6,  count: 33 },
  { rating: 4.3, rate: 250, exp: 2,  count: 14 },
  { rating: 4.3, rate: 480, exp: 5,  count: 27 },
  { rating: 4.2, rate: 320, exp: 3,  count: 16 },
  { rating: 4.2, rate: 750, exp: 10, count: 48 },
  { rating: 4.1, rate: 220, exp: 2,  count: 11 },
  { rating: 4.1, rate: 420, exp: 4,  count: 19 },
  { rating: 4.0, rate: 280, exp: 2,  count: 12 },
  { rating: 4.0, rate: 620, exp: 8,  count: 36 },
  { rating: 3.9, rate: 199, exp: 1,  count: 8 },
  { rating: 4.9, rate: 900, exp: 14, count: 72 },
  { rating: 4.8, rate: 380, exp: 4,  count: 29 },
  { rating: 4.7, rate: 520, exp: 6,  count: 35 },
  { rating: 4.6, rate: 680, exp: 9,  count: 44 },
  { rating: 4.5, rate: 340, exp: 3,  count: 21 },
  { rating: 4.4, rate: 460, exp: 5,  count: 25 },
  { rating: 4.3, rate: 580, exp: 7,  count: 32 },
  { rating: 4.2, rate: 260, exp: 2,  count: 15 },
  { rating: 4.9, rate: 1100, exp: 18, count: 96 },
];

export const CATEGORY_META = {
  "Women's Salon & Spa": {
    names: [
      "Meena Pillai", "Pooja Sharma", "Anjali Deshmukh", "Sneha Kulkarni", "Deepika Roy",
      "Kavita Sen", "Rashmi Iyer", "Priyanka Nair", "Divya Menon", "Aarti Patel",
      "Sangeeta Verma", "Preeti Joshi", "Neha Bansal", "Ritu Chawla", "Sunita Hegde",
      "Tanvi Rao", "Monika Das", "Shruti Mathur", "Simran Kaur", "Payal Bhatia",
      "Nisha Aggarwal", "Shalini Mukherjee", "Geeta Sundaram", "Rekha Nambiar", "Swati Mahajan",
      "Bhavna Shah", "Vandana Tripathi", "Pallavi Jadhav", "Smita Gokhale", "Alka Saxena"
    ],
    skills: ["Haircut & Styling", "Facial & Cleanup", "Bridal Makeup", "Manicure & Pedicure", "Waxing & Threading", "Hair Spa", "Bleach & D-Tan", "Skin Treatment"],
    bioTemplate: (name, exp, rate) => `Certified aesthetician & beauty specialist with ${exp}+ years experience (₹${rate}/hr). Expert in salon at home, bridal packages, and premium skincare.`
  },
  "Men's Salon & Spa": {
    names: [
      "Arjun Nair", "Vikram Singh", "Rohit Verma", "Karan Malhotra", "Aditya Joshi",
      "Siddharth Rao", "Rahul Kapoor", "Manoj Sharma", "Sameer Khan", "Deepak Rawat",
      "Varun Gupta", "Gaurav Sen", "Kunal Mehra", "Pranav Deshmukh", "Nikhil Hegde",
      "Amit Solanki", "Tushar Patil", "Vivek Menon", "Harish Kumar", "Chetan Reddy",
      "Rishi Saxena", "Dinesh Yadav", "Suraj Mishra", "Lalit Pandey", "Akash Bhatt",
      "Mayank Rastogi", "Anand Swaminathan", "Brijesh Tiwari", "Raghav Ahuja", "Hemant Chauhan"
    ],
    skills: ["Haircut & Beard Trim", "Face Massage & Cleanup", "Hair Color & Styling", "Head Massage", "Charcoal D-Tan", "Pedicure & Foot Care", "Shave & Grooming"],
    bioTemplate: (name, exp, rate) => `Master barber & men's grooming stylist with ${exp} years experience (₹${rate}/hr). Specializes in modern fades, precision beard shaping, and relaxing head massages.`
  },
  "AC & Appliances Repair": {
    names: [
      "Kavya Reddy", "Suresh Kumar", "Ramesh Babu", "Mahesh Chandra", "Gopalakrishnan V",
      "Santosh Yadav", "Rajendra Prasad", "Mukesh Sharma", "Venkatesh Rao", "Dharmendra Singh",
      "Satish Kulkarni", "Mohan Lal", "Jagdish Patel", "Vinod Deshpande", "Babu Rajan",
      "Pravin Sawant", "Subhash Chandra", "Kamlesh Rathore", "Ganesh Murthy", "Ashok Jena",
      "Hariprasad Naidu", "Umesh Gond", "Ravindra Hegde", "Pramod Shinde", "Kailash Mishra",
      "Sitaram Soni", "Nandkishore Dave", "Vijay Shenoy", "Nagarajan S", "Bhupendra Bisht"
    ],
    skills: ["Split & Window AC Repair", "AC Gas Refill & Leakage", "Refrigerator Repair", "Washing Machine Repair", "Microwave Repair", "Geyser Service", "RO Water Purifier Service"],
    bioTemplate: (name, exp, rate) => `Govt certified HVAC & home appliances senior technician with ${exp}+ years experience (₹${rate}/hr). Fast diagnosis and guaranteed genuine spare parts.`
  },
  "Cleaning & Pest Control": {
    names: [
      "Ravi Kumar", "Dilip Barman", "Mohan Das", "Bhanu Prakash", "Shankar Patil",
      "Chandrashekhar M", "Jagannath Swain", "Prakash Mondal", "Kishore Jena", "Laxman Rao",
      "Dhananjay Singh", "Tarun Roy", "Basavaraj N", "Ramakant Tiwari", "Anil Baghel",
      "Somnath Biswas", "Devendra Chouhan", "Girish Mhatre", "Balram Jha", "Govind Raj",
      "Pappu Sharma", "Shashi Bhushan", "Rambabu Gupta", "Chhote Lal", "Madhav Ghosh",
      "Bholanath Saha", "Dayashankar Pal", "Narayan Das", "Shailendra Tomar", "Gokul Prasad"
    ],
    skills: ["Full Home Deep Cleaning", "Kitchen Deep Cleaning", "Bathroom Sanitization", "Sofa & Carpet Shampooing", "Cockroach & Ant Pest Control", "Termite Management", "Bed Bug Elimination"],
    bioTemplate: (name, exp, rate) => `Industrial-grade deep cleaning and certified herbal pest control expert with ${exp} years field experience (₹${rate}/hr). Safe for kids & pets.`
  },
  "Electrician, Plumber & Carpenter": {
    names: [
      "Sunita Rao", "Abdul Jabbar", "Manish Tiwari", "Ram Sevak", "Chirag Panchal",
      "Dinesh Mistry", "Kishore Sutar", "Babulal Jangid", "Aslam Sheikh", "Radheshyam Carpenter",
      "Om Prakash Sharma", "Naseem Ahmed", "Kripal Singh", "Sohan Lal", "Jitendra Varma",
      "Mithun Karmakar", "Balwinder Singh", "Chotelal Yadav", "Bhimsen Gurjar", "Santosh Lohar",
      "Mohd Tariq", "Iqbal Khan", "Rameshwar Dayal", "Prahlad Kumawat", "Hasmukh Prajapati",
      "Vijay Vishwakarma", "Nandram Suthar", "Daya Shankar", "Lallan Paswan", "Fateh Singh"
    ],
    skills: ["House Wiring & MCB Fix", "Ceiling Fan & Chandelier Installation", "Pipe Leakage & Tap Replacement", "Bathroom Fitting & Geyser Plumb", "Furniture Assembly & Repair", "Door Lock & Modular Kitchen Repair", "Drainage & Blockage Clear"],
    bioTemplate: (name, exp, rate) => `Licensed multi-trade technician handling electrical, plumbing, and carpentry projects with ${exp}+ years hands-on craftsmanship (₹${rate}/hr).`
  },
  "Painting & Waterproofing": {
    names: [
      "Deepak Joshi", "Rakesh Painter", "Sukhdev Singh", "Manoj Rangari", "Ratan Lal",
      "Chhagan Bhujbal", "Ashok Chitrakar", "Virendra Chauhan", "Khemraj Sharma", "Nathuram Prajapati",
      "Jagdish Rangwala", "Mohanlal Katheria", "Gyanendra Pratap", "Bhagwan Das", "Shyam Sundar",
      "Bhagirath Mali", "Udaybhan Patel", "Lalaram Kushwaha", "Mukund Lal", "Durgesh Nandan",
      "Badri Prasad", "Brijmohan Saini", "Rajendra Varma", "Shrawan Kumar", "Mahadevappa B",
      "Kanti Bhai Patel", "Dilsher Khan", "Gajendra Rathore", "Premchand Kewat", "Sohanveer Tyagi"
    ],
    skills: ["Interior Emulsion Painting", "Exterior Weatherproof Paint", "Terrace Waterproofing", "Wall Putty & Primer Coat", "Texture & Stencil Wall Designs", "Damp Proofing Treatment", "Wood Polish & Metal Enamel"],
    bioTemplate: (name, exp, rate) => `Professional master painter & waterproofing contractor with ${exp}+ years experience (₹${rate}/hr). Clean, drip-free finish using Asian Paints & Berger.`
  }
};

export function generateAllDummyProviders() {
  const users = [];
  const profiles = [];
  let userIndex = 1;

  for (const [category, meta] of Object.entries(CATEGORY_META)) {
    for (let i = 0; i < 30; i++) {
      const name = meta.names[i] || `Expert Partner ${i + 1}`;
      const nameParts = name.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "Expert";
      const loc = INDIAN_LOCATIONS[i % INDIAN_LOCATIONS.length];
      const metric = PROVIDER_METRICS[i % PROVIDER_METRICS.length];

      const email = `prov_${category.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 6)}_${i + 1}@genie.local`;
      const phone = `98${String(10000000 + userIndex).padStart(8, '0')}`;
      const experienceYears = metric.exp;
      const hourlyRate = metric.rate;
      const averageRating = metric.rating;
      const ratingCount = metric.count;

      const user = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password: "password123",
        role: "provider"
      };

      const profile = {
        name,
        email,
        phone,
        category,
        skills: meta.skills,
        experienceYears,
        hourlyRate,
        bio: meta.bioTemplate(name, experienceYears, hourlyRate),
        pincode: loc.pincode,
        isVerified: true,
        averageRating,
        ratingCount,
        location: {
          type: "Point",
          coordinates: loc.coordinates,
          address: loc.address,
          city: loc.city,
          district: loc.district,
          state: loc.state,
          pincode: loc.pincode
        },
        contact: {
          phone,
          email,
          address: `${loc.address}, ${loc.state}`,
          pincode: loc.pincode
        }
      };

      users.push(user);
      profiles.push(profile);
      userIndex++;
    }
  }

  return { users, profiles };
}
