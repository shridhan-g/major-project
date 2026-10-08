import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { t } from "../utils/translations";

export default function Footer() {
    const { lang } = useLang();

    return (
        <footer className="mt-16 bg-hero-gradient text-slate-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-start justify-between gap-8">
                <div className="flex flex-col gap-3 max-w-sm">
                    <h2 className="text-2xl font-semibold text-white logo">GENIE</h2>
                    <p className="text-sm leading-relaxed">{t(lang, "footer_tagline")}</p>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs mb-1">
                        {t(lang, "footer_explore")}
                    </h3>
                    <Link to="/" className="hover:text-blue-400 transition-colors">
                        {t(lang, "footer_home")}
                    </Link>
                    {/* <Link to="/providers" className="hover:text-blue-400 transition-colors">
                        {t(lang, "footer_providers")}
                    </Link> */}
                    <Link to="/provider/register" className="hover:text-blue-400 transition-colors">
                        {t(lang, "footer_become_provider")}
                    </Link>
                    <Link to="/viewcart" className="hover:text-blue-400 transition-colors">
                        {t(lang, "footer_cart")}
                    </Link>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs mb-1">
                        {t(lang, "footer_support")}
                    </h3>
                    <Link to="/bookings" className="hover:text-blue-400 transition-colors">
                        {t(lang, "footer_bookings")}
                    </Link>
                    <Link to="/provider/dashboard" className="hover:text-blue-400 transition-colors">
                        {t(lang, "footer_dashboard")}
                    </Link>
                    <Link to="/admin" className="hover:text-orange-400 transition-colors text-slate-400">
                        Admin Portal
                    </Link>
                </div>
            </div>
            <div className="border-t border-slate-700/70">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <h1>{t(lang, "footer_copyright")}</h1>
                    <p>{t(lang, "footer_made_with")}</p>
                </div>
            </div>
        </footer>
    );
}
