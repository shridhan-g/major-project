import { useState, useEffect, useRef } from "react";
import {
    MapPin, Plus, Pencil, Trash2, StarOff, CheckCircle2,
    X, Home, Briefcase, Tag, Loader2, AlertCircle, Search, ChevronRight
} from "lucide-react";
import {
    getAddresses, addAddress, updateAddress, deleteAddress,
    setDefaultAddress, lookupPincode
} from "../utils/api";

// ── helpers ──────────────────────────────────────────────────────────────────
const LABEL_META = {
    Home: { icon: Home, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", border: "border-blue-400" },
    Work: { icon: Briefcase, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", border: "border-orange-400" },
    Other: { icon: Tag, color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300", border: "border-slate-400" },
};

const formatAddress = (addr) => {
    const parts = [addr.house, addr.area, addr.landmark, addr.city, addr.district, addr.state, addr.pincode].filter(Boolean);
    return parts.join(", ");
};

const EMPTY_FORM = {
    label: "Home",
    name: "",
    mobile: "",
    house: "",
    area: "",
    landmark: "",
    pincode: "",
    city: "",
    district: "",
    state: "",
    postOffice: "",
    latitude: null,
    longitude: null,
    isDefault: false,
};

// ── Sub-component: Address Form ───────────────────────────────────────────────
function AddressForm({ initial, onSave, onCancel, isSaving }) {
    const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
    const [pinLoading, setPinLoading] = useState(false);
    const [pinError, setPinError] = useState("");
    const [formError, setFormError] = useState("");
    const [postOffices, setPostOffices] = useState([]);
    const pinDebounceRef = useRef(null);

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    // Auto-lookup pincode when 6 digits entered
    useEffect(() => {
        if (form.pincode.length !== 6) { setPinError(""); setPostOffices([]); return; }
        clearTimeout(pinDebounceRef.current);
        pinDebounceRef.current = setTimeout(async () => {
            setPinLoading(true);
            setPinError("");
            try {
                const data = await lookupPincode(form.pincode);
                if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
                    const po = data[0].PostOffice[0];
                    setForm(prev => ({
                        ...prev,
                        city: po.District || po.Block || prev.city,
                        district: po.District || prev.district,
                        state: po.State || prev.state,
                        postOffice: po.Name || prev.postOffice,
                    }));
                    setPostOffices(data[0].PostOffice || []);
                    setPinError("");
                } else {
                    setPinError("No location found for this PIN code.");
                    setPostOffices([]);
                }
            } catch {
                setPinError("Could not verify PIN code. Please fill city/state manually.");
            } finally {
                setPinLoading(false);
            }
        }, 600);
        return () => clearTimeout(pinDebounceRef.current);
    }, [form.pincode]);

    const validate = () => {
        if (!form.name.trim()) return "Full name is required.";
        if (!form.mobile.trim() || !/^\d{10}$/.test(form.mobile.trim())) return "Enter a valid 10-digit mobile number.";
        if (!form.house.trim()) return "House/Flat/Building number is required.";
        if (!form.pincode || form.pincode.length !== 6) return "Enter a valid 6-digit PIN code.";
        return null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const err = validate();
        if (err) { setFormError(err); return; }
        setFormError("");
        onSave(form);
    };

    const inputCls = "w-full text-sm rounded-xl px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400";
    const labelCls = "text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block";

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Label tabs */}
            <div className="flex gap-2">
                {["Home", "Work", "Other"].map(lbl => {
                    const meta = LABEL_META[lbl];
                    const Icon = meta.icon;
                    const active = form.label === lbl;
                    return (
                        <button
                            key={lbl}
                            type="button"
                            onClick={() => set("label", lbl)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${
                                active ? `${meta.color} ${meta.border}` : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-transparent hover:border-slate-400"
                            }`}
                        >
                            <Icon size={13} /> {lbl}
                        </button>
                    );
                })}
            </div>

            {/* Map preview when coords available */}
            {form.latitude && form.longitude && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 h-32 relative">
                    <img
                        src={`https://staticmap.openstreetmap.de/staticmap.php?center=${form.latitude},${form.longitude}&zoom=15&size=600x200&markers=${form.latitude},${form.longitude},red-pushpin`}
                        alt="Map preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // fallback: OpenStreetMap tile iframe
                            e.target.style.display = 'none';
                        }}
                    />
                    <div className="absolute bottom-2 right-2 bg-white dark:bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 dark:border-slate-600">
                        📍 {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                    </div>
                </div>
            )}

            {/* Name + Mobile */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={labelCls}>Full Name *</label>
                    <input className={inputCls} placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => set("name", e.target.value)} />
                </div>
                <div>
                    <label className={labelCls}>Mobile Number *</label>
                    <input className={inputCls} placeholder="10-digit mobile" maxLength={10}
                        value={form.mobile} onChange={e => set("mobile", e.target.value.replace(/\D/g, ""))} />
                </div>
            </div>

            {/* House + Area */}
            <div>
                <label className={labelCls}>House / Flat / Building *</label>
                <input className={inputCls} placeholder="e.g. Flat 3B, Sunrise Apartments" value={form.house} onChange={e => set("house", e.target.value)} />
            </div>
            <div>
                <label className={labelCls}>Area / Colony / Street / Locality</label>
                <input className={inputCls} placeholder="e.g. MG Road, Andheri West" value={form.area} onChange={e => set("area", e.target.value)} />
            </div>

            {/* Landmark */}
            <div>
                <label className={labelCls}>Landmark (optional)</label>
                <input className={inputCls} placeholder="e.g. Near City Bank, Opposite Metro Station" value={form.landmark} onChange={e => set("landmark", e.target.value)} />
            </div>

            {/* PIN Code */}
            <div>
                <label className={labelCls}>PIN Code *</label>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className={`${inputCls} pl-8`}
                        placeholder="6-digit PIN code"
                        maxLength={6}
                        value={form.pincode}
                        onChange={e => set("pincode", e.target.value.replace(/\D/g, ""))}
                    />
                    {pinLoading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
                    {!pinLoading && form.pincode.length === 6 && !pinError && (
                        <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                    )}
                </div>
                {pinError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {pinError}</p>}
                {!pinError && postOffices.length > 0 && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} /> Auto-filled from India Post data
                    </p>
                )}
            </div>

            {/* Post Office (if multiple available, show dropdown) */}
            {postOffices.length > 1 && (
                <div>
                    <label className={labelCls}>Post Office</label>
                    <select
                        className={inputCls}
                        value={form.postOffice}
                        onChange={e => {
                            const po = postOffices.find(p => p.Name === e.target.value);
                            if (po) setForm(prev => ({
                                ...prev,
                                postOffice: po.Name,
                                city: po.District || po.Block || prev.city,
                                district: po.District || prev.district,
                                state: po.State || prev.state,
                            }));
                        }}
                    >
                        {postOffices.map(po => (
                            <option key={po.Name} value={po.Name}>{po.Name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* City, District, State (auto-filled from PIN, editable) */}
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className={labelCls}>City</label>
                    <input className={inputCls} placeholder="City" value={form.city} onChange={e => set("city", e.target.value)} />
                </div>
                <div>
                    <label className={labelCls}>District</label>
                    <input className={inputCls} placeholder="District" value={form.district} onChange={e => set("district", e.target.value)} />
                </div>
                <div>
                    <label className={labelCls}>State</label>
                    <input className={inputCls} placeholder="State" value={form.state} onChange={e => set("state", e.target.value)} />
                </div>
            </div>

            {/* Default toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <div
                    onClick={() => set("isDefault", !form.isDefault)}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${form.isDefault ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
                >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isDefault ? "translate-x-5" : "translate-x-0"}`} />
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Set as my default address</span>
            </label>

            {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
                    <AlertCircle size={14} className="shrink-0" /> {formError}
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                    {isSaving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Address"}
                </button>
            </div>
        </form>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AddressManager({ isOpen, onClose, onSelectAddress, selectedAddressId }) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("list"); // "list" | "add" | "edit"
    const [editTarget, setEditTarget] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [apiError, setApiError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setView("list");
        setEditTarget(null);
        setApiError("");
        loadAddresses();
    }, [isOpen]);

    const loadAddresses = async () => {
        setLoading(true);
        try {
            const data = await getAddresses();
            setAddresses(data.addresses || []);
        } catch (err) {
            setApiError(typeof err === "string" ? err : err?.msg || "Failed to load addresses.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (formData) => {
        setIsSaving(true);
        setApiError("");
        try {
            let result;
            if (editTarget) {
                result = await updateAddress(editTarget._id, formData);
            } else {
                result = await addAddress(formData);
            }
            setAddresses(result.addresses || []);
            setView("list");
            setEditTarget(null);
        } catch (err) {
            setApiError(typeof err === "string" ? err : err?.msg || "Failed to save address.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        setApiError("");
        try {
            const result = await deleteAddress(id);
            setAddresses(result.addresses || []);
            setDeleteConfirmId(null);
        } catch (err) {
            setApiError(typeof err === "string" ? err : err?.msg || "Failed to delete address.");
        }
    };

    const handleSetDefault = async (id) => {
        setApiError("");
        try {
            const result = await setDefaultAddress(id);
            setAddresses(result.addresses || []);
        } catch (err) {
            setApiError(typeof err === "string" ? err : err?.msg || "Failed to set default.");
        }
    };

    const handleSelect = (addr) => {
        onSelectAddress(addr);
        onClose();
    };

    if (!isOpen) return null;

    const title = view === "add" ? "Add New Address" : view === "edit" ? "Edit Address" : "Your Saved Addresses";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white dark:bg-slate-900 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[90dvh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        {view !== "list" && (
                            <button onClick={() => { setView("list"); setEditTarget(null); setApiError(""); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                <ChevronRight size={18} className="rotate-180 text-slate-500" />
                            </button>
                        )}
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                            <MapPin size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-500">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5">
                    {apiError && (
                        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                            <AlertCircle size={15} className="shrink-0" /> {apiError}
                        </div>
                    )}

                    {/* LIST VIEW */}
                    {view === "list" && (
                        <div className="flex flex-col gap-3">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                                    <Loader2 size={28} className="animate-spin" />
                                    <p className="text-sm">Loading addresses...</p>
                                </div>
                            ) : addresses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4 text-slate-400">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <MapPin size={28} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">No saved addresses</p>
                                        <p className="text-xs mt-1">Add your first address to get started</p>
                                    </div>
                                </div>
                            ) : (
                                addresses.map((addr) => {
                                    const meta = LABEL_META[addr.label] || LABEL_META.Other;
                                    const Icon = meta.icon;
                                    const isSelected = addr._id === selectedAddressId;
                                    const isDeleting = deleteConfirmId === addr._id;

                                    return (
                                        <div
                                            key={addr._id}
                                            className={`rounded-2xl border-2 p-4 transition-all ${
                                                isSelected
                                                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-900/20"
                                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600"
                                            }`}
                                        >
                                            {/* Top row */}
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${meta.color}`}>
                                                        <Icon size={10} /> {addr.label}
                                                    </span>
                                                    {addr.isDefault && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                            <CheckCircle2 size={10} /> Default
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {!addr.isDefault && (
                                                        <button
                                                            title="Set as default"
                                                            onClick={() => handleSetDefault(addr._id)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
                                                        >
                                                            <StarOff size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        title="Edit"
                                                        onClick={() => { setEditTarget(addr); setView("edit"); setApiError(""); }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        title="Delete"
                                                        onClick={() => setDeleteConfirmId(isDeleting ? null : addr._id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Address details */}
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{addr.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{addr.mobile}</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{formatAddress(addr)}</p>

                                            {/* Delete confirm */}
                                            {isDeleting && (
                                                <div className="mt-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                                                    <p className="text-xs text-red-700 dark:text-red-400 font-semibold">Delete this address?</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setDeleteConfirmId(null)}
                                                            className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                                        >
                                                            Keep
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(addr._id)}
                                                            className="text-xs px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer font-semibold"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Select button */}
                                            {!isDeleting && (
                                                <button
                                                    onClick={() => handleSelect(addr)}
                                                    className={`mt-3 w-full py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                            : "border-2 border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    }`}
                                                >
                                                    {isSelected ? (
                                                        <span className="flex items-center justify-center gap-1.5"><CheckCircle2 size={14} /> Delivering Here</span>
                                                    ) : "Deliver Here"}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}

                            {/* Add new address button */}
                            {!loading && (
                                <button
                                    onClick={() => { setView("add"); setEditTarget(null); setApiError(""); }}
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer"
                                >
                                    <Plus size={16} /> Add New Address
                                </button>
                            )}
                        </div>
                    )}

                    {/* ADD / EDIT FORM VIEW */}
                    {(view === "add" || view === "edit") && (
                        <AddressForm
                            initial={editTarget || EMPTY_FORM}
                            onSave={handleSave}
                            onCancel={() => { setView("list"); setEditTarget(null); setApiError(""); }}
                            isSaving={isSaving}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
