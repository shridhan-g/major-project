import mongoose from "mongoose";

const ServiceProviderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    profileImage: { type: String, default: "" },
    // Category of services the provider offers (matches service catalog names)
    category: { type: String, required: true, trim: true },
    skills: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0, min: 0 },
    hourlyRate: { type: Number, default: 0, min: 0 }, // charges per hour in INR
    bio: { type: String, default: "", maxlength: 2000 },
    pincode: { type: String, default: "", trim: true },
    contact: {
        phone: { type: String, default: "" },
        email: { type: String, default: "" },
        address: { type: String, default: "" },
        pincode: { type: String, default: "", trim: true },
    },
    // GeoJSON point so we can run $near queries for "providers nearby"
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
        address: { type: String, default: "" },
        pincode: { type: String, default: "", trim: true },
    },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    // Structured verification lifecycle: PENDING → APPROVED / REJECTED / SUSPENDED
    verificationStatus: {
        type: String,
        enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"],
        default: "PENDING",
    },
    // Provider Verification Status workflow: mobile_unverified -> pending -> approved / rejected
    status: {
        type: String,
        enum: ["mobile_unverified", "pending", "approved", "rejected"],
        default: "pending",
    },
    servicesOffered: { type: String, default: "" },
    idDocument: { type: String, default: "" }, // path to uploaded ID document
    idType: { type: String, default: "" },      // Aadhaar / PAN / Driving Licence / Other
    profilePhoto: { type: String, default: "" }, // path to uploaded profile photo
    mobileVerified: { type: Boolean, default: false },
    mobileVerifiedAt: { type: Date },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: "" },
    adminRemark: { type: String, default: "" },
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});


// Enable geo queries for nearby providers
ServiceProviderSchema.index({ location: "2dsphere" });

export default mongoose.model("ServiceProvider", ServiceProviderSchema);
