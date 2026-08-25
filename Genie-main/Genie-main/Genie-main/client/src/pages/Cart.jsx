import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { cart } from "../assets";
import { useNavigate, Link } from "react-router-dom";
import {
    clearUserCart,
    createRazorpayOrder,
    verifyRazorpayPayment,
    createDirectBooking,
    getProviders,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import PortalContext from "../context/PortalContext";
import {
    ImageOff,
    PackageOpen,
    ShoppingBag,
    BadgeCheck,
    Star,
    ChevronDown,
    IndianRupee,
    User,
    Calendar,
    Clock,
    MapPin,
    FileText,
    AlertCircle,
    CheckCircle2,
    X,
    ShieldCheck,
} from "lucide-react";

const MiniStars = ({ rating }) => {
    const v = rating || 0;
    return (
        <span className="flex items-center gap-0.5 text-orange-500">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={12} fill={i <= Math.round(v) ? "currentColor" : "none"} />
            ))}
            <span className="text-xs text-slate-400 ml-1">{v > 0 ? v.toFixed(1) : "New"}</span>
        </span>
    );
};

export default function Cart() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const { openLogin } = useContext(PortalContext);

    const navigateToHome = () => {
        navigate("/");
    };

    const {
        cartServices,
        addToCart,
        removeFromCart,
        getCartTax,
        getCartSubTotal,
        getCartTotal,
    } = useContext(CartContext);

    // Provider selection for the booking
    const [providers, setProviders] = useState([]);
    const [selectedProviderId, setSelectedProviderId] = useState("");
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [changingProvider, setChangingProvider] = useState(false);

    // Appointment Schedule & Address Details State
    const todayStr = new Date().toISOString().split("T")[0];
    const [serviceDate, setServiceDate] = useState(todayStr);
    const [serviceTime, setServiceTime] = useState("09:00 AM - 12:00 PM");
    const [serviceAddress, setServiceAddress] = useState("");
    const [notes, setNotes] = useState("");
    const [formError, setFormError] = useState("");
    const [bookingLoading, setBookingLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        // Restore a provider chosen earlier from a provider profile page
        try {
            const saved = localStorage.getItem("selectedProvider");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed?._id) {
                    setSelectedProviderId(parsed._id);
                    setSelectedProvider(parsed);
                }
            }
        } catch (err) {
            // ignore
        }
        getProviders()
            .then((data) => {
                setProviders(data || []);
            })
            .catch(() => {});
    }, []);

    // Sync selectedProvider object when ID or provider list changes
    useEffect(() => {
        if (selectedProviderId && providers.length > 0) {
            const found = providers.find((p) => p._id === selectedProviderId);
            if (found) setSelectedProvider(found);
        }
    }, [selectedProviderId, providers]);

    // Sort and group cart services by category
    const sortedCartServices = [...cartServices].sort((a, b) =>
        a.category.localeCompare(b.category)
    );

    if (sortedCartServices.length === 0) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center py-8 text-center">
                <img src={cart} alt="Empty Cart" className="h-14 mb-4" />
                <h1 className="text-3xl font-[NeuwMachinaBold] uppercase tracking-wider text-slate-900 dark:text-white mb-4">
                    Your Cart is Empty
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Looks like you haven&apos;t added anything to your cart yet.
                </p>
                <button
                    onClick={() => navigateToHome()}
                    className="mt-6 flex items-center gap-2 px-6 py-3 bg-brand-gradient text-white text-sm font-semibold rounded-full shadow-glow-blue hover:opacity-90 uppercase tracking-wider transition-all"
                >
                    <ShoppingBag size={16} /> Start Booking Services
                </button>
            </div>
        );
    }

    const handlePaymentWrap = (e) => {
        e.preventDefault();
        setFormError("");
        if (!serviceDate) {
            setFormError("Please select a service date.");
            return;
        }
        if (!serviceTime) {
            setFormError("Please select a time slot.");
            return;
        }
        if (!serviceAddress.trim()) {
            setFormError("Please enter your complete service address.");
            return;
        }

        if (!isAuthenticated) {
            openLogin();
            return;
        } else {
            setShowConfirmModal(true);
        }
    };

    const handlePayment = async () => {
        setBookingLoading(true);
        setFormError("");
        try {
            const subtotal = getCartSubTotal();
            const tax = getCartTax();
            const total = getCartTotal();

            const orderData = {
                _id: user._id,
                providerId: selectedProviderId || null,
                amount: total,
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
                items: sortedCartServices.map((service) => ({
                    serviceId: service._id,
                    image: service.image,
                    title: service.title,
                    category: service.category,
                    quantity: service.quantity,
                    price: service.OurPrice,
                    total: service.OurPrice * service.quantity,
                })),
                summary: {
                    subtotal,
                    tax,
                    total,
                    itemCount: sortedCartServices.length,
                },
                customerDetails: {
                    name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.name || "Customer",
                    email: user.email,
                    phone: user.phone,
                },
                bookingDetails: {
                    serviceDate,
                    serviceTime,
                    serviceAddress,
                    notes,
                },
            };

            const result = await createDirectBooking(orderData);

            if (result.success) {
                sortedCartServices.forEach((service) => {
                    removeFromCart(service);
                });
                await clearUserCart();
                localStorage.removeItem("selectedProvider");
                navigate("/bookings");
            } else {
                throw new Error(result.message || "Booking failed");
            }
        } catch (error) {
            console.error("Booking error:", error);
            setFormError(error.message || "Unable to complete booking. Please try again.");
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 pb-8">
            <div className="w-full lg:w-3/4 flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-[NeuwMachinaBold] uppercase tracking-wider text-slate-900 dark:text-white pb-6">
                        Your <span className="text-gradient">Cart</span>
                    </h1>
                    <div className="w-full grid grid-cols-6 gap-8 text-slate-500 dark:text-slate-400 text-sm tracking-wider uppercase py-2 pr-8">
                        <h1>Service</h1>
                        <h1 className="col-span-3">Description</h1>
                        <h1>Price</h1>
                        <h1>Quantity</h1>
                    </div>
                    <hr className="mt-1 mb-6 border-t border-slate-200 dark:border-slate-700" />
                    <div className="flex-grow overflow-auto">
                        {Array.from(
                            new Set(sortedCartServices.map((s) => s.category))
                        ).map((category) => (
                            <div key={category} className="mr-6">
                                <div className="flex items-center pb-4 gap-2">
                                    <PackageOpen size={17} color="#10B981" />
                                    <h1 className="text-emerald-600 dark:text-emerald-400 text-sm font-extrabold uppercase tracking-wide">
                                        {category}
                                    </h1>
                                </div>
                                {sortedCartServices
                                    .filter((service) => service.category === category)
                                    .map((service) => (
                                        <div
                                            key={service._id}
                                            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 mb-4"
                                        >
                                            <div className="flex justify-between gap-4">
                                                <div className="w-full grid grid-cols-6 gap-8">
                                                    {service.image ? (
                                                        <img
                                                            src={`${
                                                                import.meta.env.VITE_BACKEND_URL
                                                            }/${service.image}`}
                                                            alt={service.title}
                                                            className="w-36 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                                                        />
                                                    ) : (
                                                        <div className="w-36 h-20 flex flex-col gap-1 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-400">
                                                            <ImageOff size={16} />
                                                            <h1 className="text-xs">Image unavailable</h1>
                                                        </div>
                                                    )}
                                                    <p className="h-full flex items-center col-span-3 text-slate-800 dark:text-slate-200">
                                                        {service.title}
                                                    </p>
                                                    <p className="h-full flex items-center font-semibold text-slate-900 dark:text-white">
                                                        ₹{service.OurPrice}
                                                    </p>
                                                    <div className="h-full flex items-center">
                                                        <div className="w-24 h-8 flex items-center justify-center text-sm border border-slate-300 dark:border-slate-600 rounded-full overflow-hidden bg-white dark:bg-slate-800">
                                                            <button
                                                                onClick={() => removeFromCart(service)}
                                                                className="w-full h-full text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-full h-full leading-[2rem] text-center text-slate-900 dark:text-white">
                                                                {
                                                                    cartServices.find(
                                                                        (cartService) =>
                                                                            cartService._id === service._id
                                                                    ).quantity
                                                                }
                                                            </span>
                                                            <button
                                                                onClick={() => addToCart(service)}
                                                                className="w-full h-full text-slate-900 dark:text-white border-l border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Service Appointment Schedule & Address Form */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm mr-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                        <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
                        Service Appointment & Address Details
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                        These details will be sent directly to your assigned service provider.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {/* Service Date */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Calendar size={13} className="text-blue-600" /> Service Date *
                            </label>
                            <input
                                type="date"
                                min={todayStr}
                                value={serviceDate}
                                onChange={(e) => setServiceDate(e.target.value)}
                                required
                                className="w-full text-sm rounded-xl p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Time Slot */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Clock size={13} className="text-blue-600" /> Preferred Time Slot *
                            </label>
                            <select
                                value={serviceTime}
                                onChange={(e) => setServiceTime(e.target.value)}
                                className="w-full text-sm rounded-xl p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="09:00 AM - 12:00 PM">🌅 Morning (09:00 AM - 12:00 PM)</option>
                                <option value="12:00 PM - 03:00 PM">☀️ Afternoon (12:00 PM - 03:00 PM)</option>
                                <option value="03:00 PM - 06:00 PM">🌤️ Evening (03:00 PM - 06:00 PM)</option>
                                <option value="06:00 PM - 09:00 PM">🌙 Night (06:00 PM - 09:00 PM)</option>
                            </select>
                        </div>
                    </div>

                    {/* Service Address */}
                    <div className="flex flex-col gap-1.5 mb-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <MapPin size={13} className="text-blue-600" /> Full Service Address *
                        </label>
                        <textarea
                            rows="2"
                            placeholder="Enter complete house/flat no., street, landmark, area & pincode..."
                            value={serviceAddress}
                            onChange={(e) => setServiceAddress(e.target.value)}
                            required
                            className="w-full text-sm rounded-xl p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <FileText size={13} className="text-blue-600" /> Special Instructions / Notes (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Ring doorbell twice, carry ladder, park near gate..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full text-sm rounded-xl p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Order summary */}
            <div className="w-full lg:w-1/4 h-fit lg:sticky lg:top-24 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                <h1 className="text-xl font-bold uppercase tracking-wider p-5 pb-0 text-slate-900 dark:text-white">
                    Order Summary
                </h1>
                <div className="h-full flex flex-col justify-between p-5 overflow-auto">
                    <div className="pr-4 mb-5 overflow-auto flex flex-col gap-3">
                        {cartServices.map((service) => (
                            <div key={service._id}>
                                <p className="text-slate-800 dark:text-slate-200">{service.title}</p>
                                <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm tracking-wider">
                                    <div className="flex items-center">
                                        <p>₹{service.OurPrice}</p>
                                        <span className="px-2">X</span>
                                        <p>
                                            {
                                                cartServices.find(
                                                    (cartService) => cartService._id === service._id
                                                ).quantity
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p>₹{service.OurPrice * service.quantity}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {providers.length > 0 && (
                        <div className="mb-5">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Service Provider
                                </label>
                                {selectedProvider && !changingProvider && (
                                    <button
                                        onClick={() => setChangingProvider(true)}
                                        className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline"
                                    >
                                        <ChevronDown size={12} /> Change
                                    </button>
                                )}
                            </div>

                            {selectedProvider && !changingProvider ? (
                                <div className="rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-3 flex flex-col gap-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center shrink-0">
                                                <User size={14} className="text-blue-600 dark:text-blue-300" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
                                                    {selectedProvider.name}
                                                </p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                                    {selectedProvider.category}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedProvider.isVerified && (
                                            <span className="shrink-0 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                                <BadgeCheck size={13} /> Verified
                                            </span>
                                        )}
                                    </div>
                                    <MiniStars rating={selectedProvider.averageRating} />
                                    <div className="flex items-center justify-between">
                                        {selectedProvider.hourlyRate > 0 && (
                                            <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                <IndianRupee size={11} />
                                                {selectedProvider.hourlyRate}
                                                <span className="font-normal text-slate-400">/hr</span>
                                            </span>
                                        )}
                                        <Link
                                            to={`/providers/${selectedProvider._id}`}
                                            className="text-xs text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800 ml-auto"
                                            target="_blank"
                                        >
                                            View profile →
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <select
                                        value={selectedProviderId}
                                        onChange={(e) => {
                                            setSelectedProviderId(e.target.value);
                                            setChangingProvider(false);
                                        }}
                                        className="w-full text-sm rounded-lg p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">No preference (auto assign)</option>
                                        {providers.map((p) => (
                                            <option key={p._id} value={p._id}>
                                                {p.name} — {p.category} ({p.averageRating > 0 ? `${p.averageRating.toFixed(1)}★` : "new"}
                                                {p.hourlyRate > 0 ? ` · ₹${p.hourlyRate}/hr` : ""})
                                            </option>
                                        ))}
                                    </select>
                                    {changingProvider && (
                                        <button
                                            onClick={() => setChangingProvider(false)}
                                            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 self-end"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <div className="py-3 border-y border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h1 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Subtotal
                                </h1>
                                <p className="text-slate-900 dark:text-white">₹{getCartSubTotal()}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <h1 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Tax
                                </h1>
                                <p className="text-slate-900 dark:text-white">₹{getCartTax()}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-3">
                            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                Total
                            </h1>
                            <p className="font-bold text-slate-900 dark:text-white">₹{getCartTotal()}</p>
                        </div>
                    </div>
                </div>

                {formError && (
                    <div className="px-5 py-2 bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-1.5 border-t border-red-200">
                        <AlertCircle size={14} className="shrink-0" />
                        {formError}
                    </div>
                )}

                <button
                    onClick={(e) => handlePaymentWrap(e)}
                    disabled={bookingLoading}
                    className="w-full tracking-wider bg-brand-gradient text-white p-5 rounded-2xl hover:opacity-90 transition-all uppercase text-base font-bold flex items-center justify-center gap-2 shadow-glow-blue disabled:opacity-50"
                >
                    <ShoppingBag size={18} />
                    {bookingLoading ? "Booking Service..." : "BOOK SERVICE"}
                </button>
            </div>

            {/* Booking Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-5 relative">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                                <CheckCircle2 size={26} />
                            </div>
                            <div>
                                <h2 className="text-xl font-[NeuwMachinaBold] uppercase tracking-wide text-slate-900 dark:text-white">
                                    Confirm Your Booking
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Please review your service appointment details before confirming.
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                            {selectedProvider && (
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                                    <span className="font-semibold text-slate-500">Service Provider:</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{selectedProvider.name}</span>
                                </div>
                            )}
                            <div className="flex items-start gap-2">
                                <Calendar size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                <span><strong className="text-slate-900 dark:text-white">Date:</strong> {serviceDate}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Clock size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                <span><strong className="text-slate-900 dark:text-white">Time Slot:</strong> {serviceTime}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                <span><strong className="text-slate-900 dark:text-white">Address:</strong> {serviceAddress}</span>
                            </div>
                            {notes && (
                                <div className="flex items-start gap-2 italic">
                                    <FileText size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                    <span><strong className="text-slate-900 dark:text-white not-italic">Notes:</strong> &ldquo;{notes}&rdquo;</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 bg-blue-50/60 dark:bg-slate-900/40 p-3.5 rounded-xl border border-blue-100 dark:border-slate-700/60 text-xs">
                            <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm">
                                <span>Total Amount:</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">₹{getCartTotal()}</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                                Payment will be collected after service completion.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={bookingLoading}
                                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={bookingLoading}
                                className="flex-1 py-3.5 px-4 rounded-xl bg-brand-gradient text-white font-bold text-xs uppercase tracking-wider shadow-glow-blue hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {bookingLoading ? "Confirming..." : "Confirm & Book"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
