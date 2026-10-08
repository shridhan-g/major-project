import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import ServiceDetail from "../models/ServiceDetail.js";

const router = express.Router();

const validateInput = (input) => {
    const { first_name, last_name, phone, email, password } = input;
    if (!first_name || !last_name || !phone || !email || !password) {
        return "All fields are required";
    }
    if (password.length < 6) {
        return "Password must be at least 6 characters long";
    }
    if (!/^\d{10}$/.test(phone)) {
        return "Phone number must be 10 digits long";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Invalid email address";
    }
    return null;
};

//Register
router.post("/register", async (req, res) => {
    res.header("Access-Control-Allow-Credentials", true);

    const { first_name, last_name, phone, email, password } = req.body;

    const validationError = validateInput(req.body);
    if (validationError) {
        return res.status(400).json({ msg: validationError });
    }

    try {
        let user = await User.findOne({ $or: [{ phone }, { email }] });
        if (user) {
            return res.status(400).json({ msg: "User already exists." });
        }
        user = new User({
            first_name,
            last_name,
            phone,
            email,
            password,
            role: "user",
        });

        await user.save();

        const payload = {
            user: {
                _id: user._id,
            },
        };

        const secret = process.env.JWT_SECRET || "genie_dev_jwt_secret_key_12345";
        jwt.sign(
            payload,
            secret,
            { expiresIn: "30d" },
            (err, token) => {
                if (err) throw err;
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite:
                        process.env.NODE_ENV === "production" ? "None" : "Lax",
                    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                }).json({
                    success: true,
                    token,
                    user: {
                        _id: user._id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                    },
                });
            }
        );
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

//Login
router.post("/login", async (req, res) => {
    res.header("Access-Control-Allow-Credentials", true);

    const { phone, email, password } = req.body;

    try {
        let user;
        if (email) {
            user = await User.findOne({ email });
        } else if (phone) {
            user = await User.findOne({ phone });
        } else {
            return res
                .status(400)
                .json({ msg: "Please provide email or phone number" });
        }

        if (!user) {
            return res.status(400).json({ msg: "Invalid Credentials" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid Credentials" });
        }

        const payload = {
            user: {
                _id: user._id,
            },
        };

        const secret = process.env.JWT_SECRET || "genie_dev_jwt_secret_key_12345";
        jwt.sign(
            payload,
            secret,
            { expiresIn: "30d" },
            (err, token) => {
                if (err) throw err;
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite:
                        process.env.NODE_ENV === "production" ? "None" : "Lax",
                    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                }).json({
                    success: true,
                    token,
                    user: {
                        _id: user._id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                    },
                });
            }
        );
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

//Logout
router.post("/logout", (req, res) => {
    res.header("Access-Control-Allow-Credentials", true);
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        path: "/", // Clear from the entire domain
    });
    res.json({ success: true });
});

router.get("/user", async (req, res) => {
    res.header("Access-Control-Allow-Credentials", true);

    try {
        const token =
            req.cookies.token ||
            req.header("x-auth-token") ||
            req.header("Authorization")?.replace("Bearer ", "");
        if (!token)
            return res.status(401).json({
                msg: "No token, authorization denied",
                isAuthenticated: false,
            });

        const secret = process.env.JWT_SECRET || "genie_dev_jwt_secret_key_12345";
        const decoded = jwt.verify(token, secret);
        const userId = decoded.user?._id || decoded.userId || decoded.id || decoded._id;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res
                .status(404)
                .json({ msg: "User not found", isAuthenticated: false });
        }

        res.json({ isAuthenticated: true, user });
    } catch (err) {
        return res.status(401).json({
            msg: "Invalid or expired session",
            isAuthenticated: false,
        });
    }
});

const auth = async (req, res, next) => {
    try {
        const token =
            req.cookies.token ||
            req.header("x-auth-token") ||
            req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res
                .status(401)
                .json({ msg: "No token, authorization denied" });
        }

        const secret = process.env.JWT_SECRET || "genie_dev_jwt_secret_key_12345";
        const decoded = jwt.verify(token, secret);
        req.user = decoded.user || { _id: decoded.userId || decoded.id || decoded._id };
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
    }
};

