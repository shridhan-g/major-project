import { createContext, useContext, useEffect, useRef, useState } from "react";
import { updateUserCart, clearUserCart, getUserDetails } from "../utils/api";

export const CART_STORAGE_KEY = "userCart";
const CartContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};

export const CartProvider = ({ children, isAuthenticated }) => {
    const [cartServices, setCartServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Tracks whether the initial cart load has completed so the sync effect
    // doesn't fire with a stale empty array before server data arrives.
    const initializedRef = useRef(false);

    // Initialize and handle auth state changes
    useEffect(() => {
        const initializeCart = async () => {
            try {
                setLoading(true);
                if (isAuthenticated) {
                    const response = await getUserDetails();
                    if (response.user && Array.isArray(response.user.cart)) {
                        const localCart = JSON.parse(
                            localStorage.getItem(CART_STORAGE_KEY) || "[]"
                        );

                        // Transform server cart
                        const transformedServerCart = response.user.cart.map(
                            (item) => ({
                                _id: item.service,
                                quantity: item.quantity,
                                title: item.title,
                                OurPrice: item.OurPrice,
                                category: item.category,
                                type: item.type,
                                time: item.time,
                                MRP: item.MRP,
                                description: item.description,
                                image: item.image,
                            })
                        );

                        if (localCart.length > 0) {
                            // Merge carts only if there are items in local storage
                            const mergedCart = await mergeCartsOnLogin(
                                localCart,
                                transformedServerCart
                            );
                            setCartServices(mergedCart);
                            localStorage.removeItem(CART_STORAGE_KEY);
                        } else {
                            // Use server cart if no local cart
                            setCartServices(transformedServerCart);
                        }
                    }
                } else {
                    // Not authenticated - use local storage
                    const localCart = JSON.parse(
                        localStorage.getItem(CART_STORAGE_KEY) || "[]"
                    );
                    setCartServices(localCart);
                }
            } catch (err) {
                console.error("Cart initialization error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
                initializedRef.current = true;
            }
        };

        // Reset the flag when auth changes so we re-initialise cleanly
        initializedRef.current = false;
        initializeCart();
    }, [isAuthenticated]);

    // Sync cart to server / localStorage whenever it changes,
    // but only AFTER the initial load has completed.
    useEffect(() => {
        if (!initializedRef.current) return;
        if (isAuthenticated) {
            if (cartServices.length > 0) {
                updateUserCart(cartServices).catch((err) => {
                    console.error("Error updating server cart:", err);
                    setError(err.message);
                });
            }
        } else {
            localStorage.setItem(
                CART_STORAGE_KEY,
                JSON.stringify(cartServices)
            );
        }
    }, [cartServices, isAuthenticated]);

    const mergeCartsOnLogin = async (localCart, serverCart) => {
        const mergedCart = [...serverCart];

        localCart.forEach((localItem) => {
            const existingItem = mergedCart.find(
                (item) => item._id === localItem._id
            );
            if (existingItem) {
                existingItem.quantity += localItem.quantity;
            } else {
                mergedCart.push(localItem);
            }
        });

        // Update server with merged cart
        try {
            await updateUserCart(mergedCart);
            return mergedCart;
        } catch (error) {
            console.error("Error updating merged cart:", error);
            throw error;
        }
    };

    const addToCart = async (service) => {
        try {
            setCartServices((prevServices) => {
                const existingItemIndex = prevServices.findIndex(
                    (item) => item._id === service._id
                );

                if (existingItemIndex !== -1) {
                    const updatedServices = [...prevServices];
                    updatedServices[existingItemIndex] = {
                        ...updatedServices[existingItemIndex],
                        quantity:
                            updatedServices[existingItemIndex].quantity + 1,
                    };
                    return updatedServices;
                }

                return [...prevServices, { ...service, quantity: 1 }];
            });
        } catch (err) {
            setError(err.message);
        }
    };

    const removeFromCart = async (service) => {
        try {
            setCartServices((prevServices) => {
                const existingItem = prevServices.find(
                    (item) => item._id === service._id
                );

                if (existingItem && existingItem.quantity > 1) {
                    // If quantity > 1, decrement quantity
                    return prevServices.map((item) =>
                        item._id === service._id
                            ? { ...item, quantity: item.quantity - 1 }
                            : item
                    );
                }

                // If quantity is 1 or item not found, remove item
                return prevServices.filter((item) => item._id !== service._id);
            });
        } catch (err) {
            setError(err.message);
        }
    };

    const clearCart = async () => {
        try {
            if (isAuthenticated) {
                await clearUserCart();
            }
            setCartServices([]);
            if (!isAuthenticated) {
                localStorage.removeItem(CART_STORAGE_KEY);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const getCartSubTotal = () => {
        const totalInclusive = cartServices.reduce(
            (total, item) => total + item.OurPrice * item.quantity,
            0
        );
        const tax = totalInclusive * 0.18;
        return (totalInclusive - tax).toFixed(2);
    };

    const getCartTax = () => {
        return (
            cartServices.reduce(
                (total, item) => total + item.OurPrice * item.quantity,
                0
            ) * 0.18
        ).toFixed(2);
    };

    const getCartTotal = () => {
        return cartServices
            .reduce((total, item) => total + item.OurPrice * item.quantity, 0)
            .toFixed(2);
    };

    const getCartCount = () => {
        return cartServices.reduce((count, item) => count + item.quantity, 0);
    };

    // Find cart item by service ID
    const findCartItem = (serviceId) => {
        return cartServices.find((item) => item._id === serviceId);
    };

    return (
        <CartContext.Provider
            value={{
                cartServices, // Matches your existing code structure
                loading,
                error,
                addToCart,
                removeFromCart,
                clearCart,
                getCartSubTotal,
                getCartTax,
                getCartTotal,
                getCartCount,
                findCartItem,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export { CartContext };
