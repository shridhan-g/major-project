import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, CheckCircle2, AlertCircle, Loader2, RefreshCw, KeyRound, ShieldCheck } from "lucide-react";
import { sendMobileOtp, verifyMobileOtp } from "../utils/api";

const OTP_TTL_SECONDS = 10 * 60; // Exactly 10 minutes (600 seconds)
const RESEND_COOLDOWN_SECONDS = 60; // 60 seconds cooldown for resend

export default function MobileOTPVerify({ onVerified, initialPhone = "" }) {
    const [countryCode, setCountryCode] = useState("+91");
    const [phone, setPhone] = useState(
        initialPhone ? initialPhone.replace(/^\+91/, "").replace(/\D/g, "").slice(0, 10) : ""
    );

    // Flow states: "idle" | "sending" | "otp_sent" | "verifying" | "verified"
    const [step, setStep] = useState("idle"); // idle | sending | otp_sent | verifying | verified
    const [sessionId, setSessionId] = useState(null);
    const [isLiveSms, setIsLiveSms] = useState(false);
    const [smsNotice, setSmsNotice] = useState(null);
    const [fallbackOtp, setFallbackOtp] = useState(null);
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [attemptsRemaining, setAttemptsRemaining] = useState(5);
    const [verifiedPhone, setVerifiedPhone] = useState("");

    // Timers
    const [countdownSeconds, setCountdownSeconds] = useState(OTP_TTL_SECONDS);
    const [resendCooldown, setResendCooldown] = useState(0);

    const countdownRef = useRef(null);
    const cooldownRef = useRef(null);
    const otpInputRefs = useRef([]);

    // Clear timers on unmount
    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        };
    }, []);

    // Format seconds into MM:SS
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60)
            .toString()
            .padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    // Start 10-minute OTP countdown timer
    const startCountdown = useCallback(() => {
        setCountdownSeconds(OTP_TTL_SECONDS);
        if (countdownRef.current) clearInterval(countdownRef.current);

        countdownRef.current = setInterval(() => {
            setCountdownSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    setError("OTP has expired. Please click Resend OTP.");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    // Start Resend cooldown timer
    const startCooldown = useCallback(() => {
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        if (cooldownRef.current) clearInterval(cooldownRef.current);

        cooldownRef.current = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
        setPhone(val);
        setError("");
    };

    // Send OTP
    const handleSendOtp = async () => {
        setError("");
        if (!/^\d{10}$/.test(phone)) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }

        setStep("sending");
        try {
            const fullPhone = `${countryCode}${phone}`;
            const res = await sendMobileOtp(fullPhone);

            setSessionId(res.sessionId);
            setIsLiveSms(Boolean(res.isLiveSms));
            setSmsNotice(res.smsNotice || null);
            setFallbackOtp(res.fallbackOtp || null);
            setOtpDigits(["", "", "", "", "", ""]);
            setAttemptsRemaining(5);
            setStep("otp_sent");

            startCountdown();
            startCooldown();

            // Auto focus first OTP input box
            setTimeout(() => {
                otpInputRefs.current[0]?.focus();
            }, 150);
        } catch (err) {
            setError(err?.msg || err?.message || "Failed to send OTP. Please try again.");
            setStep("idle");
        }
    };

    // Handle OTP single box input
    const handleOtpChange = (index, value) => {
        const cleaned = value.replace(/\D/g, "");
        const newDigits = [...otpDigits];

        if (cleaned.length > 1) {
            // Paste or multi-character input
            const pasted = cleaned.slice(0, 6).split("");
            pasted.forEach((ch, idx) => {
                newDigits[idx] = ch;
            });
            setOtpDigits(newDigits);
            const nextIdx = Math.min(pasted.length, 5);
            otpInputRefs.current[nextIdx]?.focus();
        } else {
            newDigits[index] = cleaned;
            setOtpDigits(newDigits);
            if (cleaned && index < 5) {
                otpInputRefs.current[index + 1]?.focus();
            }
        }
        setError("");
    };

    // Backspace handling
    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    // Paste entire OTP
    const handleOtpPaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!text) return;
        const newDigits = [...otpDigits];
        for (let i = 0; i < text.length; i++) {
            newDigits[i] = text[i];
        }
        setOtpDigits(newDigits);
        const nextIdx = Math.min(text.length, 5);
        otpInputRefs.current[nextIdx]?.focus();
    };

    // Verify OTP
    const handleVerifyOtp = async () => {
        setError("");
        const fullOtp = otpDigits.join("");
        if (fullOtp.length !== 6) {
            setError("Please enter the complete 6-digit OTP.");
            return;
        }

        if (countdownSeconds <= 0) {
            setError("OTP has expired. Please request a new OTP.");
            return;
        }

        setStep("verifying");
        try {
            const res = await verifyMobileOtp(sessionId, fullOtp);
            if (res.success && res.mobile_token) {
                if (countdownRef.current) clearInterval(countdownRef.current);
                if (cooldownRef.current) clearInterval(cooldownRef.current);

                setStep("verified");
                setVerifiedPhone(`${countryCode} ${phone}`);
                if (onVerified) {
                    onVerified({
                        token: res.mobile_token,
                        phone: `${countryCode}${phone}`,
                        rawPhone: phone,
                    });
                }
            }
        } catch (err) {
            const msg = err?.msg || err?.message || "Invalid OTP. Please try again.";
            setError(msg);
            if (err?.attemptsRemaining !== undefined) {
                setAttemptsRemaining(err.attemptsRemaining);
            }
            setStep("otp_sent");
        }
    };

    // Reset flow to re-enter number
    const handleReset = () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        setStep("idle");
        setSessionId(null);
        setSmsNotice(null);
        setFallbackOtp(null);
        setOtpDigits(["", "", "", "", "", ""]);
        setError("");
        setVerifiedPhone("");
        if (onVerified) {
            onVerified(null);
        }
    };

    // ── Verified State ─────────────────────────────────────────────────────────
    if (step === "verified") {
        return (
            <div className="rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 shadow-sm transition-all animate-fadeIn">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm tracking-wide">
                                    ✓ Mobile Number Verified
                                </span>
                                <span className="text-xs bg-emerald-200/60 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-medium">
                                    Active
                                </span>
                            </div>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono">
                                {verifiedPhone}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 underline transition-colors"
                    >
                        Change
                    </button>
                </div>
            </div>
        );
    }

    // ── Main Input & Verification Card ─────────────────────────────────────────
    return (
        <div className="rounded-2xl p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                            Mobile Number Verification <span className="text-red-500">*</span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Required before submitting provider application
                        </p>
                    </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    OTP Required
                </span>
            </div>

            {/* Mobile number row */}
            <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1 flex rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <div className="flex items-center px-3 bg-slate-100 dark:bg-slate-700/50 border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <span>🇮🇳 {countryCode}</span>
                    </div>
                    <input
                        type="tel"
                        name="mobileVerifyPhone"
                        placeholder="Enter 10-digit mobile number"
                        maxLength="10"
                        value={phone}
                        onChange={handlePhoneChange}
                        disabled={step === "otp_sent" || step === "sending" || step === "verifying"}
                        className="w-full text-sm px-3.5 py-2.5 outline-none bg-transparent text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-75"
                    />
                </div>

                {step === "idle" || step === "sending" ? (
                    <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={phone.length !== 10 || step === "sending"}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
                    >
                        {step === "sending" ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Phone size={16} />
                                Send OTP
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white underline self-center"
                    >
                        Change Number
                    </button>
                )}
            </div>

            {/* OTP Sent: Input Boxes + 10-min Countdown Timer */}
            {(step === "otp_sent" || step === "verifying") && (
                <div className="flex flex-col gap-3 pt-3 border-t border-slate-200 dark:border-slate-700 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <KeyRound size={14} className="text-blue-500" />
                            Enter 6-digit OTP sent to {countryCode} {phone}
                        </span>
                        <span
                            className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                                countdownSeconds < 120
                                    ? "text-red-600 bg-red-50 dark:bg-red-950/40"
                                    : "text-blue-600 bg-blue-50 dark:bg-blue-950/40"
                            }`}
                            title="Valid for 10 minutes"
                        >
                            Expires in: {formatTime(countdownSeconds)}
                        </span>
                    </div>

                    {isLiveSms ? (
                        <div className="rounded-xl p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                            <span>📱 <strong>Live SMS Dispatched:</strong> A 6-digit OTP has been sent via SMS to <strong>{countryCode} {phone}</strong>. Please check your phone.</span>
                        </div>
                    ) : smsNotice ? (
                        <div className="rounded-xl p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs text-amber-900 dark:text-amber-200 flex flex-col gap-2">
                            <div className="flex items-start gap-1.5 font-medium text-amber-800 dark:text-amber-300">
                                <span className="shrink-0">⚠️ <strong>Fast2SMS Gateway Status:</strong></span>
                                <span>{smsNotice}</span>
                            </div>
                            {fallbackOtp && (
                                <div className="flex items-center justify-between pt-1.5 border-t border-amber-200 dark:border-amber-800/60">
                                    <span>Verification Code: <strong className="font-mono text-sm tracking-wider font-bold text-amber-950 dark:text-amber-100">{fallbackOtp}</strong></span>
                                    <button
                                        type="button"
                                        onClick={() => setOtpDigits(fallbackOtp.split(""))}
                                        className="text-xs font-semibold underline text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-white"
                                    >
                                        Auto-fill
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
                            <span>📱 Enter the 6-digit verification code sent to <strong>{countryCode} {phone}</strong>.</span>
                        </div>
                    )}

                    {/* 6 Digit Input Boxes */}
                    <div className="flex items-center justify-between gap-2 sm:gap-3 py-1">
                        {otpDigits.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => (otpInputRefs.current[idx] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                onPaste={handleOtpPaste}
                                className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                            />
                        ))}
                    </div>

                    {/* Action buttons: Verify + Resend */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                        <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={resendCooldown > 0 || step === "verifying"}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <RefreshCw size={13} className={resendCooldown > 0 ? "animate-spin" : ""} />
                            {resendCooldown > 0
                                ? `Resend OTP in ${resendCooldown}s`
                                : "Resend OTP"}
                        </button>

                        <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={otpDigits.join("").length !== 6 || step === "verifying"}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            {step === "verifying" ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    Verify OTP
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-2.5">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
