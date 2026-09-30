import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Verify token middleware
const verifyToken = (req, res, next) => {
    const token =
        req.cookies.token ||
        req.header("x-auth-token") ||
        req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ message: "Access denied" });
    }

    try {
        const secret = process.env.JWT_SECRET || "genie_dev_jwt_secret_key_12345";
        const verified = jwt.verify(token, secret);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

// Verify route - checks if user is authenticated
router.get("/verify", verifyToken, async (req, res) => {
    try {
        const userId = req.user.user?._id || req.user.userId || req.user.id || req.user._id;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

export default router;
