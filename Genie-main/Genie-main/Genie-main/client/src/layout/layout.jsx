import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="w-full fixed max-sm:px-5 z-50">
                <Navbar />
            </div>
            <div className="flex-grow mt-16">
                <Outlet />
            </div>
            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    );
}
