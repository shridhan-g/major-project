import { Link, useLocation } from "react-router-dom";
import {
    BadgeCheck,
    ClipboardList,
    LayoutDashboard,
    PackageOpen,
    LogOut,
    Home,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminNavbar() {
    const location = useLocation();
    const { logout } = useAuth();

    const getButtonClass = (path) => {
        const isActive = location.pathname === path;
        return `text-sm flex items-center gap-1 px-4 py-1.5 rounded-full font-medium transition-all duration-300 ${
            isActive
                ? "bg-brand-gradient text-white shadow-glow-blue"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
        }`;
    };

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <Link to="/admin" className={getButtonClass("/admin")}>
                <LayoutDashboard size={18} />
                Dashboard
            </Link>
            <Link
                to="/admin/services"
                className={getButtonClass("/admin/services")}
            >
                <PackageOpen size={18} strokeWidth={1.5} />
                Services
            </Link>
            <Link
                to="/admin/bookings"
                className={getButtonClass("/admin/bookings")}
            >
                <ClipboardList size={18} strokeWidth={1.75} />
                Bookings
            </Link>
            <Link
                to="/admin/providers"
                className={getButtonClass("/admin/providers")}
            >
                <BadgeCheck size={18} strokeWidth={1.75} />
                Providers
            </Link>

            <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

            <Link
                to="/"
                className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-500 transition-colors"
                title="Go to main website"
            >
                <Home size={14} />
                <span className="hidden md:inline">Genie Site</span>
            </Link>

            <button
                onClick={logout}
                className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                title="Log out of admin panel"
            >
                <LogOut size={14} />
                <span className="hidden md:inline">Logout</span>
            </button>
        </div>
    );
}

