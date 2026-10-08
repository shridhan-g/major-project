import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { getProviderById, submitProviderReview } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { t } from "../utils/translations";
import { BadgeCheck, Star, MapPin, Phone, Mail, Clock, CalendarCheck } from "lucide-react";

const StarRating = ({ rating, size = 16 }) => {
    const value = rating || 0;
    return (
        <span className="flex items-center gap-0.5 text-orange-500">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={size}
                    fill={i <= Math.round(value) ? "currentColor" : "none"}
                />
            ))}
            <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                {value > 0 ? value.toFixed(1) : "No ratings yet"}
            </span>
        </span>
    );
};

export default function ProviderProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { lang } = useLang();

    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");

    useEffect(() => {
        getProviderById(id)
            .then((data) => {
                setProvider(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || "Failed to load provider");
                setLoading(false);
            });
    }, [id]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setSubmitError("");
        setSubmitSuccess("");
        if (rating < 1) {
            setSubmitError("Please select a star rating (1-5).");
            return;
        }
        setSubmitting(true);
        try {
            await submitProviderReview(id, { rating, comment });
            setSubmitSuccess("Thanks! Your review has been saved.");
            setRating(0);
            setComment("");
            const data = await getProviderById(id);
            setProvider(data);
        } catch (err) {
            setSubmitError(err.message || "Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    const bookWithProvider = () => {
        if (provider) {
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
        navigate("/viewcart");
    };

    if (loading) {
        return <p className="pb-10 text-slate-500">Loading provider...</p>;
    }
    if (error || !provider) {
        return <p className="pb-10 text-red-500">{error || "Provider not found"}</p>;
    }

    const reviews = provider.reviews || [];

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-10 pt-8">
            <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8 mb-8">
                <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-600/10 blur-2xl" />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-3xl font-[NeuwMachinaBold] text-slate-900 dark:text-white">
                                {provider.name}
                            </h1>
                            {provider.isVerified && (
                                <span className="badge-verified">
                                    <BadgeCheck size={14} /> {t(lang, "providers_verified")}
                                </span>
                            )}
                        </div>
                        <p className="text-blue-600 dark:text-blue-400 font-medium">
                            {t(lang, provider.category)}
                        </p>
                        <StarRating rating={provider.averageRating} size={18} />
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            {provider.ratingCount} review{provider.ratingCount === 1 ? "" : "s"}
                        </span>
                    </div>
                    <button
                        onClick={bookWithProvider}
                        className="flex items-center gap-2 bg-brand-gradient text-white px-6 py-3 rounded-full hover:opacity-90 transition-all uppercase tracking-wider text-sm font-semibold shadow-glow-blue cursor-pointer"
                    >
                        <CalendarCheck size={16} /> {t(lang, "Book with this Provider")}
                    </button>
                </div>

                <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-dashed border-slate-200 dark:border-slate-700 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Clock size={16} className="text-blue-600 dark:text-blue-400" />{" "}
                        {provider.experienceYears} {t(lang, "providers_yrs_exp")}
                    </div>
                    {provider.hourlyRate > 0 && (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span className="text-lg">₹</span>{" "}
                            {provider.hourlyRate}
                            <span className="font-normal text-slate-500 dark:text-slate-400">/hr</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 truncate">
                        <MapPin size={16} className="text-blue-600 dark:text-blue-400" />{" "}
                        {provider.location?.address ||
                            provider.contact?.address ||
                            "Location not specified"}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Phone size={16} className="text-blue-600 dark:text-blue-400" />{" "}
                        {provider.contact?.phone || provider.phone}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 truncate">
                        <Mail size={16} className="text-blue-600 dark:text-blue-400" />{" "}
                        {provider.contact?.email || provider.email}
                    </div>
                </div>

                <div className="relative mt-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 pb-2">
                        {t(lang, "Skills")}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {(provider.skills || []).length > 0 ? (
                            provider.skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="text-sm bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full px-3 py-1 text-slate-700 dark:text-slate-200"
                                >
                                    {t(lang, skill)}
                                </span>
                            ))
                        ) : (
                            <span className="text-slate-500 text-sm">No skills listed</span>
                        )}
                    </div>
                </div>

                {provider.bio && (
                    <div className="relative mt-6">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 pb-2">
                            {t(lang, "About")}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {provider.bio}
                        </p>
                    </div>
                )}
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-[NeuwMachinaBold] text-slate-900 dark:text-white pb-4">
                    {t(lang, "Ratings & Reviews")}
                </h2>

                {isAuthenticated ? (
                    <form
                        onSubmit={handleSubmitReview}
                        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 mb-6 flex flex-col gap-3"
                    >
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setRating(i)}
                                    onMouseEnter={() => setHoverRating(i)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="text-orange-500"
                                >
                                    <Star
                                        size={28}
                                        fill={
                                            i <= (hoverRating || rating)
                                                ? "currentColor"
                                                : "none"
                                        }
                                    />
                                </button>
                            ))}
                            <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                                {rating > 0 ? `${rating} star` : "Select rating"}
                            </span>
                        </div>
                        <textarea
                            rows="3"
                            placeholder={t(lang, "Share your experience with this provider...")}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="text-sm rounded-lg p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
                        {submitSuccess && (
                            <p className="text-emerald-600 text-sm">{submitSuccess}</p>
                        )}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="self-start bg-brand-gradient text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {submitting ? t(lang, "Submitting...") : t(lang, "Submit Review")}
                        </button>
                    </form>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 pb-4">
                        {t(lang, "Please login to leave a review.")}
                    </p>
                )}

                {reviews.length === 0 ? (
                    <p className="text-slate-500">{t(lang, "No reviews yet. Be the first!")}</p>
                ) : (
                    <div className="flex flex-col gap-4">
                        {reviews.map((review) => (
                            <div
                                key={review._id}
                                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4"
                            >
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {review.user?.first_name} {review.user?.last_name}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {format(new Date(review.createdAt), "PP")}
                                    </span>
                                </div>
                                <StarRating rating={review.rating} size={14} />
                                {review.comment && (
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                                        {review.comment}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
