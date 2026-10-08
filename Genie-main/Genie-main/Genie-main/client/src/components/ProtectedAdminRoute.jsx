import { useAuth } from "../context/AuthContext";
import AdminLogin from "../admin/Pages/AdminLogin";

const ProtectedAdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-3" />
                <p className="text-sm font-medium">Checking administrator authorization...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AdminLogin />;
    }

    if (user?.role !== "admin") {
        return <AdminLogin nonAdminUser={user} />;
    }

    return children;
};

export default ProtectedAdminRoute;

