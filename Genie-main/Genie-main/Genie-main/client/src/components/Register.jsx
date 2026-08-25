import { useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../utils/api";
import { UserPlus } from "lucide-react";

export default function Register({
    onRegisterSuccess,
    onClose,
    onSwitchToLogin,
}) {
    const [userData, setUserData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        password: "",
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await register(userData);
            onRegisterSuccess(response.user);
            onClose();
        } catch (error) {
            setError(error.msg || "An error occurred");
        }
    };

    const handleSwitchToLogin = (e) => {
        e.preventDefault();
        onClose();
        onSwitchToLogin();
    };

    const inputClass =
        "text-sm rounded-lg p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500";

    return (
        <>
            <form
                onSubmit={handleSubmit}
                className="w-80 sm:w-96 flex flex-col gap-6 px-8 sm:px-10 pb-8"
            >
                <div className="text-center">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                        Create Account
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Join Genie in a few seconds
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="w-full flex gap-2">
                        <input
                            type="text"
                            placeholder="First Name"
                            name="first_name"
                            value={userData.first_name}
                            onChange={handleChange}
                            className={`${inputClass} w-1/2`}
                        />
                        <input
                            type="text"
                            placeholder="Last Name"
                            name="last_name"
                            value={userData.last_name}
                            onChange={handleChange}
                            className={`${inputClass} w-1/2`}
                        />
                    </div>
                    <input
                        type="tel"
                        placeholder="Enter Mobile No"
                        pattern="[0-9]{10}"
                        maxLength="10"
                        autoComplete="off"
                        name="phone"
                        value={userData.phone}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (
                                !/[0-9]/.test(e.key) &&
                                e.key !== "Backspace" &&
                                e.key !== "Delete" &&
                                e.key !== "ArrowLeft" &&
                                e.key !== "ArrowRight" &&
                                e.key !== "Tab"
                            ) {
                                e.preventDefault();
                            }
                        }}
                        className={inputClass}
                    />
                    <input
                        type="email"
                        placeholder="Enter Email"
                        autoComplete="off"
                        name="email"
                        value={userData.email}
                        onChange={handleChange}
                        className={inputClass}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        autoComplete="off"
                        name="password"
                        value={userData.password}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>
                {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                )}
                <button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-brand-gradient text-white p-2.5 rounded-full shadow-glow-blue hover:opacity-90 transition-all text-sm font-semibold"
                >
                    <UserPlus size={16} /> Register
                </button>
                <h1 className="text-sm text-center -mt-2 text-slate-500 dark:text-slate-400">
                    Already have an account?{" "}
                    <span
                        onClick={handleSwitchToLogin}
                        className="font-semibold text-blue-600 dark:text-blue-400 underline underline-offset-2 cursor-pointer"
                    >
                        Login
                    </span>
                </h1>
                <Link
                    to="/provider/register"
                    onClick={onClose}
                    className="text-center text-sm bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full py-2 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                    Are you a service provider?{" "}
                    <span className="font-semibold">Join us here</span>
                </Link>
            </form>
        </>
    );
}
