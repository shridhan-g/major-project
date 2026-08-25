import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getServiceDetails } from "../utils/api";
import ClipLoader from "react-spinners/ClipLoader";
import { ChevronRight } from "lucide-react";

const ServiceDetails = ({ serviceName }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [selectedServiceType, setSelectedServiceType] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const data = await getServiceDetails(serviceName);
                setDetails(data);
            } catch (err) {
                setError("Failed to load service details");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [serviceName]);

    useEffect(() => {
        if (
            selectedSubcategory &&
            !details?.subcategories[selectedSubcategory]?.serviceTypes
        ) {
            navigate(`/services/${serviceName}/${selectedSubcategory}`);
        }
    }, [selectedSubcategory, details, navigate, serviceName]);

    if (loading)
        return (
            <div className="w-[22rem] sm:w-[40rem] h-64 flex justify-center items-center">
                <ClipLoader color="#2563EB" />
            </div>
        );
    if (error)
        return (
            <div className="w-[22rem] sm:w-[40rem] h-64 flex justify-center items-center text-red-500">
                {error}
            </div>
        );
    if (!details)
        return (
            <div className="w-[22rem] sm:w-[40rem] h-64 flex justify-center items-center text-slate-500">
                No details available
            </div>
        );

    const handleSubcategorySelect = (subcategory) => {
        setSelectedSubcategory(subcategory);
        setSelectedServiceType(null);
    };

    const handleServiceTypeSelect = (serviceType) => {
        setSelectedServiceType(serviceType);
        navigate(
            `/services/${serviceName}/${selectedSubcategory}/${serviceType}`
        );
    };

    return (
        <div className="px-6 sm:px-10 pb-8">
            <div className="flex items-center gap-2 pb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {serviceName}
                </h2>
                {selectedSubcategory && (
                    <>
                        <ChevronRight size={18} className="text-slate-400" />
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {selectedSubcategory}
                        </span>
                    </>
                )}
            </div>

            {!selectedSubcategory ? (
                <div>
                    <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {Object.keys(details.subcategories || {}).map(
                            (subcategory, index) => (
                                <button
                                    key={subcategory}
                                    onClick={() =>
                                        handleSubcategorySelect(subcategory)
                                    }
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    className="card-hover animate-fade-in-up group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-premium overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <div className="h-32 flex items-center justify-center p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700 overflow-hidden">
                                        <img
                                            src={`${
                                                import.meta.env.VITE_BACKEND_URL
                                            }/${
                                                details.subcategories[
                                                    subcategory
                                                ].image
                                            }`}
                                            alt={subcategory}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                const lower = subcategory.toLowerCase();
                                                if (lower.includes("electric")) e.target.src = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80";
                                                else if (lower.includes("plumb")) e.target.src = "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80";
                                                else if (lower.includes("carpent")) e.target.src = "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop&q=80";
                                                else if (lower.includes("clean") || lower.includes("pest")) e.target.src = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80";
                                                else if (lower.includes("salon") || lower.includes("spa") || lower.includes("women") || lower.includes("men")) e.target.src = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&auto=format&fit=crop&q=80";
                                                else e.target.src = "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&auto=format&fit=crop&q=80";
                                            }}
                                            className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                    <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100 text-center py-3 px-2 border-t border-slate-100 dark:border-slate-700">
                                        {subcategory}
                                    </h1>
                                </button>
                            )
                        )}
                    </div>
                </div>
            ) : !selectedServiceType ? (
                <div className="flex flex-col gap-4">
                    {details.subcategories[selectedSubcategory]?.serviceTypes &&
                    Object.keys(
                        details.subcategories[selectedSubcategory]
                            .serviceTypes
                    ).length > 0 ? (
                        Object.keys(
                            details.subcategories[selectedSubcategory]
                                .serviceTypes
                        ).map((serviceType, index) => (
                            <button
                                key={serviceType}
                                onClick={() =>
                                    handleServiceTypeSelect(serviceType)
                                }
                                style={{ animationDelay: `${index * 50}ms` }}
                                className="card-hover animate-fade-in-up group flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-premium overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <img
                                    src={`${
                                        import.meta.env.VITE_BACKEND_URL
                                    }/${
                                        details.subcategories[
                                            selectedSubcategory
                                        ].serviceTypes[serviceType].image
                                    }`}
                                    alt={serviceType}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&auto=format&fit=crop&q=80";
                                    }}
                                    className="w-28 h-24 object-cover object-center"
                                />
                                <div className="flex flex-col gap-1 py-3 pr-4">
                                    <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {serviceType}
                                    </h1>
                                    <div className="flex gap-2">
                                        {serviceType === "Salon Classic" && (
                                            <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-600 rounded-full px-2 py-0.5 uppercase">
                                                Economical
                                            </span>
                                        )}
                                        {serviceType === "Salon Prime" && (
                                            <span className="text-xs bg-blue-100 text-blue-700 border border-blue-600 rounded-full px-2 py-0.5 uppercase">
                                                Premium
                                            </span>
                                        )}
                                        {serviceType === "Salon Luxe" && (
                                            <span className="text-xs bg-orange-100 text-orange-700 border border-orange-600 rounded-full px-2 py-0.5 uppercase">
                                                Top Partners
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-slate-500 text-sm py-8 text-center">
                            No service types available
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default ServiceDetails;
