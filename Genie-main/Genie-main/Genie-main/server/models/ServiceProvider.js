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
    contact: {
        phone: { type: String, default: "" },
        email: { type: String, default: "" },
        address: { type: String, default: "" },
    },
    // GeoJSON point so we can run $near queries for "providers nearby"
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
        address: { type: String, default: "" },
    },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

// Enable geo queries for nearby providers
ServiceProviderSchema.index({ location: "2dsphere" });

export default mongoose.model("ServiceProvider", ServiceProviderSchema);
