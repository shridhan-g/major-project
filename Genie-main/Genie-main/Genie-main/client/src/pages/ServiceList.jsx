import { useContext, useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getServiceDetails, getProviders } from "../utils/api";
import { cart2, quality, tick } from "../assets";
import ClipLoader from "react-spinners/ClipLoader";
import { CartContext } from "../context/CartContext";
import ServiceCart from "../components/ServiceCart";
import { PackageOpen, ShieldCheck, BadgeCheck, Star, MapPin, IndianRupee, Clock, Check, User, SlidersHorizontal, Search, Loader2, X, Locate } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { t } from "../utils/translations";

// ── Category & Service Image Photography Mapping ─────────────────────────────
// High-resolution, curated photography with instant fallback for all service types
const CATEGORY_IMAGE_MAP = [
    // Electrical
    { keys: ["fan", "ceiling fan"], url: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&auto=format&fit=crop&q=80", emoji: "🌀" },
    { keys: ["appliance", "home appliance"], url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80", emoji: "🔌" },
    { keys: ["doorbell", "bell"], url: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&auto=format&fit=crop&q=80", emoji: "🔔" },
    { keys: ["inverter", "stabiliser", "battery"], url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&auto=format&fit=crop&q=80", emoji: "🔋" },
    { keys: ["mcb", "submeter", "meter", "fuse", "breaker"], url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80", emoji: "⚡" },
    { keys: ["switch", "socket", "plug"], url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80", emoji: "🔌" },
    { keys: ["light", "lamp", "ceiling light", "wall light", "chandelier"], url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&auto=format&fit=crop&q=80", emoji: "💡" },
    { keys: ["wiring", "wire", "cable"], url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80", emoji: "⚡" },

    // Plumbing
    { keys: ["tap", "mixer", "faucet"], url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80", emoji: "🚰" },
    { keys: ["basin", "sink"], url: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=400&auto=format&fit=crop&q=80", emoji: "🧼" },
    { keys: ["bath", "shower", "fittings"], url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400&auto=format&fit=crop&q=80", emoji: "🚿" },
    { keys: ["drain", "drainage", "pipe", "sewage"], url: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&auto=format&fit=crop&q=80", emoji: "🔧" },
    { keys: ["toilet", "commode", "sanitary"], url: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=400&auto=format&fit=crop&q=80", emoji: "🚽" },
    { keys: ["tank", "water tank", "motor", "water pipes"], url: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=400&auto=format&fit=crop&q=80", emoji: "💧" },
    { keys: ["grouting", "filter", "water filer", "water filter"], url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&auto=format&fit=crop&q=80", emoji: "🚰" },

    // Carpentry
    { keys: ["bed", "mattress"], url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&auto=format&fit=crop&q=80", emoji: "🛏️" },
    { keys: ["cupboard", "drawer", "wardrobe", "cabinet"], url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&auto=format&fit=crop&q=80", emoji: "🚪" },
    { keys: ["door", "window", "curtain"], url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80", emoji: "🚪" },
    { keys: ["furniture", "chair", "table", "furniture repair"], url: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop&q=80", emoji: "🪑" },
    { keys: ["drill", "hanger", "clothes hanger", "drill & hang"], url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80", emoji: "🔨" },

    // Cleaning & Pest Control
    { keys: ["kitchen", "kitchen cleaning"], url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop&q=80", emoji: "🍳" },
    { keys: ["bathroom", "bathroom cleaning"], url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80", emoji: "🧼" },
    { keys: ["sofa", "carpet"], url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop&q=80", emoji: "🛋️" },
    { keys: ["house", "apartment", "deep clean", "occupied", "unfurnished"], url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80", emoji: "🧹" },
    { keys: ["pest", "cockroach", "termite", "bed bug"], url: "https://images.unsplash.com/photo-1587393855524-087f83d95bc9?w=400&auto=format&fit=crop&q=80", emoji: "🐜" },

    // AC & Appliances
    { keys: ["ac", "air condition", "cooling"], url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&auto=format&fit=crop&q=80", emoji: "❄️" },
    { keys: ["fridge", "refrigerator", "single door", "double door", "side-by-side"], url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80", emoji: "🧊" },
    { keys: ["washing machine", "dryer", "cleaning"], url: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop&q=80", emoji: "🫧" },
    { keys: ["microwave", "oven"], url: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400&auto=format&fit=crop&q=80", emoji: "📦" },

    // Salon & Spa
    { keys: ["haircut", "cut", "styling", "beard", "shave"], url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop&q=80", emoji: "✂️" },
    { keys: ["facial", "clean-up", "skin", "makeup", "bleach", "detan"], url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80", emoji: "🌸" },
    { keys: ["waxing", "wax", "threading"], url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&auto=format&fit=crop&q=80", emoji: "✨" },
    { keys: ["manicure", "pedicure", "nail", "gel"], url: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&auto=format&fit=crop&q=80", emoji: "💅" },
    { keys: ["massage", "spa", "stress", "pain", "relief", "swedish"], url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&auto=format&fit=crop&q=80", emoji: "💆" },
    { keys: ["hair color", "color", "botox", "keratin", "hair care"], url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80", emoji: "💇" },

    // Painting & Waterproofing
    { keys: ["consultation", "inspection", "laser", "diagnostic"], url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&auto=format&fit=crop&q=80", emoji: "📋" },
    { keys: ["room", "interior", "wall", "paint", "bhk", "accent", "texture"], url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&auto=format&fit=crop&q=80", emoji: "🎨" },
    { keys: ["rental", "refresh", "budget", "express", "touch-up"], url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80", emoji: "🏠" },
    { keys: ["wood", "polish", "enamel", "grill", "gate", "varnish"], url: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop&q=80", emoji: "🚪" },
    { keys: ["waterproof", "terrace", "roof", "drain", "coating"], url: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=400&auto=format&fit=crop&q=80", emoji: "🌧️" },
    { keys: ["damp", "seepage", "efflorescence", "crack", "leak"], url: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=400&auto=format&fit=crop&q=80", emoji: "🛡️" },
    { keys: ["grout", "grouting", "epoxy", "tile joint", "tile"], url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400&auto=format&fit=crop&q=80", emoji: "🧼" },
];

const findMatchedImage = (titleOrName) => {
    const lower = (titleOrName || "").toLowerCase();
    for (const item of CATEGORY_IMAGE_MAP) {
        if (item.keys.some((k) => lower.includes(k))) return item;
    }
    return {
        url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80",
        emoji: "🛠️",
    };
};

// ── CategoryTileImage Component for Sidebar ───────────────────────────────────
const CategoryTileImage = ({ src, name }) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const match = findMatchedImage(name);

    const initialSrc =
        src && src.trim() !== "" && !src.includes("undefined")
            ? (src.startsWith("http://") || src.startsWith("https://") ? src : `${backendUrl}${src.startsWith("/") ? "" : "/"}${src}`)
            : match.url;

    const [imgSrc, setImgSrc] = useState(initialSrc);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        if (imgSrc !== match.url) {
            setImgSrc(match.url);
        } else {
            setHasError(true);
        }
    };

    if (hasError) {
        return (
            <div className="w-full h-16 sm:h-20 flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-700 dark:to-slate-800 text-3xl">
                <span>{match.emoji}</span>
            </div>
        );
    }

    return (
        <div className="w-full h-16 sm:h-20 relative overflow-hidden bg-slate-100 dark:bg-slate-700">
            <img
                src={imgSrc}
                alt={name}
                onError={handleError}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-50 group-hover:opacity-30 transition-opacity" />
        </div>
    );
};

// ── ServiceImage Component for Service Cards ─────────────────────────────────
const ServiceImage = ({ src, title, className = "w-36 h-24" }) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const match = findMatchedImage(title);

    const initialSrc =
        src && src.trim() !== "" && !src.includes("undefined")
            ? (src.startsWith("http://") || src.startsWith("https://") ? src : `${backendUrl}${src.startsWith("/") ? "" : "/"}${src}`)
            : match.url;

    const [imgSrc, setImgSrc] = useState(initialSrc);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        if (imgSrc !== match.url) {
            setImgSrc(match.url);
        } else {
            setHasError(true);
        }
    };

    if (hasError) {
        return (
            <div className={`${className} flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 text-4xl`}>
                <span>{match.emoji}</span>
            </div>
        );
    }

    return (
        <div className={`${className} relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 shadow-sm`}>
            <img
                src={imgSrc}
                alt={title}
                onError={handleError}
                className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
                loading="lazy"
            />
        </div>
    );
};
// ────────────────────────────────────────────────────────────────────────────

const StarRating = ({ rating }) => {
    const value = rating || 0;
    return (
        <span className="flex items-center gap-0.5 text-orange-500">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={13}
                    fill={i <= Math.round(value) ? "currentColor" : "none"}
                />
            ))}
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-medium">
                {value > 0 ? value.toFixed(1) : "New"}
            </span>
        </span>
    );
};

const ServiceList = () => {
    const { serviceName, subcategory, serviceType } = useParams();
    const { cartServices, addToCart, removeFromCart } = useContext(CartContext);
    const { lang } = useLang();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const categoryRefs = useRef({});

    // Provider state & Location filter for nearest providers
    const [providers, setProviders] = useState([]);
    const [selectedProviderId, setSelectedProviderId] = useState("");
    const [minRating, setMinRating] = useState(0);
    const [maxWage, setMaxWage] = useState("");
    const [sortBy, setSortBy] = useState("nearest");
    const [showProviderFilters, setShowProviderFilters] = useState(false);
    const [showLocationForm, setShowLocationForm] = useState(false);

    // Nearest location filter state (Pincode, City, District, State)
    const [userPincode, setUserPincode] = useState(() => localStorage.getItem("userPincode") || "");
    const [userCity, setUserCity] = useState(() => localStorage.getItem("userCity") || "");
    const [userDistrict, setUserDistrict] = useState(() => localStorage.getItem("userDistrict") || "");
    const [userState, setUserState] = useState(() => localStorage.getItem("userState") || "");
    const [pincodeLoading, setPincodeLoading] = useState(false);

    // Separate loading state for providers list (Never unmounts or refreshes the page)
    const [providersLoading, setProvidersLoading] = useState(false);

    // Debounced location values for smooth, flicker-free provider search
    const [debouncedPincode, setDebouncedPincode] = useState(userPincode);
    const [debouncedCity, setDebouncedCity] = useState(userCity);
    const [debouncedDistrict, setDebouncedDistrict] = useState(userDistrict);
    const [debouncedState, setDebouncedState] = useState(userState);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedPincode(userPincode);
            setDebouncedCity(userCity);
            setDebouncedDistrict(userDistrict);
            setDebouncedState(userState);
        }, 300);
        return () => clearTimeout(timer);
    }, [userPincode, userCity, userDistrict, userState]);

    // Restore selected provider on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("selectedProvider");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed?._id) setSelectedProviderId(parsed._id);
            }
        } catch (err) {
            // ignore
        }
    }, []);

    // Handle Pincode change & auto-populate City, District, State
    const handlePincodeChange = async (e) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
        setUserPincode(val);
        localStorage.setItem("userPincode", val);

        if (val.length === 6) {
            setPincodeLoading(true);
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
                const data = await res.json();
                if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice?.length > 0) {
                    const po = data[0].PostOffice[0];
                    const detectedCity = po.Block || po.District || po.Name || "";
                    const detectedDistrict = po.District || "";
                    const detectedState = po.State || "";
                    setUserCity(detectedCity);
                    setUserDistrict(detectedDistrict);
                    setUserState(detectedState);
                    localStorage.setItem("userCity", detectedCity);
                    localStorage.setItem("userDistrict", detectedDistrict);
                    localStorage.setItem("userState", detectedState);
                }
            } catch (err) {
                // Ignore network error
            } finally {
                setPincodeLoading(false);
            }
        }
    };

    const clearLocation = () => {
        setUserPincode("");
        setUserCity("");
        setUserDistrict("");
        setUserState("");
        setDebouncedPincode("");
        setDebouncedCity("");
        setDebouncedDistrict("");
        setDebouncedState("");
        localStorage.removeItem("userPincode");
        localStorage.removeItem("userCity");
        localStorage.removeItem("userDistrict");
        localStorage.removeItem("userState");
    };

    // 1. Fetch Service Details (Runs only on route params change)
    useEffect(() => {
        let isMounted = true;
        const fetchServicesData = async () => {
            try {
                setLoading(true);
                const data = await getServiceDetails(serviceName);
                if (!isMounted) return;

                let servicesList = [];
                let categoriesList = [];

                if (data.subcategories && data.subcategories[subcategory]) {
                    const subcategoryData = data.subcategories[subcategory];

                    if (serviceType && subcategoryData.serviceTypes) {
                        const serviceTypeData = subcategoryData.serviceTypes[serviceType];
                        if (serviceTypeData && serviceTypeData.categories) {
                            categoriesList = serviceTypeData.categories;
                            servicesList = serviceTypeData.categories.flatMap(
                                (cat) =>
                                    (cat.services || []).map((service) => ({
                                        ...service,
                                        category: cat.name,
                                    }))
                            );
                        }
                    } else if (subcategoryData.categories) {
                        categoriesList = subcategoryData.categories;
                        servicesList = subcategoryData.categories.flatMap(
                            (cat) =>
                                (cat.services || []).map((service) => ({
                                    ...service,
                                    category: cat.name,
                                }))
                        );
                    } else if (subcategoryData.services) {
                        servicesList = subcategoryData.services;
                        categoriesList = [
                            ...new Set(
                                servicesList.map((service) => service.category)
                            ),
                        ].map((catName) => ({
                            name: catName,
                            categoryImage: subcategoryData.categoryImage || "",
                        }));
                    }
                }

                setServices(servicesList);
                setCategories(
                    categoriesList.sort((a, b) => a.name.localeCompare(b.name))
                );
            } catch (err) {
                console.error("Error fetching services data:", err);
                if (isMounted) setError("Failed to load services");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchServicesData();
        return () => { isMounted = false; };
    }, [serviceName, subcategory, serviceType]);

    // 2. Fetch Providers based on debounced location filters (Flicker-free, never unmounts page)
    useEffect(() => {
        let isMounted = true;
        const fetchProvidersList = async () => {
            try {
                setProvidersLoading(true);
                const queryTerm = serviceName || subcategory;
                const provData = await getProviders({
                    category: queryTerm,
                    pincode: debouncedPincode,
                    city: debouncedCity,
                    district: debouncedDistrict,
                    state: debouncedState,
                });
                if (isMounted) {
                    setProviders(provData || []);
                }
            } catch (err) {
                console.error("Error fetching providers:", err);
                if (isMounted) setProviders([]);
            } finally {
                if (isMounted) setProvidersLoading(false);
            }
        };

        fetchProvidersList();
        return () => { isMounted = false; };
    }, [serviceName, subcategory, debouncedPincode, debouncedCity, debouncedDistrict, debouncedState]);

    const scrollToCategory = (category) => {
        categoryRefs.current[category]?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSelectProvider = (provider) => {
        if (selectedProviderId === provider._id) {
            // Deselect
            setSelectedProviderId("");
            localStorage.removeItem("selectedProvider");
        } else {
            // Select provider
            setSelectedProviderId(provider._id);
            localStorage.setItem(
                "selectedProvider",
                JSON.stringify({
                    _id: provider._id,
                    name: provider.name,
                    category: provider.category,
                    isVerified: provider.isVerified,
                    averageRating: provider.averageRating,
                    hourlyRate: provider.hourlyRate,
                    bio: provider.bio,
                    location: provider.location,
                })
            );
        }
    };

    // Filter + Sort providers
    const filteredProviders = (() => {
        let list = [...providers];
        if (minRating > 0) list = list.filter((p) => (p.averageRating || 0) >= minRating);
        if (maxWage !== "") list = list.filter((p) => (p.hourlyRate || 0) <= Number(maxWage));

        if (sortBy === "nearest" || !sortBy) {
            list.sort((a, b) => {
                if (a.matchScore !== undefined && b.matchScore !== undefined && a.matchScore !== b.matchScore) {
                    return b.matchScore - a.matchScore;
                }
                if (a.isExactPincodeMatch && !b.isExactPincodeMatch) return -1;
                if (!a.isExactPincodeMatch && b.isExactPincodeMatch) return 1;
                const distA = a.distanceKm !== undefined ? a.distanceKm : 999999;
                const distB = b.distanceKm !== undefined ? b.distanceKm : 999999;
                return distA - distB;
            });
        } else if (sortBy === "rating_desc") {
            list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        } else if (sortBy === "wage_asc") {
            list.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
        } else if (sortBy === "wage_desc") {
            list.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
        } else if (sortBy === "experience_desc") {
            list.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
        }
        return list;
    })();

    if (loading)
        return (
            <div className="w-full h-[76vh] flex justify-center items-center">
                <ClipLoader color="#2563EB" />
            </div>
        );
    if (error) return <div className="text-red-500">{error}</div>;

    const hasLocation = Boolean(userPincode || userCity || userDistrict || userState);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 relative grid grid-cols-1 lg:grid-cols-5 gap-6 pb-6">
            {/* Sidebar Component */}
            <div className="lg:sticky lg:top-24 self-start max-lg:static max-lg:w-full">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white pb-1">
                    {t(lang, serviceName)}
                </h2>
                <h3 className="text-3xl font-[NeuwMachinaBold] text-gradient pb-6">
                    {t(lang, serviceType || subcategory)}
                </h3>
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h1 className="font-bold text-slate-900 dark:text-white text-nowrap mb-4 tracking-wide">
                        {t(lang, "Select a service")}
                    </h1>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {categories.map((category) => (
                            <button
                                key={category.name}
                                onClick={() => scrollToCategory(category.name)}
                                className="group card-hover rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-slate-800 text-center shadow-xs hover:shadow-md transition-all flex flex-col cursor-pointer"
                            >
                                <CategoryTileImage
                                    src={category.categoryImage}
                                    name={category.name}
                                />
                                <h1 className="h-10 py-1 text-xs font-semibold leading-4 px-1.5 flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {t(lang, category.name)}
                                </h1>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Area: Providers Details FIRST, then Services */}
            <div className="lg:col-span-3 flex flex-col gap-6 mt-4">

                {/* 1. PROVIDERS SECTION (LISTED FIRST) */}
                <div className="rounded-2xl p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {t(lang, "Available Service Providers")}
                                </h2>
                                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
                                    {filteredProviders.length}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {t(lang, "Select your preferred expert for")} {t(lang, subcategory || serviceName)}
                            </p>
                        </div>

                        {/* Filter & Sort Controls */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setShowLocationForm((v) => !v)}
                                className={`flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 border transition-all cursor-pointer ${
                                    hasLocation
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-blue-500"
                                }`}
                            >
                                <MapPin size={13} className={hasLocation ? "text-blue-600 dark:text-blue-400" : "text-slate-400"} />
                                {hasLocation ? (
                                    <span>
                                        📍 {userPincode || userCity || userDistrict || "Location Active"}
                                    </span>
                                ) : (
                                    <span>Find Nearest</span>
                                )}
                            </button>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="text-xs rounded-full p-2 px-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                                <option value="nearest">🎯 Sort by Nearest</option>
                                <option value="rating_desc">⭐ Highest Rating</option>
                                <option value="wage_asc">₹ Wage: Low to High</option>
                                <option value="wage_desc">₹ Wage: High to Low</option>
                                <option value="experience_desc">🏅 Most Experienced</option>
                            </select>
                            <button
                                onClick={() => setShowProviderFilters((v) => !v)}
                                className={`p-2 rounded-full border text-xs transition-colors cursor-pointer ${showProviderFilters ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-500"}`}
                                title="Toggle Filters"
                            >
                                <SlidersHorizontal size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Nearest Provider Location Search Panel (PIN CODE, CITY, DISTRICT, STATE) */}
                    {(showLocationForm || hasLocation) && (
                        <div className="mt-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-900/60 border border-blue-200/80 dark:border-slate-700/80 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                                    <Locate size={14} className="text-blue-600 dark:text-blue-400" />
                                    Find Nearest Providers By Location
                                </span>
                                {hasLocation && (
                                    <button
                                        onClick={clearLocation}
                                        className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                        <X size={13} /> Clear Location
                                    </button>
                                )}
                            </div>

                            {/* PIN CODE Search Input */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    PIN CODE *
                                </label>
                                <div className="relative flex items-center">
                                    <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="6-digit PIN code"
                                        maxLength="6"
                                        value={userPincode}
                                        onChange={handlePincodeChange}
                                        className="w-full text-xs rounded-xl pl-10 pr-9 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                                    />
                                    {pincodeLoading && (
                                        <div className="absolute right-3">
                                            <Loader2 size={14} className="animate-spin text-blue-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3-Column: CITY, DISTRICT, STATE */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        CITY
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={userCity}
                                        onChange={(e) => {
                                            setUserCity(e.target.value);
                                            localStorage.setItem("userCity", e.target.value);
                                        }}
                                        className="text-xs rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        DISTRICT
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="District"
                                        value={userDistrict}
                                        onChange={(e) => {
                                            setUserDistrict(e.target.value);
                                            localStorage.setItem("userDistrict", e.target.value);
                                        }}
                                        className="text-xs rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        STATE
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="State"
                                        value={userState}
                                        onChange={(e) => {
                                            setUserState(e.target.value);
                                            localStorage.setItem("userState", e.target.value);
                                        }}
                                        className="text-xs rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Expandable filter bar */}
                    {showProviderFilters && (
                        <div className="py-3 px-4 my-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                                <span className="font-semibold text-slate-600 dark:text-slate-400">Min Rating:</span>
                                {[0, 3, 4, 4.5].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setMinRating(v)}
                                        className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer ${minRating === v ? "bg-orange-500 text-white border-orange-500" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"}`}
                                    >
                                        {v === 0 ? "Any" : `${v}★+`}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-semibold text-slate-600 dark:text-slate-400">Max Wage:</span>
                                <input
                                    type="number"
                                    placeholder="₹/hr"
                                    value={maxWage}
                                    onChange={(e) => setMaxWage(e.target.value)}
                                    className="w-20 p-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                                />
                            </div>
                            {(minRating > 0 || maxWage !== "" || sortBy !== "nearest") && (
                                <button
                                    onClick={() => { setMinRating(0); setMaxWage(""); setSortBy("nearest"); }}
                                    className="text-red-500 hover:underline font-semibold ml-auto cursor-pointer"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    )}

                    {/* Providers Grid */}
                    {providersLoading ? (
                        <div className="py-10 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                            <Loader2 size={20} className="animate-spin text-blue-600" />
                            <span>Finding nearest providers...</span>
                        </div>
                    ) : filteredProviders.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-sm">
                            No providers matching criteria in your area.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            {filteredProviders.map((provider) => {
                                const isSelected = selectedProviderId === provider._id;
                                const providerPincode = provider.pincode || provider.location?.pincode;
                                return (
                                    <div
                                        key={provider._id}
                                        className={`relative rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                                            isSelected
                                                ? "border-blue-500 bg-blue-50/70 dark:bg-blue-900/30 ring-2 ring-blue-500/50 shadow-md"
                                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600"
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                                                        {provider.name?.charAt(0) || "P"}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-base leading-snug text-slate-900 dark:text-white">
                                                            {t(lang, provider.name)}
                                                        </h3>
                                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                            {t(lang, provider.category)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    {provider.isVerified && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5 font-semibold">
                                                            <BadgeCheck size={12} /> {t(lang, "Verified")}
                                                        </span>
                                                    )}
                                                    {(provider.isExactPincodeMatch || (provider.distanceKm !== undefined && provider.distanceKm <= 50) || provider.isCityMatch || provider.isDistrictMatch) && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5">
                                                            🎯 {provider.isExactPincodeMatch ? "Nearest Match" : provider.distanceKm ? `${provider.distanceKm} km` : "Local Match"}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                                                <StarRating rating={provider.averageRating} />
                                                {provider.hourlyRate > 0 && (
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                                                        <IndianRupee size={12} />
                                                        {provider.hourlyRate}
                                                        <span className="font-normal text-slate-400 text-[11px]">/hr</span>
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} /> {provider.experienceYears} {t(lang, "providers_yrs_exp") || "yrs exp"}
                                                </span>
                                                {provider.location?.address && (
                                                    <span className="flex items-center gap-1 truncate max-w-[160px]" title={`${provider.location.address} ${providerPincode ? `(${providerPincode})` : ""}`}>
                                                        <MapPin size={12} className="text-red-500 shrink-0" /> {provider.location.address} {providerPincode ? `· ${providerPincode}` : ""}
                                                    </span>
                                                )}
                                            </div>

                                            {provider.skills?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {provider.skills.slice(0, 3).map((s) => (
                                                        <span key={s} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5">
                                                            {t(lang, s)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-1">
                                            <button
                                                onClick={() => handleSelectProvider(provider)}
                                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "bg-emerald-600 text-white shadow-sm"
                                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-glow-blue"
                                                }`}
                                            >
                                                {isSelected ? (
                                                    <>
                                                        <Check size={14} /> Selected for Booking
                                                    </>
                                                ) : (
                                                    <>Book with {provider.name.split(" ")[0]}</>
                                                )}
                                            </button>
                                            <Link
                                                to={`/providers/${provider._id}`}
                                                target="_blank"
                                                className="text-[11px] text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 underline shrink-0 px-1"
                                            >
                                                Profile
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 2. SERVICES SECTION (LISTED AFTER PROVIDERS) */}
                <div className="flex flex-col rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white pb-4 border-b border-slate-100 dark:border-slate-700 mb-6">
                        Available Services
                    </h2>

                    {categories.map((category, index) => (
                        <div
                            key={category.name}
                            ref={(el) => (categoryRefs.current[category.name] = el)}
                            className={
                                index !== 0
                                    ? "scroll-mt-28 pt-8 border-t border-slate-200 dark:border-slate-700"
                                    : "scroll-mt-40"
                            }
                        >
                            <div className="flex items-center pb-4 gap-2">
                                <PackageOpen size={17} color="#10B981" />
                                <h1 className="text-emerald-600 dark:text-emerald-400 text-sm font-extrabold uppercase tracking-wide">
                                    {category.name}
                                </h1>
                            </div>

                            <div className="flex flex-col gap-6 mb-8">
                                {services
                                    .filter(
                                        (service) =>
                                            service.category === category.name
                                    )
                                    .map(
                                        (
                                            service,
                                            serviceIndex,
                                            filteredServices
                                        ) => (
                                            <div key={serviceIndex}>
                                                <div className="flex justify-between gap-4">
                                                    <div className="w-8/12">
                                                        <h4 className="font-semibold tracking-wide text-slate-900 dark:text-white">
                                                            {service.title}
                                                        </h4>

                                                        <div className="flex items-center gap-4 mt-1">
                                                            {service.MRP ===
                                                            service.OurPrice ? (
                                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                                    ₹
                                                                    {
                                                                        service.OurPrice
                                                                    }
                                                                </p>
                                                            ) : (
                                                                <p className="flex items-center gap-3 font-semibold text-slate-900 dark:text-white">
                                                                    ₹
                                                                    {
                                                                        service.OurPrice
                                                                    }
                                                                    <strike className="text-sm text-slate-400 font-normal">
                                                                        ₹
                                                                        {
                                                                            service.MRP
                                                                        }
                                                                    </strike>
                                                                </p>
                                                            )}
                                                        </div>
                                                        {service.time && (
                                                            <p className="text-sm text-slate-400 dark:text-slate-500 pt-1">
                                                                {service.time}
                                                            </p>
                                                        )}
                                                        <div className="text-sm py-2 text-slate-500 dark:text-slate-400">
                                                            {service.description
                                                                ?.length > 1 ? (
                                                                <ul className="list-disc pl-5">
                                                                    {service.description.map(
                                                                        (
                                                                            point,
                                                                            idx
                                                                        ) => (
                                                                            <li
                                                                                key={
                                                                                    idx
                                                                                }
                                                                            >
                                                                                {
                                                                                    point
                                                                                }
                                                                            </li>
                                                                        )
                                                                    )}
                                                                </ul>
                                                            ) : (
                                                                <p>
                                                                    {
                                                                        service
                                                                            ?.description?.[0]
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="w-36 flex flex-col items-center justify-end">
                                                        <ServiceImage
                                                            src={service.image}
                                                            title={service.title}
                                                            className="w-36 h-24"
                                                        />
                                                        {!cartServices.find(
                                                            (cartService) =>
                                                                cartService._id ===
                                                                service._id
                                                        ) ? (
                                                            <button
                                                                onClick={() =>
                                                                    addToCart(
                                                                        service
                                                                    )
                                                                }
                                                                className="w-20 h-8 text-sm bg-brand-gradient text-white leading-[1] rounded-full -translate-y-4 hover:opacity-90 transition-all shadow-glow-blue"
                                                            >
                                                                Add
                                                            </button>
                                                        ) : (
                                                            <div className="w-24 h-8 flex items-center justify-center text-sm border border-slate-300 dark:border-slate-600 rounded-full -translate-y-4 overflow-hidden bg-white dark:bg-slate-800">
                                                                <button
                                                                    onClick={() =>
                                                                        removeFromCart(
                                                                            service
                                                                        )
                                                                    }
                                                                    className="w-full h-full text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="w-full h-full leading-[2rem] text-center text-slate-900 dark:text-white">
                                                                    {
                                                                        cartServices.find(
                                                                            (
                                                                                cartService
                                                                            ) =>
                                                                                cartService._id ===
                                                                                service._id
                                                                        ).quantity
                                                                    }
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        addToCart(
                                                                            service
                                                                        )
                                                                    }
                                                                    className="w-full h-full text-slate-900 dark:text-white border-l border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {serviceIndex <
                                                    filteredServices.length - 1 && (
                                                    <hr className="border-t border-dashed border-slate-300 dark:border-slate-600 mt-6" />
                                                )}
                                            </div>
                                        )
                                    )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Component */}
            <div className="lg:sticky lg:top-24 self-start overflow-hidden flex flex-col gap-5 max-lg:hidden">
                <div className="h-96 flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
                    {cartServices.length === 0 ? (
                        <>
                            <div className="h-full w-full flex flex-col gap-4 justify-center items-center text-slate-500 dark:text-slate-400">
                                <img src={cart2} alt="" className="opacity-80" />
                                <p>No items in your cart.</p>
                            </div>
                        </>
                    ) : (
                        <ServiceCart />
                    )}
                </div>
                <div className="relative p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck size={20} className="text-orange-500" />
                        <h1 className="text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wide font-[NeuwMachinaBold]">
                            Quality Assured
                        </h1>
                    </div>
                    <img
                        src={quality}
                        alt=""
                        className="absolute top-4 right-4 w-8 opacity-90"
                    />
                    <ul className="pl-1 pt-2 pb-0 flex flex-col gap-2 text-slate-700 dark:text-slate-300">
                        <li className="flex gap-3 items-center text-sm">
                            <img src={tick} alt="" className="w-5 h-auto" />
                            4.5+ Rated Services
                        </li>
                        <li className="flex gap-3 items-center text-sm">
                            <img src={tick} alt="" className="w-5 h-auto" />
                            Luxury Experience Guaranteed
                        </li>
                        <li className="flex gap-3 items-center text-sm">
                            <img src={tick} alt="" className="w-5 h-auto" />
                            Premium Branded Products
                        </li>
                        <li className="flex gap-3 items-center text-sm">
                            <img src={tick} alt="" className="w-5 h-auto" />
                            Expert Professionals
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ServiceList;
