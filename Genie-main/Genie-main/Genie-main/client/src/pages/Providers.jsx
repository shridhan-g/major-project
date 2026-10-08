import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { getServices, getProviders, getNearbyProviders, getRecommendedProviders } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { BadgeCheck, Locate, Star, MapPin, SlidersHorizontal, IndianRupee, X } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { t } from "../utils/translations";

const MAPS_API_KEY = import.meta.env.VITE_PLACES_NEW_API_KEY;
const mapContainerStyle = { width: "100%", height: "100%" };

const StarRating = ({ rating, noRatingsLabel }) => {
    const value = rating || 0;
    return (
        <span className="flex items-center gap-0.5 text-orange-500">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={14} fill={i <= Math.round(value) ? "currentColor" : "none"} />
            ))}
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                {value > 0 ? value.toFixed(1) : noRatingsLabel}
            </span>
        </span>
    );
};

const ProviderCard = ({ provider, verifiedLabel, noRatingsLabel, yrsExpLabel, lang }) => {
    const pPin = provider.pincode || provider.location?.pincode;
    return (
        <Link
            to={`/providers/${provider._id}`}
            className="card-hover bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-premium p-4 flex flex-col gap-2 transition-all"
        >
            <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-lg leading-tight text-slate-900 dark:text-white">{provider.name}</h2>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    {provider.isVerified && (
                        <span className="badge-verified shrink-0">
                            <BadgeCheck size={13} /> {verifiedLabel}
                        </span>
                    )}
                    {(provider.isExactPincodeMatch || (provider.distanceKm !== undefined && provider.distanceKm <= 50)) && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded-full">
                            🎯 {provider.isExactPincodeMatch ? t(lang, "Nearest Match") : `${provider.distanceKm} km`}
                        </span>
                    )}
                </div>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{t(lang, provider.category)}</p>
            <StarRating rating={provider.averageRating} noRatingsLabel={noRatingsLabel} />
            {provider.hourlyRate > 0 && (
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <IndianRupee size={13} />
                    {provider.hourlyRate}
                    <span className="font-normal text-slate-400 text-xs">/hr</span>
                </p>
            )}
            <div className="flex flex-wrap gap-1.5">
                {(provider.skills || []).slice(0, 4).map((skill) => (
                    <span key={skill} className="text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full px-2 py-0.5 text-slate-600 dark:text-slate-300">
                        {t(lang, skill)}
                    </span>
                ))}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1 mt-auto pt-2">
                <span>{provider.experienceYears} {yrsExpLabel}</span>
                {provider.location?.address && (
                    <span className="flex items-center gap-1 truncate" title={`${provider.location.address} ${pPin ? `(${pPin})` : ''}`}>
                        <MapPin size={12} className="text-red-500 shrink-0" /> {provider.location.address} {pPin ? `· ${pPin}` : ""}
                    </span>
                )}
            </div>
        </Link>
    );
};

