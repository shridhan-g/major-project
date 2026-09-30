import axios from "axios";

// Set up base URL for the API and create an axios instance with default settings.
const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const axiosInstance = axios.create({
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach Authorization header if stored in localStorage
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("genie_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// User Registration API
export const register = async (userData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/users/register`,
            userData
        );
        if (response.data?.token) {
            localStorage.setItem("genie_token", response.data.token);
        }
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// User Login API
export const login = async (userData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/users/login`,
            userData
        );
        if (response.data?.token) {
            localStorage.setItem("genie_token", response.data.token);
        }
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get User Details API
export const getUserDetails = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/users/user`);
        const data = response.data;
        // Only normalize cart when a user is present (e.g. logged out returns
        // `{ isAuthenticated: false }` with no user field)
        if (data.user) {
            data.user.cart = Array.isArray(data.user.cart)
                ? data.user.cart
                : [];
        }
        return data;
    } catch (error) {
        console.error("Error fetching user details:", error);
        throw error.response?.data || error.message;
    }
};

// User Logout API
export const logout = async () => {
    try {
        localStorage.removeItem("genie_token");
        await axiosInstance.post(`${API_URL}/users/logout`);
    } catch (error) {
        console.error("Logout failed:", error);
        throw error.response?.data || error.message;
    }
};

// Get Services List API
export const getServices = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/services`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get Service Details API
export const getServiceDetails = async (serviceName) => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/services/${encodeURIComponent(serviceName)}/details`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Update User Cart API
export const updateUserCart = async (cartItems) => {
    try {
        if (!Array.isArray(cartItems)) {
            throw new Error("Cart items should be an array");
        }

        // Transform the cart items to match backend structure
        const processedItems = cartItems.map((item) => ({
            service: item._id,
            quantity: parseInt(item.quantity, 10),
            title: item.title,
            OurPrice: parseFloat(item.OurPrice),
            total: parseFloat(item.OurPrice) * parseInt(item.quantity, 10),
            category: item.category || "",
            type: item.type || "",
            time: item.time || "",
            MRP: parseFloat(item.MRP || 0),
            description: Array.isArray(item.description)
                ? item.description
                : [],
            image: item.image || "",
        }));

        const response = await axiosInstance.put(
            `${API_URL}/users/cart`,
            processedItems
        );
        return response.data;
    } catch (error) {
        console.error("Error updating cart:", error);
        throw error.response?.data || error.message;
    }
};

// Get User Cart API
export const getUserCart = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/users/cart`);
        const data = response.data;
        return Array.isArray(data.cart) ? data.cart : [];
    } catch (error) {
        console.error("Error fetching user cart:", error);
        throw error.response?.data || error.message;
    }
};

// Clear User Cart API
export const clearUserCart = async () => {
    try {
        const response = await axiosInstance.delete(`${API_URL}/users/cart`);
        return response.data;
    } catch (error) {
        console.error("Error clearing cart:", error);
        throw error.response?.data || error.message;
    }
};

export const createRazorpayOrder = async (orderData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/razorpay/create-order`,
            orderData
        );
        return response.data;
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        throw error.response?.data || error.message;
    }
};

// Verify Razorpay Payment API
export const verifyRazorpayPayment = async (paymentData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/razorpay/verify-payment`,
            paymentData
        );
        return response.data;
    } catch (error) {
        console.error("Error verifying payment:", error);
        throw error.response?.data || error.message;
    }
};

export const createDirectBooking = async (orderData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/razorpay/direct-booking`,
            orderData
        );
        return response.data;
    } catch (error) {
        console.error("Error creating direct booking:", error);
        throw error.response?.data || error.message;
    }
};

export const getUserBookings = async (userId) => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/razorpay/bookings/${userId}`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching bookings:", error);
        throw error.response?.data || error.message;
    }
};

export const cancelUserBooking = async (bookingId, reason = "") => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/razorpay/bookings/${bookingId}/cancel`,
            { reason }
        );
        return response.data;
    } catch (error) {
        console.error("Error cancelling booking:", error);
        throw error.response?.data || error.message;
    }
};

// ─── Address Management APIs ──────────────────────────────────────────────────

// Get all saved addresses
export const getAddresses = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/users/addresses`);
        return response.data;
    } catch (error) {
        console.error("Error fetching addresses:", error);
        throw error.response?.data || error.message;
    }
};

