// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticateUser = async (req, res, next) => {
    try {
        // Get token from cookie or header
        const token =
            req.cookies.token ||
            req.header("x-auth-token") ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided.",
            });
        }

        try {
            // Verify token
            const secret = process.env.JWT_SECRET || "genie_dev_jwt_secret_key_12345";
            const decoded = jwt.verify(token, secret);
            const userId = decoded.user?._id || decoded.userId || decoded.id || decoded._id;

            // Get user from database (excluding password)
            const user = await User.findById(userId).select("-password");

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found.",
                });
            }

            // Add user to request object
            req.user = user;
            next();
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: "Invalid token.",
            });
        }
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

// Optional: Middleware to check if user is admin
export const authenticateAdmin = async (req, res, next) => {
    try {
        // First run the regular authentication
        await authenticateUser(req, res, async () => {
            // Check if user has admin role
            if (req.user && req.user.role === "admin") {
                next();
            } else {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Admin privileges required.",
                });
            }
        });
    } catch (error) {
        console.error("Admin auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

// Optional: Middleware to verify user owns the resource
export const verifyResourceOwnership = (resourceField) => {
    return async (req, res, next) => {
        try {
            // First authenticate the user
            await authenticateUser(req, res, async () => {
                const resourceId =
                    req.params[resourceField] || req.body[resourceField];

                if (resourceId !== req.user._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: "Access denied. You don't own this resource.",
                    });
                }

                next();
            });
        } catch (error) {
            console.error("Resource ownership verification error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error.",
            });
        }
    };
};

export const isAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ message: "No token, authorization denied" });
        }

        const secret = process.env.JWT_SECRET || "genie_dev_jwt_secret_key_12345";
        const decoded = jwt.verify(token, secret);
        const userId = decoded.user?._id || decoded.userId || decoded.id || decoded._id;
        const user = await User.findById(userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized as admin" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: "Token is not valid" });
    }
};
