import express from "express";
import ServiceProvider from "../models/ServiceProvider.js";
import Review from "../models/Review.js";

const router = express.Router();

// Get all providers (supports ?status=pending|approved|rejected|all)
router.get("/", async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status && status !== "all") {
            if (status === "approved") {
                query.$or = [
                    { status: "approved" },
                    { isVerified: true, status: { $nin: ["pending", "rejected", "mobile_unverified"] } },
                ];
            } else if (status === "pending") {
                query.$or = [
                    { status: "pending" },
                    { status: { $exists: false }, isVerified: false },
                ];
            } else {
                query.status = status;
            }
        }

        const providers = await ServiceProvider.find(query)
            .populate("user", "first_name last_name email phone")
            .sort({ createdAt: -1 });
        res.json(providers);
    } catch (error) {
        console.error("Error fetching providers:", error);
        res.status(500).json({ message: "Error fetching providers" });
    }
});

// Approve provider application
router.put("/:id/approve", async (req, res) => {
    try {
        const provider = await ServiceProvider.findByIdAndUpdate(
            req.params.id,
            {
                status: "approved",
                verificationStatus: "APPROVED",
                isVerified: true,
                approvedAt: new Date(),
                verifiedAt: new Date(),
                rejectionReason: "",
                adminRemark: "",
            },
            { new: true }
        ).populate("user", "first_name last_name email phone");

        if (!provider) {
            return res.status(404).json({ message: "Provider not found" });
        }

        res.json({
            success: true,
            message: "Provider application approved successfully.",
            provider,
        });
    } catch (error) {
        console.error("Error approving provider:", error);
        res.status(500).json({ message: "Error approving provider" });
    }
});

// Reject provider application with reason
router.put("/:id/reject", async (req, res) => {
    try {
        const { reason } = req.body;
        const provider = await ServiceProvider.findByIdAndUpdate(
            req.params.id,
            {
                status: "rejected",
                verificationStatus: "REJECTED",
                isVerified: false,
                rejectionReason: (reason || "").trim() || "Application declined by administrator.",
                adminRemark: (reason || "").trim() || "Application declined by administrator.",
            },
            { new: true }
        ).populate("user", "first_name last_name email phone");

        if (!provider) {
            return res.status(404).json({ message: "Provider not found" });
        }

        res.json({
            success: true,
            message: "Provider application rejected.",
            provider,
        });
    } catch (error) {
        console.error("Error rejecting provider:", error);
        res.status(500).json({ message: "Error rejecting provider" });
    }
});

// Verify / unverify a provider (backward compatibility)
router.put("/:id/verify", async (req, res) => {
    try {
        const { isVerified } = req.body;
        if (typeof isVerified !== "boolean") {
            return res.status(400).json({ message: "isVerified must be a boolean" });
        }

        const updateData = isVerified
            ? { status: "approved", verificationStatus: "APPROVED", isVerified: true, approvedAt: new Date(), verifiedAt: new Date(), rejectionReason: "", adminRemark: "" }
            : { status: "rejected", verificationStatus: "SUSPENDED", isVerified: false };

        const provider = await ServiceProvider.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate("user", "first_name last_name email phone");

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