// Add a new address
export const addAddress = async (addressData) => {
    try {
        const response = await axiosInstance.post(`${API_URL}/users/addresses`, addressData);
        return response.data;
    } catch (error) {
        console.error("Error adding address:", error);
        throw error.response?.data || error.message;
    }
};

// Update an existing address
export const updateAddress = async (id, addressData) => {
    try {
        const response = await axiosInstance.put(`${API_URL}/users/addresses/${id}`, addressData);
        return response.data;
    } catch (error) {
        console.error("Error updating address:", error);
        throw error.response?.data || error.message;
    }
};

// Delete an address
export const deleteAddress = async (id) => {
    try {
        const response = await axiosInstance.delete(`${API_URL}/users/addresses/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting address:", error);
        throw error.response?.data || error.message;
    }
};

// Set an address as default
export const setDefaultAddress = async (id) => {
    try {
        const response = await axiosInstance.put(`${API_URL}/users/addresses/${id}/default`);
        return response.data;
    } catch (error) {
        console.error("Error setting default address:", error);
        throw error.response?.data || error.message;
    }
};

// Lookup a pincode via backend proxy (India Post API)
export const lookupPincode = async (pincode) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/users/addresses/pincode/${pincode}`);
        return response.data;
    } catch (error) {
        console.error("Error looking up pincode:", error);
        throw error.response?.data || error.message;
    }
};


export const getDashboardStats = async (timeRange = "all") => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/admin/dashboard/stats`,
            {
                params: { timeRange },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error.response?.data || error.message;
    }
};

export const createService = async (formData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/admin/services/`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error creating service:", error);
        throw error.response?.data || error.message;
    }
};

// Update an existing service
export const updateService = async (id, formData) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/services/${id}`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating service:", error);
        throw error.response?.data || error.message;
    }
};

// Delete a service
export const deleteService = async (id) => {
    try {
        const response = await axiosInstance.delete(
            `${API_URL}/admin/services/${id}`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting service:", error);
        throw error.response?.data || error.message;
    }
};

// Get service details by service ID
export const getServiceDetailsById = async (serviceId) => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/admin/servicedetails/${serviceId}`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching service details:", error);
        throw error.response?.data || error.message;
    }
};

