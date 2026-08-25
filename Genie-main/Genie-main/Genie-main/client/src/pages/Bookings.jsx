import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserBookings } from "../utils/api";
import { format } from "date-fns";
import { useNavigate, Link } from "react-router-dom";
import { ImageOff, CheckCircle2, Clock, ShieldCheck, RefreshCw } from "lucide-react";

const STATUS_STYLES = {
    SERVICE_BOOKED: "bg-yellow-100 text-yellow-900 border-yellow-500/50 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-700",
    ACCEPTED: "bg-emerald-100 text-emerald-900 border-emerald-500/50 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700",
    PROVIDER_ASSIGNED: "bg-emerald-100 text-emerald-900 border-emerald-500/50 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700",
    IN_PROGRESS: "bg-indigo-100 text-indigo-900 border-indigo-500/50 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700",
    SERVICE_COMPLETED: "bg-blue-100 text-blue-900 border-blue-500/50 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700",
    CANCELLED: "bg-red-100 text-red-900 border-red-500/50 dark:bg-red-950/60 dark:text-red-300 dark:border-red-700",
};

const STATUS_LABELS = {
    SERVICE_BOOKED: "Pending Acceptance",
    ACCEPTED: "Booking Accepted",
    PROVIDER_ASSIGNED: "Booking Accepted",
    IN_PROGRESS: "In Progress",
    SERVICE_COMPLETED: "Service Completed",
    CANCELLED: "Cancelled",
};

export default function Bookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            setError("Please login to view your bookings");
            navigate("/");
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
            const interval = setInterval(() => fetchBookings(false), 3000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, user, navigate]);

    if (loading) {
        return (
            <div className="pb-8">
                <h1 className="text-3xl font-[NeuwMachinaBold] uppercase tracking-wider pb-6 text-slate-900 dark:text-white">
                    Loading Bookings...
                </h1>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pb-8">
                <h1 className="text-3xl font-[NeuwMachinaBold] uppercase tracking-wider pb-6 text-slate-900 dark:text-white">
                    Your Bookings
                </h1>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="relative min-h-[50vh]">
                <h1 className="text-3xl font-[NeuwMachinaBold] uppercase tracking-wider pb-6 text-slate-900 dark:text-white">
                    Your Bookings
                </h1>
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 text-lg">
                    No bookings found.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-8">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
                <h1 className="text-3xl sm:text-4xl font-[NeuwMachinaBold] uppercase tracking-wider text-slate-900 dark:text-white">
                    Your <span className="text-gradient">Bookings</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Live Status Sync
                </span>
            </div>

            <div className="space-y-8">
                {bookings.map((booking) => (
                    <div
                        key={booking.orderId}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-md"
                    >
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-wrap justify-between items-center gap-3 p-5">
                            <div className="flex flex-wrap gap-x-10 gap-y-2">
                                <div>
                                    <h1 className="text-xs font-medium text-blue-100">
                                        Order
                                    </h1>
                                    <h1 className="text-sm font-semibold">
                                        #{booking.orderId}
                                    </h1>
                                </div>
                                <div>
                                    <h1 className="text-xs font-medium text-blue-100">
                                        Order Placed
                                    </h1>
                                    <p className="text-sm">
                                        {format(
                                            new Date(booking.createdAt),
                                            "PPpp"
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <h1 className="text-xs font-medium text-blue-100">
                                        Payment Method
                                    </h1>
                                    <p className="text-sm">{booking.method}</p>
                                </div>
                                {booking.bookingDetails?.serviceDate && (
                                    <div>
                                        <h1 className="text-xs font-medium text-blue-100">
                                            Appointment
                                        </h1>
                                        <p className="text-sm font-semibold">
                                            📅 {booking.bookingDetails.serviceDate} ({booking.bookingDetails.serviceTime})
                                        </p>
                                        {booking.bookingDetails.serviceAddress && (
                                            <p className="text-xs text-blue-100 truncate max-w-[200px]" title={booking.bookingDetails.serviceAddress}>
                                                📍 {booking.bookingDetails.serviceAddress}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {booking.provider && (
                                    <div>
                                        <h1 className="text-xs font-medium text-blue-100">
                                            Provider
                                        </h1>
                                        <Link
                                            to={`/providers/${booking.provider._id}`}
                                            className="text-sm font-semibold hover:underline"
                                        >
                                            {booking.provider.name}
                                        </Link>
                                        <p className="text-xs text-blue-100">
                                            {booking.provider.category}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Status Badge */}
                            <span
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold tracking-wider rounded-full border uppercase shadow-sm ${
                                    STATUS_STYLES[booking.status] ||
                                    "bg-slate-100 text-slate-700 border-slate-700"
                                }`}
                            >
                                {booking.status === "ACCEPTED" || booking.status === "PROVIDER_ASSIGNED" ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                        <CheckCircle2 size={14} className="text-emerald-700 dark:text-emerald-300" />
                                        {STATUS_LABELS[booking.status] || "ACCEPTED"}
                                    </>
                                ) : booking.status === "SERVICE_COMPLETED" ? (
                                    <>
                                        <CheckCircle2 size={14} className="text-blue-700 dark:text-blue-300" />
                                        {STATUS_LABELS[booking.status] || "COMPLETED"}
                                    </>
                                ) : (
                                    <>
                                        <Clock size={14} className="text-yellow-700 dark:text-yellow-300" />
                                        {STATUS_LABELS[booking.status] || booking.status.replace(/_/g, " ")}
                                    </>
                                )}
                            </span>
                        </div>

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
                                                    src={`${
                                                        import.meta.env
                                                            .VITE_BACKEND_URL
                                                    }/${item.image}`}
                                                    alt={item.title}
                                                    className="w-32 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                                                />
                                            ) : (
                                                <div className="w-32 h-20 flex flex-col gap-1 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-400">
                                                    <ImageOff size={16} />
                                                    <h1 className="text-xs">
                                                        Image unavailable
                                                    </h1>
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-0.5">
                                                <h3 className="font-semibold tracking-wide text-slate-900 dark:text-white">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                                    ₹{item.price.toFixed(2)}
                                                </p>
                                                <div className="flex gap-5 pt-1">
                                                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                                                        Quantity: {item.quantity}
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
                                                <h3 className="tracking-wide text-slate-800 dark:text-slate-200">
                                                    {item.title}
                                                </h3>
                                                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                                    <p>
                                                        ₹{item.price.toFixed(2)} X{" "}
                                                        {item.quantity}
                                                    </p>
                                                    <p>₹{item.total.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <div className="border-y border-slate-200 dark:border-slate-700 py-2 mt-4 text-sm">
                                            <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                                <span>Subtotal:</span>
                                                <span>
                                                    ₹
                                                    {booking.summary.subtotal.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                                <span>Tax:</span>
                                                <span>
                                                    ₹
                                                    {booking.summary.tax.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between tracking-wide font-bold pt-2 text-sm text-slate-900 dark:text-white">
                                            <span>Total:</span>
                                            <span>
                                                ₹
                                                {booking.summary.total.toFixed(
                                                    2
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
