import { createContext, useContext, useState } from "react";

export const LANGUAGES = [
    { code: "en", label: "English", native: "English", flag: "🇬🇧" },
    { code: "hi", label: "Hindi", native: "हिंदी", flag: "🇮🇳" },
    { code: "mr", label: "Marathi", native: "मराठी", flag: "🇮🇳" },
    { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        return localStorage.getItem("genie_lang") || "en";
    });

    const changeLang = (code) => {
        setLang(code);
        localStorage.setItem("genie_lang", code);
    };

    return (
        <LanguageContext.Provider value={{ lang, changeLang }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLang() {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        return {
            lang: localStorage.getItem("genie_lang") || "en",
            changeLang: () => {},
        };
    }
    return ctx;
}
