import { useState, useEffect } from "react";
import {
    getAllProvidersAdmin,
    approveProvider,
    rejectProvider,
    verifyProvider,
    deleteProviderAdmin,
} from "../../utils/api";
import {
    BadgeCheck,
    Clock,
    XCircle,
    Star,
    Trash2,
    CheckCircle2,
    FileText,
    ExternalLink,
    Search,
    UserCheck,
    AlertCircle,
    MapPin,
    Briefcase,
    Phone,
    Mail,
    X,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function AdminProviders() {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("pending"); // "pending" | "approved" | "rejected" | "all"
    const [searchTerm, setSearchTerm] = useState("");

    // Reject Modal state
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchProviders = async () => {
        try {
            const data = await getAllProvidersAdmin("all");
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

    // Filter providers based on tab and search
    const filteredProviders = providers.filter((p) => {
        const pStatus = p.status || (p.isVerified ? "approved" : "pending");
        if (activeTab !== "all" && pStatus !== activeTab) {
            return false;
        }
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            p.name?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q) ||
            p.phone?.includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.pincode?.includes(q) ||
            p.servicesOffered?.toLowerCase().includes(q)
        );
    });

    const counts = {
        all: providers.length,
        pending: providers.filter((p) => (p.status || (p.isVerified ? "approved" : "pending")) === "pending").length,
        approved: providers.filter((p) => (p.status || (p.isVerified ? "approved" : "pending")) === "approved").length,
        rejected: providers.filter((p) => p.status === "rejected").length,
    };

    const handleApprove = async (provider) => {
        if (!window.confirm(`Approve provider "${provider.name}"? Their profile will be published to public service listings.`)) {
            return;
        }
        setActionLoading(true);
        try {
            await approveProvider(provider._id);
            await fetchProviders();
        } catch (err) {
            alert(err?.msg || err?.message || "Failed to approve provider");
        } finally {
            setActionLoading(false);
        }
    };

    const openRejectModal = (provider) => {
        setSelectedProvider(provider);
        setRejectionReason("");
        setRejectModalOpen(true);
    };

    const handleConfirmReject = async () => {
        if (!selectedProvider) return;
        setActionLoading(true);
        try {
            await rejectProvider(selectedProvider._id, rejectionReason);
            setRejectModalOpen(false);
            setSelectedProvider(null);
            await fetchProviders();
        } catch (err) {
            alert(err?.msg || err?.message || "Failed to reject provider");
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleVerification = async (provider) => {
        const nextState = !provider.isVerified;
        try {
            await verifyProvider(provider._id, nextState);
            await fetchProviders();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const handleDelete = async (provider) => {
        if (!window.confirm(`Permanently delete provider "${provider.name}"? This action cannot be undone.`)) {
            return;
        }
        try {
            await deleteProviderAdmin(provider._id);
            await fetchProviders();
        } catch (err) {
            alert("Failed to delete provider");
        }
    };

    const getFileUrl = (filePath) => {
        if (!filePath) return "";
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            return filePath;
        }
        return `${BACKEND_URL}${filePath.startsWith("/") ? "" : "/"}${filePath}`;
    };

    if (loading) return <div className="p-8 text-slate-500">Loading provider applications...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-[NeuwMachinaBold] text-slate-900 dark:text-white">
                        Provider <span className="text-gradient">Verification</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Review submitted provider applications, inspect government IDs, and approve or reject profiles.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search name, phone, area..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === "pending"
                            ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                >
                    <Clock size={14} />
                    Pending Review
                    {counts.pending > 0 && (
                        <span className="bg-white/30 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                            {counts.pending}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab("approved")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === "approved"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                >
                    <BadgeCheck size={14} />
                    Approved & Live ({counts.approved})
                </button>

                <button
                    onClick={() => setActiveTab("rejected")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === "rejected"
                            ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                >
                    <XCircle size={14} />
                    Rejected ({counts.rejected})
                </button>

                <button
                    onClick={() => setActiveTab("all")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === "all"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                >
                    All Providers ({counts.all})
                </button>
            </div>

            {/* Providers Listing */}
            {filteredProviders.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        No service providers found in this section.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredProviders.map((provider) => {
                        const status = provider.status || (provider.isVerified ? "approved" : "pending");

                        return (
                            <div
                                key={provider._id}
                                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 sm:p-6 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                            >
                                <div className="flex flex-col lg:flex-row items-start justify-between gap-5">
                                    {/* Left Details */}
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* Avatar or profile photo */}
                                        <div className="shrink-0">
                                            {provider.profilePhoto ? (
                                                <img
                                                    src={getFileUrl(provider.profilePhoto)}
                                                    alt={provider.name}
                                                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                                                    onError={(e) => {
                                                        e.target.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                                                    {provider.name?.charAt(0) || "P"}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 flex-1">
                                            {/* Name and Status Badge */}
                                            <div className="flex flex-wrap items-center gap-2.5">
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                                    {provider.name}
                                                </h3>

                                                {/* Status badge */}
                                                {status === "approved" && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                                        <BadgeCheck size={13} /> Approved & Live
                                                    </span>
                                                )}
                                                {status === "pending" && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                                        <Clock size={13} /> Pending Review
                                                    </span>
                                                )}
                                                {status === "rejected" && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                                        <XCircle size={13} /> Application Declined
                                                    </span>
                                                )}

                                                {/* Mobile Verified tag */}
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                                    <CheckCircle2 size={12} className="text-blue-500" />
                                                    Phone Verified
                                                </span>
                                            </div>

                                            {/* Category & Ratings */}
                                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                                <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
                                                    {provider.category}
                                                </span>

                                                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                                    <Star size={13} className="text-amber-500 fill-amber-500" />
                                                    {provider.averageRating > 0
                                                        ? provider.averageRating.toFixed(1)
                                                        : "Unrated"}{" "}
                                                    ({provider.ratingCount} reviews)
                                                </span>

                                                {provider.experienceYears > 0 && (
                                                    <span className="text-slate-600 dark:text-slate-300">
                                                        • <strong>{provider.experienceYears}</strong> yrs experience
                                                    </span>
                                                )}

                                                {provider.hourlyRate > 0 && (
                                                    <span className="text-slate-600 dark:text-slate-300 font-mono">
                                                        • ₹{provider.hourlyRate}/hr
                                                    </span>
                                                )}
                                            </div>

                                            {/* Specific Services Offered */}
                                            {provider.servicesOffered && (
                                                <div className="text-xs bg-slate-50 dark:bg-slate-700/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        Services Offered:
                                                    </span>{" "}
                                                    <span className="text-slate-600 dark:text-slate-400">
                                                        {provider.servicesOffered}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Contact & Location */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Phone size={13} className="text-slate-400 shrink-0" />
                                                    <span className="font-mono">{provider.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Mail size={13} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{provider.email}</span>
                                                </div>
                                                {(provider.location?.address || provider.contact?.address || provider.pincode) && (
                                                    <div className="flex items-center gap-1.5 sm:col-span-2">
                                                        <MapPin size={13} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">
                                                            {provider.location?.address || provider.contact?.address || "Address"}
                                                            {provider.pincode ? ` — PIN ${provider.pincode}` : ""}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Verification Badges */}
                                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                                    provider.mobileVerified
                                                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600"
                                                }`}>
                                                    📱 Mobile {provider.mobileVerified ? "Verified" : "Unverified"}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                                    provider.emailVerified
                                                        ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600"
                                                }`}>
                                                    ✉️ Email {provider.emailVerified ? "Verified" : "Unverified"}
                                                </span>
                                            </div>

                                            {/* ID Document & Files View */}
                                            {provider.idDocument && (
                                                <div className="pt-2">
                                                    <a
                                                        href={getFileUrl(provider.idDocument)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 px-3 py-1.5 rounded-xl transition-colors"
                                                    >
                                                        <FileText size={14} />
                                                        View Government ID Document
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            )}

                                            {/* Rejection Reason Notice if rejected */}
                                            {status === "rejected" && provider.rejectionReason && (
                                                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 mt-1">
                                                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                                    <div>
                                                        <strong>Rejection Reason:</strong> {provider.rejectionReason}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons on Right */}
                                    <div className="flex lg:flex-col items-center gap-2 shrink-0 self-end lg:self-center w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-700">
                                        {status === "pending" ? (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(provider)}
                                                    disabled={actionLoading}
                                                    className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                                                >
                                                    <UserCheck size={14} />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => openRejectModal(provider)}
                                                    disabled={actionLoading}
                                                    className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 active:scale-95 transition-all"
                                                >
                                                    <XCircle size={14} />
                                                    Reject
                                                </button>
                                            </>
                                        ) : status === "approved" ? (
                                            <button
                                                onClick={() => handleToggleVerification(provider)}
                                                className="flex-1 lg:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                                            >
                                                Revoke / Suspend
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleApprove(provider)}
                                                className="flex-1 lg:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                                            >
                                                Re-evaluate & Approve
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(provider)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                                            title="Delete provider"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Rejection Reason Modal */}
            {rejectModalOpen && selectedProvider && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                Reject Provider Application
                            </h3>
                            <button
                                onClick={() => setRejectModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Provide a reason for declining <strong>{selectedProvider.name}</strong>'s application.
                        </p>

                        {/* Quick Reason Suggestions */}
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                "ID document is blurry or invalid",
                                "Incomplete contact / address details",
                                "Experience could not be verified",
                                "Category requirements not met",
                            ].map((sug) => (
                                <button
                                    key={sug}
                                    type="button"
                                    onClick={() => setRejectionReason(sug)}
                                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                                >
                                    {sug}
                                </button>
                            ))}
                        </div>

                        <textarea
                            rows="3"
                            placeholder="Type specific rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                        />

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setRejectModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmReject}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-sm"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

