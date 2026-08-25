import { Routes, Route } from "react-router-dom";
import AdminSidebar from "../Components/AdminSidebar";
import AdminNavbar from "../Components/AdminNavbar";
import AdminServicesPage from "./AdminServicesPage";
import AdminDashboard from "./AdminDashboard";
import AdminBookings from "./AdminBookings";
import AdminProviders from "./AdminProviders";

export default function Main() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
            <div className="sticky top-0 z-40 glass border-b border-slate-200/70 dark:border-slate-700/70">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-6">
                    <AdminSidebar />
                    <AdminNavbar />
                </div>
            </div>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/services" element={<AdminServicesPage />} />
                    <Route path="/bookings" element={<AdminBookings />} />
                    <Route path="/providers" element={<AdminProviders />} />
                    <Route path="*" element={<div className="text-slate-500">Page not found</div>} />
                </Routes>
            </main>
        </div>
    );
}
