import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../utils/api";
import { LogIn, ShieldCheck } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { t } from "../utils/translations";

export default function Login({ onLoginSuccess, onClose, onSwitchToRegister }) {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ emailOrPhone: "", password: "" });
    const [error, setError] = useState("");
    const { lang } = useLang();

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const loginData = {
                email: userData.emailOrPhone.includes("@") ? userData.emailOrPhone.trim().toLowerCase() : undefined,
                phone: !userData.emailOrPhone.includes("@") ? userData.emailOrPhone.trim() : undefined,
                password: userData.password,
            };
            const response = await login(loginData);
            onLoginSuccess(response.user);
            onClose();

            if (response.user?.role === "admin") {
                navigate("/admin");
            }
        } catch (error) {
            setError(error.msg || "Invalid Credentials");
        }
    };

    const handleSwitchToRegister = (e) => {
        e.preventDefault();
        onClose();
        onSwitchToRegister();
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="w-80 sm:w-96 flex flex-col gap-6 px-8 sm:px-10 pb-8">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t(lang, "login_welcome")}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t(lang, "login_subtitle")}</p>
                </div>
                <div className="flex flex-col gap-3">
                    <input
                        id="validatingEmail"
                        type="text"
                        placeholder={t(lang, "login_email_phone")}
                        autoComplete="off"
                        name="emailOrPhone"
                        value={userData.emailOrPhone}
                        onChange={handleChange}
                        className="text-sm rounded-lg p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        id="validatingPassword"
                        type="password"
                        placeholder={t(lang, "login_password")}
                        autoComplete="off"
                        name="password"
                        value={userData.password}
                        onChange={handleChange}
                        className="text-sm rounded-lg p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2 select-none">
                        <input type="checkbox" name="RememberMe" id="RememberMe" className="accent-blue-600" />
                        <label htmlFor="RememberMe" className="text-sm text-slate-500 dark:text-slate-400">
                            {t(lang, "login_remember")}
                        </label>
                    </div>
                </div>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-brand-gradient text-white p-2.5 rounded-full shadow-glow-blue hover:opacity-90 transition-all text-sm font-semibold"
                >
                    <LogIn size={16} /> {t(lang, "login_btn")}
                </button>
                <h1 className="text-sm text-center -mt-2 text-slate-500 dark:text-slate-400">
                    {t(lang, "login_no_account")}{" "}
                    <span
                        onClick={handleSwitchToRegister}
                        className="font-semibold text-blue-600 dark:text-blue-400 underline underline-offset-2 cursor-pointer"
                    >
                        {t(lang, "login_register_now")}
                    </span>
                </h1>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-center">
                    <Link
                        to="/admin"
                        onClick={onClose}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors inline-flex items-center gap-1.5 justify-center"
                    >
                        <ShieldCheck size={14} className="text-orange-500" />
                        <span>Administrator? <span className="font-semibold underline">Admin Portal Login</span></span>
                    </Link>
                </div>
            </form>
        </>
    );
}
