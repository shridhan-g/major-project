import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { getServices, getProviders, getNearbyProviders, getRecommendedProviders } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { BadgeCheck, Locate, Star, MapPin, SlidersHorizontal, IndianRupee, X } from "lucide-react";

const MAPS_API_KEY = import.meta.env.VITE_PLACES_NEW_API_KEY;

const mapContainerStyle = { width: "100%", height: "100%" };

const StarRating = ({ rating }) => {
    const value = rating || 0;
    return (
        <span className="flex items-center gap-0.5 text-orange-500">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={14} fill={i <= Math.round(value) ? "currentColor" : "none"} />
            ))}
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                {value > 0 ? value.toFixed(1) : "No ratings"}
            </span>
        </span>
    );
};

const ProviderCard = ({ provider }) => (
    <Link
        to={`/providers/${provider._id}`}
        className="card-hover bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-premium p-4 flex flex-col gap-2 transition-all"
    >
        <div className="flex items-start justify-between gap-2">
            <h2 className="font-semibold text-lg leading-tight text-slate-900 dark:text-white">
                {provider.name}
            </h2>
            {provider.isVerified && (
                <span className="badge-verified shrink-0">
                    <BadgeCheck size={13} /> Verified
                </span>
            )}
        </div>
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{provider.category}</p>
        <StarRating rating={provider.averageRating} />
        {provider.hourlyRate > 0 && (
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <IndianRupee size={13} />
                {provider.hourlyRate}
                <span className="font-normal text-slate-400 text-xs">/hr</span>
            </p>
        )}
        <div className="flex flex-wrap gap-1.5">
            {(provider.skills || []).slice(0, 4).map((skill) => (
                <span
                    key={skill}
                    className="text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full px-2 py-0.5 text-slate-600 dark:text-slate-300"
                >
                    {skill}
                </span>
            ))}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1 mt-auto pt-2">
            <span>{provider.experienceYears} yrs experience</span>
            {provider.location?.address && (
                <span className="flex items-center gap-1 truncate">
                    <MapPin size={12} /> {provider.location.address}
                </span>
            )}
        </div>
    </Link>
);

export default function Providers() {
    const { isAuthenticated } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [services, setServices] = useState([]);
    const [providers, setProviders] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [category, setCategory] = useState(searchParams.get("category") || "");
    const [loading, setLoading] = useState(true);
    const [locating, setLocating] = useState(false);
    const [nearError, setNearError] = useState("");
    const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.209 });
    const [currentCoords, setCurrentCoords] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filter/Sort state
    const [minRating, setMinRating] = useState(0);
    const [maxWage, setMaxWage] = useState("");
    const [minWage, setMinWage] = useState("");
    const [sortBy, setSortBy] = useState(""); // "" | "rating_desc" | "wage_asc" | "wage_desc" | "experience_desc"

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
        getProviders({ category, search })
            .then((data) => { if (!cancelled) setProviders(data || []); })
            .catch(() => { if (!cancelled) setProviders([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [category, search]);

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

    // Apply client-side filters + sort on top of API results
    const filteredProviders = useMemo(() => {
        let result = [...providers];
        if (minRating > 0) result = result.filter((p) => (p.averageRating || 0) >= minRating);
        if (minWage !== "") result = result.filter((p) => (p.hourlyRate || 0) >= Number(minWage));
        if (maxWage !== "") result = result.filter((p) => (p.hourlyRate || 0) <= Number(maxWage));
        if (sortBy === "rating_desc") result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        else if (sortBy === "wage_asc") result.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
        else if (sortBy === "wage_desc") result.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
        else if (sortBy === "experience_desc") result.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
        return result;
    }, [providers, minRating, minWage, maxWage, sortBy]);

    const mapProviders = filteredProviders.filter(
        (p) => p.location?.coordinates && (p.location.coordinates[0] !== 0 || p.location.coordinates[1] !== 0)
    );

    return (
        <div className="max-w-7xl mx-auto pb-10">
            <h1 className="text-3xl sm:text-4xl font-[NeuwMachinaBold] text-slate-900 dark:text-white pb-2">
                Service <span className="text-gradient">Providers</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 pb-6">
                Find verified professionals near you.{" "}
                <Link to="/provider/register" className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2">
                    Are you a provider? Join us
                </Link>
            </p>

            {isAuthenticated && recommended.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-900 dark:text-white pb-3">
                        Recommended for you
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recommended.map((provider) => (
                            <ProviderCard key={provider._id} provider={provider} />
                        ))}
                    </div>
                </div>
            )}

            {/* Search + Filter bar */}
            <div className="flex flex-wrap items-center gap-3 pb-4">
                <input
                    type="text"
                    placeholder="Search by name, category or skill..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="text-sm rounded-full p-2.5 px-4 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="text-sm rounded-full p-2.5 px-4 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Categories</option>
                    {services.map((service) => (
                        <option key={service._id} value={service.serviceName}>{service.serviceName}</option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm rounded-full p-2.5 px-4 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Sort By</option>
                    <option value="rating_desc">⭐ Highest Rating</option>
                    <option value="wage_asc">₹ Lowest Wage</option>
                    <option value="wage_desc">₹ Highest Wage</option>
                    <option value="experience_desc">🏅 Most Experienced</option>
                </select>
                <button
                    onClick={() => setShowFilters((v) => !v)}
                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full border transition-all ${showFilters ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-500"}`}
                >
                    <SlidersHorizontal size={15} />
                    Filters {hasActiveFilters && <span className="bg-white text-blue-600 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">!</span>}
                </button>
                <button
                    onClick={findNearby}
                    disabled={locating}
                    className="flex items-center gap-2 text-sm font-semibold bg-brand-gradient text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-all shadow-glow-blue disabled:opacity-50"
                >
                    <Locate size={16} />
                    {locating ? "Finding..." : "Find Near Me"}
                </button>
            </div>

            {/* Expanded filter panel */}
            {showFilters && (
                <div className="mb-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-wrap gap-6 items-end">
                    {/* Min Rating */}
                    <div className="flex flex-col gap-2 min-w-[180px]">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Minimum Rating
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
                                    {v === 0 ? "Any" : `${v}★`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Wage range */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Hourly Rate (₹/hr)
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
                            <X size={14} /> Clear all filters
                        </button>
                    )}
                </div>
            )}

            {nearError && <p className="text-red-500 text-sm pb-4">{nearError}</p>}

            {/* Results count */}
            {!loading && (
                <p className="text-xs text-slate-400 pb-3">
                    Showing {filteredProviders.length} provider{filteredProviders.length !== 1 ? "s" : ""}
                    {hasActiveFilters && " (filtered)"}
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
                            <p>No providers match your filters.</p>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="text-blue-600 text-sm font-semibold underline">
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredProviders.map((provider) => (
                                <ProviderCard key={provider._id} provider={provider} />
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
                            No providers with location data to show on the map.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