// Update user's cart
router.put("/cart", auth, async (req, res) => {
    try {
        const cartItems = req.body;
        if (!Array.isArray(cartItems)) {
            return res.status(400).json({ msg: "Invalid cart data format" });
        }

        const mappedCart = cartItems.map((item) => ({
            service: item.service,
            quantity: parseInt(item.quantity, 10),
            title: item.title || "",
            OurPrice: parseFloat(item.OurPrice || 0),
            total: parseFloat(item.OurPrice || 0) * parseInt(item.quantity, 10),
            category: item.category || "",
            type: item.type || "",
            time: item.time || "",
            MRP: parseFloat(item.MRP || 0),
            description: Array.isArray(item.description) ? item.description : [],
            image: item.image || "",
        }));

        // Use findByIdAndUpdate to bypass Mongoose version conflicts
        const updated = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { cart: mappedCart } },
            { new: true, runValidators: false }
        );
        if (!updated) return res.status(404).json({ msg: "User not found" });

        res.json(updated.cart);
    } catch (err) {
        console.error("Cart update error:", err);
        res.status(400).json({ msg: err.message });
    }
});

// Add a new route to get cart
router.get("/cart", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        res.json({ cart: user.cart || [] });
    } catch (err) {
        console.error("Get cart error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Clear user's cart
router.delete("/cart", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        user.cart = [];
        await user.save();
        res.json({ msg: "Cart cleared successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// ─── Address Management Routes ───────────────────────────────────────────────

// GET all saved addresses for the logged-in user
router.get("/addresses", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("addresses");
        if (!user) return res.status(404).json({ msg: "User not found" });
        res.json({ addresses: user.addresses || [] });
    } catch (err) {
        console.error("Get addresses error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// POST add a new address (max 10)
router.post("/addresses", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        if (user.addresses.length >= 10) {
            return res.status(400).json({ msg: "Maximum 10 addresses allowed. Please delete one to add a new address." });
        }

        const { label, name, mobile, house, area, landmark, pincode, city, district, state, postOffice, latitude, longitude, isDefault } = req.body;

        if (!name || !mobile || !pincode) {
            return res.status(400).json({ msg: "Name, mobile, and pincode are required." });
        }

        // If new address is default, remove default from all others
        if (isDefault) {
            user.addresses.forEach(addr => { addr.isDefault = false; });
        }

        // If no addresses exist yet, make the first one default
        const makeDefault = isDefault || user.addresses.length === 0;

        user.addresses.push({ label, name, mobile, house, area, landmark, pincode, city, district, state, postOffice, latitude, longitude, isDefault: makeDefault });
        await user.save();

        res.status(201).json({ addresses: user.addresses });
    } catch (err) {
        console.error("Add address error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// PUT update an existing address
router.put("/addresses/:id", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        const address = user.addresses.id(req.params.id);
        if (!address) return res.status(404).json({ msg: "Address not found" });

        const { label, name, mobile, house, area, landmark, pincode, city, district, state, postOffice, latitude, longitude, isDefault } = req.body;

        // If setting this as default, clear others first
        if (isDefault) {
            user.addresses.forEach(addr => { addr.isDefault = false; });
        }

        Object.assign(address, { label, name, mobile, house, area, landmark, pincode, city, district, state, postOffice, latitude, longitude, isDefault: isDefault || address.isDefault });

        await user.save();
        res.json({ addresses: user.addresses });
    } catch (err) {
        console.error("Update address error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// DELETE an address
router.delete("/addresses/:id", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        const addressIndex = user.addresses.findIndex(a => a._id.toString() === req.params.id);
        if (addressIndex === -1) return res.status(404).json({ msg: "Address not found" });

        const wasDefault = user.addresses[addressIndex].isDefault;
        user.addresses.splice(addressIndex, 1);

        // If the deleted one was default, assign default to the first remaining
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        res.json({ addresses: user.addresses });
    } catch (err) {
        console.error("Delete address error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// PUT set an address as default
router.put("/addresses/:id/default", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        user.addresses.forEach(addr => {
            addr.isDefault = addr._id.toString() === req.params.id;
        });

        await user.save();
        res.json({ addresses: user.addresses });
    } catch (err) {
        console.error("Set default address error:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// GET India Post pincode lookup proxy (avoids CORS in browser)
router.get("/addresses/pincode/:code", async (req, res) => {
    const code = req.params.code;
    if (!code || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ msg: "Invalid pincode. Must be 6 digits." });
    }
    try {
        const axios = (await import("axios")).default;
        const response = await axios.get(`https://api.postalpincode.in/pincode/${code}`, { timeout: 8000 });
        res.json(response.data);
    } catch (err) {
        console.error("Pincode lookup error:", err.message);
        res.status(502).json([{ Status: "Error", Message: "Pincode service unavailable" }]);
    }
});

export default router;

