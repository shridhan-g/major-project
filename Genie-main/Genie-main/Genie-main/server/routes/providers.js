import express from "express";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import ServiceProvider from "../models/ServiceProvider.js";
import Review from "../models/Review.js";
import Payment from "../models/Payment.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

const setAuthCookie = (res, userId) => {
    const token = jwt.sign(
        { user: { _id: userId } },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 24 * 60 * 60 * 1000,
    });
};

const publicProviderFields = "-user -__v";

// Provider registration: creates a User account (role: "provider") + provider profile
router.post("/register", async (req, res) => {
    res.header("Access-Control-Allow-Credentials", true);

    const {
        name,
        email,
        phone,
        password,
        category,
        skills,
        experienceYears,
        hourlyRate,
        bio,
        location,
        contact,
    } = req.body;

    if (!name || !email || !phone || !password || !category) {
        return res
            .status(400)
            .json({ msg: "Name, email, phone, password and category are required" });
    }
    if (password.length < 6) {
        return res.status(400).json({ msg: "Password must be at least 6 characters long" });
    }
    if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ msg: "Phone number must be 10 digits long" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ msg: "Invalid email address" });
    }

    try {
        let existingUser = await User.findOne({ $or: [{ phone }, { email }] });
        let user;

        if (existingUser) {
            // Check if this user already has a provider profile
            const existingProv = await ServiceProvider.findOne({ user: existingUser._id });
            if (existingProv) {
                return res.status(400).json({ msg: "An account with this email or phone is already registered as a provider." });
            }
            // Upgrade existing user account to provider role
            existingUser.role = "provider";
            if (password && password.length >= 6) {
                existingUser.password = password;
            }
            user = await existingUser.save();
        } else {
            const nameParts = (name || "").trim().split(/\s+/);
            const firstName = nameParts[0] || "Provider";
            const lastName = nameParts.slice(1).join(" ") || "Partner";

            user = new User({
                first_name: firstName,
                last_name: lastName,
                email,
                phone,
                password,
                role: "provider",
            });
            await user.save();
        }

        const skillList = Array.isArray(skills)
            ? skills
            : String(skills || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);

        const provider = new ServiceProvider({
            user: user._id,
            name,
            email,
            phone,
            category,
            skills: skillList,
            experienceYears: parseInt(experienceYears, 10) || 0,
            hourlyRate: parseFloat(hourlyRate) || 0,
            bio: bio || "",
            isVerified: true,
            contact: {
                phone: contact?.phone || phone,
                email: contact?.email || email,
                address: contact?.address || location?.address || "",
            },
            location: {
                type: "Point",
                coordinates: [
                    parseFloat(location?.lng) || 77.2090,
                    parseFloat(location?.lat) || 28.6139,
                ],
                address: location?.address || contact?.address || "",
            },
        });
        await provider.save();

        setAuthCookie(res, user._id);

        res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
            provider,
        });
    } catch (err) {
        console.error("Provider registration error:", err);
        if (err.code === 11000) {
            return res.status(400).json({ msg: "An account with this email or phone number already exists." });
        }
        res.status(400).json({ msg: err.message || "Registration failed. Please check your inputs." });
    }
});

// List verified providers, strictly filterable by category, service field, or skills
router.get("/", async (req, res) => {
    try {
        const { category, search } = req.query;
        const filter = { isVerified: true };

        const queryTerm = (category || search || "").trim();

        if (queryTerm) {
            // Build regex terms with strict word boundaries
            const terms = [queryTerm, ...queryTerm.split(/[\s,&]+/)]
                .map((t) => t.trim())
                .filter((t) => t.length >= 2);

            const orConditions = [];
            for (const term of terms) {
                const termEscaped = term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                const wordRx = new RegExp(`\\b${termEscaped}\\b`, "i");
                orConditions.push(
                    { category: wordRx },
                    { skills: wordRx }
                );
            }
            filter.$or = orConditions;
        }

        const providers = await ServiceProvider.find(filter)
            .select(publicProviderFields)
            .sort({ averageRating: -1, ratingCount: -1 });

        res.json(providers);
    } catch (error) {
        console.error("Error listing providers:", error);
        res.status(500).json({ message: "Error fetching providers" });
    }
});

// Find nearby verified providers using the geo index
router.get("/nearby", async (req, res) => {
    try {
        const { lat, lng, radius, category } = req.query;
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);

        if (isNaN(latNum) || isNaN(lngNum)) {
            return res.status(400).json({ message: "Valid lat and lng are required" });
        }

        const maxDistance = parseInt(radius, 10) || 20000; // default 20km
        const filter = {
            isVerified: true,
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [lngNum, latNum] },
                    $maxDistance: maxDistance,
                },
            },
        };
        if (category) filter.category = category;

        const providers = await ServiceProvider.find(filter)
            .select(publicProviderFields)
            .limit(50);
        res.json(providers);
    } catch (error) {
        console.error("Error fetching nearby providers:", error);
        res.status(500).json({ message: "Error fetching nearby providers" });
    }
});

