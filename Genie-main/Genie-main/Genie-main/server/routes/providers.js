import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import axiosLib from "axios";

import User from "../models/User.js";
import ServiceProvider from "../models/ServiceProvider.js";
import Review from "../models/Review.js";
import Payment from "../models/Payment.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration for profile photo and ID document uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.includes("pdf") ? ".pdf" : ".jpg");
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
        "application/pdf",
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only images (JPEG/PNG/WEBP) and PDF files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE OTP — In-Memory Store
// Key: sessionId  Value: { phone, otpHash, expiresAt, attempts }
// Also index by phone so generating a new OTP invalidates previous sessions
// ─────────────────────────────────────────────────────────────────────────────
const mobileOtpStore = new Map();
const phoneToSessionMap = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL OTP — In-Memory Store
// Key: sessionId  Value: { email, otpHash, expiresAt, attempts, verified }
// Also index by email so generating a new OTP invalidates previous sessions
// ─────────────────────────────────────────────────────────────────────────────
const emailOtpStore = new Map();
const emailToSessionMap = new Map();
const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;  // 10 minutes
const EMAIL_OTP_MAX_ATTEMPTS = 5;
const EMAIL_TOKEN_TTL = "30m";
const EMAIL_OTP_RATE_LIMIT_MAX = 5;
const EMAIL_OTP_RATE_WINDOW_MS = 10 * 60 * 1000;
const emailOtpRateLimit = new Map();

// Purge expired email OTP sessions periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of emailOtpStore.entries()) {
        if (val.expiresAt < now) {
            emailOtpStore.delete(key);
            if (emailToSessionMap.get(val.email) === key) {
                emailToSessionMap.delete(val.email);
            }
        }
    }
}, 60_000);

function getEmailOtpJwtSecret() {
    return (process.env.JWT_SECRET || "genie_dev_jwt_secret_key_12345") + "_email_otp";
}

function checkEmailOtpRateLimit(key) {
    const now = Date.now();
    const entry = emailOtpRateLimit.get(key);
    if (!entry || now - entry.windowStart > EMAIL_OTP_RATE_WINDOW_MS) {
        emailOtpRateLimit.set(key, { count: 1, windowStart: now });
        return true;
    }
    if (entry.count >= EMAIL_OTP_RATE_LIMIT_MAX) return false;
    entry.count++;
    return true;
}

// Nodemailer transporter — uses SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS if configured
// Otherwise falls back to Ethereal test account (dev only)
let _cachedTransport = null;
async function getEmailTransport() {
    if (_cachedTransport) return _cachedTransport;
    const { createTransport, createTestAccount } = await import("nodemailer");

    const smtpHost = process.env.SMTP_HOST || "";
    const smtpUser = process.env.SMTP_USER || "";
    const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);

    if (smtpUser && smtpPass) {
        if (smtpHost.includes("gmail") || smtpUser.includes("@gmail.com")) {
            _cachedTransport = createTransport({
                service: "gmail",
                auth: { user: smtpUser, pass: smtpPass },
            });
            console.log("[Email OTP] Using Gmail SMTP service for:", smtpUser);
        } else if (smtpHost) {
            _cachedTransport = createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: { user: smtpUser, pass: smtpPass },
            });
            console.log("[Email OTP] Using configured SMTP server:", smtpHost);
        }
    }
    
    if (!_cachedTransport) {
        // Dev mode: create a temporary Ethereal test account
        const testAccount = await createTestAccount();
        _cachedTransport = createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });
        _cachedTransport._ethereal = true;
        _cachedTransport._etherealUser = testAccount.user;
        console.log("[Email OTP] Dev mode: using Ethereal test email account", testAccount.user);
    }
    return _cachedTransport;
}

