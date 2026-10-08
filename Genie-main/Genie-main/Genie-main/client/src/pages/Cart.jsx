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
    getAddresses,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import PortalContext from "../context/PortalContext";
import { useLang } from "../context/LanguageContext";
import { t } from "../utils/translations";
import AddressManager from "../components/AddressManager";
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
    Home,
    Briefcase,
    Tag,
    Plus,
    Pencil,
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
    const { lang } = useLang();
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
    const [notes, setNotes] = useState("");
    const [formError, setFormError] = useState("");
    const [bookingLoading, setBookingLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Address Manager state
    const [showAddressManager, setShowAddressManager] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null); // full address object

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

        // Load saved addresses and auto-select default
        if (isAuthenticated) {
            getAddresses()
                .then((data) => {
                    const addrs = data.addresses || [];
                    if (!selectedAddress) {
                        const def = addrs.find(a => a.isDefault) || addrs[0] || null;
                        setSelectedAddress(def);
                    }
                })
                .catch(() => {});
        }

        const pincode = selectedAddress?.pincode || localStorage.getItem("userPincode") || "";
        getProviders({ pincode })
            .then((data) => {
                setProviders(data || []);
                if (!selectedProviderId && data && data.length > 0) {
                    const nearest = data[0];
                    setSelectedProvider(nearest);
                }
            })
            .catch(() => {});
    }, [isAuthenticated, selectedAddress?.pincode]);

    // Sync selectedProvider object when ID or provider list changes
    useEffect(() => {
        if (selectedProviderId && providers.length > 0) {
            const found = providers.find((p) => p._id === selectedProviderId);
            if (found) setSelectedProvider(found);
        }
    }, [selectedProviderId, providers]);

    // Format a full address object into a display string
    const formatAddressDisplay = (addr) => {
        if (!addr) return "";
        const parts = [addr.house, addr.area, addr.landmark, addr.city, addr.district, addr.state, addr.pincode].filter(Boolean);
        return parts.join(", ");
    };

    const LABEL_META = {
        Home: { icon: Home, color: "text-blue-600 dark:text-blue-400" },
        Work: { icon: Briefcase, color: "text-orange-600 dark:text-orange-400" },
        Other: { icon: Tag, color: "text-slate-500 dark:text-slate-400" },
    };

    // Sort and group cart services by category
    const sortedCartServices = [...cartServices].sort((a, b) =>
        (a.category || "").localeCompare(b.category || "")
    );

    if (sortedCartServices.length === 0) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center py-8 text-center">
                <img src={cart} alt="Empty Cart" className="h-14 mb-4" />
                <h1 className="text-xl font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {t(lang, "Cart is empty")}
                </h1>
                <p className="text-sm text-slate-500 pb-4">
                    {t(lang, "Explore our services and add items to your cart")}
                </p>
                <button
                    onClick={navigateToHome}
                    className="flex items-center gap-2 bg-brand-gradient text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all font-semibold uppercase tracking-wider text-xs shadow-glow-blue cursor-pointer"
                >
                    <ShoppingBag size={16} /> {t(lang, "hero_book")}
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
        if (!selectedAddress) {
            setFormError("Please select or add a delivery address.");
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
                providerId: selectedProviderId || (selectedProvider ? selectedProvider._id : null),
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
                    pincode: selectedAddress?.pincode || "",
                },
                bookingDetails: {
                    serviceDate,
                    serviceTime,
                    // Legacy flat string (backward compat)
                    serviceAddress: formatAddressDisplay(selectedAddress),
                    pincode: selectedAddress?.pincode || "",
                    notes,
                    // Structured address snapshot
                    addressSnapshot: selectedAddress ? {
                        label: selectedAddress.label || "",
                        name: selectedAddress.name || "",
                        mobile: selectedAddress.mobile || "",
                        house: selectedAddress.house || "",
                        area: selectedAddress.area || "",
                        landmark: selectedAddress.landmark || "",
                        pincode: selectedAddress.pincode || "",
                        city: selectedAddress.city || "",
                        district: selectedAddress.district || "",
                        state: selectedAddress.state || "",
                        postOffice: selectedAddress.postOffice || "",
                        latitude: selectedAddress.latitude || null,
                        longitude: selectedAddress.longitude || null,
                    } : {},
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row gap-6 pb-8 pt-8">
            <div className="w-full lg:w-3/4 flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-[NeuwMachinaBold] uppercase tracking-wider text-slate-900 dark:text-white pb-6">
                        {t(lang, "Your Cart")}
                    </h1>
                    <div className="w-full grid grid-cols-6 gap-8 text-slate-500 dark:text-slate-400 text-sm tracking-wider uppercase py-2 pr-8">
                        <h1>{t(lang, "Service")}</h1>
                        <h1 className="col-span-3">{t(lang, "Description")}</h1>
                        <h1>{t(lang, "Price")}</h1>
                        <h1>{t(lang, "bookings_quantity")}</h1>
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
                                        {t(lang, category)}
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
                                                            <h1 className="text-xs">{t(lang, "bookings_image_unavail")}</h1>
                                                        </div>
                                                    )}
                                                    <p className="h-full flex items-center col-span-3 text-slate-800 dark:text-slate-200">
                                                        {t(lang, service.title)}
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

                {/* Service Appointment Schedule & Address */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm mr-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                        <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
                        {t(lang, "Service Appointment & Address Details")}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                        These details will be sent directly to your assigned service provider.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {/* Service Date */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Calendar size={13} className="text-blue-600" /> {t(lang, "Service Date")} *
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
                                <Clock size={13} className="text-blue-600" /> {t(lang, "Preferred Time Slot")} *
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

                    {/* ── Delivery Address Selector ─────────────────────── */}
                    <div className="mb-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-3">
                            <MapPin size={13} className="text-blue-600" /> Delivery Address *
                        </label>

                        {selectedAddress ? (
                            /* Selected address card */
                            <div className="rounded-2xl border-2 border-blue-500 bg-blue-50/60 dark:bg-blue-900/20 p-4 relative group">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                                            {(() => {
                                                const meta = LABEL_META[selectedAddress.label] || LABEL_META.Other;
                                                const Icon = meta.icon;
                                                return <Icon size={16} className={meta.color} />;
                                            })()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedAddress.name}</p>
                                                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 font-semibold">{selectedAddress.label}</span>
                                                {selectedAddress.isDefault && (
                                                    <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                                                        <CheckCircle2 size={9} /> Default
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedAddress.mobile}</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{formatAddressDisplay(selectedAddress)}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddressManager(true)}
                                        className="shrink-0 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                                    >
                                        <Pencil size={11} /> Change
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* No address: prompt to add */
                            <button
                                type="button"
                                onClick={() => setShowAddressManager(true)}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
                            >
                                <Plus size={16} /> Add Delivery Address
                            </button>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <FileText size={13} className="text-blue-600" /> {t(lang, "Special Instructions / Notes")}
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
                    {t(lang, "Order Summary")}
                </h1>
                <div className="h-full flex flex-col justify-between p-5 overflow-auto">
                    <div className="pr-4 mb-5 overflow-auto flex flex-col gap-3">
                        {cartServices.map((service) => (
                            <div key={service._id}>
                                <p className="text-slate-800 dark:text-slate-200">{t(lang, service.title)}</p>
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
                                    {t(lang, "bookings_provider")}
                                </label>
                                {selectedProvider && !changingProvider && (
                                    <button
                                        onClick={() => setChangingProvider(true)}
                                        className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                                    >
                                        <ChevronDown size={12} /> {t(lang, "Change")}
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
                                                    {t(lang, selectedProvider.name)}
                                                </p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                                    {t(lang, selectedProvider.category)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            {selectedProvider.isVerified && (
                                                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    <BadgeCheck size={13} /> {t(lang, "providers_verified")}
                                                </span>
                                            )}
                                            {(selectedProvider.isExactPincodeMatch || (selectedProvider.distanceKm !== undefined && selectedProvider.distanceKm <= 50)) && (
                                                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 px-1.5 py-0.5 rounded">
                                                    🎯 {selectedProvider.isExactPincodeMatch ? t(lang, "Nearest Provider") : `${selectedProvider.distanceKm} km`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <MiniStars rating={selectedProvider.averageRating} />

                                    {(selectedProvider.location?.address || selectedProvider.pincode) && (
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                                            <MapPin size={11} className="text-red-500 shrink-0" />
                                            {t(lang, selectedProvider.location?.address || "")} {selectedProvider.pincode || selectedProvider.location?.pincode ? `· ${selectedProvider.pincode || selectedProvider.location?.pincode}` : ""}
                                        </p>
                                    )}

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
                                            {t(lang, "View profile")} →
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
                                        <option value="">{t(lang, "No preference (auto assign nearest)")}</option>
                                        {providers.map((p) => {
                                            const pPin = p.pincode || p.location?.pincode;
                                            const nearTag = p.isExactPincodeMatch ? " [🎯 Nearest]" : p.distanceKm ? ` [${p.distanceKm} km]` : "";
                                            return (
                                                <option key={p._id} value={p._id}>
                                                    {t(lang, p.name)} — {t(lang, p.category)}{nearTag} ({p.averageRating > 0 ? `${p.averageRating.toFixed(1)}★` : "new"}
                                                    {pPin ? ` · ${pPin}` : ""}{p.hourlyRate > 0 ? ` · ₹${p.hourlyRate}/hr` : ""})
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {changingProvider && (
                                        <button
                                            onClick={() => setChangingProvider(false)}
                                            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 self-end cursor-pointer"
                                        >
                                            {t(lang, "Cancel")}
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
                                    {t(lang, "Approx. Subtotal")}
                                </h1>
                                <p className="text-slate-900 dark:text-white">~₹{getCartSubTotal()}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <h1 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    {t(lang, "Estimated Tax")}
                                </h1>
                                <p className="text-slate-900 dark:text-white">~₹{getCartTax()}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-3">
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                                    {t(lang, "Approx. Total")}
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                        Estimated
                                    </span>
                                </h1>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    * Final price subject to on-site scope
                                </p>
                            </div>
                            <p className="font-extrabold text-slate-900 dark:text-white text-xl">~₹{getCartTotal()}</p>
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
                    className="w-full tracking-wider bg-brand-gradient text-white p-5 rounded-2xl hover:opacity-90 transition-all uppercase text-base font-bold flex items-center justify-center gap-2 shadow-glow-blue disabled:opacity-50 cursor-pointer"
                >
                    <ShoppingBag size={18} />
                    {bookingLoading ? t(lang, "Booking Service...") : t(lang, "BOOK SERVICE")}
                </button>
            </div>

            {/* Booking Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-5 relative">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                                <CheckCircle2 size={26} />
                            </div>
                            <div>
                                <h2 className="text-xl font-[NeuwMachinaBold] uppercase tracking-wide text-slate-900 dark:text-white">
                                    {t(lang, "Confirm Your Booking")}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Please review your service appointment details before confirming.
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                            {selectedProvider && (
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                                    <span className="font-semibold text-slate-500">{t(lang, "bookings_provider")}:</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{selectedProvider.name}</span>
                                </div>
                            )}
                            <div className="flex items-start gap-2">
                                <Calendar size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                <span><strong className="text-slate-900 dark:text-white">{t(lang, "Service Date")}:</strong> {serviceDate}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Clock size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                <span><strong className="text-slate-900 dark:text-white">{t(lang, "Preferred Time Slot")}:</strong> {serviceTime}</span>
                            </div>
                            {/* Structured address in confirm modal */}
                            {selectedAddress && (
                                <div className="flex items-start gap-2">
                                    <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-slate-900 dark:text-white">Delivery Address:</strong>
                                        <p className="mt-0.5">{selectedAddress.name} · {selectedAddress.mobile}</p>
                                        <p>{formatAddressDisplay(selectedAddress)}</p>
                                        {selectedAddress.city && selectedAddress.state && (
                                            <p className="text-slate-500">{selectedAddress.city}, {selectedAddress.state} – {selectedAddress.pincode}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {notes && (
                                <div className="flex items-start gap-2 italic">
                                    <FileText size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                    <span><strong className="text-slate-900 dark:text-white not-italic">{t(lang, "Special Instructions / Notes")}:</strong> &ldquo;{notes}&rdquo;</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5 bg-blue-50/60 dark:bg-slate-900/40 p-3.5 rounded-xl border border-blue-100 dark:border-slate-700/60 text-xs">
                            <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white text-sm">
                                <span className="flex items-center gap-1.5">
                                    {t(lang, "Approximate Total")}:
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                        Estimated
                                    </span>
                                </span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">~₹{getCartTotal()}</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                                💡 <strong>Approximate Price:</strong> Payment will be collected after service completion. Final amount may vary based on on-site inspection or additional parts required.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={bookingLoading}
                                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {t(lang, "Cancel")}
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={bookingLoading}
                                className="flex-1 py-3.5 px-4 rounded-xl bg-brand-gradient text-white font-bold text-xs uppercase tracking-wider shadow-glow-blue hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {bookingLoading ? t(lang, "Confirming...") : t(lang, "Confirm & Book")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Address Manager Modal */}
            <AddressManager
                isOpen={showAddressManager}
                onClose={() => setShowAddressManager(false)}
                onSelectAddress={(addr) => {
                    setSelectedAddress(addr);
                    setShowAddressManager(false);
                }}
                selectedAddressId={selectedAddress?._id}
            />
        </div>
    );
}
