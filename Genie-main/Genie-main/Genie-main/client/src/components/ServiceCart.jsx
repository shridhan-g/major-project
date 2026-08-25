import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { clearCartImg } from "../assets";
import { Link } from "react-router-dom";

export default function ServiceCart() {
    const { cartServices, addToCart, removeFromCart, clearCart, getCartTotal } =
        useContext(CartContext);

    return (
        <div className="flex flex-col justify-between h-full w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between py-4 px-4 mb-4">
                <h1 className="text-lg font-semibold">Cart</h1>
                <button
                    onClick={clearCart}
                    className="rounded p-1 hover:bg-white/20 transition-colors"
                >
                    <img src={clearCartImg} alt="" className="h-5" />
                </button>
            </div>
            <div className="h-full overflow-y-auto px-4 pr-4 flex flex-col gap-4">
                {cartServices.map((service, id) => (
                    <div key={id}>
                        <div className="flex justify-between items-end gap-4">
                            <div className="flex gap-4 w-2/3">
                                <div className="text-sm">
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {service.title}
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-400">
                                        ₹{service.OurPrice}
                                    </p>
                                </div>
                            </div>

                            <div className="w-20 h-7 flex items-center justify-center text-sm border border-slate-300 dark:border-slate-600 rounded-full overflow-hidden bg-white dark:bg-slate-800">
                                <button
                                    onClick={() => removeFromCart(service)}
                                    className="w-full h-full text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    -
                                </button>
                                <span className="bg-transparent w-20 h-full leading-[1.75rem] text-center text-slate-900 dark:text-white">
                                    {
                                        cartServices.find(
                                            (cartService) =>
                                                cartService._id === service._id
                                        ).quantity
                                    }
                                </span>
                                <button
                                    onClick={() => addToCart(service)}
                                    className="w-full h-full text-slate-900 dark:text-white border-l border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        {id < cartServices.length - 1 && (
                            <hr className="border-t border-dashed border-slate-300 dark:border-slate-600 my-4" />
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-brand-gradient text-white flex items-center justify-between p-3 px-4 mt-4 text-nowrap text-sm uppercase">
                <div className="flex gap-2">
                    <p>Total:</p>
                    <p>₹{getCartTotal()}</p>
                </div>
                <Link
                    to="/viewcart"
                    className="flex gap-2 items-center uppercase text-xs tracking-wider font-bold bg-white text-blue-700 rounded-full px-3 py-1.5 hover:bg-slate-100 transition-colors"
                >
                    View Cart
                </Link>
            </div>
        </div>
    );
}
