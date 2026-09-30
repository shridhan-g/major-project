import { useState, useEffect, useRef, useCallback } from "react";
import { ShieldCheck, ShieldAlert, Loader2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { sendAadhaarOtp, verifyAadhaarOtp } from "../utils/api";

const OTP_RESEND_COOLDOWN = 60;  // seconds
const OTP_TTL = 5 * 60;          // seconds

export default function AadhaarVerify({ onVerified }) {
    // Consent
    const [consentGiven, setConsentGiven] = useState(false);

    // Aadhaar input
    const [aadhaar, setAadhaar] = useState("");
    const [showAadhaar, setShowAadhaar] = useState(false);

    // OTP flow
    const [step, setStep] = useState("idle"); // idle | sending | otp | verifying | verified
    const [sessionId, setSessionId] = useState(null);
    const [demoOtp, setDemoOtp] = useState(null);
    const [otpMode, setOtpMode] = useState(null); // "real" | "demo"
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [attemptsLeft, setAttemptsLeft] = useState(5);

    // Timers
    const [otpExpiry, setOtpExpiry] = useState(0);
    const [resendCooldown, setResendCooldown] = useState(0);
    const expiryRef = useRef(null);
    const resendRef = useRef(null);
    const otpInputRefs = useRef([]);

    const startOtpExpiry = useCallback(() => {
        setOtpExpiry(OTP_TTL);
        clearInterval(expiryRef.current);
        expiryRef.current = setInterval(() => {
            setOtpExpiry((s) => {
                if (s <= 1) {
                    clearInterval(expiryRef.current);
                    setStep("idle");
                    setError("OTP has expired. Please request a new one.");
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
    }, []);

    const startResendCooldown = useCallback(() => {
        setResendCooldown(OTP_RESEND_COOLDOWN);
        clearInterval(resendRef.current);
        resendRef.current = setInterval(() => {
            setResendCooldown((s) => {
                if (s <= 1) { clearInterval(resendRef.current); return 0; }
                return s - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => () => {
        clearInterval(expiryRef.current);
        clearInterval(resendRef.current);
    }, []);

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60).toString().padStart(2, "0");
        const s = (sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const handleAadhaarChange = (e) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 12);
        setAadhaar(val);
        setError("");
    };

    const handleSendOtp = useCallback(async () => {
        setError("");
        if (!/^\d{12}$/.test(aadhaar)) {
            setError("Please enter a valid 12-digit Aadhaar number.");
            return;
        }
        setStep("sending");
        try {
            // Send raw Aadhaar number over HTTPS — backend passes it to UIDAI provider
            const res = await sendAadhaarOtp(aadhaar);
            setSessionId(res.sessionId);
            setOtpMode(res.mode);
            if (res.demo_otp) setDemoOtp(res.demo_otp);
            setOtp(["", "", "", "", "", ""]);
            setAttemptsLeft(5);
            setStep("otp");
            startOtpExpiry();
            startResendCooldown();
            setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
        } catch (err) {
            setError(err?.msg || err?.message || "Failed to send OTP. Please try again.");
            setStep("idle");
        }
    }, [aadhaar, startOtpExpiry, startResendCooldown]);

    const handleOtpInput = (idx, val) => {
        if (!/^\d*$/.test(val)) return;
        const updated = [...otp];
        updated[idx] = val.slice(-1);
        setOtp(updated);
        setError("");
        if (val && idx < 5) {
            otpInputRefs.current[idx + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (idx, e) => {
        if (e.key === "Backspace" && !otp[idx] && idx > 0) {
            otpInputRefs.current[idx - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(""));
            otpInputRefs.current[5]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join("");
        if (otpString.length < 6) {
            setError("Please enter the complete 6-digit OTP.");
            return;
        }
        setStep("verifying");
        try {
            const res = await verifyAadhaarOtp(sessionId, otpString);
            clearInterval(expiryRef.current);
            clearInterval(resendRef.current);
            setStep("verified");
            setDemoOtp(null);
            onVerified(res.aadhaar_token);
        } catch (err) {
            const remaining = err?.attemptsRemaining;
            const newAttempts = remaining !== undefined ? remaining : attemptsLeft - 1;
            setAttemptsLeft(newAttempts);
            setError(err?.msg || "Invalid OTP. Please try again.");
            setOtp(["", "", "", "", "", ""]);
            setTimeout(() => otpInputRefs.current[0]?.focus(), 50);
            if (newAttempts <= 0) {
                setStep("idle");
                setSessionId(null);
                setDemoOtp(null);
            } else {
                setStep("otp");
            }
        }
    };

    const handleResend = useCallback(() => {
        if (resendCooldown > 0) return;
        clearInterval(expiryRef.current);
        setStep("idle");
        setOtp(["", "", "", "", "", ""]);
        setDemoOtp(null);
        setError("");
        setTimeout(() => handleSendOtp(), 0);
    }, [resendCooldown, handleSendOtp]);

    /* ─────────────── VERIFIED STATE ─────────────── */
    if (step === "verified") {
        return (
            <div className="aadhaar-verified-banner">
                <ShieldCheck size={20} className="aadhaar-shield-icon" />
                <span>Aadhaar Verified ✓</span>
            </div>
        );
    }

    return (
        <div className="aadhaar-section">
            {/* Header */}
            <div className="aadhaar-header">
                <ShieldCheck size={18} className="aadhaar-header-icon" />
                <div>
                    <p className="aadhaar-header-title">Aadhaar Verification</p>
                    <p className="aadhaar-header-sub">Required to become a verified service provider</p>
                </div>
                                <span className={otpMode === "real" ? "aadhaar-real-badge" : "aadhaar-demo-badge"}>
                                {otpMode === "real" ? "UIDAI Live" : "Demo Mode"}
                            </span>
            </div>

            {/* Consent */}
            {!consentGiven ? (
                <label className="aadhaar-consent-label" htmlFor="aadhaar-consent">
                    <input
                        type="checkbox"
                        className="aadhaar-consent-checkbox"
                        checked={consentGiven}
                        onChange={(e) => setConsentGiven(e.target.checked)}
                        id="aadhaar-consent"
                    />
                    <span className="aadhaar-consent-text">
                        I consent to Aadhaar-based identity verification as per UIDAI guidelines.
                        My Aadhaar number will be used only for one-time verification and will not be stored.
                    </span>
                </label>
            ) : (
                <div className="aadhaar-flow">
                    {/* Aadhaar Number Input */}
                    <div className="aadhaar-field-row">
                        <div className="aadhaar-input-wrapper">
                            <label className="aadhaar-label" htmlFor="aadhaar-number">
                                Aadhaar Number *
                            </label>
                            <div className="aadhaar-input-inner">
                                <input
                                    type={showAadhaar ? "text" : "password"}
                                    inputMode="numeric"
                                    maxLength={12}
                                    placeholder="Enter 12-digit Aadhaar number"
                                    value={aadhaar}
                                    onChange={handleAadhaarChange}
                                    disabled={step === "otp" || step === "verifying" || step === "sending"}
                                    className="aadhaar-number-input"
                                    autoComplete="off"
                                    id="aadhaar-number"
                                />
                                <button
                                    type="button"
                                    className="aadhaar-eye-btn"
                                    onClick={() => setShowAadhaar((v) => !v)}
                                    tabIndex={-1}
                                    aria-label="Toggle Aadhaar visibility"
                                >
                                    {showAadhaar ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {aadhaar.length > 0 && aadhaar.length < 12 && (
                                <span className="aadhaar-digits-left">
                                    {12 - aadhaar.length} digit{12 - aadhaar.length !== 1 ? "s" : ""} remaining
                                </span>
                            )}
                        </div>

                        {/* Send OTP button — only shown when not in OTP entry mode */}
                        {step !== "otp" && step !== "verifying" && (
                            <button
                                type="button"
                                id="aadhaar-send-otp-btn"
                                onClick={handleSendOtp}
                                disabled={step === "sending" || aadhaar.length !== 12}
                                className="aadhaar-send-btn"
                            >
                                {step === "sending" ? (
                                    <>
                                        <Loader2 size={15} className="aadhaar-spin" />
                                        Sending…
                                    </>
                                ) : (
                                    "Send OTP"
                                )}
                            </button>
                        )}
                    </div>

                    {/* OTP sent info */}
                    {step === "otp" && (
                        demoOtp ? (
                            <div className="aadhaar-demo-hint">
                                <span className="aadhaar-demo-hint-label">🔧 Demo OTP:</span>
                                <span className="aadhaar-demo-hint-otp">{demoOtp}</span>
                                <span className="aadhaar-demo-hint-note">
                                    (Real UIDAI OTP goes to Aadhaar-registered mobile. Add AADHAAR_API_KEY in .env for live mode.)
                                </span>
                            </div>
                        ) : (
                            <div className="aadhaar-real-hint">
                                <span>📱 OTP sent to your <strong>Aadhaar-registered mobile number</strong>. Please check your SMS.</span>
                            </div>
                        )
                    )}

                    {/* OTP Input Section */}
                    {(step === "otp" || step === "verifying") && (
                        <div className="aadhaar-otp-section">
                            <div className="aadhaar-otp-meta">
                                <span className="aadhaar-otp-label">Enter 6-digit OTP</span>
                                <span className="aadhaar-otp-expiry">
                                    Expires in{" "}
                                    <span className={otpExpiry < 60 ? "aadhaar-expiry-red" : "aadhaar-expiry-normal"}>
                                        {formatTime(otpExpiry)}
                                    </span>
                                </span>
                            </div>

                            <div className="aadhaar-otp-boxes" onPaste={handleOtpPaste}>
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => (otpInputRefs.current[idx] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpInput(idx, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                        disabled={step === "verifying"}
                                        className={`aadhaar-otp-box${digit ? " aadhaar-otp-box--filled" : ""}`}
                                        id={`aadhaar-otp-${idx}`}
                                        aria-label={`OTP digit ${idx + 1}`}
                                    />
                                ))}
                            </div>

                            <div className="aadhaar-otp-actions">
                                <button
                                    type="button"
                                    id="aadhaar-verify-btn"
                                    onClick={handleVerifyOtp}
                                    disabled={step === "verifying" || otp.join("").length < 6}
                                    className="aadhaar-verify-btn"
                                >
                                    {step === "verifying" ? (
                                        <>
                                            <Loader2 size={15} className="aadhaar-spin" />
                                            Verifying…
                                        </>
                                    ) : (
                                        "Verify OTP"
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0}
                                    className="aadhaar-resend-btn"
                                    id="aadhaar-resend-btn"
                                >
                                    <RefreshCw size={13} />
                                    {resendCooldown > 0
                                        ? `Resend in ${resendCooldown}s`
                                        : "Resend OTP"}
                                </button>
                            </div>

                            {attemptsLeft < 5 && attemptsLeft > 0 && (
                                <p className="aadhaar-attempts">
                                    {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
                                </p>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="aadhaar-error">
                            <ShieldAlert size={15} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
