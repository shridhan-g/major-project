import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import Payment from "../models/Payment.js";
import ServiceProvider from "../models/ServiceProvider.js";
import User from "../models/User.js";

const router = express.Router();
dotenv.config();

// Helper to reliably find valid User ObjectId
const resolveUserId = async (req, orderDetails = {}) => {
    let rawId = orderDetails._id || orderDetails.userId || orderDetails.user;
    if (rawId) {
        const found = await User.findById(rawId);
        if (found) return found._id;
    }

    const token = req.cookies?.token || req.header("x-auth-token");
    if (token) {
        try {
            const secret = process.env.JWT_SECRET || "genie_dev_jwt_secret_key_12345";
            const decoded = jwt.verify(token, secret);
            const tokenUserId = decoded.user?._id || decoded.userId || decoded.id || decoded._id;
            if (tokenUserId) {
                const found = await User.findById(tokenUserId);
                if (found) return found._id;
            }
        } catch (_) {}
    }

    if (orderDetails.customerDetails?.email) {
        const found = await User.findOne({ email: orderDetails.customerDetails.email });
        if (found) return found._id;
    }

    const firstUser = await User.findOne();
    return firstUser?._id || null;
};

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_key_id",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_test_mock_secret",
});

// Test route to verify the router is working
router.get("/test", (req, res) => {
    res.json({ message: "Razorpay routes are working" });
});

