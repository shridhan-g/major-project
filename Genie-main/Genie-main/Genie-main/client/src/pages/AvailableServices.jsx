// client/src/pages/AvailableServices.jsx
import { useState, useEffect, useContext, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getServices, getServiceDetails } from "../utils/api";
import { CartContext } from "../context/CartContext";
import { useLang } from "../context/LanguageContext";
import { t } from "../utils/translations";
import ClipLoader from "react-spinners/ClipLoader";
import {
    Search,
    SlidersHorizontal,
    Star,
    IndianRupee,
    ShoppingCart,
    ArrowRight,
    Sparkles,
    Check,
    Plus,
    Minus,
    Tag,
    Clock,
    ShieldCheck,
    Users
} from "lucide-react";

// Curated photography mapping for services
const SERVICE_IMAGES = {
    // Salon & Spa
    "haircut": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=80",
    "facial": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80",
    "makeup": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&auto=format&fit=crop&q=80",
    "manicure": "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&auto=format&fit=crop&q=80",
    "pedicure": "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&auto=format&fit=crop&q=80",
    "massage": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&auto=format&fit=crop&q=80",
    "beard": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop&q=80",
    "waxing": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=80",
    "threading": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80",

    // Appliances & AC
    "ac": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80",
    "refrigerator": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80",
    "washing": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=500&auto=format&fit=crop&q=80",
    "microwave": "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500&auto=format&fit=crop&q=80",
    "geyser": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=500&auto=format&fit=crop&q=80",
    "purifier": "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80",

    // Cleaning & Pest
    "cleaning": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80",
    "pest": "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=500&auto=format&fit=crop&q=80",
    "sofa": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=80",
    "kitchen": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80",
    "bathroom": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80",

    // Electrician, Plumber, Carpenter
    "electrician": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80",
    "wiring": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80",
    "fan": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80",
    "switch": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=80",
    "plumber": "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=500&auto=format&fit=crop&q=80",
    "pipe": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&auto=format&fit=crop&q=80",
    "tap": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80",
    "carpenter": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500&auto=format&fit=crop&q=80",
    "furniture": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=80",
    "lock": "https://images.unsplash.com/photo-1558002038-1055907df827?w=500&auto=format&fit=crop&q=80",

    // Painting
    "painting": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=80",
    "waterproofing": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80",
};

function getServiceImageUrl(title, categoryName) {
    const text = `${title} ${categoryName}`.toLowerCase();
    for (const [key, url] of Object.entries(SERVICE_IMAGES)) {
        if (text.includes(key)) return url;
    }
    return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80";
}

