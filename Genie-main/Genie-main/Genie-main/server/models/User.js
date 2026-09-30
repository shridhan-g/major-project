import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema(
    {
        label: { type: String, default: "Home", trim: true }, // "Home", "Work", "Other"
        name: { type: String, required: true, trim: true },
        mobile: { type: String, required: true, trim: true },
        house: { type: String, default: "", trim: true },   // House/flat/building no.
        area: { type: String, default: "", trim: true },    // Area/colony/street/locality
        landmark: { type: String, default: "", trim: true },
        pincode: { type: String, required: true, trim: true },
        city: { type: String, default: "", trim: true },
        district: { type: String, default: "", trim: true },
        state: { type: String, default: "", trim: true },
        postOffice: { type: String, default: "", trim: true },
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        isDefault: { type: Boolean, default: false },
    },
    { _id: true }
);

const cartItemSchema = new mongoose.Schema({
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceDetail",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
    },
    category: { type: String },
    type: { type: String },
    title: { type: String },
    image: { type: String },
    time: { type: String },
    OurPrice: { type: Number, required: true, min: 0 },
    MRP: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    description: [String],
});

const UserSchema = new mongoose.Schema({
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, default: "user" },
    cart: { type: [cartItemSchema], default: [] },
    addresses: { type: [addressSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    // Avoid double hashing if already bcrypt hashed
    if (typeof this.password === 'string' && /^\$2[aby]\$\d{2}\$/.test(this.password)) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

export default mongoose.model("User", UserSchema);
