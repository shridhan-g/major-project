import { ArrowUpRight } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { t } from "../utils/translations";

const Services = ({ serviceImage, serviceName, onServiceClick, delay = 0 }) => {
    const { lang } = useLang();
    return (
        <button
            onClick={() => onServiceClick && onServiceClick(serviceName)}
            style={{ animationDelay: `${delay}ms` }}
            className="card-hover animate-fade-in-up group w-full text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-premium overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            <div className="w-full h-28 sm:h-32 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700 flex items-center justify-center p-4">
                <img
                    src={`${import.meta.env.VITE_BACKEND_URL}/${serviceImage}`}
                    alt={serviceName}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                />
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-3 border-t border-slate-100 dark:border-slate-700">
                <h1 className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight line-clamp-2">
                    {t(lang, serviceName)}
                </h1>
                <ArrowUpRight
                    size={16}
                    className="shrink-0 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                />
            </div>
        </button>
    );
};

export default Services;
