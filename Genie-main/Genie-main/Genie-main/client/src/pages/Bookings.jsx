import { useState, useEffect, useContext } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserBookings, cancelUserBooking } from "../utils/api";
import { format } from "date-fns";
import { useNavigate, Link } from "react-router-dom";
import { ImageOff, CheckCircle2, Clock, ShieldCheck, RefreshCw, XCircle, AlertTriangle, X } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { t } from "../utils/translations";
import PortalContext from "../context/PortalContext";

const STATUS_STYLES = {
    SERVICE_BOOKED: "bg-yellow-100 text-yellow-900 border-yellow-500/50 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-700",
    ACCEPTED: "bg-emerald-100 text-emerald-900 border-emerald-500/50 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700",
    PROVIDER_ASSIGNED: "bg-emerald-100 text-emerald-900 border-emerald-500/50 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700",
    IN_PROGRESS: "bg-indigo-100 text-indigo-900 border-indigo-500/50 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700",
    SERVICE_COMPLETED: "bg-blue-100 text-blue-900 border-blue-500/50 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700",
    CANCELLED: "bg-red-100 text-red-900 border-red-500/50 dark:bg-red-950/60 dark:text-red-300 dark:border-red-700",
};

export default function Bookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancellingBooking, setCancellingBooking] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");

    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { lang } = useLang();
    const { openLogin } = useContext(PortalContext);

    const STATUS_LABELS = {
        SERVICE_BOOKED: t(lang, "bookings_status_pending"),
        ACCEPTED: t(lang, "bookings_status_accepted"),
        PROVIDER_ASSIGNED: t(lang, "bookings_status_accepted"),
        IN_PROGRESS: t(lang, "bookings_status_in_progress"),
        SERVICE_COMPLETED: t(lang, "bookings_status_completed"),
        CANCELLED: t(lang, "bookings_status_cancelled"),
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/");
            openLogin();
            setLoading(false);
            return;
        }

        const fetchBookings = async (isInitial = false) => {
            try {
                if (user && user._id) {
                    if (isInitial) setLoading(true);
                    const data = await getUserBookings(user._id);
                    setBookings(data || []);
                    setError(null);
                } else {
                    if (isInitial) setError("User ID is missing. Please login again.");
                }
            } catch (error) {
                console.error("Error fetching bookings:", error);
                if (isInitial) setError("Failed to load bookings. Please try again later.");
            } finally {
                if (isInitial) setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchBookings(true);
            const interval = setInterval(() => fetchBookings(false), 4000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, user, navigate]);

    const handleOpenCancelModal = (booking) => {
        setCancellingBooking(booking);
        setCancelReason("");
        setCancelError("");
    };

    const handleConfirmCancel = async () => {
        if (!cancellingBooking) return;
        try {
            setIsCancelling(true);
            setCancelError("");
            await cancelUserBooking(cancellingBooking._id, cancelReason);
            setBookings((prev) =>
                prev.map((b) =>
                    b._id === cancellingBooking._id ? { ...b, status: "CANCELLED" } : b
                )
            );
            setCancellingBooking(null);
        } catch (err) {
            console.error("Cancellation error:", err);
            setCancelError(err.message || "Failed to cancel booking. Please try again.");
        } finally {
            setIsCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="pb-8">
                <h1 className="text-3xl font-[NeuwMachinaBold] uppercase tracking-wider pb-6 text-slate-900 dark:text-white">
                    {t(lang, "bookings_loading")}
                </h1>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pb-8">
                <h1 className="text-3xl font-[NeuwMachinaBold] uppercase tracking-wider pb-6 text-slate-900 dark:text-white">
                    {t(lang, "bookings_heading")} {t(lang, "bookings_heading_2")}
                </h1>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="relative min-h-[50vh]">
                <h1 className="text-3xl font-[NeuwMachinaBold] uppercase tracking-wider pb-6 text-slate-900 dark:text-white">
                    {t(lang, "bookings_heading")} <span className="text-gradient">{t(lang, "bookings_heading_2")}</span>
                </h1>
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 text-lg">
                    {t(lang, "bookings_none")}
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-8">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
                <h1 className="text-3xl sm:text-4xl font-[NeuwMachinaBold] uppercase tracking-wider text-slate-900 dark:text-white">
                    {t(lang, "bookings_heading")} <span className="text-gradient">{t(lang, "bookings_heading_2")}</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    {t(lang, "bookings_live_sync")}
                </span>
            </div>

            <div className="space-y-8">
                {bookings.map((booking) => (
                    <div
                        key={booking.orderId || booking._id}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-md"
                    >
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-wrap justify-between items-center gap-3 p-5">
                            <div className="flex flex-wrap gap-x-10 gap-y-2">
                                <div>
                                    <h1 className="text-xs font-medium text-blue-100">{t(lang, "bookings_order")}</h1>
                                    <h1 className="text-sm font-semibold">#{booking.orderId}</h1>
                                </div>
                                <div>
                                    <h1 className="text-xs font-medium text-blue-100">{t(lang, "bookings_order_placed")}</h1>
                                    <p className="text-sm">{format(new Date(booking.createdAt), "PPpp")}</p>
                                </div>
                                <div>
                                    <h1 className="text-xs font-medium text-blue-100">{t(lang, "bookings_payment_method")}</h1>
                                    <p className="text-sm">{booking.method}</p>
                                </div>
                                {booking.bookingDetails?.serviceDate && (
                                    <div>
                                        <h1 className="text-xs font-medium text-blue-100">{t(lang, "bookings_appointment")}</h1>
                                        <p className="text-sm font-semibold">
                                            📅 {booking.bookingDetails.serviceDate} ({booking.bookingDetails.serviceTime})
                                        </p>
                                        {/* Show structured addressSnapshot when available, fallback to legacy flat address */}
                                        {booking.bookingDetails.addressSnapshot?.name ? (
                                            <div className="mt-1">
                                                <p className="text-xs text-blue-100 font-semibold">
                                                    📍 {booking.bookingDetails.addressSnapshot.name} · {booking.bookingDetails.addressSnapshot.mobile}
                                                </p>
                                                <p className="text-xs text-blue-100 truncate max-w-[260px]" title={
                                                    [
                                                        booking.bookingDetails.addressSnapshot.house,
                                                        booking.bookingDetails.addressSnapshot.area,
                                                        booking.bookingDetails.addressSnapshot.city,
                                                        booking.bookingDetails.addressSnapshot.state,
                                                        booking.bookingDetails.addressSnapshot.pincode,
                                                    ].filter(Boolean).join(", ")
                                                }>
                                                    {[
                                                        booking.bookingDetails.addressSnapshot.house,
                                                        booking.bookingDetails.addressSnapshot.area,
                                                        booking.bookingDetails.addressSnapshot.city,
                                                        booking.bookingDetails.addressSnapshot.state,
                                                    ].filter(Boolean).join(", ")}
                                                    {booking.bookingDetails.addressSnapshot.pincode ? ` – ${booking.bookingDetails.addressSnapshot.pincode}` : ""}
                                                </p>
                                            </div>
                                        ) : booking.bookingDetails.serviceAddress ? (
                                            <p className="text-xs text-blue-100 truncate max-w-[200px]" title={booking.bookingDetails.serviceAddress}>
                                                📍 {booking.bookingDetails.serviceAddress}
                                            </p>
                                        ) : null}
                                    </div>
                                )}
                                {booking.provider && (
                                    <div>
                                        <h1 className="text-xs font-medium text-blue-100">{t(lang, "bookings_provider")}</h1>
                                        <Link
                                            to={`/providers/${booking.provider._id}`}
                                            className="text-sm font-semibold hover:underline"
                                        >
                                            {t(lang, booking.provider.name)}
                                        </Link>
                                        <p className="text-xs text-blue-100">{t(lang, booking.provider.category)}</p>
                                    </div>
                                )}
                            </div>

                            {/* Status Badge & Cancel Action */}
                            <div className="flex items-center gap-3">
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold tracking-wider rounded-full border uppercase shadow-sm ${
                                        STATUS_STYLES[booking.status] || "bg-slate-100 text-slate-700 border-slate-700"
                                    }`}
                                >
                                    {booking.status === "ACCEPTED" || booking.status === "PROVIDER_ASSIGNED" ? (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                            <CheckCircle2 size={14} className="text-emerald-700 dark:text-emerald-300" />
                                            {STATUS_LABELS[booking.status] || t(lang, "bookings_status_accepted")}
                                        </>
                                    ) : booking.status === "SERVICE_COMPLETED" ? (
                                        <>
                                            <CheckCircle2 size={14} className="text-blue-700 dark:text-blue-300" />
                                            {STATUS_LABELS[booking.status] || t(lang, "bookings_status_completed")}
                                        </>
                                    ) : booking.status === "CANCELLED" ? (
                                        <>
                                            <XCircle size={14} className="text-red-700 dark:text-red-300" />
                                            {STATUS_LABELS[booking.status] || t(lang, "bookings_status_cancelled")}
                                        </>
                                    ) : (
                                        <>
                                            <Clock size={14} className="text-yellow-700 dark:text-yellow-300" />
                                            {STATUS_LABELS[booking.status] || booking.status.replace(/_/g, " ")}
                                        </>
                                    )}
                                </span>

                                {booking.status !== "SERVICE_COMPLETED" && booking.status !== "CANCELLED" && (
                                    <button
                                        onClick={() => handleOpenCancelModal(booking)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
                                        title="Cancel Booking"
                                    >
                                        <XCircle size={13} />
                                        {t(lang, "Cancel Booking")}
                                    </button>
                                )}
                            </div>
                        </div>

                        {booking.status === "CANCELLED" && (
                            <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800/60 px-6 py-2.5 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
                                <span className="flex items-center gap-2 font-medium">
                                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                                    {t(lang, "This booking has been cancelled.")}
                                </span>
                            </div>
                        )}

                        <div className="max-h-80 flex flex-col md:flex-row">
                            <div className="w-full px-6 overflow-auto">
                                {booking.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-center py-5 border-b border-dashed border-slate-200 dark:border-slate-700 last:border-0"
                                    >
                                        <div className="flex items-center gap-5">
                                            {item.image ? (
                                                <img
                                                    src={`${import.meta.env.VITE_BACKEND_URL}/${item.image}`}
                                                    alt={item.title}
                                                    className="w-32 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                                                />
                                            ) : (
                                                <div className="w-32 h-20 flex flex-col gap-1 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-400">
                                                    <ImageOff size={16} />
                                                    <h1 className="text-xs">{t(lang, "bookings_image_unavail")}</h1>
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-0.5">
                                                <h3 className="font-semibold tracking-wide text-slate-900 dark:text-white">{t(lang, item.title)}</h3>
                                                <p className="text-sm text-slate-700 dark:text-slate-300">₹{item.price.toFixed(2)}</p>
                                                <div className="flex gap-5 pt-1">
                                                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                                                        {t(lang, "bookings_quantity")}: {item.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="w-full md:w-1/4 min-w-60 bg-slate-50 dark:bg-slate-900 border-t md:border-l md:border-t-0 border-slate-200 dark:border-slate-700 p-6">
                                <div className="h-full flex flex-col justify-between space-y-3">
                                    <div className="flex flex-col gap-3">
                                        {booking.items.map((item, index) => (
                                            <div key={index} className="text-sm">
                                                <h3 className="tracking-wide text-slate-800 dark:text-slate-200">{t(lang, item.title)}</h3>
                                                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                                    <p>₹{item.price.toFixed(2)} X {item.quantity}</p>
                                                    <p>₹{item.total.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <div className="border-y border-slate-200 dark:border-slate-700 py-2 mt-4 text-sm">
                                            <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                                <span>{t(lang, "bookings_subtotal")}</span>
                                                <span>~₹{booking.summary?.subtotal ? booking.summary.subtotal.toFixed(2) : "0.00"}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                                <span>{t(lang, "bookings_tax")}</span>
                                                <span>~₹{booking.summary?.tax ? booking.summary.tax.toFixed(2) : "0.00"}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center tracking-wide font-bold pt-2 text-sm text-slate-900 dark:text-white">
                                            <span className="flex items-center gap-1.5">
                                                {t(lang, "bookings_total")}
                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                    Approx.
                                                </span>
                                            </span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">~₹{booking.summary?.total ? booking.summary.total.toFixed(2) : (booking.amount / 100).toFixed(2)}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 text-right">
                                            * Approximate quote subject to on-site scope
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cancel Booking Confirmation Modal */}
            {cancellingBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative animate-scale-up">
                        <button
                            onClick={() => setCancellingBooking(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                            <AlertTriangle size={24} />
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-[NeuwMachinaBold]">
                            {t(lang, "Cancel Booking")}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                            {t(lang, "Are you sure you want to cancel this booking?")}
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                {t(lang, "Reason for cancellation (optional)")}
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                rows={3}
                                placeholder="e.g. Rescheduled, Change of plans..."
                                className="w-full text-sm rounded-xl p-3 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        {cancelError && (
                            <p className="text-xs text-red-500 mb-3">{cancelError}</p>
                        )}

                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setCancellingBooking(null)}
                                disabled={isCancelling}
                                className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                            >
                                {t(lang, "Keep Booking")}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                disabled={isCancelling}
                                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {isCancelling ? t(lang, "Cancelling...") : t(lang, "Confirm Cancellation")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