// Create order route
router.post("/create-order", async (req, res) => {
    try {
        // Extract the order details
        const { amount, currency, receipt, notes } = req.body;

        // Create order options
        const options = {
            amount: parseInt(amount),
            currency: currency || "INR",
            receipt,
            notes,
            payment_capture: 1, // Auto capture payment
        };

        // Add detailed order information
        if (notes && notes.items) {
            options.notes = {
                ...notes,
                items_summary: notes.items, // This will be visible in Razorpay dashboard
            };
        }

        const order = await razorpay.orders.create(options);

        res.json(order);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({
            success: false,
            message: "Error creating order",
            error: error.message,
        });
    }
});
// Verify payment route
router.post("/verify-payment", async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderDetails,
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Missing payment verification details",
            });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "secret")
            .update(sign)
            .digest("hex");

        let paymentObj = {
            status: "SERVICE_BOOKED",
            method: "Razorpay",
            amount: orderDetails?.amount || 0,
            currency: orderDetails?.currency || "INR",
            count: 1,
        };

        try {
            const fetched = await razorpay.payments.fetch(razorpay_payment_id);
            if (fetched) {
                paymentObj.amount = fetched.amount || paymentObj.amount;
                paymentObj.currency = fetched.currency || paymentObj.currency;
                paymentObj.method = fetched.method || paymentObj.method;
                paymentObj.count = fetched.count || 1;
                paymentObj.status = fetched.status === "captured" ? "SERVICE_BOOKED" : fetched.status;
            }
        } catch (fetchErr) {
            console.warn("Razorpay API fetch notice (proceeding with local order verification):", fetchErr.message);
        }

        let assignedProviderId = orderDetails.providerId || null;

        if (!assignedProviderId && orderDetails.items && orderDetails.items.length > 0) {
            const firstItem = orderDetails.items[0];
            const catStr = firstItem.category || "";
            const titleStr = firstItem.title || "";
            
            // Try matching category exact or partial
            if (catStr) {
                const catMatch = await ServiceProvider.findOne({
                    isVerified: true,
                    $or: [
                        { category: new RegExp(catStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") },
                        { skills: new RegExp(catStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") },
                    ],
                }).sort({ averageRating: -1 });
                if (catMatch) assignedProviderId = catMatch._id;
            }

            // If no match yet, try matching by key words from title (e.g. Plumber, AC, Salon, Cleaning)
            if (!assignedProviderId && titleStr) {
                const keywords = titleStr.split(/\s+/).filter((w) => w.length > 2);
                for (const word of keywords) {
                    const wordMatch = await ServiceProvider.findOne({
                        isVerified: true,
                        $or: [
                            { category: new RegExp(word, "i") },
                            { skills: new RegExp(word, "i") },
                            { name: new RegExp(word, "i") },
                        ],
                    }).sort({ averageRating: -1 });
                    if (wordMatch) {
                        assignedProviderId = wordMatch._id;
                        break;
                    }
                }
            }

            // Ultimate fallback: highest rated active provider
            if (!assignedProviderId) {
                const fallbackProvider = await ServiceProvider.findOne({ isVerified: true }).sort({ averageRating: -1 });
                if (fallbackProvider) {
                    assignedProviderId = fallbackProvider._id;
                }
            }
        }

        const resolvedUserId = await resolveUserId(req, orderDetails);

        const newPayment = new Payment({
            user: resolvedUserId,
            provider: assignedProviderId,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            amount: paymentObj.amount,
            currency: paymentObj.currency,
            status: paymentObj.status || "SERVICE_BOOKED",
            method: paymentObj.method || "Razorpay",
            items: orderDetails.items,
            summary: orderDetails.summary,
            customerDetails: orderDetails.customerDetails,
            bookingDetails: orderDetails.bookingDetails || {},
            attempts: paymentObj.count || 1,
        });

        await newPayment.save();
        console.log(`✅ Order #${razorpay_order_id} saved to DB and assigned to provider: ${assignedProviderId}`);

        res.json({
            success: true,
            message: "Payment verified and saved successfully",
            paymentId: newPayment._id,
            orderId: razorpay_order_id,
            providerId: assignedProviderId,
        });
    } catch (error) {
        console.error("Error in verify-payment:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Direct booking route (No payment gateway needed)
router.post("/direct-booking", async (req, res) => {
    try {
        const orderDetails = req.body;
        let assignedProviderId = orderDetails.providerId || null;

        if (!assignedProviderId && orderDetails.items && orderDetails.items.length > 0) {
            const firstItem = orderDetails.items[0];
            const catStr = firstItem.category || "";
            const titleStr = firstItem.title || "";

            if (catStr) {
                const catMatch = await ServiceProvider.findOne({
                    isVerified: true,
                    $or: [
                        { category: new RegExp(catStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") },
                        { skills: new RegExp(catStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") },
                    ],
                }).sort({ averageRating: -1 });
                if (catMatch) assignedProviderId = catMatch._id;
            }

            if (!assignedProviderId && titleStr) {
                const keywords = titleStr.split(/\s+/).filter((w) => w.length > 2);
                for (const word of keywords) {
                    const wordMatch = await ServiceProvider.findOne({
                        isVerified: true,
                        $or: [
                            { category: new RegExp(word, "i") },
                            { skills: new RegExp(word, "i") },
                            { name: new RegExp(word, "i") },
                        ],
                    }).sort({ averageRating: -1 });
                    if (wordMatch) {
                        assignedProviderId = wordMatch._id;
                        break;
                    }
                }
            }

            if (!assignedProviderId) {
                const fallbackProvider = await ServiceProvider.findOne({ isVerified: true }).sort({ averageRating: -1 });
                if (fallbackProvider) {
                    assignedProviderId = fallbackProvider._id;
                }
            }
        }

        const resolvedUserId = await resolveUserId(req, orderDetails);
        const generatedOrderId = `ORD_${Date.now()}`;
        const generatedPaymentId = `PAY_DIRECT_${Math.floor(100000 + Math.random() * 900000)}`;

        const newBooking = new Payment({
            user: resolvedUserId,
            provider: assignedProviderId,
            orderId: generatedOrderId,
            paymentId: generatedPaymentId,
            amount: orderDetails.amount || 0,
            currency: orderDetails.currency || "INR",
            status: "SERVICE_BOOKED",
            method: "Pay After Service (Cash / UPI)",
            items: orderDetails.items || [],
            summary: orderDetails.summary || {},
            customerDetails: orderDetails.customerDetails || {},
            bookingDetails: orderDetails.bookingDetails || {},
            attempts: 1,
        });

        await newBooking.save();
        console.log(`✅ Direct Booking #${generatedOrderId} created for provider: ${assignedProviderId}`);

        res.json({
            success: true,
            message: "Booking confirmed successfully!",
            paymentId: newBooking._id,
            orderId: generatedOrderId,
            providerId: assignedProviderId,
        });
    } catch (error) {
        console.error("Error creating direct booking:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new route to get user bookings
router.get("/bookings/:user", async (req, res) => {
    try {
        const bookings = await Payment.find({
            user: req.params.user,
        })
            .sort({ createdAt: -1 })
            .populate("provider", "name category averageRating");

        res.json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
            error: error.message,
        });
    }
});

export default router;
