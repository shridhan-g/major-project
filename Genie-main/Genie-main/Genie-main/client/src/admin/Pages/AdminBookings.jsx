import { useState, useEffect } from "react";
import { getAllBookings, updateBookingStatus } from "../../utils/api";
import { format } from "date-fns";
import { ImageOff } from "lucide-react";

export default function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const data = await getAllBookings();
            setBookings(data || []);
            setError(null);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setError("Failed to load bookings. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            await updateBookingStatus(bookingId, newStatus);
            // Refresh bookings after status update
            fetchBookings();
        } catch (error) {
            console.error("Error updating booking status:", error);
            alert("Failed to update booking status");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "SERVICE_BOOKED":
                return "bg-yellow-100 text-yellow-800 border-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-500";
            case "PROVIDER_ASSIGNED":
                return "bg-blue-100 text-blue-800 border-blue-800 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-500";
            case "SERVICE_COMPLETED":
                return "bg-emerald-100 text-emerald-800 border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-500";
            default:
                return "bg-slate-100 text-slate-700 border-slate-700 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500";
        }
    };

    if (loading) {
        return <div className="p-6 text-slate-500">Loading bookings...</div>;
    }

    if (error) {
        return <div className="p-6 text-red-500">{error}</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-[NeuwMachinaBold] text-slate-900 dark:text-white mb-6">
                Manage <span className="text-gradient">Bookings</span>
            </h1>
            <div className="space-y-6">
                {bookings.map((booking) => (
                    <div
                        key={booking.orderId}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3">
                            <div className="space-x-4">
                                <span className="font-medium text-slate-900 dark:text-white">
                                    Order #{booking.orderId}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 text-sm">
                                    {booking.createdAt
                                        ? format(
                                              new Date(booking.createdAt),
                                              "PPpp"
                                          )
                                        : "—"}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span
                                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                                        booking.status
                                    )}`}
                                >
                                    {(booking.status || "UNKNOWN").replace(
                                        /_/g,
                                        " "
                                    )}
                                </span>
                                <select
                                    className="border border-slate-300 dark:border-slate-600 rounded-full px-3 py-1 text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={booking.status}
                                    onChange={(e) =>
                                        handleStatusUpdate(
                                            booking._id,
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="SERVICE_BOOKED">
                                        Service Booked
                                    </option>
                                    <option value="PROVIDER_ASSIGNED">
                                        Provider Assigned
                                    </option>
                                    <option value="SERVICE_COMPLETED">
                                        Service Completed
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="mb-4">
                                <h3 className="font-medium mb-2 text-slate-900 dark:text-white">
                                    Customer Details
                                </h3>
                                <div className="text-sm text-slate-600 dark:text-slate-300">
                                    <p>
                                        Name:{" "}
                                        {booking.customerDetails?.name || "—"}
                                    </p>
                                    <p>
                                        Email:{" "}
                                        {booking.customerDetails?.email || "—"}
                                    </p>
                                    <p>
                                        Phone:{" "}
                                        {booking.customerDetails?.phone || "—"}
                                    </p>
                                </div>
                                {booking.provider && (
                                    <div className="mt-2">
                                        <h3 className="font-medium mb-1 text-slate-900 dark:text-white">
                                            Assigned Provider
                                        </h3>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">
                                            {booking.provider.name}{" "}
                                            <span className="text-slate-500 dark:text-slate-400">
                                                ({booking.provider.category})
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {booking.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-700 pt-4"
                                    >
                                        {item.image ? (
                                            <img
                                                src={`${
                                                    import.meta.env.VITE_BACKEND_URL
                                                }/${item.image}`}
                                                alt={item.title}
                                                className="w-24 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-600"
                                            />
                                        ) : (
                                            <div className="w-24 h-16 flex flex-col gap-1 items-center justify-center bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400">
                                                <ImageOff size={16} />
                                                <span className="text-xs">
                                                    No image
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h4 className="font-medium text-slate-900 dark:text-white">
                                                {item.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Quantity: {item.quantity} × ₹
                                                {item.price}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                ₹{item.total}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                                    <span>Subtotal:</span>
                                    <span>₹{booking.summary?.subtotal ?? 0}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                                    <span>Tax:</span>
                                    <span>₹{booking.summary?.tax ?? 0}</span>
                                </div>
                                <div className="flex justify-between font-medium mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                    <span>Total:</span>
                                    <span>₹{booking.summary?.total ?? 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