// Personalized recommendations based on the user's past bookings
router.get("/recommended", authenticateUser, async (req, res) => {
    try {
        const payments = await Payment.find({
            user: req.user._id,
            status: { $in: ["SERVICE_BOOKED", "PROVIDER_ASSIGNED", "SERVICE_COMPLETED"] },
        });
        const bookedTitles = payments.flatMap((p) =>
            (p.items || []).map((i) => (i.title || "").toLowerCase())
        );

        const providers = await ServiceProvider.find({ isVerified: true })
            .select(publicProviderFields)
            .lean();

        const score = (p) => {
            const category = (p.category || "").toLowerCase();
            const bookingMatch = bookedTitles.some(
                (t) => t && (t.includes(category) || category.includes(t))
            );
            return (
                (p.averageRating || 3) * 2 +
                Math.min(p.experienceYears || 0, 15) * 0.4 +
                Math.min(p.ratingCount || 0, 50) * 0.1 +
                (bookingMatch ? 2 : 0)
            );
        };

        const ranked = providers.sort((a, b) => score(b) - score(a)).slice(0, 8);
        res.json(ranked);
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        res.status(500).json({ message: "Error fetching recommendations" });
    }
});

// Current provider's own profile
router.get("/me", authenticateUser, async (req, res) => {
    try {
        const provider = await ServiceProvider.findOne({ user: req.user._id }).select(
            publicProviderFields
        );
        if (!provider) {
            return res.status(404).json({ message: "Provider profile not found" });
        }
        res.json(provider);
    } catch (error) {
        console.error("Error fetching provider profile:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Update current provider's profile
router.put("/me", authenticateUser, async (req, res) => {
    try {
        const provider = await ServiceProvider.findOne({ user: req.user._id });
        if (!provider) {
            return res.status(404).json({ message: "Provider profile not found" });
        }

        const { name, category, skills, experienceYears, bio, contact, location } = req.body;

        if (name) provider.name = name;
        if (category) provider.category = category;
        if (skills !== undefined) {
            provider.skills = Array.isArray(skills)
                ? skills
                : String(skills).split(",").map((s) => s.trim()).filter(Boolean);
        }
        if (experienceYears !== undefined)
            provider.experienceYears = parseInt(experienceYears, 10) || 0;
        if (bio !== undefined) provider.bio = bio;
        if (contact) {
            if (contact.phone !== undefined) provider.contact.phone = contact.phone;
            if (contact.email !== undefined) provider.contact.email = contact.email;
            if (contact.address !== undefined) provider.contact.address = contact.address;
        }
        if (location) {
            if (location.lat !== undefined && location.lng !== undefined) {
                provider.location.coordinates = [
                    parseFloat(location.lng) || 0,
                    parseFloat(location.lat) || 0,
                ];
            }
            if (location.address !== undefined) provider.location.address = location.address;
        }

        await provider.save();
        res.json(provider);
    } catch (error) {
        console.error("Error updating provider profile:", error);
        res.status(500).json({ message: "Error updating provider profile" });
    }
});

// Bookings assigned to the current provider
router.get("/me/bookings", authenticateUser, async (req, res) => {
    try {
        const provider = await ServiceProvider.findOne({ user: req.user._id });
        if (!provider) {
            return res.status(404).json({ message: "Provider profile not found" });
        }
        const bookings = await Payment.find({ provider: provider._id })
            .sort({ createdAt: -1 })
            .populate("user", "first_name last_name email phone");
        res.json(bookings);
    } catch (error) {
        console.error("Error fetching provider bookings:", error);
        res.status(500).json({ message: "Error fetching provider bookings" });
    }
});

// Update status of a booking assigned to current provider
router.put("/me/bookings/:id/status", authenticateUser, async (req, res) => {
    try {
        const provider = await ServiceProvider.findOne({ user: req.user._id });
        if (!provider) {
            return res.status(404).json({ message: "Provider profile not found" });
        }
        const { status } = req.body;
        const booking = await Payment.findOneAndUpdate(
            { _id: req.params.id, provider: provider._id },
            { status },
            { new: true }
        ).populate("user", "first_name last_name email phone");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found or not assigned to you" });
        }
        res.json(booking);
    } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).json({ message: "Error updating booking status" });
    }
});

// Public provider profile (with reviews)
router.get("/:id", async (req, res) => {
    try {
        const provider = await ServiceProvider.findById(req.params.id).select(
            publicProviderFields
        );
        if (!provider) {
            return res.status(404).json({ message: "Provider not found" });
        }
        const reviews = await Review.find({ provider: provider._id })
            .populate("user", "first_name last_name")
            .sort({ createdAt: -1 });
        res.json({ ...provider.toObject(), reviews });
    } catch (error) {
        console.error("Error fetching provider:", error);
        res.status(500).json({ message: "Error fetching provider" });
    }
});

// Reviews for a provider
router.get("/:id/reviews", async (req, res) => {
    try {
        const reviews = await Review.find({ provider: req.params.id })
            .populate("user", "first_name last_name")
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Error fetching reviews" });
    }
});

// Submit / update a star rating + comment for a provider
router.post("/:id/reviews", authenticateUser, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const ratingNum = parseInt(rating, 10);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        const provider = await ServiceProvider.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({ message: "Provider not found" });
        }

        const review = await Review.findOneAndUpdate(
            { user: req.user._id, provider: provider._id },
            { rating: ratingNum, comment: String(comment || "").trim() },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Recompute the provider's average rating
        const reviews = await Review.find({ provider: provider._id });
        const avg = reviews.length
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        provider.averageRating = Math.round(avg * 10) / 10;
        provider.ratingCount = reviews.length;
        await provider.save();

        res.status(201).json(review);
    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ message: "Error submitting review" });
    }
});

export default router;
