import express from "express";
import ServiceProvider from "../models/ServiceProvider.js";
import Review from "../models/Review.js";

const router = express.Router();

// Get all providers (including unverified) for admin review
router.get("/", async (req, res) => {
    try {
        const providers = await ServiceProvider.find()
            .populate("user", "first_name last_name email phone")
            .sort({ createdAt: -1 });
        res.json(providers);
    } catch (error) {
        console.error("Error fetching providers:", error);
        res.status(500).json({ message: "Error fetching providers" });
    }
});

// Verify / unverify a provider
router.put("/:id/verify", async (req, res) => {
    try {
        const { isVerified } = req.body;
        if (typeof isVerified !== "boolean") {
            return res.status(400).json({ message: "isVerified must be a boolean" });
        }

        const provider = await ServiceProvider.findByIdAndUpdate(
            req.params.id,
            { isVerified, verifiedAt: isVerified ? new Date() : null },
            { new: true }
        );

        if (!provider) {
            return res.status(404).json({ message: "Provider not found" });
        }

        res.json(provider);
    } catch (error) {
        console.error("Error updating provider verification:", error);
        res.status(500).json({ message: "Error updating provider verification" });
    }
});

// Delete a provider profile (and their reviews)
router.delete("/:id", async (req, res) => {
    try {
        const provider = await ServiceProvider.findByIdAndDelete(req.params.id);
        if (!provider) {
            return res.status(404).json({ message: "Provider not found" });
        }
        await Review.deleteMany({ provider: provider._id });
        res.json({ message: "Provider deleted successfully" });
    } catch (error) {
        console.error("Error deleting provider:", error);
        res.status(500).json({ message: "Error deleting provider" });
    }
});

export default router;
