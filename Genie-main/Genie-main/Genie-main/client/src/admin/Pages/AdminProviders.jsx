import { useState, useEffect } from "react";
import {
    getAllProvidersAdmin,
    verifyProvider,
    deleteProviderAdmin,
} from "../../utils/api";
import { BadgeCheck, BadgeX, Star, Trash2 } from "lucide-react";

export default function AdminProviders() {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProviders = async () => {
        try {
            const data = await getAllProvidersAdmin();
            setProviders(data || []);
            setError(null);
        } catch (err) {
            console.error("Error fetching providers:", err);
            setError("Failed to load providers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    const handleVerify = async (provider, isVerified) => {
        try {
            await verifyProvider(provider._id, isVerified);
            fetchProviders();
        } catch (err) {
            alert("Failed to update verification status");
        }
    };

    const handleDelete = async (provider) => {
        if (!window.confirm(`Delete provider "${provider.name}"? This cannot be undone.`)) {
            return;
        }
        try {
            await deleteProviderAdmin(provider._id);
            fetchProviders();
        } catch (err) {
            alert("Failed to delete provider");
        }
    };

    if (loading) return <div className="p-6 text-slate-500">Loading providers...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <div>
            <h1 className="text-3xl font-[NeuwMachinaBold] text-slate-900 dark:text-white mb-6">
                Manage <span className="text-gradient">Providers</span>
            </h1>

            {providers.length === 0 ? (
                <p className="text-slate-500">No providers registered yet.</p>
            ) : (
                <div className="space-y-4">
                    {providers.map((provider) => (
                        <div
                            key={provider._id}
                            className="card-hover bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-lg text-slate-900 dark:text-white">
                                            {provider.name}
                                        </span>
                                        {provider.isVerified ? (
                                            <span className="badge-verified">
                                                <BadgeCheck size={13} /> Verified
                                            </span>
                                        ) : (
                                            <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 border border-orange-600 dark:border-orange-500 rounded-full px-2.5 py-0.5 uppercase">
                                                <BadgeX size={13} className="inline -mt-0.5" /> Pending
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                        {provider.category}
                                    </span>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <Star
                                            size={14}
                                            className="text-orange-500"
                                            fill="currentColor"
                                        />
                                        {provider.averageRating > 0
                                            ? provider.averageRating.toFixed(1)
                                            : "No rating"}{" "}
                                        ({provider.ratingCount} reviews)
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-300">
                                        <p>
                                            Account:{" "}
                                            {provider.user?.first_name}{" "}
                                            {provider.user?.last_name} (
                                            {provider.user?.email})
                                        </p>
                                        <p>Phone: {provider.phone}</p>
                                        {provider.experienceYears > 0 && (
                                            <p>
                                                {provider.experienceYears} years experience
                                            </p>
                                        )}
                                        {provider.skills?.length > 0 && (
                                            <p className="truncate">
                                                Skills: {provider.skills.join(", ")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() =>
                                            handleVerify(provider, !provider.isVerified)
                                        }
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border transition-colors ${
                                            provider.isVerified
                                                ? "bg-orange-100 text-orange-700 border-orange-600 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-500"
                                                : "bg-emerald-100 text-emerald-700 border-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-500"
                                        }`}
                                    >
                                        {provider.isVerified ? "Revoke" : "Approve"}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(provider)}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                    >
                                        <Trash2 size={13} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
