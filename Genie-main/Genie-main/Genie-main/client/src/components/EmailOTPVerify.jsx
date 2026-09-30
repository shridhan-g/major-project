import { useState, useEffect, useRef, useCallback } from "react";
import { Mail, CheckCircle2, AlertCircle, Loader2, RefreshCw, KeyRound, ShieldCheck } from "lucide-react";
import { sendEmailOtp, verifyEmailOtp } from "../utils/api";

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60;

export default function EmailOTPVerify({ onVerified, initialEmail = "" }) {
    const [email, setEmail] = useState(initialEmail || "");

    // Flow states: "idle" | "sending" | "otp_sent" | "verifying" | "verified"
    const [step, setStep] = useState("idle");
    const [sessionId, setSessionId] = useState(null);
    const [isLiveEmail, setIsLiveEmail] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [fallbackOtp, setFallbackOtp] = useState(null);
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [attemptsRemaining, setAttemptsRemaining] = useState(5);
    const [verifiedEmail, setVerifiedEmail] = useState("");

    const [countdownSeconds, setCountdownSeconds] = useState(OTP_TTL_SECONDS);
    const [resendCooldown, setResendCooldown] = useState(0);

    const countdownRef = useRef(null);
    const cooldownRef = useRef(null);
    const otpInputRefs = useRef([]);

    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        };
    }, []);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

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

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        setError("");
    };

    const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

    const handleSendOtp = async () => {
        setError("");
        if (!isValidEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        setStep("sending");
        try {
            const res = await sendEmailOtp(email.trim().toLowerCase());
            setSessionId(res.sessionId);
            setIsLiveEmail(Boolean(res.isLiveEmail));
            setPreviewUrl(res.previewUrl || null);
            setFallbackOtp(res.fallbackOtp || null);
            setOtpDigits(["", "", "", "", "", ""]);
            setAttemptsRemaining(5);
            setStep("otp_sent");
            startCountdown();
            startCooldown();
            setTimeout(() => {
                otpInputRefs.current[0]?.focus();
            }, 150);
        } catch (err) {
            setError(err?.msg || err?.message || "Failed to send OTP. Please try again.");
            setStep("idle");
        }
    };

    const handleOtpChange = (index, value) => {
        const cleaned = value.replace(/\D/g, "");
        const newDigits = [...otpDigits];
        if (cleaned.length > 1) {
            const pasted = cleaned.slice(0, 6).split("");
            pasted.forEach((ch, idx) => { newDigits[idx] = ch; });
            setOtpDigits(newDigits);
            const nextIdx = Math.min(pasted.length, 5);
            otpInputRefs.current[nextIdx]?.focus();
        } else {
            newDigits[index] = cleaned;
            setOtpDigits(newDigits);
            if (cleaned && index < 5) otpInputRefs.current[index + 1]?.focus();
        }
        setError("");
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!text) return;
        const newDigits = [...otpDigits];
        for (let i = 0; i < text.length; i++) newDigits[i] = text[i];
        setOtpDigits(newDigits);
        const nextIdx = Math.min(text.length, 5);
        otpInputRefs.current[nextIdx]?.focus();
    };

    const handleVerifyOtp = async () => {
        setError("");
        const fullOtp = otpDigits.join("");
        if (fullOtp.length !== 6) { setError("Please enter the complete 6-digit OTP."); return; }
        if (countdownSeconds <= 0) { setError("OTP has expired. Please request a new OTP."); return; }
        setStep("verifying");
        try {
            const res = await verifyEmailOtp(sessionId, fullOtp, email.trim().toLowerCase());
            if (res.success && res.email_token) {
                if (countdownRef.current) clearInterval(countdownRef.current);
                if (cooldownRef.current) clearInterval(cooldownRef.current);
                setStep("verified");
                setVerifiedEmail(res.email || email);
                if (onVerified) {
                    onVerified({ token: res.email_token, email: res.email || email.trim().toLowerCase() });
                }
            }
        } catch (err) {
            const msg = err?.msg || err?.message || "Invalid OTP. Please try again.";
            setError(msg);
            if (err?.attemptsRemaining !== undefined) setAttemptsRemaining(err.attemptsRemaining);
            setStep("otp_sent");
        }
    };

    const handleReset = () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        setStep("idle");
        setSessionId(null);
        setPreviewUrl(null);
        setFallbackOtp(null);
        setOtpDigits(["", "", "", "", "", ""]);
        setError("");
        setVerifiedEmail("");
        if (onVerified) onVerified(null);
    };

    // ── Verified State ──────────────────────────────────────────────────────────
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
                                    ✓ Email Verified
                                </span>
                                <span className="text-xs bg-emerald-200/60 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-medium">
                                    Active
                                </span>
                            </div>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono">
                                {verifiedEmail}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={handleReset}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 underline transition-colors">
                        Change
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                            Email Verification <span className="text-red-500">*</span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Verify your email address before submitting
                        </p>
                    </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    OTP Required
                </span>
            </div>

            {/* Email input row */}
            <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1 flex rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                    <div className="flex items-center px-3 bg-slate-100 dark:bg-slate-700/50 border-r border-slate-200 dark:border-slate-600 text-slate-500">
                        <Mail size={16} />
                    </div>
                    <input
                        type="email"
                        name="emailVerifyInput"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={handleEmailChange}
                        disabled={step === "otp_sent" || step === "sending" || step === "verifying"}
                        className="w-full text-sm px-3.5 py-2.5 outline-none bg-transparent text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-75"
                    />
                </div>

                {step === "idle" || step === "sending" ? (
                    <button type="button" onClick={handleSendOtp}
                        disabled={!isValidEmail(email) || step === "sending"}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shrink-0">
                        {step === "sending" ? (
                            <><Loader2 size={16} className="animate-spin" /> Sending...</>
                        ) : (
                            <><Mail size={16} /> Send OTP</>
                        )}
                    </button>
                ) : (
                    <button type="button" onClick={handleReset}
                        className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white underline self-center">
                        Change Email
                    </button>
                )}
            </div>

            {/* OTP Sent: Input Boxes + Countdown */}
            {(step === "otp_sent" || step === "verifying") && (
                <div className="flex flex-col gap-3 pt-3 border-t border-slate-200 dark:border-slate-700 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <KeyRound size={14} className="text-indigo-500" />
                            Enter 6-digit OTP sent to {email}
                        </span>
                        <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                            countdownSeconds < 120
                                ? "text-red-600 bg-red-50 dark:bg-red-950/40"
                                : "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40"
                        }`} title="Valid for 10 minutes">
                            Expires in: {formatTime(countdownSeconds)}
                        </span>
                    </div>

                    {isLiveEmail ? (
                        <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                            <span>📧 <strong>Email Sent:</strong> A 6-digit verification code has been sent to <strong>{email}</strong>. Please check your inbox and spam folder.</span>
                        </div>
                    ) : previewUrl ? (
                        <div className="rounded-xl p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs text-amber-900 dark:text-amber-200 flex flex-col gap-2">
                            <div className="font-medium">🔧 <strong>Dev Mode:</strong> Email sent via Ethereal (test inbox).</div>
                            <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                                className="underline text-amber-700 dark:text-amber-300 font-semibold">
                                👁 Preview email in browser →
                            </a>
                            {fallbackOtp && (
                                <div className="flex items-center justify-between pt-1.5 border-t border-amber-200 dark:border-amber-800/60">
                                    <span>Code: <strong className="font-mono text-sm tracking-wider">{fallbackOtp}</strong></span>
                                    <button type="button" onClick={() => setOtpDigits(fallbackOtp.split(""))}
                                        className="text-xs font-semibold underline text-amber-800">Auto-fill</button>
                                </div>
                            )}
                        </div>
                    ) : fallbackOtp ? (
                        <div className="rounded-xl p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-200 flex items-center justify-between gap-3">
                            <span>📋 OTP: <strong className="font-mono text-sm tracking-widest">{fallbackOtp}</strong></span>
                            <button type="button" onClick={() => setOtpDigits(fallbackOtp.split(""))}
                                className="text-xs font-semibold underline text-blue-700">Auto-fill</button>
                        </div>
                    ) : (
                        <div className="rounded-xl p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-200">
                            📧 Enter the 6-digit code sent to <strong>{email}</strong>.
                        </div>
                    )}

                    {/* 6 OTP Digit Inputs */}
                    <div className="flex items-center justify-between gap-2 sm:gap-3 py-1">
                        {otpDigits.map((digit, idx) => (
                            <input key={idx} ref={(el) => (otpInputRefs.current[idx] = el)}
                                type="text" inputMode="numeric" maxLength="1"
                                value={digit}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                onPaste={handleOtpPaste}
                                className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                            />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                        <button type="button" onClick={handleSendOtp}
                            disabled={resendCooldown > 0 || step === "verifying"}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <RefreshCw size={13} className={resendCooldown > 0 ? "animate-spin" : ""} />
                            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                        </button>
                        <button type="button" onClick={handleVerifyOtp}
                            disabled={otpDigits.join("").length !== 6 || step === "verifying"}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                            {step === "verifying" ? (
                                <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                            ) : (
                                <><CheckCircle2 size={16} /> Verify OTP</>
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
