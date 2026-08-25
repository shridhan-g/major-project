import { useState } from "react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { Loader, Locate, MapPin } from "lucide-react";

export const Location = () => {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const getCurrentLocation = () => {
        setIsLoading(true);
        setError(null);

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                // Success callback
                (position) => {
                    const { latitude, longitude } = position.coords;

                    // Use Google Places to get a readable address if available
                    if (window.google?.maps?.Geocoder) {
                        const geocoder = new window.google.maps.Geocoder();
                        geocoder.geocode(
                            { location: { lat: latitude, lng: longitude } },
                            (results, status) => {
                                setIsLoading(false);
                                if (status === "OK" && results[0]) {
                                    setCurrentLocation({
                                        label: results[0].formatted_address,
                                        value: {
                                            description:
                                                results[0].formatted_address,
                                            place_id: results[0].place_id,
                                        },
                                    });
                                } else {
                                    setError("Unable to get location details");
                                }
                            }
                        );
                    } else {
                        setIsLoading(false);
                        setCurrentLocation({
                            label: `Current Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
                            value: {
                                description: `Lat: ${latitude}, Lng: ${longitude}`,
                                place_id: "geo_curr",
                            },
                        });
                    }
                },
                // Error callback
                (error) => {
                    setIsLoading(false);
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            setError("Location access denied by user");
                            break;
                        case error.POSITION_UNAVAILABLE:
                            setError("Location information is unavailable");
                            break;
                        case error.TIMEOUT:
                            setError("Location request timed out");
                            break;
                        default:
                            setError("An unknown error occurred");
                    }
                }
            );
        } else {
            setError("Geolocation is not supported by this browser");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-80 sm:w-96 min-h-80 p-6 sm:p-8 relative">
            <div className="text-center mb-5">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    Select your location
                </h1>
            </div>
            {isLoading && (
                <div className="absolute top-7 right-6">
                    <Loader size={18} className="animate-spin text-blue-600" />
                </div>
            )}

            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

            <div className="w-full flex flex-col gap-3">
                <GooglePlacesAutocomplete
                    apiKey={import.meta.env.VITE_PLACES_NEW_API_KEY}
                    apiOptions={{ language: "en", region: "in" }}
                    selectProps={{
                        value: currentLocation,
                        onChange: setCurrentLocation,
                        placeholder: "Select a location",
                        className:
                            "w-full flex-grow rounded-lg border border-slate-300 dark:border-slate-600",
                        styles: {
                            control: (base) => ({
                                ...base,
                                borderRadius: "0.5rem",
                                borderColor: "transparent",
                                padding: "0.1rem",
                                boxShadow: "none",
                                "&:hover": { borderColor: "transparent" },
                            }),
                        },
                    }}
                />
                <button
                    onClick={getCurrentLocation}
                    className="flex items-center justify-center gap-2 rounded-full bg-brand-gradient text-white text-sm font-semibold p-2.5 hover:opacity-90 transition-all disabled:opacity-50"
                    disabled={isLoading}
                >
                    <Locate size={18} />
                    Use Current Location
                </button>
                <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <MapPin size={14} className="shrink-0 mt-0.5 text-blue-600" />
                    <span>
                        Your location helps us show nearby providers and services.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Location;
