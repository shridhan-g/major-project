import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getServices, registerProvider } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
    Wrench,
    Search,
    Loader2,
    Upload,
    FileText,
    Image,
    Clock,
    CheckCircle2,
    ShieldCheck,
    ArrowRight,
    Home,
} from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { t } from "../utils/translations";
import EmailOTPVerify from "../components/EmailOTPVerify";

const inputClass =
    "text-sm rounded-xl p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400";

export default function ProviderRegister() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { lang } = useLang();

    const [services, setServices] = useState([]);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        category: "",
        servicesOffered: "",
        skills: "",
        experienceYears: "",
        hourlyRate: "",
        bio: "",
        streetAddress: "",
        pincode: "",
        city: "",
        district: "",
        state: "",
    });

    // File upload states
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
    const [idDocument, setIdDocument] = useState(null);
    const [idDocumentName, setIdDocumentName] = useState("");

    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Email OTP verification state
    const [emailToken, setEmailToken] = useState(null);
    const [verifiedEmail, setVerifiedEmail] = useState("");

    // Successful submission review screen state
    const [submittedApplication, setSubmittedApplication] = useState(null);

    useEffect(() => {
        getServices()
            .then((data) => setServices(data || []))
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Profile photo handler
    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("Profile photo must be smaller than 5MB.");
            return;
        }
        setProfilePhoto(file);
        setProfilePhotoPreview(URL.createObjectURL(file));
        setError("");
    };

    // ID document handler
    const handleDocumentChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("ID document must be smaller than 5MB.");
            return;
        }
        setIdDocument(file);
        setIdDocumentName(file.name);
        setError("");
    };

    // Auto-fetch City, District, State when 6-digit PIN code is typed
    const handlePincodeChange = async (e) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
        setForm((prev) => ({ ...prev, pincode: val }));

        if (val.length === 6) {
            setPincodeLoading(true);
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
                const data = await res.json();
                if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice?.length > 0) {
                    const po = data[0].PostOffice[0];
                    setForm((prev) => ({
                        ...prev,
                        city: prev.city || po.Block || po.District || po.Name || "",
                        district: po.District || "",
                        state: po.State || "",
                    }));
                }
            } catch (err) {
                // User can still type manually
            } finally {
                setPincodeLoading(false);
            }
        }
    };

    const handleEmailVerified = (data) => {
        if (!data) {
            setEmailToken(null);
            setVerifiedEmail("");
            return;
        }
        setEmailToken(data.token);
        setVerifiedEmail(data.email);
        setForm((prev) => ({ ...prev, email: data.email || prev.email }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!emailToken) {
            setError("Please complete email OTP verification before submitting.");
            return;
        }

        const effectiveEmail = (form.email || verifiedEmail || "").trim();
        const cleanPhone = (form.phone || "").trim().replace(/[^\d]/g, "");

        if (!form.name || !form.name.trim()) {
            setError("Full name is required.");
            return;
        }
        if (!effectiveEmail) {
            setError("Email address is required.");
            return;
        }
        if (!cleanPhone) {
            setError("Mobile number is required.");
            return;
        }
        if (cleanPhone.length !== 10) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }
        if (!form.password || form.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (!form.category) {
            setError("Please select a service category.");
            return;
        }

        setLoading(true);

        const fullAddress = [form.streetAddress, form.city, form.district, form.state]
            .filter(Boolean)
            .join(", ") || form.city || form.pincode;

        try {
            // Build FormData to support file uploads
            const formData = new FormData();
            formData.append("name", form.name.trim());
            formData.append("email", effectiveEmail);
            formData.append("phone", cleanPhone);
            formData.append("password", form.password);
            formData.append("category", form.category);
            formData.append("servicesOffered", form.servicesOffered);
            formData.append("skills", form.skills);
            formData.append("experienceYears", form.experienceYears || "0");
            formData.append("hourlyRate", form.hourlyRate || "0");
            formData.append("bio", form.bio);
            formData.append("streetAddress", form.streetAddress);
            formData.append("pincode", form.pincode);
            formData.append("city", form.city);
            formData.append("district", form.district);
            formData.append("state", form.state);
            formData.append("address", fullAddress);
            formData.append("email_token", emailToken);

            if (profilePhoto) {
                formData.append("profilePhoto", profilePhoto);
            }
            if (idDocument) {
                formData.append("idDocument", idDocument);
            }

            const response = await registerProvider(formData);

            // Show application submitted pending review screen
            setSubmittedApplication({
                provider: response.provider,
                user: response.user,
                name: form.name.trim(),
                email: effectiveEmail,
                phone: cleanPhone,
                category: form.category,
                servicesOffered: form.servicesOffered,
                pincode: form.pincode,
                city: form.city,
            });

            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            setError(err.msg || err.message || "Registration failed. Please check your details and try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Application Submitted / Pending Admin Review Screen ────────────────────
    if (submittedApplication) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 animate-fadeIn">
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                    {/* Header banner */}
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white text-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/30">
                            <Clock size={36} className="text-white animate-pulse" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-[NeuwMachinaBold] uppercase tracking-wide">
                            Application Submitted!
                        </h2>
                        <p className="text-blue-100 text-sm mt-2 max-w-md mx-auto">
                            Your service provider application has been received and is currently{" "}
                            <strong>under review</strong> by the Genie administration team.
                        </p>
                    </div>

                    <div className="p-6 sm:p-8 flex flex-col gap-6">
                        {/* Status badge & notice */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                                        Status: Pending Admin Approval
                                    </span>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                        Verification typically completes within 24 to 48 hours.
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                                Pending
                            </span>
                        </div>

                        {/* Summary details */}
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-3 text-sm">
                            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-700 pb-2">
                                Application Summary
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Provider Name:</span>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                        {submittedApplication.name}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Mobile Number:</span>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        {submittedApplication.phone}{" "}
                                        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-normal">
                                            (✓ Verified)
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Email:</span>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                        {submittedApplication.email}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Service Category:</span>
                                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                                        {submittedApplication.category}
                                    </p>
                                </div>
                                {submittedApplication.pincode && (
                                    <div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Service Area PIN:</span>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                            {submittedApplication.pincode} ({submittedApplication.city || "Local"})
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* What's next instructions */}
                        <div className="flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                            <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck size={16} className="text-blue-600" />
                                What happens next?
                            </h5>
                            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                                <li>Our team checks your uploaded government ID & credentials for authenticity.</li>
                                <li>Once verified, your profile will become active in public customer searches.</li>
                                <li>You will be able to receive direct customer bookings and service inquiries.</li>
                            </ul>
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            <Link
                                to="/"
                                className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3 px-5 rounded-full border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                            >
                                <Home size={16} />
                                Back to Home
                            </Link>
                            <Link
                                to="/services"
                                className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors shadow-md"
                            >
                                Explore Services
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="flex items-center gap-3 pb-2">
                <Wrench size={22} className="text-blue-600 dark:text-blue-400" />
                <h1 className="text-3xl sm:text-4xl font-[NeuwMachinaBold] uppercase tracking-wider text-slate-900 dark:text-white">
                    {t(lang, "prov_reg_heading")} <span className="text-gradient">{t(lang, "prov_reg_heading_2")}</span>
                </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 pb-6 text-sm">
                Join Genie as a certified service professional. Verify your <strong>email address</strong> via OTP, then submit your details for admin approval.
            </p>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
            >
                {/* Email OTP Verification Component (Required) */}
                <EmailOTPVerify onVerified={handleEmailVerified} initialEmail={form.email} />

                {/* 2. Provider Basic Information */}
                <div className="flex flex-col gap-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Provider Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="name"
                            placeholder={t(lang, "prov_reg_fullname") + " *"}
                            value={form.name}
                            onChange={handleChange}
                            required
                            className={inputClass}
                        />
                        <div className="relative">
                            <input
                                type="email"
                                name="email"
                                placeholder={t(lang, "prov_reg_email") + " *"}
                                value={form.email}
                                onChange={handleChange}
                                required
                                className={`${inputClass} w-full`}
                            />
                            {verifiedEmail && form.email === verifiedEmail && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 size={12} /> Verified
                                </span>
                            )}
                        </div>
                        <input
                            type="tel"
                            name="phone"
                            placeholder={t(lang, "prov_reg_phone") + " * (10 digits)"}
                            value={form.phone}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setForm((prev) => ({ ...prev, phone: val }));
                            }}
                            required
                            maxLength="10"
                            className={inputClass}
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder={t(lang, "prov_reg_password") + " * (Min 6 chars)"}
                            minLength="6"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className={inputClass}
                        />
                        <select
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            required
                            className={`${inputClass} bg-white dark:bg-slate-800`}
                        >
                            <option value="">{t(lang, "prov_reg_select_cat")}</option>
                            {services.map((service) => (
                                <option key={service._id} value={service.serviceName}>
                                    {service.serviceName}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            name="experienceYears"
                            placeholder={t(lang, "prov_reg_exp") + " (in years)"}
                            min="0"
                            value={form.experienceYears}
                            onChange={handleChange}
                            className={inputClass}
                        />
                        <input
                            type="number"
                            name="hourlyRate"
                            placeholder={t(lang, "prov_reg_rate") + " (₹ / hour)"}
                            min="0"
                            value={form.hourlyRate}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>

                    {/* Services Offered (Detailed list) */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Specific Services Offered *
                        </label>
                        <textarea
                            name="servicesOffered"
                            placeholder="e.g. AC Deep Cleaning, Gas Charging, Split AC Installation, Coil Repair"
                            rows="2"
                            value={form.servicesOffered}
                            onChange={handleChange}
                            required
                            className={inputClass}
                        />
                        <span className="text-[11px] text-slate-400">
                            List specific services customers can book from you.
                        </span>
                    </div>

                    {/* Skills & Bio */}
                    <input
                        type="text"
                        name="skills"
                        placeholder="Key Skills (comma-separated, e.g. Inverter AC, Troubleshooting, Wiring)"
                        value={form.skills}
                        onChange={handleChange}
                        className={inputClass}
                    />
                    <textarea
                        name="bio"
                        placeholder="Professional Bio / Experience Overview"
                        rows="3"
                        value={form.bio}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>

                {/* 3. Address & Location Details with Pincode lookup */}
                <div className="flex flex-col gap-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Service Location & Address
                    </h3>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            PIN CODE *
                        </label>
                        <div className="relative flex items-center">
                            <Search size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                name="pincode"
                                placeholder="6-digit PIN code"
                                maxLength="6"
                                pattern="[0-9]{6}"
                                value={form.pincode}
                                onChange={handlePincodeChange}
                                required
                                className="w-full text-sm rounded-xl pl-11 pr-10 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                            />
                            {pincodeLoading && (
                                <div className="absolute right-4">
                                    <Loader2 size={16} className="animate-spin text-blue-500" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                CITY
                            </label>
                            <input
                                type="text"
                                name="city"
                                placeholder="City"
                                value={form.city}
                                onChange={handleChange}
                                required
                                className="text-sm rounded-xl px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                DISTRICT
                            </label>
                            <input
                                type="text"
                                name="district"
                                placeholder="District"
                                value={form.district}
                                onChange={handleChange}
                                required
                                className="text-sm rounded-xl px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                STATE
                            </label>
                            <input
                                type="text"
                                name="state"
                                placeholder="State"
                                value={form.state}
                                onChange={handleChange}
                                required
                                className="text-sm rounded-xl px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            STREET / AREA / WORKSHOP ADDRESS
                        </label>
                        <input
                            type="text"
                            name="streetAddress"
                            placeholder="e.g. Shop #4, Link Road, Andheri West"
                            value={form.streetAddress}
                            onChange={handleChange}
                            className="text-sm rounded-xl px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* 4. Document & Photo Upload Section */}
                <div className="flex flex-col gap-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Verification Documents & Profile Photo
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Profile Photo */}
                        <div className="flex flex-col gap-2 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40">
                            <div className="flex items-center gap-2">
                                <Image size={18} className="text-blue-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Profile Photo
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Clear portrait photo (JPG, PNG, max 5MB)
                            </p>
                            <label className="cursor-pointer flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors">
                                <Upload size={14} />
                                Choose Photo
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                            </label>
                            {profilePhotoPreview && (
                                <div className="flex items-center gap-3 pt-1">
                                    <img
                                        src={profilePhotoPreview}
                                        alt="Preview"
                                        className="w-12 h-12 rounded-full object-cover border border-blue-500"
                                    />
                                    <span className="text-xs text-emerald-600 font-medium truncate">
                                        Photo selected
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* ID Document Upload */}
                        <div className="flex flex-col gap-2 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40">
                            <div className="flex items-center gap-2">
                                <FileText size={18} className="text-indigo-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    ID / Govt Document *
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Aadhaar, PAN, or Govt ID (PDF, JPG, PNG, max 5MB)
                            </p>
                            <label className="cursor-pointer flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors">
                                <Upload size={14} />
                                Choose Document
                                <input
                                    type="file"
                                    accept="application/pdf,image/jpeg,image/png"
                                    onChange={handleDocumentChange}
                                    className="hidden"
                                />
                            </label>
                            {idDocumentName && (
                                <div className="flex items-center gap-2 pt-1 text-xs text-emerald-600 font-medium truncate">
                                    <CheckCircle2 size={14} className="shrink-0" />
                                    <span className="truncate">{idDocumentName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !emailToken}
                    title={!emailToken ? "Verify your email address first to enable registration" : undefined}
                    className="bg-brand-gradient text-white p-3.5 rounded-full hover:opacity-95 transition-all uppercase tracking-wider text-sm font-bold shadow-glow-blue disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Submitting Application...
                        </>
                    ) : (
                        "Submit Application for Review"
                    )}
                </button>

                <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                    {t(lang, "prov_reg_have_account")}{" "}
                    <Link
                        to="/providers"
                        className="font-semibold text-blue-600 dark:text-blue-400 underline underline-offset-2"
                    >
                        {t(lang, "prov_reg_browse")}
                    </Link>
                </p>
            </form>
        </div>
    );
}
