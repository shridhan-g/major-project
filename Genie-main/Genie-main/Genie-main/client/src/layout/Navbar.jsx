import { useEffect, useState, useCallback, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { bookings, logo } from "../assets";
import { HiUser } from "react-icons/hi2";
import { Sun, Moon, ShoppingCart, MapPin, BadgeCheck, Wrench } from "lucide-react";

import Login from "../components/Login";
import Register from "../components/Register";
import PortalLayout from "../components/PortalLayout";

import { CartContext } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import PortalContext from "../context/PortalContext";
import Location from "../components/Location";

const NAV_LINKS = [
    { label: "Home", to: "/" },
    { label: "Services", to: "/#services" },
    { label: "Providers", to: "/providers" },
    { label: "Bookings", to: "/bookings" },
    { label: "Become a Provider", to: "/provider/register" },
    { label: "Provider Dashboard", to: "/provider/dashboard" },
];

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { dark, toggle } = useTheme();

    const {
        showAddress,
        openAddress,
        closeAddress,
        showLogin,
        openLogin,
        closeLogin,
        showRegister,
        openRegister,
        closeRegister,
    } = useContext(PortalContext);

    const { isAuthenticated, user, login, logout } = useAuth();
    const { getCartCount } = useContext(CartContext);

    const [top, setTop] = useState(true);

    useEffect(() => {
        const scrollHandler = () => {
            window.scrollY > 10 ? setTop(false) : setTop(true);
        };
        window.addEventListener("scroll", scrollHandler);
        return () => window.removeEventListener("scroll", scrollHandler);
    }, []);

    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        setCartCount(getCartCount());
    }, [getCartCount]);

    const handleLoginSuccess = useCallback(
        (userData) => {
            login(userData);
            closeLogin();
        },
        [closeLogin, login]
    );

    const handleRegisterSuccess = useCallback(
        (userData) => {
            login(userData);
            closeRegister();
        },
        [closeRegister, login]
    );

    const handleLogout = useCallback(async () => {
        try {
            await logout();
            navigate("/");
        } catch (error) {
            console.error("Logout failed", error);
        }
    }, [logout, navigate]);

    const isActive = (to) => {
        if (to === "/") return location.pathname === "/";
        if (to === "/#services") return location.pathname === "/";
        return location.pathname.startsWith(to);
    };

    const goHomeAndScrollToServices = (e, to) => {
        if (to === "/#services") {
            e.preventDefault();
            if (location.pathname !== "/") {
                navigate("/");
                setTimeout(() => {
                    document
                        .getElementById("services")
                        ?.scrollIntoView({ behavior: "smooth" });
                }, 150);
            } else {
                document
                    .getElementById("services")
                    ?.scrollIntoView({ behavior: "smooth" });
            }
        }
    };

    return (
        <>
            <header
                className={`fixed top-0 inset-x-0 z-50 glass border-b border-slate-200/70 dark:border-slate-700/70 transition-shadow duration-300 ${
                    !top && "shadow-glass"
                }`}
            >
                <nav className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 h-16">
                    {/* Brand */}
                    <div className="flex items-center gap-1 shrink-0">
                        <img src={logo} alt="" className="h-9" />
                        <Link
                            to="/"
                            className="text-2xl tracking-tighter font-semibold logo hover:text-blue-600 transition-colors duration-300"
                        >
                            GENIE
                        </Link>
                        {isAuthenticated && user?.role === "admin" && (
                            <Link
                                to="/admin"
                                className="flex items-center gap-1 text-xs uppercase font-semibold font-[NeuwMachina] tracking-wide mt-0.5 mx-2 bg-orange-100 border border-orange-500 text-orange-700 rounded-md px-2 py-0.5 hover:bg-orange-200 transition-colors duration-300"
                            >
                                <BadgeCheck size={13} /> Admin
                            </Link>
                        )}
                        {isAuthenticated && user?.role === "provider" && (
                            <Link
                                to="/provider/dashboard"
                                className="flex items-center gap-1 text-xs uppercase font-semibold font-[NeuwMachina] tracking-wide mt-0.5 mx-2 bg-emerald-100 border border-emerald-600 text-emerald-700 rounded-md px-2 py-0.5 hover:bg-emerald-200 transition-colors duration-300"
                            >
                                <Wrench size={13} /> Provider
                            </Link>
                        )}
                    </div>

                    {/* Nav links */}
                    <div className="hidden lg:flex items-center gap-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.label}
                                to={link.to}
                                onClick={(e) => goHomeAndScrollToServices(e, link.to)}
                                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors duration-300 ${
                                    isActive(link.to)
                                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={toggle}
                            aria-label="Toggle dark mode"
                            className="p-2 rounded-full border border-slate-300 dark:border-slate-600 hover:border-blue-500 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                        >
                            {dark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <Link
                            to="/viewcart"
                            className="relative flex items-center gap-1.5 p-2 rounded-full border border-slate-300 dark:border-slate-600 hover:border-blue-500 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                        >
                            <ShoppingCart size={18} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-brand-gradient text-white text-[11px] font-bold">
                                    {cartCount}
                                </span>
                            )}
                            <span className="hidden sm:inline text-sm">Cart</span>
                        </Link>

                        {isAuthenticated && user ? (
                            <>
                                <Link
                                    to="/bookings"
                                    className="hidden sm:flex items-center gap-1.5 p-2 rounded-full border border-slate-300 dark:border-slate-600 hover:border-blue-500 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                                >
                                    <img src={bookings} alt="" className="h-5" />
                                    <span className="text-sm">Bookings</span>
                                </Link>
                                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 hidden sm:block"></div>
                                <div className="hidden sm:flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                        Hi, {user?.first_name}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-1.5 rounded-full border-2 border-slate-900 dark:border-white hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors text-sm"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    onClick={openLogin}
                                    className="text-sm font-medium px-3 py-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                                >
                                    Login
                                </div>
                                <div
                                    onClick={openRegister}
                                    className="group relative px-4 py-1.5 rounded-full flex items-center justify-center gap-1.5 overflow-hidden bg-brand-gradient text-white text-sm font-medium shadow-glow-blue hover:opacity-90 transition-all duration-300 cursor-pointer"
                                >
                                    <div className="w-full h-full relative flex items-center justify-center gap-2 z-10">
                                        <HiUser size="16px" />
                                        <span>Register</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </nav>
            </header>

            <PortalLayout isOpen={showAddress} onClose={closeAddress}>
                <Location />
            </PortalLayout>
            <PortalLayout isOpen={showLogin} onClose={closeLogin}>
                <Login
                    onLoginSuccess={handleLoginSuccess}
                    onClose={closeLogin}
                    onSwitchToRegister={openRegister}
                />
            </PortalLayout>
            <PortalLayout isOpen={showRegister} onClose={closeRegister}>
                <Register
                    onRegisterSuccess={handleRegisterSuccess}
                    onClose={closeRegister}
                    onSwitchToLogin={openLogin}
                    openLogin={openLogin}
                />
            </PortalLayout>
        </>
    );
}
