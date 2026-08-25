import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getServices, registerProvider } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Wrench } from "lucide-react";

const inputClass =
    "text-sm rounded-lg p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500";

export default function ProviderRegister() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [services, setServices] = useState([]);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        category: "",
        skills: "",
        experienceYears: "",
        hourlyRate: "",
        bio: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getServices()
            .then((data) => setServices(data))
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const response = await registerProvider({
                name: form.name,
                email: form.email,
                phone: form.phone,
                password: form.password,
                category: form.category,
                skills: form.skills,
                experienceYears: form.experienceYears,
                hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : 0,
                bio: form.bio,
            });
            login(response.user || response);
            navigate("/provider/dashboard");
        } catch (err) {
            setError(err.msg || err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-10">
            <div className="flex items-center gap-2 pb-2">
                <Wrench size={22} className="text-blue-600 dark:text-blue-400" />
                <h1 className="text-3xl sm:text-4xl font-[NeuwMachinaBold] uppercase tracking-wider text-slate-900 dark:text-white">
                    Become a <span className="text-gradient">Provider</span>
                </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 pb-6">
                Create your professional profile, get verified by our team, and
                start receiving bookings.
            </p>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name *"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className={inputClass}
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email *"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className={inputClass}
                    />
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Mobile Number (10 digits) *"
                        pattern="[0-9]{10}"
                        maxLength="10"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        className={inputClass}
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password (min 6 characters) *"
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
                        <option value="">Select Service Category *</option>
                        {services.map((service) => (
                            <option key={service._id} value={service.serviceName}>
                                {service.serviceName}
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        name="experienceYears"
                        placeholder="Years of Experience"
                        min="0"
                        value={form.experienceYears}
                        onChange={handleChange}
                        className={inputClass}
                    />
                    <input
                        type="number"
                        name="hourlyRate"
                        placeholder="Hourly Rate (₹/hr)"
                        min="0"
                        value={form.hourlyRate}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>

                <input
                    type="text"
                    name="skills"
                    placeholder="Skills (comma separated, e.g. Plumbing, Fitting, Repair)"
                    value={form.skills}
                    onChange={handleChange}
                    className={inputClass}
                />
                <textarea
                    name="bio"
                    placeholder="Tell customers about yourself and your work..."
                    rows="3"
                    value={form.bio}
                    onChange={handleChange}
                    className={inputClass}
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-brand-gradient text-white p-3 rounded-full hover:opacity-90 transition-all uppercase tracking-wider text-sm font-semibold shadow-glow-blue disabled:opacity-50"
                >
                    {loading ? "Registering..." : "Register as Provider"}
                </button>
                <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                    Already have an account?{" "}
                    <Link to="/providers" className="font-semibold text-blue-600 dark:text-blue-400 underline underline-offset-2">
                        Browse providers
                    </Link>
                </p>
            </form>
        </div>
    );
}
