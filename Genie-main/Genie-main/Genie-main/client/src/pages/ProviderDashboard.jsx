import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
    getMyProviderProfile,
    updateProviderProfile,
    getMyProviderBookings,
    updateProviderBookingStatus,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { BadgeCheck, Star, RefreshCw, CheckCircle, Clock, CalendarCheck } from "lucide-react";

const inputClass =
    "text-sm rounded-lg p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500";

const STATUS_STYLES = {
    SERVICE_BOOKED: "bg-yellow-100 text-yellow-900 border-yellow-500/50 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-700",
    ACCEPTED: "bg-emerald-100 text-emerald-900 border-emerald-500/50 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 font-bold",
    PROVIDER_ASSIGNED: "bg-emerald-100 text-emerald-900 border-emerald-500/50 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 font-bold",
    IN_PROGRESS: "bg-indigo-100 text-indigo-900 border-indigo-500/50 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700",
    SERVICE_COMPLETED: "bg-blue-100 text-blue-900 border-blue-500/50 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700",
    CANCELLED: "bg-red-100 text-red-900 border-red-500/50 dark:bg-red-950/60 dark:text-red-300 dark:border-red-700",
};

export default function ProviderDashboard() {
    const { isAuthenticated } = useAuth();
    const [tab, setTab] = useState("bookings");
    const [profile, setProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [lastSyncTime, setLastSyncTime] = useState(new Date());

    const [form, setForm] = useState({
        name: "",
        category: "",
        skills: "",
        experienceYears: "",
        hourlyRate: "",
        bio: "",
        phone: "",
        email: "",
        address: "",
        lat: "",
        lng: "",
    });

    // Initial load of provider profile & initial bookings
    useEffect(() => {
        if (!isAuthenticated) return;
        getMyProviderProfile()
            .then((data) => {
                setProfile(data);
                setForm({
                    name: data.name || "",
                    category: data.category || "",
                    skills: (data.skills || []).join(", "),
                    experienceYears: data.experienceYears || "",
                    hourlyRate: data.hourlyRate || "",
                    bio: data.bio || "",
                    phone: data.contact?.phone || data.phone || "",
                    email: data.contact?.email || data.email || "",
                    address: data.location?.address || "",
                    lat: data.location?.coordinates?.[1] ?? "",
                    lng: data.location?.coordinates?.[0] ?? "",
                });
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [isAuthenticated]);

    // REAL-TIME POLLING for bookings (polls every 3 seconds)
    useEffect(() => {
        if (!profile) return;

        const fetchBookings = () => {
            getMyProviderBookings()
                .then((data) => {
                    setBookings(data || []);
                    setLastSyncTime(new Date());
                })
                .catch(() => {});
        };

        // Fetch immediately
        fetchBookings();

        // Poll every 3 seconds for instant real-time updates when customer books
        const intervalId = setInterval(fetchBookings, 3000);
        return () => clearInterval(intervalId);
    }, [profile]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");
        try {
            const updated = await updateProviderProfile({
                name: form.name,
                category: form.category,
                skills: form.skills,
                experienceYears: form.experienceYears,
                hourlyRate: form.hourlyRate,
                bio: form.bio,
                contact: { phone: form.phone, email: form.email, address: form.address },
                location: { lat: form.lat, lng: form.lng, address: form.address },
            });
            setProfile(updated);
            setMessage("Profile updated successfully.");
        } catch (err) {
            setError(err.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (bookingId, newStatus) => {
        setUpdatingStatusId(bookingId);
        try {
            const updatedBooking = await updateProviderBookingStatus(bookingId, newStatus);
            setBookings((prev) =>
                prev.map((b) => (b._id === bookingId ? updatedBooking : b))
            );
        } catch (err) {
            alert(err.message || "Failed to update status");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="pb-10 text-center">
                <p className="text-slate-500 dark:text-slate-400">
                    Please login to view your provider dashboard.
                </p>
            </div>
        );
    }

    if (loading) {
        return <p className="pb-10 text-slate-500">Loading dashboard...</p>;
    }

    if (notFound || !profile) {
        return (
            <div className="pb-10 text-center">
                <h1 className="text-3xl font-[NeuwMachinaBold] uppercase tracking-wider pb-3 text-slate-900 dark:text-white">
                    Provider Dashboard
                </h1>
                <p className="text-slate-500 dark:text-slate-400 pb-4">
                    You don&apos;t have a provider profile yet.
                </p>
                <Link
                    to="/provider/register"
                    className="inline-block bg-brand-gradient text-white px-6 py-3 rounded-full hover:opacity-90 transition-all uppercase tracking-wider text-sm font-semibold shadow-glow-blue"
                >
                    Register as a Provider
                </Link>
            </div>
        );
    }

    const pendingBookings = bookings.filter((b) => b.status === "SERVICE_BOOKED");

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Top Dashboard Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-[NeuwMachinaBold] uppercase tracking-wider text-slate-900 dark:text-white">
                        Provider <span className="text-gradient">Dashboard</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-1.5">
                        {profile.isVerified ? (
                            <span className="badge-verified">
                                <BadgeCheck size={14} /> Verified Provider
                            </span>
                        ) : (
                            <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 border border-orange-600 dark:border-orange-500 rounded-full px-2.5 py-1 uppercase">
                                Pending Verification
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Real-Time Syncing
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 shadow-sm">
                    <Star size={16} className="text-orange-500" fill="currentColor" />
                    <span className="font-semibold">
                        {profile.averageRating > 0 ? profile.averageRating.toFixed(1) : "No rating"}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                        ({profile.ratingCount} reviews)
                    </span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between gap-2 mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setTab("bookings")}
                        className={`px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wide transition-all flex items-center gap-2 ${
                            tab === "bookings"
                                ? "bg-blue-600 text-white shadow-glow-blue"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                    >
                        <CalendarCheck size={15} />
                        My Bookings
                        {bookings.length > 0 && (
                            <span className="ml-1 bg-white text-blue-600 font-extrabold text-xs px-2 py-0.5 rounded-full">
                                {bookings.length}
                            </span>
                        )}
                        {pendingBookings.length > 0 && (
                            <span className="bg-yellow-400 text-yellow-950 font-bold text-xs px-1.5 py-0.5 rounded-full animate-bounce">
                                {pendingBookings.length} New!
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setTab("profile")}
                        className={`px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wide transition-all ${
                            tab === "profile"
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                    >
                        My Profile
                    </button>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                    <RefreshCw size={12} className="animate-spin text-blue-500" />
                    Auto-updated {format(lastSyncTime, "HH:mm:ss")}
                </span>
            </div>

            {/* BOOKINGS TAB */}
            {tab === "bookings" ? (
                <div className="flex flex-col gap-4">
                    {bookings.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 flex flex-col items-center gap-3">
                            <Clock size={36} className="opacity-40" />
                            <p className="font-semibold text-base">No bookings assigned to you yet.</p>
                            <p className="text-xs text-slate-400">
                                When customers book your services, new orders will appear here automatically in real time!
                            </p>
                        </div>
                    ) : (
                        bookings.map((booking) => (
                            <div
                                key={booking._id || booking.orderId}
                                className={`bg-white dark:bg-slate-800 rounded-2xl border p-5 transition-all ${
                                    booking.status === "SERVICE_BOOKED"
                                        ? "border-yellow-400 dark:border-yellow-600 bg-yellow-50/30 dark:bg-yellow-950/20 ring-1 ring-yellow-400/40"
                                        : "border-slate-200 dark:border-slate-700 shadow-sm"
                                }`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            Order #{booking.orderId}
                                        </span>
                                        <span className="text-slate-500 dark:text-slate-400 text-xs">
                                            {booking.createdAt ? format(new Date(booking.createdAt), "PPpp") : "Recently"}
                                        </span>
                                    </div>
                                    <span
                                        className={`px-3 py-1 text-xs font-semibold rounded-full border uppercase ${STATUS_STYLES[booking.status] || "bg-slate-100 text-slate-700 border-slate-700"}`}
                                    >
                                        {booking.status?.replace(/_/g, " ")}
                                    </span>
                                </div>

                                {/* Customer & Appointment Schedule Details */}
                                <div className="text-sm text-slate-600 dark:text-slate-300 mb-3 bg-blue-50/50 dark:bg-slate-900/60 p-4 rounded-xl border border-blue-100 dark:border-slate-700 flex flex-col gap-1.5">
                                    <p className="font-bold text-slate-900 dark:text-white text-base">
                                        👤 Customer: {booking.customerDetails?.name || `${booking.user?.first_name || ""} ${booking.user?.last_name || ""}`}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs pt-1">
                                        <p className="text-slate-600 dark:text-slate-300">
                                            📞 Phone: <span className="font-semibold text-slate-900 dark:text-white">{booking.customerDetails?.phone || booking.user?.phone || "N/A"}</span>
                                        </p>
                                        <p className="text-slate-600 dark:text-slate-300">
                                            ✉️ Email: <span className="font-semibold text-slate-900 dark:text-white">{booking.customerDetails?.email || booking.user?.email || "N/A"}</span>
                                        </p>
                                        <p className="text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1">
                                            📅 Date: <span>{booking.bookingDetails?.serviceDate || "As Scheduled"}</span>
                                        </p>
                                        <p className="text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1">
                                            ⏰ Time Slot: <span>{booking.bookingDetails?.serviceTime || "Standard Hours"}</span>
                                        </p>
                                    </div>
                                    {booking.bookingDetails?.serviceAddress && (
                                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium pt-1 border-t border-blue-100 dark:border-slate-700/80 mt-1">
                                            📍 <span className="font-semibold">Service Address:</span> {booking.bookingDetails.serviceAddress}
                                        </p>
                                    )}
                                    {booking.bookingDetails?.notes && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                            📝 <span className="font-semibold not-italic">Notes:</span> &ldquo;{booking.bookingDetails.notes}&rdquo;
                                        </p>
                                    )}
                                </div>

                                {/* Items list */}
                                <div className="flex flex-col gap-1 text-sm mb-4">
                                    {(booking.items || []).map((item, i) => (
                                        <div key={i} className="flex justify-between text-slate-700 dark:text-slate-300">
                                            <span>{item.title} × {item.quantity}</span>
                                            <span className="font-medium">₹{item.total || item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-dashed border-slate-200 dark:border-slate-700 mt-2 pt-2 flex justify-between font-bold text-slate-900 dark:text-white text-base">
                                        <span>Total Earnings</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">₹{booking.summary?.total || booking.amount / 100}</span>
                                    </div>
                                </div>

                                {/* Real-time Status Actions */}
                                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <span className="text-xs text-slate-400 font-semibold mr-1">Update Booking Status:</span>
                                    {booking.status === "SERVICE_BOOKED" && (
                                        <button
                                            onClick={() => handleStatusChange(booking._id, "ACCEPTED")}
                                            disabled={updatingStatusId === booking._id}
                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <CheckCircle size={13} /> Accept Booking
                                        </button>
                                    )}
                                    {(booking.status === "ACCEPTED" || booking.status === "PROVIDER_ASSIGNED" || booking.status === "IN_PROGRESS") && (
                                        <button
                                            onClick={() => handleStatusChange(booking._id, "SERVICE_COMPLETED")}
                                            disabled={updatingStatusId === booking._id}
                                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <CheckCircle size={13} /> Mark Service Completed
                                        </button>
                                    )}
                                    {booking.status === "SERVICE_COMPLETED" && (
                                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                            <CheckCircle size={14} /> Completed & Paid
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* PROFILE TAB */
                <form
                    onSubmit={handleSave}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-4"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className={inputClass}
                        />
                        <input
                            type="text"
                            name="category"
                            placeholder="Service Category"
                            value={form.category}
                            onChange={handleChange}
                            required
                            className={inputClass}
                        />
                        <input
                            type="number"
                            name="experienceYears"
                            placeholder="Years of Experience"
                            min="0"
                            value={form.experienceYears}
                            onChange={handleChange}
                            className={inputClass}
                        />
                        <input
                            type="number"
                            name="hourlyRate"
                            placeholder="Hourly Rate (₹/hr)"
                            min="0"
                            value={form.hourlyRate}
                            onChange={handleChange}
                            className={inputClass}
                        />
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Contact Phone"
                            value={form.phone}
                            onChange={handleChange}
                            className={inputClass}
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Contact Email"
                            value={form.email}
                            onChange={handleChange}
                            className={inputClass}
                        />
                        <input
                            type="text"
                            name="address"
                            placeholder="Service Area / Address"
                            value={form.address}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                    <input
                        type="text"
                        name="skills"
                        placeholder="Skills (comma separated)"
                        value={form.skills}
                        onChange={handleChange}
                        className={inputClass}
                    />
                    <textarea
                        name="bio"
                        rows="3"
                        placeholder="About you and your work"
                        value={form.bio}
                        onChange={handleChange}
                        className={inputClass}
                    />
                    <div className="flex gap-3">
                        <input
                            type="text"
                            name="lat"
                            placeholder="Latitude"
                            value={form.lat}
                            onChange={handleChange}
                            className={`${inputClass} w-32`}
                        />
                        <input
                            type="text"
                            name="lng"
                            placeholder="Longitude"
                            value={form.lng}
                            onChange={handleChange}
                            className={`${inputClass} w-32`}
                        />
                    </div>

                    {message && <p className="text-emerald-600 text-sm font-semibold">{message}</p>}
                    {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

                    <button
                        type="submit"
                        disabled={saving}
                        className="self-start bg-brand-gradient text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all uppercase tracking-wider text-sm font-semibold shadow-glow-blue disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Profile"}
                    </button>
                </form>
            )}
        </div>
    );
}
