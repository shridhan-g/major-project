/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    blue: "#2563EB",
                    indigo: "#4F46E5",
                    orange: "#F97316",
                },
            },
            boxShadow: {
                glass: "0 8px 32px rgba(15, 23, 42, 0.08)",
                premium: "0 20px 60px -15px rgba(37, 99, 235, 0.25)",
                "glow-blue": "0 8px 30px rgba(37, 99, 235, 0.15)",
                "glow-indigo": "0 8px 30px rgba(79, 70, 229, 0.15)",
            },
            backgroundImage: {
                "brand-gradient":
                    "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)",
                "accent-gradient":
                    "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                "hero-gradient":
                    "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-12px)" },
                },
                floatSlow: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-22px)" },
                },
                statusPulse: {
                    "0%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.5)" },
                    "70%": { boxShadow: "0 0 0 8px rgba(16, 185, 129, 0)" },
                    "100%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-1000px 0" },
                    "100%": { backgroundPosition: "1000px 0" },
                },
                fadeInUp: {
                    "0%": { opacity: "0", transform: "translateY(24px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
            animation: {
                float: "float 5s ease-in-out infinite",
                "float-slow": "floatSlow 8s ease-in-out infinite",
                "status-pulse": "statusPulse 2s infinite",
                shimmer: "shimmer 1.5s infinite linear",
                "fade-in-up": "fadeInUp 0.6s ease-out both",
            },
            transitionProperty: {
                bottom: "bottom",
            },
            transitionDuration: {
                400: "400ms",
            },
            transitionTimingFunction: {
                ease: "ease",
            },
        },
    },
    plugins: [],
};
