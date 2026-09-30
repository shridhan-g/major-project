import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceProvider",
        default: null,
    },
    orderId: {
        type: String,
        required: true,
        unique: true,
    },
    paymentId: {
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined values
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        default: "INR",
    },
    status: {
        type: String,
        enum: ['SERVICE_BOOKED', 'PROVIDER_ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'SERVICE_COMPLETED', 'CANCELLED'],
        default: 'SERVICE_BOOKED'
    },
    method: {
        type: String,
    },
    failureReason: {
        type: String,
    },
    items: [
        {
            serviceId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Service",
                required: false,
            },
            image: String,
            title: String,
            quantity: Number,
            price: Number,
            total: Number,
        },
    ],
    summary: {
        subtotal: Number,
        tax: Number,
        total: Number,
        itemCount: Number,
    },
    customerDetails: {
        name: String,
        email: String,
        phone: String,
    },
    bookingDetails: {
        serviceDate: { type: String, default: "" },
        serviceTime: { type: String, default: "" },
        serviceAddress: { type: String, default: "" },  // legacy flat string (kept for backward-compat)
        pincode: { type: String, default: "" },
        notes: { type: String, default: "" },
        // Structured address snapshot (saved at booking time)
        addressSnapshot: {
            label: { type: String, default: "" },
            name: { type: String, default: "" },
            mobile: { type: String, default: "" },
            house: { type: String, default: "" },
            area: { type: String, default: "" },
            landmark: { type: String, default: "" },
            pincode: { type: String, default: "" },
            city: { type: String, default: "" },
            district: { type: String, default: "" },
            state: { type: String, default: "" },
            postOffice: { type: String, default: "" },
            latitude: { type: Number, default: null },
            longitude: { type: Number, default: null },
        },
    },

    attempts: {
        type: Number,
    },
    lastAttemptAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update the updatedAt timestamp before saving
paymentSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
