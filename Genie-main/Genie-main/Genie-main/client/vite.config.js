import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ["react", "react-dom", "react-router-dom"],
                    motion: ["framer-motion"],
                    charts: ["recharts"],
                    maps: [
                        "@react-google-maps/api",
                        "react-google-places-autocomplete",
                    ],
                    icons: ["react-icons", "lucide-react"],
                },
            },
        },
    },
});
