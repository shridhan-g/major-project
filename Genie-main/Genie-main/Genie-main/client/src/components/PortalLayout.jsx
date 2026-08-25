import { useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";

export default function PortalLayout({ isOpen, onClose, children }) {
    const portalRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                contentRef.current &&
                !contentRef.current.contains(event.target)
            ) {
                onClose();
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.body.style.overflow = "auto";
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            <div
                ref={portalRef}
                className="fixed w-screen h-screen top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/60 backdrop-blur-sm select-none z-50 overflow-hidden"
            >
                <div
                    ref={contentRef}
                    className="fixed max-h-[85%] glass dark:bg-slate-800 dark:border dark:border-slate-700 rounded-2xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-premium overflow-auto"
                >
                    <div className="flex justify-end pt-4 pr-4">
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="rounded-full p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <IoClose size={20} />
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </>
    );
}