// Subcategory operations
export const createSubcategory = async (serviceId, formData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateSubcategory = async (serviceId, subcategoryName, formData) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteSubcategory = async (serviceId, subcategoryName) => {
    try {
        const response = await axiosInstance.delete(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Service Type operations
export const createServiceType = async (serviceId, subcategoryName, formData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}/types`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Add similar functions for updating and deleting service types

// Build the subcategory base path for category routes
const categoryBasePath = (serviceId, subcategoryName, typeName) =>
    typeName
        ? `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}/types/${typeName}`
        : `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}`;

// Category operations
export const createCategory = async (serviceId, subcategoryName, typeName, formData) => {
    try {
        const response = await axiosInstance.post(
            `${categoryBasePath(serviceId, subcategoryName, typeName)}/categories`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Service Type operations (completing the missing functions)
export const updateServiceType = async (serviceId, subcategoryName, typeKey, formData) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}/types/${typeKey}`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteServiceType = async (serviceId, subcategoryName, typeKey) => {
    try {
        const response = await axiosInstance.delete(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}/types/${typeKey}`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Category operations (completing the missing functions)
export const updateCategory = async (serviceId, subcategoryName, typeName, categoryId, formData) => {
    try {
        const response = await axiosInstance.put(
            `${categoryBasePath(serviceId, subcategoryName, typeName)}/categories/${categoryId}`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteCategory = async (serviceId, subcategoryName, typeName, categoryId) => {
    try {
        const response = await axiosInstance.delete(
            `${categoryBasePath(serviceId, subcategoryName, typeName)}/categories/${categoryId}`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Service Detail operations
export const createServiceDetail = async (serviceId, formData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/admin/services/${serviceId}/details`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateServiceDetail = async (serviceId, detailId, formData) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/services/${serviceId}/details/${detailId}`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteServiceDetail = async (serviceId, detailId) => {
    try {
        const response = await axiosInstance.delete(
            `${API_URL}/admin/services/${serviceId}/details/${detailId}`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// ---------- Provider APIs ----------

// Mobile OTP — Send 6-digit OTP (10-minute validity)
export const sendMobileOtp = async (phone) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/providers/mobile/send-otp`,
            { phone }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Mobile OTP — Verify 6-digit OTP
export const verifyMobileOtp = async (sessionId, otp) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/providers/mobile/verify-otp`,
            { sessionId, otp }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Email OTP — Send 6-digit OTP to provider email (10-minute validity)
export const sendEmailOtp = async (email) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/providers/email/send-otp`,
            { email }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Email OTP — Verify 6-digit OTP
export const verifyEmailOtp = async (sessionId, otp, email = "") => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/providers/email/verify-otp`,
            { sessionId, otp, email }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Aadhaar OTP (retained for backward compatibility)
export const sendAadhaarOtp = async (aadhaarNumber) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/providers/aadhaar/send-otp`,
            { aadhaarNumber }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const verifyAadhaarOtp = async (sessionId, otp) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/providers/aadhaar/verify-otp`,
            { sessionId, otp }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Register as a service provider (creates user + provider profile with pending status)
// Supports FormData for file uploads (profile photo + ID document) or regular JSON
export const registerProvider = async (providerData) => {
    try {
        const isFormData = typeof FormData !== "undefined" && providerData instanceof FormData;
        const config = isFormData
            ? { headers: { "Content-Type": "multipart/form-data" } }
            : {};
        const response = await axiosInstance.post(
            `${API_URL}/providers/register`,
            providerData,
            config
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get verified providers (optional category / search filters)
export const getProviders = async (params = {}) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/providers`, {
            params,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Find providers near a lat/lng position
export const getNearbyProviders = async (params) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/providers/nearby`, {
            params,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Personalized provider recommendations based on past bookings
export const getRecommendedProviders = async () => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/providers/recommended`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Public provider profile with reviews
export const getProviderById = async (providerId) => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/providers/${providerId}`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Current provider's own profile
export const getMyProviderProfile = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/providers/me`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Update current provider's profile
export const updateProviderProfile = async (profileData) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/providers/me`,
            profileData
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Bookings assigned to the current provider
export const getMyProviderBookings = async () => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/providers/me/bookings`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Update status of a booking assigned to current provider
export const updateProviderBookingStatus = async (bookingId, status) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/providers/me/bookings/${bookingId}/status`,
            { status }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Submit / update a review (star rating + comment) for a provider
export const submitProviderReview = async (providerId, reviewData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/providers/${providerId}/reviews`,
            reviewData
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// ---------- Admin Provider APIs ----------

// Get all providers (supports ?status=pending|approved|rejected|all)
export const getAllProvidersAdmin = async (status = "all") => {
    try {
        const query = status && status !== "all" ? `?status=${status}` : "";
        const response = await axiosInstance.get(`${API_URL}/admin/providers${query}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Approve a provider application
export const approveProvider = async (providerId) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/providers/${providerId}/approve`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Reject a provider application with reason
export const rejectProvider = async (providerId, reason = "") => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/providers/${providerId}/reject`,
            { reason }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Verify / unverify a provider (legacy compatibility)
export const verifyProvider = async (providerId, isVerified) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/providers/${providerId}/verify`,
            { isVerified }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Delete a provider profile
export const deleteProviderAdmin = async (providerId) => {
    try {
        const response = await axiosInstance.delete(
            `${API_URL}/admin/providers/${providerId}`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get all bookings (admin only)
export const getAllBookings = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/admin/bookings`);
        return response.data;
    } catch (error) {
        console.error("Error fetching all bookings:", error);
        throw error.response?.data || error.message;
    }
};

// Update booking status (admin only)
export const updateBookingStatus = async (bookingId, status) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/bookings/${bookingId}/status`,
            { status }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating booking status:", error);
        throw error.response?.data || error.message;
    }
};