async function sendEmailOtp(email, otp) {
    try {
        const { getTestMessageUrl } = await import("nodemailer");
        const transport = await getEmailTransport();
        const info = await transport.sendMail({
            from: process.env.SMTP_FROM || '"Genie Support" <noreply@genie.app>',
            to: email,
            subject: `${otp} is your Genie verification code`,
            text: `Your Genie provider email verification OTP is: ${otp}\n\nThis code is valid for 10 minutes. Do not share it with anyone.`,
            html: `
                <div style="font-family: Arial, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
                    <h2 style="color: #1e3a8a; margin: 0 0 8px 0; font-size: 22px;">Genie Provider Verification</h2>
                    <p style="color: #475569; font-size: 14px; margin: 0 0 18px 0;">Use the 6-digit verification code below to verify your email address:</p>
                    <div style="background: #eff6ff; border: 2px dashed #2563eb; border-radius: 12px; padding: 18px 24px; text-align: center; margin: 18px 0;">
                        <span style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #1e40af; font-family: 'Courier New', monospace; display: block;">
                            ${otp}
                        </span>
                    </div>
                    <p style="color: #64748b; font-size: 13px; margin: 16px 0 0 0;">⏱ Valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
                    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;"/>
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">If you did not request this verification code, please ignore this email.</p>
                </div>
            `,
        });

        if (transport._ethereal) {
            const previewUrl = getTestMessageUrl(info);
            console.log(`[Email OTP] Ethereal preview URL: ${previewUrl}`);
            return { isLiveEmail: false, previewUrl };
        }
        console.log(`[Email OTP] Live email successfully dispatched to ${email} (MessageId: ${info.messageId})`);
        return { isLiveEmail: true };
    } catch (err) {
        console.error("[Email OTP] Send error:", err.message);
        throw err;
    }
}

// Rate-limit store: key = phone or IP, value = { count, windowStart }
const mobileOtpRateLimit = new Map();
const OTP_RATE_LIMIT_MAX = 5;
const OTP_RATE_WINDOW_MS = 10 * 60 * 1000;    // 10 minutes
const MOBILE_OTP_TTL_MS = 10 * 60 * 1000;     // Exactly 10 minutes (600 seconds)
const MOBILE_OTP_MAX_ATTEMPTS = 5;
const MOBILE_TOKEN_TTL = "30m";

function getOtpJwtSecret() {
    return (process.env.JWT_SECRET || "genie_dev_jwt_secret_key_12345") + "_mobile_otp";
}

function normalizePhone(rawPhone) {
    if (!rawPhone) return "";
    let clean = String(rawPhone).trim().replace(/[^\d+]/g, "");
    if (clean.startsWith("+91")) {
        clean = clean.slice(3);
    } else if (clean.startsWith("91") && clean.length === 12) {
        clean = clean.slice(2);
    }
    return clean;
}

function checkOtpRateLimit(key) {
    const now = Date.now();
    const entry = mobileOtpRateLimit.get(key);
    if (!entry || now - entry.windowStart > OTP_RATE_WINDOW_MS) {
        mobileOtpRateLimit.set(key, { count: 1, windowStart: now });
        return true;
    }
    if (entry.count >= OTP_RATE_LIMIT_MAX) return false;
    entry.count++;
    return true;
}

// Purge expired OTP sessions periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of mobileOtpStore.entries()) {
        if (val.expiresAt < now) {
            mobileOtpStore.delete(key);
            if (phoneToSessionMap.get(val.phone) === key) {
                phoneToSessionMap.delete(val.phone);
            }
        }
    }
}, 60_000);

const setAuthCookie = (res, userId) => {
    const token = jwt.sign(
        { user: { _id: userId } },
        process.env.JWT_SECRET || "genie_dev_jwt_secret_key_12345",
        { expiresIn: "30d" }
    );
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return token;
};

const publicProviderFields = "-user -__v";

// Approx coordinates for major Indian pincode prefixes to estimate distance accurately
const PINCODE_PREFIX_COORDS = {
    "11": [77.2090, 28.6139], // Delhi
    "12": [77.0266, 28.4595], // Haryana / Gurgaon
    "13": [76.8173, 30.7333], // Chandigarh/Punjab
    "20": [77.3910, 28.5355], // Noida / UP West
    "30": [75.7873, 26.9124], // Jaipur / Rajasthan
    "38": [72.5714, 23.0225], // Ahmedabad / Gujarat
    "39": [72.8311, 21.1702], // Surat
    "40": [72.8777, 19.0760], // Mumbai
    "41": [73.8567, 18.5204], // Pune
    "44": [79.0882, 21.1458], // Nagpur
    "50": [78.4867, 17.3850], // Hyderabad
    "56": [77.5946, 12.9716], // Bangalore
    "60": [80.2707, 13.0827], // Chennai
    "68": [76.2673, 9.9312],  // Kochi / Kerala
    "70": [88.3639, 22.5726], // Kolkata
};