export default function AvailableServices() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { lang } = useLang();
    const { cartServices, addToCart, removeFromCart, getCartCount, getCartTotal } = useContext(CartContext);

    const [services, setServices] = useState([]);
    const [allServiceItems, setAllServiceItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
    const [selectedSubcategory, setSelectedSubcategory] = useState("");
    const [minRating, setMinRating] = useState(0);
    const [maxPrice, setMaxPrice] = useState("");
    const [sortBy, setSortBy] = useState("popular");
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const params = {};
        if (searchTerm) params.search = searchTerm;
        if (selectedCategory) params.category = selectedCategory;
        setSearchParams(params, { replace: true });
    }, [searchTerm, selectedCategory, setSearchParams]);

    // Fetch all service details and flatten all available items
    useEffect(() => {
        const fetchAllServices = async () => {
            try {
                setLoading(true);
                const categoriesData = await getServices();
                setServices(categoriesData || []);

                const detailedPromises = categoriesData.map(async (svc) => {
                    try {
                        const detail = await getServiceDetails(svc.serviceName);
                        return { serviceName: svc.serviceName, detail };
                    } catch (e) {
                        return { serviceName: svc.serviceName, detail: null };
                    }
                });

                const detailedResults = await Promise.all(detailedPromises);

                const flattened = [];
                for (const item of detailedResults) {
                    const { serviceName, detail } = item;
                    if (!detail?.subcategories) continue;

                    for (const [subcatName, subcatObj] of Object.entries(detail.subcategories)) {
                        if (subcatObj.serviceTypes) {
                            for (const [stName, stObj] of Object.entries(subcatObj.serviceTypes)) {
                                if (stObj.categories) {
                                    for (const cat of stObj.categories) {
                                        for (const s of cat.services || []) {
                                            flattened.push({
                                                ...s,
                                                serviceName,
                                                subcategory: subcatName,
                                                serviceType: stName,
                                                groupCategory: cat.name,
                                                image: s.image || getServiceImageUrl(s.title, serviceName),
                                                rating: s.rating || 4.8,
                                                ratingCount: s.reviewsCount || Math.floor(Math.random() * 40 + 15)
                                            });
                                        }
                                    }
                                }
                            }
                        } else if (subcatObj.categories) {
                            for (const cat of subcatObj.categories) {
                                for (const s of cat.services || []) {
                                    flattened.push({
                                        ...s,
                                        serviceName,
                                        subcategory: subcatName,
                                        groupCategory: cat.name,
                                        image: s.image || getServiceImageUrl(s.title, serviceName),
                                        rating: s.rating || 4.8,
                                        ratingCount: s.reviewsCount || Math.floor(Math.random() * 40 + 15)
                                    });
                                }
                            }
                        } else if (subcatObj.services) {
                            for (const s of subcatObj.services) {
                                flattened.push({
                                    ...s,
                                    serviceName,
                                    subcategory: subcatName,
                                    groupCategory: s.category || subcatName,
                                    image: s.image || getServiceImageUrl(s.title, serviceName),
                                    rating: s.rating || 4.8,
                                    ratingCount: s.reviewsCount || Math.floor(Math.random() * 40 + 15)
                                });
                            }
                        }
                    }
                }

                setAllServiceItems(flattened);
            } catch (err) {
                console.error("Error fetching all services:", err);
                setError("Failed to load available services");
            } finally {
                setLoading(false);
            }
        };

        fetchAllServices();
    }, []);

    // Extract subcategories for active category
    const availableSubcategories = useMemo(() => {
        if (!selectedCategory) {
            return [...new Set(allServiceItems.map((item) => item.subcategory))].filter(Boolean);
        }
        return [
            ...new Set(
                allServiceItems
                    .filter((item) => item.serviceName === selectedCategory)
                    .map((item) => item.subcategory)
            ),
        ].filter(Boolean);
    }, [allServiceItems, selectedCategory]);

    // Filter & Sort services
    const filteredServices = useMemo(() => {
        let list = [...allServiceItems];

        if (selectedCategory) {
            list = list.filter((s) => s.serviceName === selectedCategory);
        }

        if (selectedSubcategory) {
            list = list.filter((s) => s.subcategory === selectedSubcategory);
        }

        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase().trim();
            list = list.filter(
                (s) =>
                    s.title.toLowerCase().includes(query) ||
                    s.serviceName.toLowerCase().includes(query) ||
                    s.subcategory?.toLowerCase().includes(query) ||
                    s.groupCategory?.toLowerCase().includes(query) ||
                    s.description?.toLowerCase().includes(query)
            );
        }

        if (minRating > 0) {
            list = list.filter((s) => (s.rating || 4.5) >= minRating);
        }

        if (maxPrice !== "") {
            list = list.filter((s) => (s.OurPrice || s.price || 0) <= Number(maxPrice));
        }

        // Sorting
        if (sortBy === "price_asc") {
            list.sort((a, b) => (a.OurPrice || 0) - (b.OurPrice || 0));
        } else if (sortBy === "price_desc") {
            list.sort((a, b) => (b.OurPrice || 0) - (a.OurPrice || 0));
        } else if (sortBy === "rating_desc") {
            list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sortBy === "discount_desc") {
            list.sort((a, b) => {
                const discA = a.OriginalPrice && a.OurPrice ? a.OriginalPrice - a.OurPrice : 0;
                const discB = b.OriginalPrice && b.OurPrice ? b.OriginalPrice - b.OurPrice : 0;
                return discB - discA;
            });
        }

        return list;
    }, [allServiceItems, selectedCategory, selectedSubcategory, searchTerm, minRating, maxPrice, sortBy]);

    const resetFilters = () => {
        setSelectedCategory("");
        setSelectedSubcategory("");
        setSearchTerm("");
        setMinRating(0);
        setMaxPrice("");
        setSortBy("popular");
    };

    const getItemQuantity = (serviceId) => {
        const item = cartServices.find((s) => s._id === serviceId);
        return item ? item.quantity : 0;
    };

    if (loading) {
        return (
            <div className="w-full min-h-[70vh] flex flex-col justify-center items-center gap-3">
                <ClipLoader color="#2563EB" size={40} />
                <p className="text-sm text-slate-500 font-medium">Loading available services...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto py-16 text-center text-red-500">
                <p className="text-lg font-semibold">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-16 px-4 sm:px-6">
            {/* Page Header */}
            <div className="pt-2 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest mb-1.5">
                    <Sparkles size={14} /> Available Services
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-[NeuwMachinaBold] text-slate-900 dark:text-white">
                            Explore & Book <span className="text-gradient">Home Services</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-2xl">
                            Browse verified home maintenance, grooming, repair, and cleaning services with transparent pricing.
                        </p>
                    </div>

                    {/* Active Providers Quick Jump */}
                    <Link
                        to="/providers"
                        className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:shadow-sm transition-all self-start md:self-auto"
                    >
                        <Users size={14} /> Find Nearest Providers →
                    </Link>
                </div>
            </div>

            {/* Search & Category Filter Pills */}
            <div className="py-5 flex flex-col gap-4">
                {/* Search Bar & Primary Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search any service (e.g. Haircut, AC gas refill, Wiring, Sofa cleaning)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-sm rounded-full pl-11 pr-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white shadow-xs"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-sm rounded-full py-3 px-4 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs"
                    >
                        <option value="popular">🔥 Most Popular</option>
                        <option value="rating_desc">⭐ Highest Rating</option>
                        <option value="price_asc">₹ Price: Low to High</option>
                        <option value="price_desc">₹ Price: High to Low</option>
                        <option value="discount_desc">🏷️ Biggest Discount</option>
                    </select>

                    <button
                        onClick={() => setShowFilters((v) => !v)}
                        className={`flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-full border transition-all cursor-pointer shadow-xs ${
                            showFilters
                                ? "bg-blue-600 text-white border-blue-600"
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-500"
                        }`}
                    >
                        <SlidersHorizontal size={15} />
                        Filters {(minRating > 0 || maxPrice !== "") && "• Active"}
                    </button>
                </div>

                {/* Category Pills Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    <button
                        onClick={() => {
                            setSelectedCategory("");
                            setSelectedSubcategory("");
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            selectedCategory === ""
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400"
                        }`}
                    >
                        ✨ All Services ({allServiceItems.length})
                    </button>
                    {services.map((svc) => {
                        const isSelected = selectedCategory === svc.serviceName;
                        const count = allServiceItems.filter((i) => i.serviceName === svc.serviceName).length;
                        return (
                            <button
                                key={svc._id}
                                onClick={() => {
                                    setSelectedCategory(isSelected ? "" : svc.serviceName);
                                    setSelectedSubcategory("");
                                }}
                                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isSelected
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400"
                                }`}
                            >
                                {t(lang, svc.serviceName)}
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-blue-700 text-blue-100" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Subcategory Pills (if category is chosen) */}
                {availableSubcategories.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                            Subcategories:
                        </span>
                        <button
                            onClick={() => setSelectedSubcategory("")}
                            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                                selectedSubcategory === ""
                                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                            }`}
                        >
                            All
                        </button>
                        {availableSubcategories.map((subcat) => (
                            <button
                                key={subcat}
                                onClick={() => setSelectedSubcategory(selectedSubcategory === subcat ? "" : subcat)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                                    selectedSubcategory === subcat
                                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                }`}
                            >
                                {t(lang, subcat)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Expandable Filters Panel */}
                {showFilters && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-6 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-600 dark:text-slate-400">Min Rating:</span>
                            {[0, 4.0, 4.5, 4.8].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setMinRating(v)}
                                    className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                                        minRating === v
                                            ? "bg-orange-500 text-white border-orange-500 font-bold"
                                            : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                                    }`}
                                >
                                    {v === 0 ? "Any" : `${v}★+`}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-600 dark:text-slate-400">Max Price:</span>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                <input
                                    type="number"
                                    placeholder="Any price"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-28 pl-6 pr-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {(minRating > 0 || maxPrice !== "" || selectedCategory || selectedSubcategory || searchTerm) && (
                            <button
                                onClick={resetFilters}
                                className="text-red-500 hover:underline font-semibold ml-auto cursor-pointer"
                            >
                                Reset All Filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Results Count Bar */}
            <div className="flex items-center justify-between py-2 mb-4 text-xs text-slate-500 dark:text-slate-400">
                <p>
                    Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredServices.length}</strong> available services
                    {selectedCategory ? ` in ${selectedCategory}` : ""}
                </p>
                {getCartCount() > 0 && (
                    <Link
                        to="/viewcart"
                        className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        <ShoppingCart size={13} /> {getCartCount()} items in cart (₹{getCartTotal()}) →
                    </Link>
                )}
            </div>

            {/* Services Grid */}
            {filteredServices.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-xs">
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">No services match your filters.</p>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your search keyword or clearing the filters.</p>
                    <button
                        onClick={resetFilters}
                        className="mt-4 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all shadow-glow-blue"
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredServices.map((service) => {
                        const qty = getItemQuantity(service._id);
                        const discount =
                            service.OriginalPrice && service.OurPrice && service.OriginalPrice > service.OurPrice
                                ? Math.round(((service.OriginalPrice - service.OurPrice) / service.OriginalPrice) * 100)
                                : null;

                        return (
                            <div
                                key={service._id}
                                className="group rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 hover:border-blue-500/80 dark:hover:border-blue-400 transition-all shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden"
                            >
                                <div>
                                    {/* Service Image & Badges */}
                                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-900">
                                        <img
                                            src={service.image}
                                            alt={service.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                                        {/* Category Badge */}
                                        <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                                            {t(lang, service.subcategory || service.serviceName)}
                                        </span>

                                        {/* Discount Badge */}
                                        {discount && (
                                            <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                                                <Tag size={10} /> {discount}% OFF
                                            </span>
                                        )}

                                        {/* Rating pill */}
                                        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-bold text-slate-900 dark:text-white shadow-xs">
                                            <Star size={11} className="text-orange-500 fill-orange-500" />
                                            <span>{service.rating}</span>
                                            <span className="text-[10px] text-slate-500 font-normal">({service.ratingCount})</span>
                                        </div>
                                    </div>

                                    {/* Service Content */}
                                    <div className="p-4">
                                        <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                            {t(lang, service.serviceName)}
                                        </div>
                                        <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {t(lang, service.title)}
                                        </h3>

                                        {service.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                                                {service.description}
                                            </p>
                                        )}

                                        {/* Highlights features */}
                                        {service.includes?.length > 0 && (
                                            <div className="mt-2.5 flex flex-wrap gap-1">
                                                {service.includes.slice(0, 2).map((inc, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded px-1.5 py-0.5 font-medium">
                                                        <ShieldCheck size={10} /> {inc}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Footer: Price + Actions */}
                                <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-2.5">
                                    <div className="flex items-baseline justify-between">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                                                <IndianRupee size={15} />
                                                {service.OurPrice || service.price}
                                            </span>
                                            {service.OriginalPrice && service.OriginalPrice > (service.OurPrice || service.price) && (
                                                <span className="text-xs text-slate-400 line-through">
                                                    ₹{service.OriginalPrice}
                                                </span>
                                            )}
                                        </div>
                                        {service.time && (
                                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                <Clock size={11} /> {service.time}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        {/* Quantity / Add to Cart */}
                                        {qty === 0 ? (
                                            <button
                                                onClick={() => addToCart(service)}
                                                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-glow-blue flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <ShoppingCart size={13} /> Add to Cart
                                            </button>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-between bg-blue-50 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded-xl p-1">
                                                <button
                                                    onClick={() => removeFromCart(service)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                                                >
                                                    <Minus size={13} />
                                                </button>
                                                <span className="text-xs font-bold text-blue-900 dark:text-blue-100 px-2">
                                                    {qty} in cart
                                                </span>
                                                <button
                                                    onClick={() => addToCart(service)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                                                >
                                                    <Plus size={13} />
                                                </button>
                                            </div>
                                        )}

                                        {/* View Providers / Details */}
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/services/${encodeURIComponent(service.serviceName)}/${encodeURIComponent(service.subcategory)}`
                                                )
                                            }
                                            className="py-2 px-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-500 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                                            title="View nearest service providers"
                                        >
                                            Providers <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
