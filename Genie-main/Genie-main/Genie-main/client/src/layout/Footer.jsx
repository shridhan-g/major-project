import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="mt-16 bg-hero-gradient text-slate-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-start justify-between gap-8">
                <div className="flex flex-col gap-3 max-w-sm">
                    <h2 className="text-2xl font-semibold text-white logo">
                        GENIE
                    </h2>
                    <p className="text-sm leading-relaxed">
                        Your trusted home services companion. Book verified
                        professionals for cleaning, repairs, salon and more —
                        all in one place.
                    </p>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs mb-1">
                        Explore
                    </h3>
                    <Link to="/" className="hover:text-blue-400 transition-colors">
                        Home
                    </Link>
                    <Link to="/providers" className="hover:text-blue-400 transition-colors">
                        Service Providers
                    </Link>
                    <Link
                        to="/provider/register"
                        className="hover:text-blue-400 transition-colors"
                    >
                        Become a Provider
                    </Link>
                    <Link to="/viewcart" className="hover:text-blue-400 transition-colors">
                        Your Cart
                    </Link>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs mb-1">
                        Support
                    </h3>
                    <Link to="/bookings" className="hover:text-blue-400 transition-colors">
                        My Bookings
                    </Link>
                    <Link
                        to="/provider/dashboard"
                        className="hover:text-blue-400 transition-colors"
                    >
                        Provider Dashboard
                    </Link>
                </div>
            </div>
            <div className="border-t border-slate-700/70">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <h1>&copy; Genie, 2024. All rights reserved.</h1>
                    <p>Made with 💙 for local service communities.</p>
                </div>
            </div>
        </footer>
    );
}
