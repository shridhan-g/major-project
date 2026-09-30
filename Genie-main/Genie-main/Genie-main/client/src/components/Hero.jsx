import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, CalendarCheck, LayoutDashboard, Briefcase } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { t } from "../utils/translations";

const STATS_KEYS = [
    { value: "10+", labelKey: "hero_stat_services" },
    { value: "150k+", labelKey: "hero_stat_users" },
    { value: "3k+", labelKey: "hero_stat_pros" },
];

export default function Hero() {
    const navigate = useNavigate();
    const { lang } = useLang();

    const scrollToServices = () => {
        document
            .getElementById("services")
            ?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <section className="relative overflow-hidden bg-hero-gradient text-white">
            {/* Decorative floating blobs */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl animate-float-slow" />
            <div className="pointer-events-none absolute top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-indigo-600/30 blur-3xl animate-float" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl animate-float-slow" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28 flex flex-col items-center text-center">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8 text-blue-200">
                    <Sparkles size={14} className="text-orange-400" />
                    {t(lang, "hero_badge")}
                </span>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-[NeuwMachinaBold] leading-tight tracking-tight">
                    {t(lang, "hero_title_1")} <span className="text-gradient">{t(lang, "hero_title_2")}</span>
                </h1>

                <p className="mt-6 max-w-2xl text-slate-300 text-base sm:text-lg">
                    {t(lang, "hero_subtitle")}
                </p>



                {/* Primary Action Buttons */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                    <button
                        onClick={scrollToServices}
                        className="group flex items-center gap-2 bg-accent-gradient text-white text-sm sm:text-base font-semibold rounded-full px-6 sm:px-7 py-3.5 shadow-glow-indigo hover:opacity-90 transition-all cursor-pointer"
                    >
                        {t(lang, "hero_book")}
                        <ArrowRight
                            size={18}
                            className="transition-transform group-hover:translate-x-1"
                        />
                    </button>

                    <Link
                        to="/provider/register"
                        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm sm:text-base font-semibold rounded-full px-6 py-3.5 transition-all shadow-glow-orange cursor-pointer"
                    >
                        <Briefcase size={18} className="text-white" />
                        {t(lang, "hero_become_provider")}
                    </Link>

                    <Link
                        to="/bookings"
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-sm sm:text-base font-semibold rounded-full px-6 py-3.5 backdrop-blur-md transition-all shadow-sm"
                    >
                        <CalendarCheck size={18} className="text-orange-400" />
                        {t(lang, "hero_my_bookings")}
                    </Link>

                    <Link
                        to="/provider/dashboard"
                        className="flex items-center gap-2 bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-400/40 text-white text-sm sm:text-base font-semibold rounded-full px-6 py-3.5 backdrop-blur-md transition-all shadow-sm"
                    >
                        <LayoutDashboard size={18} className="text-emerald-200" />
                        {t(lang, "hero_provider_dashboard")}
                    </Link>
                </div>

                {/* Animated stats */}
                <div className="mt-16 w-full grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
                    {STATS_KEYS.map((stat, i) => (
                        <div
                            key={stat.labelKey}
                            className={`glass rounded-2xl px-6 py-6 flex flex-col items-center gap-1 ${
                                i % 2 === 0
                                    ? "animate-float"
                                    : "animate-float-slow"
                            }`}
                        >
                            <span className="text-4xl font-[NeuwMachinaBold] text-gradient">
                                {stat.value}
                            </span>
                            <span className="text-sm text-slate-300">
                                {t(lang, stat.labelKey)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
