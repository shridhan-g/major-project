import { useState, useEffect } from "react";
import { getDashboardStats } from "../../utils/api";
import { Calendar, TrendingUp, ChevronDown } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const TimeRangeSelector = ({ value, onChange }) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full px-4 py-1.5 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
        </select>
        <ChevronDown
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={16}
        />
    </div>
);

const StatCard = ({ title, value, icon: Icon }) => (
    <div className="card-hover bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                    {title}
                </p>
                <h3 className="text-3xl font-[NeuwMachinaBold] text-slate-900 dark:text-white">
                    {value}
                </h3>
            </div>
            <div
                className={`p-3 rounded-full bg-brand-gradient shadow-glow-blue`}
            >
                <Icon size={22} className="text-white" />
            </div>
        </div>
    </div>
);

const STATUS_STYLES = {
    SERVICE_BOOKED:
        "bg-yellow-100 text-yellow-800 border-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-500",
    PROVIDER_ASSIGNED:
        "bg-blue-100 text-blue-800 border-blue-800 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-500",
    SERVICE_COMPLETED:
        "bg-emerald-100 text-emerald-800 border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-500",
};

const RecentPaymentsTable = ({ payments }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        <h3 className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Recent Payments
        </h3>
        <div className="overflow-auto mt-4">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-neutral-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                        <th className="text-left py-2">Order ID</th>
                        <th className="text-left py-2">Customer</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {payments?.map((payment) => (
                        <tr
                            key={payment._id}
                            className="border-b border-slate-100 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300"
                        >
                            <td className="py-2.5">
                                {payment.orderId?.slice(-6) || "—"}
                            </td>
                            <td className="py-2.5">
                                {payment.user?.first_name}{" "}
                                {payment.user?.last_name}
                            </td>
                            <td className="py-2.5">
                                ₹{payment.summary?.total ?? 0}
                            </td>
                            <td className="py-2.5">
                                <span
                                    className={`px-2 py-1 rounded-full text-xs uppercase border ${
                                        STATUS_STYLES[payment.status] ||
                                        "bg-slate-100 text-slate-700 border-slate-700 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500"
                                    }`}
                                >
                                    {(payment.status || "UNKNOWN").replace(
                                        /_/g,
                                        " "
                                    )}
                                </span>
                            </td>
                            <td className="py-2.5">
                                {new Date(payment.createdAt)
                                    .toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })
                                    .replace(/\//g, "-")}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const RevenueChart = ({ data }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-xs uppercase text-slate-500 dark:text-slate-400 mb-4 px-5 pt-4 tracking-wide">
            Monthly Revenue
        </h3>
        <div className="h-40 pl-1 pr-4 pb-3 text-xs">
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(100,116,139,0.2)"
                        />
                        <XAxis
                            dataKey="month"
                            stroke="#64748b"
                            tick={{ fill: "#64748b", fontSize: 11 }}
                        />
                        <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 11 }} />
                        <Tooltip
                            formatter={(value) => `₹${value.toLocaleString()}`}
                            contentStyle={{
                                backgroundColor: "#0f172a",
                                border: "1px solid #334155",
                                borderRadius: "0.5rem",
                                color: "#f1f5f9",
                                fontSize: "12px",
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#4F46E5"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: "#4F46E5" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                    No revenue data available
                </div>
            )}
        </div>
    </div>
);

const TopServicesChart = ({ data }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-xs text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wide">
            Top Services
        </h3>
        <div className="h-36 space-y-4 overflow-y-auto pr-3">
            {data && data.length > 0 ? (
                data.map((service) => {
                    const maxRevenue = data[0]?.revenue || 0;
                    const widthPct = maxRevenue
                        ? (service.revenue / maxRevenue) * 100
                        : 0;
                    return (
                        <div key={service._id} className="relative">
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[70%]">
                                    {service._id}
                                </span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    ₹{(service.revenue || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-brand-gradient rounded-full h-2"
                                    style={{ width: `${widthPct}%` }}
                                />
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-center text-slate-400">
                    No services data available
                </div>
            )}
        </div>
    </div>
);

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState("all");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getDashboardStats(timeRange);
                // Ensure all required properties exist with default values
                setStats({
                    totalServices: data.totalServices || 0,
                    totalServiceDetails: data.totalServiceDetails || 0,
                    totalUsers: data.totalUsers || 0,
                    totalPayments: data.totalPayments || 0,
                    revenue: data.revenue || { total: 0, count: 0 },
                    monthlyRevenue: data.monthlyRevenue || [],
                    paymentStatusStats: data.paymentStatusStats || [],
                    topServices: data.topServices || [],
                    recentPayments: data.recentPayments || [],
                    timeRange: data.timeRange,
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                setError(error.message || "Failed to fetch dashboard stats");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [timeRange]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-brand-gradient text-white px-5 py-2 rounded-full hover:opacity-90 transition-all"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <p className="text-slate-500">No data available</p>
            </div>
        );
    }

    const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];

    // Ensure we have data for all months with 0 values for missing months
    const chartData = Array.from({ length: 12 }, (_, i) => {
        const existingData = stats.monthlyRevenue.find(
            (item) => monthNames.indexOf(item.month) === i
        );
        return {
            month: monthNames[i],
            total: existingData ? existingData.total : 0,
            count: existingData ? existingData.count : 0,
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                <h1 className="text-3xl font-[NeuwMachinaBold] text-slate-900 dark:text-white">
                    <span className="text-gradient">Dashboard</span>
                </h1>
                <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Grid */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <StatCard
                            title={`${
                                timeRange === "all" ? "Total" : "Period"
                            } Payments`}
                            value={stats.totalPayments}
                            icon={Calendar}
                        />
                        <StatCard
                            title="Revenue"
                            value={`₹${stats.revenue.total.toLocaleString()}`}
                            icon={TrendingUp}
                        />
                    </div>
                    <RecentPaymentsTable payments={stats.recentPayments} />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-rows-2 gap-6">
                    <RevenueChart data={chartData} />
                    <TopServicesChart data={stats.topServices} />
                </div>
            </div>
        </div>
    );
}