export default function Providers() {
    const { isAuthenticated } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const { lang } = useLang();

    const [services, setServices] = useState([]);
    const [providers, setProviders] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [category, setCategory] = useState(searchParams.get("category") || "");
    const [pincode, setPincode] = useState(() => localStorage.getItem("userPincode") || "");
    const [city, setCity] = useState(() => localStorage.getItem("userCity") || "");
    const [district, setDistrict] = useState(() => localStorage.getItem("userDistrict") || "");
    const [state, setState] = useState(() => localStorage.getItem("userState") || "");
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [showLocationForm, setShowLocationForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [locating, setLocating] = useState(false);
    const [nearError, setNearError] = useState("");
    const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.209 });
    const [currentCoords, setCurrentCoords] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const [minRating, setMinRating] = useState(0);
    const [maxWage, setMaxWage] = useState("");
    const [minWage, setMinWage] = useState("");
    const [sortBy, setSortBy] = useState("nearest");

    // Auto-fetch City, District, State when 6-digit PIN code is typed
    const handlePincodeChange = async (e) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
        setPincode(val);
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
                    setCity(detectedCity);
                    setDistrict(detectedDistrict);
                    setState(detectedState);
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

    // Debounce search and location inputs for smooth, flicker-free updates
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [debouncedPincode, setDebouncedPincode] = useState(pincode);
    const [debouncedCity, setDebouncedCity] = useState(city);
    const [debouncedDistrict, setDebouncedDistrict] = useState(district);
    const [debouncedState, setDebouncedState] = useState(state);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setDebouncedPincode(pincode);
            setDebouncedCity(city);
            setDebouncedDistrict(district);
            setDebouncedState(state);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, pincode, city, district, state]);

    const clearLocation = () => {
        setPincode("");
        setCity("");
        setDistrict("");
        setState("");
        setDebouncedPincode("");
        setDebouncedCity("");
        setDebouncedDistrict("");
        setDebouncedState("");
        localStorage.removeItem("userPincode");
        localStorage.removeItem("userCity");
        localStorage.removeItem("userDistrict");
        localStorage.removeItem("userState");
    };

    useEffect(() => {
        const params = {};
        if (search) params.search = search;
        if (category) params.category = category;
        setSearchParams(params, { replace: true });
    }, [search, category, setSearchParams]);

    useEffect(() => {
        getServices().then((data) => setServices(data)).catch(() => {});
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getProviders({ category, search: debouncedSearch, pincode: debouncedPincode, city: debouncedCity, district: debouncedDistrict, state: debouncedState })
            .then((data) => { if (!cancelled) setProviders(data || []); })
            .catch(() => { if (!cancelled) setProviders([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [category, debouncedSearch, debouncedPincode, debouncedCity, debouncedDistrict, debouncedState]);


    useEffect(() => {
        if (isAuthenticated) {
            getRecommendedProviders().then((data) => setRecommended(data || [])).catch(() => {});
        }
    }, [isAuthenticated]);

    const findNearby = () => {
        setLocating(true);
        setNearError("");
        if (!("geolocation" in navigator)) {
            setNearError("Geolocation is not supported by this browser.");
            setLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentCoords({ lat: latitude, lng: longitude });
                setMapCenter({ lat: latitude, lng: longitude });
                try {
                    const data = await getNearbyProviders({ lat: latitude, lng: longitude, radius: 20000, category });
                    setProviders(data || []);
                } catch (err) {
                    setNearError(err.message || "Failed to find nearby providers");
                } finally {
                    setLocating(false);
                }
            },
            () => {
                setNearError("Location access denied. Unable to search nearby.");
                setLocating(false);
            }
        );
    };

    const clearFilters = () => {
        setMinRating(0);
        setMinWage("");
        setMaxWage("");
        setSortBy("");
    };

    const hasActiveFilters = minRating > 0 || minWage !== "" || maxWage !== "" || sortBy !== "";

    const filteredProviders = useMemo(() => {
        let result = [...providers];
        if (minRating > 0) result = result.filter((p) => (p.averageRating || 0) >= minRating);
        if (minWage !== "") result = result.filter((p) => (p.hourlyRate || 0) >= Number(minWage));
        if (maxWage !== "") result = result.filter((p) => (p.hourlyRate || 0) <= Number(maxWage));

        if (sortBy === "nearest") {
            result.sort((a, b) => {
                if (a.isExactPincodeMatch && !b.isExactPincodeMatch) return -1;
                if (!a.isExactPincodeMatch && b.isExactPincodeMatch) return 1;
                const distA = a.distanceKm !== undefined ? a.distanceKm : 999999;
                const distB = b.distanceKm !== undefined ? b.distanceKm : 999999;
                return distA - distB;
            });
        } else if (sortBy === "rating_desc") {
            result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        } else if (sortBy === "wage_asc") {
            result.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
        } else if (sortBy === "wage_desc") {
            result.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
        } else if (sortBy === "experience_desc") {
            result.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
        }
        return result;
    }, [providers, minRating, minWage, maxWage, sortBy]);


    const mapProviders = filteredProviders.filter(
        (p) => p.location?.coordinates && (p.location.coordinates[0] !== 0 || p.location.coordinates[1] !== 0)
    );

    const verifiedLabel = t(lang, "providers_verified");
    const noRatingsLabel = t(lang, "providers_no_ratings");
    const yrsExpLabel = t(lang, "providers_yrs_exp");
    const providerCount = filteredProviders.length;
    const providerWord = providerCount === 1 ? t(lang, "providers_provider") : t(lang, "providers_providers");

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 pt-8">
            <h1 className="text-3xl sm:text-4xl font-[NeuwMachinaBold] text-slate-900 dark:text-white pb-2">
                {t(lang, "providers_heading")} <span className="text-gradient">{t(lang, "providers_heading_2")}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 pb-6">
                {t(lang, "providers_subtitle")}{" "}
                <Link to="/provider/register" className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2">
                    {t(lang, "providers_join")}
                </Link>
            </p>

            {isAuthenticated && recommended.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-900 dark:text-white pb-3">
                        {t(lang, "providers_recommended")}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recommended.map((provider) => (
                            <ProviderCard
                                key={provider._id}
                                provider={provider}
                                lang={lang}
                                verifiedLabel={verifiedLabel}
                                noRatingsLabel={noRatingsLabel}
                                yrsExpLabel={yrsExpLabel}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Search + Filter bar */}
            <div className="flex flex-wrap items-center gap-3 pb-4">
                <input
                    type="text"
                    placeholder={t(lang, "providers_search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="text-sm rounded-full p-2.5 px-4 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 w-52"
                />

                {/* Location Button */}
                <button
                    onClick={() => setShowLocationForm((v) => !v)}
                    className={`flex items-center gap-1.5 text-sm font-semibold rounded-full px-4 py-2.5 border transition-all cursor-pointer ${
                        pincode || city || district || state
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-blue-500"
                    }`}
                >
                    <MapPin size={14} className={pincode || city || district ? "text-blue-600 dark:text-blue-400" : "text-slate-400"} />
                    {pincode || city || district ? (
                        <span>📍 {pincode || city || district}</span>
                    ) : (
                        <span>{t(lang, "Find Nearest")}</span>
                    )}
                </button>

                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="text-sm rounded-full p-2.5 px-4 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">{t(lang, "providers_all_categories")}</option>
                    {services.map((service) => (
                        <option key={service._id} value={service.serviceName}>{t(lang, service.serviceName)}</option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm rounded-full p-2.5 px-4 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="nearest">{t(lang, "Sort by Nearest")}</option>
                    <option value="rating_desc">{t(lang, "providers_sort_rating")}</option>
                    <option value="wage_asc">{t(lang, "providers_sort_wage_low")}</option>
                    <option value="wage_desc">{t(lang, "providers_sort_wage_high")}</option>
                    <option value="experience_desc">{t(lang, "providers_sort_exp")}</option>
                </select>

                <button
                    onClick={() => setShowFilters((v) => !v)}
                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full border transition-all cursor-pointer ${showFilters ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-500"}`}
                >
                    <SlidersHorizontal size={15} />
                    {t(lang, "providers_filters")} {hasActiveFilters && <span className="bg-white text-blue-600 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">!</span>}
                </button>
                <button
                    onClick={findNearby}
                    disabled={locating}
                    className="flex items-center gap-2 text-sm font-semibold bg-brand-gradient text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-all shadow-glow-blue disabled:opacity-50 cursor-pointer"
                >
                    <Locate size={16} />
                    {locating ? t(lang, "providers_finding") : t(lang, "providers_find_near")}
                </button>
            </div>

            {/* Nearest Provider Location Panel (PIN CODE, CITY, DISTRICT, STATE) */}
            {(showLocationForm || pincode || city || district || state) && (
                <div className="mb-6 p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-900/60 border border-blue-200/80 dark:border-slate-700/80 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                            <Locate size={14} className="text-blue-600 dark:text-blue-400" />
                            Find Nearest Providers By Location
                        </span>
                        {(pincode || city || district || state) && (
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
                                value={pincode}
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
                                value={city}
                                onChange={(e) => {
                                    setCity(e.target.value);
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
                                value={district}
                                onChange={(e) => {
                                    setDistrict(e.target.value);
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
                                value={state}
                                onChange={(e) => {
                                    setState(e.target.value);
                                    localStorage.setItem("userState", e.target.value);
                                }}
                                className="text-xs rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Expanded filter panel */}
            {showFilters && (
                <div className="mb-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-wrap gap-6 items-end">
                    <div className="flex flex-col gap-2 min-w-[180px]">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            {t(lang, "providers_min_rating")}
                        </label>
                        <div className="flex items-center gap-1">
                            {[0, 1, 2, 3, 4, 5].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setMinRating(v)}
                                    className={`flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-semibold border transition-all ${
                                        minRating === v
                                            ? "bg-orange-500 text-white border-orange-500"
                                            : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-orange-400"
                                    }`}
                                >
                                    {v === 0 ? t(lang, "providers_any") : `${v}★`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            {t(lang, "providers_hourly_rate")}
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={minWage}
                                min={0}
                                onChange={(e) => setMinWage(e.target.value)}
                                className="w-24 text-sm rounded-lg p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-slate-400 text-sm">–</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxWage}
                                min={0}
                                onChange={(e) => setMaxWage(e.target.value)}
                                className="w-24 text-sm rounded-lg p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-semibold transition-colors pb-0.5"
                        >
                            <X size={14} /> {t(lang, "providers_clear_filters")}
                        </button>
                    )}
                </div>
            )}

            {nearError && <p className="text-red-500 text-sm pb-4">{nearError}</p>}

            {!loading && (
                <p className="text-xs text-slate-400 pb-3">
                    {t(lang, "providers_showing")} {providerCount} {providerWord}
                    {hasActiveFilters && ` ${t(lang, "providers_filtered")}`}
                </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Array(4).fill().map((_, i) => (
                                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-3">
                                    <div className="skeleton h-5 w-2/3 rounded-full" />
                                    <div className="skeleton h-4 w-1/2 rounded-full" />
                                    <div className="skeleton h-16 w-full rounded-xl" />
                                </div>
                            ))}
                        </div>
                    ) : filteredProviders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                            <Star size={40} className="opacity-30" />
                            <p>{t(lang, "providers_no_match")}</p>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="text-blue-600 text-sm font-semibold underline">
                                    {t(lang, "providers_clear")}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredProviders.map((p) => (
                                <ProviderCard
                                    key={p._id}
                                    provider={p}
                                    lang={lang}
                                    verifiedLabel={verifiedLabel}
                                    noRatingsLabel={noRatingsLabel}
                                    yrsExpLabel={yrsExpLabel}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-[28rem] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative">
                    {MAPS_API_KEY && MAPS_API_KEY !== "YOUR_GOOGLE_PLACES_API_KEY" && mapProviders.length > 0 ? (
                        <LoadScript googleMapsApiKey={MAPS_API_KEY}>
                            <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={11}>
                                {currentCoords && (
                                    <Marker
                                        position={currentCoords}
                                        icon={{ url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
                                        title="You are here"
                                    />
                                )}
                                {mapProviders.map((provider) => (
                                    <Marker
                                        key={provider._id}
                                        position={{ lat: provider.location.coordinates[1], lng: provider.location.coordinates[0] }}
                                        title={provider.name}
                                    />
                                ))}
                            </GoogleMap>
                        </LoadScript>
                    ) : mapProviders.length > 0 ? (
                        <iframe
                            title="Providers Map"
                            width="100%"
                            height="100%"
                            className="border-0 rounded-2xl"
                            loading="lazy"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${(mapCenter.lng || 77.209) - 0.1}%2C${(mapCenter.lat || 28.6139) - 0.1}%2C${(mapCenter.lng || 77.209) + 0.1}%2C${(mapCenter.lat || 28.6139) + 0.1}&layer=mapnik&marker=${mapCenter.lat || 28.6139}%2C${mapCenter.lng || 77.209}`}
                        ></iframe>
                    ) : (
                        <div className="h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm p-6 text-center">
                            {t(lang, "providers_no_map")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
