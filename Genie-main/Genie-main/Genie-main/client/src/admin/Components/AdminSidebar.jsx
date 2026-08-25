import { Link } from "react-router-dom";
import { logo } from "../../assets";
import { ShieldCheck } from "lucide-react";

export default function AdminSidebar() {
    return (
        <div className="flex items-center gap-1">
            <img src={logo} alt="" className="h-9" />
            <Link
                to="/admin"
                className="text-2xl tracking-tighter font-semibold logo text-slate-900 dark:text-white hover:text-blue-600 transition-colors duration-300"
            >
                GENIE
            </Link>
            <span className="hidden sm:flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ml-3 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border border-orange-500">
                <ShieldCheck size={13} /> Admin Panel
            </span>
        </div>
    );
}
