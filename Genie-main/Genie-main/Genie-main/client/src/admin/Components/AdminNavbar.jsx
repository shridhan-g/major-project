import { Link, useLocation } from "react-router-dom";
import {
    BadgeCheck,
    ClipboardList,
    LayoutDashboard,
    PackageOpen,
} from "lucide-react";

export default function AdminNavbar() {
    const location = useLocation();

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
        </div>
    );
}