function getCoordsForPincode(pincode) {
    if (!pincode) return null;
    const clean = String(pincode).trim().replace(/\D/g, "");
    if (clean.length < 2) return null;
    const prefix = clean.substring(0, 2);
    return PINCODE_PREFIX_COORDS[prefix] || null;
}

function calculateDistanceKm(coords1, coords2) {
    if (!coords1 || !coords2) return null;
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;
    if (lon1 === 0 && lat1 === 0) return null;
    if (lon2 === 0 && lat2 === 0) return null;
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL SMS GATEWAY INTEGRATION
// Automatically dispatches live SMS if credentials are configured in server/.env
// Supports Fast2SMS, 2Factor, or Twilio
// ─────────────────────────────────────────────────────────────────────────────
function isRealSmsConfigured() {
    return Boolean(
        process.env.FAST2SMS_API_KEY ||
        process.env.TWOFACTOR_API_KEY ||
        (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
    );
}

async function sendSmsViaGateway(cleanPhone, otp) {
    const fast2smsKey = (process.env.FAST2SMS_API_KEY || "").trim();
    const twoFactorKey = (process.env.TWOFACTOR_API_KEY || "").trim();
    const twilioSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
    const twilioToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
    const twilioFrom = (process.env.TWILIO_PHONE_NUMBER || "").trim();

    // 1. Fast2SMS (Indian OTP route - www.fast2sms.com)
    if (fast2smsKey) {
        try {
            const res = await axiosLib.get("https://www.fast2sms.com/dev/bulkV2", {
                headers: {
                    authorization: fast2smsKey,
                },
                params: {
                    authorization: fast2smsKey,
                    variables_values: otp,
                    route: "otp",
                    numbers: cleanPhone,
                },
                timeout: 12000,
            });
            const resData = res.data || {};
            console.log(`[Fast2SMS] Response for +91 ${cleanPhone}:`, resData);
            if (resData.return === true) {
                console.log(`[Fast2SMS] Successfully delivered live SMS to +91 ${cleanPhone}`);
                return true;
            }
            const rawMsg = Array.isArray(resData.message)
                ? resData.message.join(", ")
                : (typeof resData.message === "string" ? resData.message : (resData.Details || "Fast2SMS dispatch error"));
            throw new Error(rawMsg);
        } catch (err) {
            const rawMsg = Array.isArray(err.response?.data?.message)
                ? err.response.data.message.join(", ")
                : (err.response?.data?.message || err.message || "Fast2SMS delivery failed.");
            console.error("[Fast2SMS] Delivery error:", rawMsg);
            throw new Error(rawMsg);
        }
    }

    // 2. 2Factor.in (India OTP service - 2factor.in)
    if (twoFactorKey) {
        try {
            const res = await axiosLib.get(
                `https://2factor.in/v3/${twoFactorKey}/SMS/+91${cleanPhone}/${otp}/OTP1`,
                { timeout: 12000 }
            );
            console.log(`[2Factor] Dispatched live OTP to +91 ${cleanPhone}:`, res.data);
            if (res.data?.Status !== "Success") {
                throw new Error(res.data?.Details || "2Factor SMS delivery failed.");
            }
            return true;
        } catch (err) {
            console.error("[2Factor] Delivery error:", err.response?.data || err.message);
            throw new Error(err.response?.data?.Details || err.message || "2Factor delivery failed.");
        }
    }

    // 3. Twilio (Global SMS - twilio.com)
    if (twilioSid && twilioToken && twilioFrom) {
        try {
            const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
            const params = new URLSearchParams();
            params.append("To", `+91${cleanPhone}`);
            params.append("From", twilioFrom);
            params.append("Body", `Your Genie provider verification OTP is ${otp}. Valid for 10 minutes. Do not share this code.`);

            const res = await axiosLib.post(
                `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
                params,
                {
                    headers: {
                        Authorization: authHeader,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    timeout: 12000,
                }
            );
            console.log(`[Twilio] Dispatched live SMS to +91 ${cleanPhone}:`, res.data?.sid);
            return true;
        } catch (err) {
            console.error("[Twilio] Delivery error:", err.response?.data || err.message);
            throw new Error(err.response?.data?.message || err.message || "Twilio SMS delivery failed.");
        }
    }

    return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL OTP — Send OTP
// POST /api/providers/email/send-otp
// Body: { email }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/email/send-otp", async (req, res) => {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ msg: "Please enter a valid email address." });
    }
    const normalizedEmail = email.trim().toLowerCase();

    if (!checkEmailOtpRateLimit(normalizedEmail) || !checkEmailOtpRateLimit(ip)) {
        return res.status(429).json({
            msg: "Too many OTP requests. Please wait a few minutes before trying again.",
        });
    }

    // Keep previous unexpired OTPs active (valid 10 mins) so any received code remains valid

    // Generate secure 6-digit OTP
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = await bcrypt.hash(otp, 8);
    const sessionId = crypto.randomBytes(24).toString("hex");

    emailOtpStore.set(sessionId, {
        email: normalizedEmail,
        otpHash,
        expiresAt: Date.now() + EMAIL_OTP_TTL_MS,
        attempts: 0,
    });
    emailToSessionMap.set(normalizedEmail, sessionId);

    console.log(`[Email OTP] Generated OTP for ${normalizedEmail}: ${otp} (valid 10 min)`);

    let isLiveEmail = false;
    let previewUrl = null;
    let fallbackOtp = null;

    try {
        const result = await sendEmailOtp(normalizedEmail, otp);
        isLiveEmail = result.isLiveEmail;
        previewUrl = result.previewUrl || null;
        if (!isLiveEmail) fallbackOtp = otp; // Dev mode: expose OTP for testing
    } catch (err) {
        console.warn("[Email OTP] Email send warning:", err.message);
        // Even if email fails, return sessionId so dev can test with fallbackOtp
        fallbackOtp = otp;
    }

    return res.json({
        success: true,
        sessionId,
        email: normalizedEmail,
        expiresIn: 600,
        isLiveEmail,
        previewUrl,
        fallbackOtp: isLiveEmail ? undefined : fallbackOtp,
        message: isLiveEmail
            ? `Verification code sent to ${normalizedEmail}. Please check your inbox.`
            : `OTP generated for ${normalizedEmail}. Check server console or use the code provided.`,
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL OTP — Verify OTP
// POST /api/providers/email/verify-otp
// Body: { sessionId, otp, email }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/email/verify-otp", async (req, res) => {
    const { sessionId, otp, email } = req.body;

    if (!otp) {
        return res.status(400).json({ msg: "6-digit OTP is required." });
    }

    const cleanOtp = String(otp).trim().replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
        return res.status(400).json({ msg: "Please enter a valid 6-digit OTP." });
    }

    const targetEmail = String(email || "").trim().toLowerCase();

    // Gather candidate sessions: by sessionId, by email, or all active unexpired sessions
    const candidates = [];
    if (sessionId && emailOtpStore.has(sessionId)) {
        candidates.push({ id: sessionId, session: emailOtpStore.get(sessionId) });
    }
    for (const [id, s] of emailOtpStore.entries()) {
        if (id !== sessionId && Date.now() <= s.expiresAt) {
            if (!targetEmail || s.email === targetEmail) {
                candidates.push({ id, session: s });
            }
        }
    }

    if (candidates.length === 0) {
        return res.status(400).json({
            msg: "No active verification session found. Please click 'Send OTP' again.",
        });
    }

    let matchedItem = null;
    for (const item of candidates) {
        if (Date.now() > item.session.expiresAt) continue;
        if (item.session.attempts >= EMAIL_OTP_MAX_ATTEMPTS) continue;

        item.session.attempts++;
        const isMatch = await bcrypt.compare(cleanOtp, item.session.otpHash);
        if (isMatch) {
            matchedItem = item;
            break;
        }
    }

    if (!matchedItem) {
        console.warn(`[Email OTP Verify] Invalid OTP attempt: ${cleanOtp} for email: ${targetEmail || "unknown"}`);
        return res.status(400).json({
            msg: "Invalid OTP. Please check the 6-digit code and try again.",
        });
    }

    const verifiedEmail = matchedItem.session.email;
    console.log(`[Email OTP Verify] SUCCESS for ${verifiedEmail}`);

    // Clean up verified session
    emailOtpStore.delete(matchedItem.id);
    if (emailToSessionMap.get(verifiedEmail) === matchedItem.id) {
        emailToSessionMap.delete(verifiedEmail);
    }

    // Issue short-lived email-verification token
    const emailToken = jwt.sign(
        { email_verified: true, email: verifiedEmail },
        getEmailOtpJwtSecret(),
        { expiresIn: EMAIL_TOKEN_TTL }
    );

    return res.json({
        success: true,
        email_token: emailToken,
        email: verifiedEmail,
        message: "Email address verified successfully.",
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE OTP — Send OTP
// POST /api/providers/mobile/send-otp
// Body: { phone }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/mobile/send-otp", async (req, res) => {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const { phone } = req.body;

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
        return res.status(400).json({ msg: "Please enter a valid 10-digit mobile number." });
    }

    if (!checkOtpRateLimit(cleanPhone) || !checkOtpRateLimit(ip)) {
        return res.status(429).json({
            msg: "Too many OTP requests. Please wait a few minutes before trying again.",
        });
    }

    // Invalidate previous OTP session for this phone number if one exists
    const prevSessionId = phoneToSessionMap.get(cleanPhone);
    if (prevSessionId) {
        mobileOtpStore.delete(prevSessionId);
        phoneToSessionMap.delete(cleanPhone);
    }

    // Generate secure 6-digit OTP
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = await bcrypt.hash(otp, 8);
    const sessionId = crypto.randomBytes(24).toString("hex");

    mobileOtpStore.set(sessionId, {
        phone: cleanPhone,
        otpHash,
        expiresAt: Date.now() + MOBILE_OTP_TTL_MS,
        attempts: 0,
    });
    phoneToSessionMap.set(cleanPhone, sessionId);

    // Check if real SMS gateway is configured
    const realSmsConfigured = isRealSmsConfigured();
    let liveSmsSent = false;
    let smsNotice = null;

    if (realSmsConfigured) {
        try {
            await sendSmsViaGateway(cleanPhone, otp);
            liveSmsSent = true;
            console.log(`[Mobile OTP] REAL SMS sent to +91 ${cleanPhone}`);
        } catch (err) {
            console.warn(`[Mobile OTP] SMS gateway dispatch notice for +91 ${cleanPhone}: ${err.message}`);
            smsNotice = err.message;
            console.log(`[Mobile OTP] Fallback Code for +91 ${cleanPhone}: ${otp}`);
        }
    } else {
        console.log(`[Mobile OTP] Demo/Simulation: OTP for +91 ${cleanPhone} is ${otp} (valid for 10 min)`);
    }

    return res.json({
        success: true,
        sessionId,
        phone: `+91 ${cleanPhone}`,
        expiresIn: 600, // 600 seconds = exactly 10 minutes
        isLiveSms: liveSmsSent,
        smsNotice,
        fallbackOtp: liveSmsSent ? undefined : otp,
        message: liveSmsSent
            ? `Live OTP sent to your phone (+91 ${cleanPhone}) via SMS. Please check your text messages.`
            : (smsNotice
                ? `SMS Gateway Notice: ${smsNotice}`
                : `6-digit OTP generated for +91 ${cleanPhone}. Please enter the OTP to verify.`),
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE OTP — Verify OTP
// POST /api/providers/mobile/verify-otp
// Body: { sessionId, otp }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/mobile/verify-otp", async (req, res) => {
    const { sessionId, otp } = req.body;

    if (!sessionId || !otp) {
        return res.status(400).json({ msg: "Session ID and 6-digit OTP are required." });
    }

    const session = mobileOtpStore.get(sessionId);
    if (!session) {
        return res.status(400).json({
            msg: "OTP session expired or replaced by a new request. Please request a new OTP.",
        });
    }

    if (Date.now() > session.expiresAt) {
        mobileOtpStore.delete(sessionId);
        phoneToSessionMap.delete(session.phone);
        return res.status(400).json({
            msg: "OTP has expired (10-minute validity exceeded). Please request a new OTP.",
        });
    }

    if (session.attempts >= MOBILE_OTP_MAX_ATTEMPTS) {
        mobileOtpStore.delete(sessionId);
        phoneToSessionMap.delete(session.phone);
        return res.status(400).json({
            msg: "Maximum attempts exceeded. Please request a new OTP.",
        });
    }

    session.attempts++;
    const isValid = await bcrypt.compare(String(otp).trim(), session.otpHash);

    if (!isValid) {
        const remaining = MOBILE_OTP_MAX_ATTEMPTS - session.attempts;
        return res.status(400).json({
            msg: "Invalid OTP. Please check and try again.",
            attemptsRemaining: remaining,
        });
    }

    // OTP correct: clean up session
    mobileOtpStore.delete(sessionId);
    phoneToSessionMap.delete(session.phone);

    // Issue short-lived verification token
    const mobileToken = jwt.sign(
        { mobile_verified: true, phone: session.phone },
        getOtpJwtSecret(),
        { expiresIn: MOBILE_TOKEN_TTL }
    );

    return res.json({
        success: true,
        mobile_token: mobileToken,
        phone: `+91 ${session.phone}`,
        message: "Mobile number verified successfully.",
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER REGISTRATION
// POST /api/providers/register
// Accepts multipart/form-data or json
// Requires email_token
// Creates User + ServiceProvider with status: "pending", verificationStatus: "PENDING"
// ─────────────────────────────────────────────────────────────────────────────
router.post(
    "/register",
    (req, res, next) => {
        upload.fields([
            { name: "profilePhoto", maxCount: 1 },
            { name: "idDocument", maxCount: 1 },
        ])(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ msg: `File upload error: ${err.message}` });
            } else if (err) {
                return res.status(400).json({ msg: err.message });
            }
            next();
        });
    },
    async (req, res) => {
        res.header("Access-Control-Allow-Credentials", true);

        const {
            name,
            email,
            phone,
            password,
            category,
            servicesOffered,
            skills,
            experienceYears,
            hourlyRate,
            bio,
            location,
            contact,
            pincode,
            streetAddress,
            city,
            district,
            state,
            email_token,
        } = req.body;

        // Email verification required
        if (!email_token) {
            return res.status(400).json({
                msg: "Email OTP verification is required to register as a service provider.",
            });
        }

        // Validate email token
        let verifiedEmailData;
        try {
            verifiedEmailData = jwt.verify(email_token, getEmailOtpJwtSecret());
            if (!verifiedEmailData.email_verified) {
                throw new Error("Invalid email verification token");
            }
        } catch {
            return res.status(400).json({
                msg: "Email verification token is invalid or expired. Please verify your email address again.",
            });
        }

        const finalEmail = (email || verifiedEmailData.email || "").trim().toLowerCase();
        const cleanPhone = normalizePhone(phone);

        if (!name || !name.trim()) {
            return res.status(400).json({ msg: "Full name is required." });
        }
        if (!finalEmail) {
            return res.status(400).json({ msg: "Email address is required." });
        }
        if (!cleanPhone) {
            return res.status(400).json({ msg: "Mobile number is required." });
        }
        if (!password) {
            return res.status(400).json({ msg: "Password is required." });
        }
        if (!category) {
            return res.status(400).json({ msg: "Service category is required." });
        }
        if (password.length < 6) {
            return res.status(400).json({ msg: "Password must be at least 6 characters long." });
        }
        if (!/^\d{10}$/.test(cleanPhone)) {
            return res.status(400).json({ msg: "Phone number must be a 10-digit mobile number." });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
            return res.status(400).json({ msg: "Invalid email address format." });
        }

        try {
            let user = await User.findOne({ email: finalEmail });
            if (user) {
                return res.status(400).json({ msg: "A user with this email already exists." });
            }

            const existingPhone = await User.findOne({ phone: cleanPhone });
            if (existingPhone) {
                return res.status(400).json({ msg: "A user with this mobile number already exists." });
            }

            const nameParts = name.trim().split(" ");
            const firstName = nameParts[0] || "Provider";
            const lastName = nameParts.slice(1).join(" ") || "Partner";

            user = new User({
                first_name: firstName,
                last_name: lastName,
                email: finalEmail,
                phone: cleanPhone,
                password,
                role: "provider",
            });
            await user.save();

            const skillList = Array.isArray(skills)
                ? skills
                : String(skills || "")
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);

            const cleanPincode = (pincode || location?.pincode || contact?.pincode || "").trim();
            const coords = [
                parseFloat(location?.lng) || (getCoordsForPincode(cleanPincode)?.[0] || 77.2090),
                parseFloat(location?.lat) || (getCoordsForPincode(cleanPincode)?.[1] || 28.6139),
            ];

            const fullAddress =
                [streetAddress, city, district, state].filter(Boolean).join(", ") ||
                location?.address ||
                contact?.address ||
                "";

            let profilePhotoPath = "";
            if (req.files?.profilePhoto?.[0]) {
                profilePhotoPath = `/uploads/${req.files.profilePhoto[0].filename}`;
            } else if (typeof req.body.profilePhoto === "string") {
                profilePhotoPath = req.body.profilePhoto;
            }

            let idDocumentPath = "";
            if (req.files?.idDocument?.[0]) {
                idDocumentPath = `/uploads/${req.files.idDocument[0].filename}`;
            } else if (typeof req.body.idDocument === "string") {
                idDocumentPath = req.body.idDocument;
            }

            const provider = new ServiceProvider({
                user: user._id,
                name: name.trim(),
                email: finalEmail,
                phone: cleanPhone,
                category,
                servicesOffered: servicesOffered || "",
                skills: skillList,
                experienceYears: parseInt(experienceYears, 10) || 0,
                hourlyRate: parseFloat(hourlyRate) || 0,
                bio: bio || "",
                pincode: cleanPincode,
                idDocument: idDocumentPath,
                idType: req.body.idType || "",
                profilePhoto: profilePhotoPath,
                // Status defaults to "pending" for admin review
                status: "pending",
                verificationStatus: "PENDING",
                isVerified: false,
                mobileVerified: false,
                emailVerified: true,
                emailVerifiedAt: new Date(),
                contact: {
                    phone: cleanPhone,
                    email: finalEmail,
                    address: fullAddress,
                    pincode: cleanPincode,
                },
                location: {
                    type: "Point",
                    coordinates: coords,
                    address: fullAddress,
                    pincode: cleanPincode,
                },
            });
            await provider.save();

            setAuthCookie(res, user._id);

            res.status(201).json({
                success: true,
                message: "Provider application submitted successfully! Your account is under admin review.",
                status: "pending",
                user: {
                    _id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                },
                provider: {
                    _id: provider._id,
                    name: provider.name,
                    category: provider.category,
                    status: provider.status,
                    isVerified: provider.isVerified,
                    verificationStatus: provider.verificationStatus,
                    mobileVerified: provider.mobileVerified,
                    emailVerified: provider.emailVerified,
                    idDocument: provider.idDocument,
                    profilePhoto: provider.profilePhoto,
                    servicesOffered: provider.servicesOffered,
                },
            });
        } catch (err) {
            console.error("Provider registration error:", err);
            if (err.code === 11000) {
                return res.status(400).json({ msg: "An account with this email or phone number already exists." });
            }
            res.status(400).json({ msg: err.message || "Registration failed. Please check your inputs." });
        }
    }
);

// List verified providers, strictly filterable by category, service field, skills, or pincode / city / district / state / proximity
router.get("/", async (req, res) => {
    try {
        const { category, search, pincode, city, district, state, lat, lng } = req.query;
        const approvalFilter = {
            $or: [
                { status: "approved" },
                { isVerified: true, status: { $nin: ["pending", "rejected", "mobile_unverified"] } },
            ],
        };

        const filter = { $and: [approvalFilter] };

        const queryTerm = (category || search || "").trim();

        if (queryTerm) {
            // Build regex terms with strict word boundaries
            const terms = [queryTerm, ...queryTerm.split(/[\s,&]+/)]
                .map((t) => t.trim())
                .filter((t) => t.length >= 2);

            const searchOrConditions = [];
            for (const term of terms) {
                const termEscaped = term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                const wordRx = new RegExp(`\\b${termEscaped}\\b`, "i");
                searchOrConditions.push(
                    { name: wordRx },
                    { category: wordRx },
                    { skills: wordRx },
                    { servicesOffered: wordRx }
                );
            }
            if (searchOrConditions.length > 0) {
                filter.$and.push({ $or: searchOrConditions });
            }
        }

        let providers = await ServiceProvider.find(filter)
            .select(publicProviderFields)
            .sort({ averageRating: -1, ratingCount: -1 });

        // Calculate distance and annotate nearest providers if location info provided
        let targetCoords = null;
        if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
            targetCoords = [parseFloat(lng), parseFloat(lat)];
        } else if (pincode) {
            targetCoords = getCoordsForPincode(pincode);
        }

        const cleanSearchPincode = (pincode || "").trim().replace(/\D/g, "");
        const cleanCity = (city || "").trim().toLowerCase();
        const cleanDistrict = (district || "").trim().toLowerCase();
        const cleanState = (state || "").trim().toLowerCase();
        const hasLocationQuery = Boolean(cleanSearchPincode || cleanCity || cleanDistrict || cleanState || targetCoords);

        let providersWithDistance = providers.map((p) => {
            const pObj = p.toObject();
            const providerPincode = (p.pincode || p.location?.pincode || p.contact?.pincode || "").trim().replace(/\D/g, "");
            const providerAddress = (p.location?.address || p.contact?.address || p.address || "").toLowerCase();
            const providerCoords = p.location?.coordinates || getCoordsForPincode(providerPincode);

            let distanceKm = null;
            let isExactPincodeMatch = false;
            let isCityMatch = false;
            let isDistrictMatch = false;
            let isStateMatch = false;
            let matchScore = 0; // Higher = closer / better match

            // 1. Check exact pincode match
            if (cleanSearchPincode && providerPincode) {
                if (cleanSearchPincode === providerPincode) {
                    isExactPincodeMatch = true;
                    distanceKm = 1.2;
                    matchScore += 100;
                } else if (cleanSearchPincode.substring(0, 3) === providerPincode.substring(0, 3)) {
                    distanceKm = distanceKm || 4.5;
                    matchScore += 50;
                } else if (cleanSearchPincode.substring(0, 2) === providerPincode.substring(0, 2)) {
                    distanceKm = distanceKm || 12.0;
                    matchScore += 20;
                }
            }

            // 2. Check City match in provider address
            if (cleanCity && providerAddress) {
                if (providerAddress.includes(cleanCity)) {
                    isCityMatch = true;
                    distanceKm = Math.min(distanceKm || 999, 3.0);
                    matchScore += 40;
                }
            }

            // 3. Check District match in provider address
            if (cleanDistrict && providerAddress) {
                if (providerAddress.includes(cleanDistrict)) {
                    isDistrictMatch = true;
                    distanceKm = Math.min(distanceKm || 999, 6.5);
                    matchScore += 30;
                }
            }

            // 4. Check State match in provider address
            if (cleanState && providerAddress) {
                if (providerAddress.includes(cleanState)) {
                    isStateMatch = true;
                    distanceKm = Math.min(distanceKm || 999, 20.0);
                    matchScore += 10;
                }
            }

            // 5. Geographic coordinates distance
            if (targetCoords && providerCoords && (!distanceKm || distanceKm > 50)) {
                const geoDist = calculateDistanceKm(targetCoords, providerCoords);
                if (geoDist !== null) {
                    distanceKm = geoDist;
                }
            }

            return {
                ...pObj,
                pincode: providerPincode,
                distanceKm: distanceKm !== null && distanceKm < 999 ? distanceKm : undefined,
                isExactPincodeMatch,
                isCityMatch,
                isDistrictMatch,
                isStateMatch,
                matchScore,
            };
        });

        // If user searched with location filters, sort best nearest match first
        if (hasLocationQuery) {
            providersWithDistance.sort((a, b) => {
                if (a.matchScore !== b.matchScore) {
                    return b.matchScore - a.matchScore; // Highest score first
                }
                const distA = a.distanceKm !== undefined ? a.distanceKm : 999999;
                const distB = b.distanceKm !== undefined ? b.distanceKm : 999999;
                return distA - distB;
            });
        }

        res.json(providersWithDistance);
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

        const { name, category, skills, experienceYears, bio, contact, location, pincode } = req.body;

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
        
        const cleanPincode = (pincode || location?.pincode || contact?.pincode || "").trim();
        if (cleanPincode) {
            provider.pincode = cleanPincode;
            if (provider.contact) provider.contact.pincode = cleanPincode;
            if (provider.location) provider.location.pincode = cleanPincode;
        }

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
            } else if (cleanPincode && getCoordsForPincode(cleanPincode)) {
                provider.location.coordinates = getCoordsForPincode(cleanPincode);
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
