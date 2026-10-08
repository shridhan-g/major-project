import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, LogIn, ArrowLeft, AlertCircle, KeyRound, CheckCircle2 } from "lucide-react";
import { login as apiLogin } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { logo } from "../../assets";

export default function AdminLogin({ nonAdminUser }) {
    const { login, logout } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        emailOrPhone: "admin@gmail.com",
        password: "admin@1234",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [rememberMe, setRememberMe] = useState(true);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError("");
    };

    const handleFillDemo = () => {
        setFormData({
            emailOrPhone: "admin@gmail.com",
            password: "admin@1234",
        });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const loginData = {
                email: formData.emailOrPhone.includes("@") ? formData.emailOrPhone.trim().toLowerCase() : undefined,
                phone: !formData.emailOrPhone.includes("@") ? formData.emailOrPhone.trim() : undefined,
                password: formData.password,
            };

            const response = await apiLogin(loginData);

            if (!response?.user) {
                throw new Error("Invalid response from server");
            }

            if (response.user.role !== "admin") {
                setError("Access denied: This account does not have administrator privileges.");
                setLoading(false);
                return;
            }

            // Successfully authenticated as admin
            login({ ...response.user, token: response.token });
            navigate("/admin", { replace: true });
        } catch (err) {
            console.error("Admin login error:", err);
            const msg =
                err?.msg ||
                err?.message ||
                (typeof err === "string" ? err : "Invalid admin credentials. Please verify email and password.");
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // If already logged in as a non-admin account
    if (nonAdminUser) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background decorative glowing orbs */}
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10 text-center">
                    <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Admin Privileges Required</h2>
                    <p className="text-sm text-slate-300 mb-4">
                        You are currently signed in as:
                    </p>
                    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3.5 mb-6 text-left">
                        <p className="text-sm font-semibold text-white">
                            {nonAdminUser.first_name} {nonAdminUser.last_name || ""}
                        </p>
                        <p className="text-xs text-slate-400">{nonAdminUser.email}</p>
                        <span className="inline-block mt-2 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-600">
                            Current Role: {nonAdminUser.role || "user"}
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={logout}
                            className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm transition-all shadow-lg shadow-orange-600/20 cursor-pointer"
                        >
                            Sign In with Admin Account
                        </button>
                        <Link
                            to="/"
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition-all inline-flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} /> Return to Genie Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Background ambient gradient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-orange-600/15 via-blue-600/15 to-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

            {/* Back to Home link */}
            <div className="w-full max-w-md mb-4 flex items-center justify-between z-10">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={14} /> Back to Genie
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Secure Portal
                </div>
            </div>

            {/* Main Login Card */}
            <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10">
                {/* Header branding */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 text-orange-400 mb-3 shadow-lg shadow-orange-500/10">
                        <ShieldCheck size={28} />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <img src={logo} alt="Genie" className="h-6" />
                        <h1 className="text-xl font-bold text-white tracking-tight">GENIE ADMIN</h1>
                    </div>
                    <p className="text-xs text-slate-400">
                        Sign in to access administrator dashboard & controls
                    </p>
                </div>

                {/* Quick-fill Demo Admin credentials chip */}
                <div className="mb-5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                        <KeyRound size={15} className="text-amber-400 shrink-0" />
                        <div>
                            <span className="font-semibold text-slate-200">Default Admin:</span>{" "}
                            <code className="text-amber-300 font-mono text-[11px]">admin@gmail.com</code>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleFillDemo}
                        className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 px-2.5 py-1 rounded-md transition-all cursor-pointer shrink-0"
                    >
                        Auto-Fill
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Admin Email / Phone
                        </label>
                        <div className="relative">
                            <Mail
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                            />
                            <input
                                type="text"
                                name="emailOrPhone"
                                required
                                value={formData.emailOrPhone}
                                onChange={handleChange}
                                placeholder="admin@gmail.com"
                                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                            />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-orange-500/20"
                            />
                            <span>Remember admin session</span>
                        </label>
                        <span className="text-slate-500 text-[11px]">Role: Admin</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                <LogIn size={16} /> Sign In to Admin Panel
                            </>
                        )}
                    </button>
                </form>

                {/* Footer notes */}
                <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
                    <p>
                        Authorized personnel only. All access attempts are logged.
                    </p>
                </div>
            </div>
        </div>
    );
}
