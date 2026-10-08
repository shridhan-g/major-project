import { useEffect, useState } from "react";
import { getServices } from "../utils/api";
import Services from "./Services";
import SkeletonService from "./SkeletonService";
import { SkeletonTheme } from "react-loading-skeleton";
import PortalLayout from "./PortalLayout";
import ServiceDetails from "./ServiceDetails";
import { Sparkles } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { t } from "../utils/translations";

import { Link } from "react-router-dom";

export default function ServicesSection() {
    const [servicesData, setServicesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);
    const { lang } = useLang();

    const handleServiceClick = (serviceName) => {
        setSelectedService(serviceName);
    };

    useEffect(() => {
        const fetchServices = async () => {
            try {
                setIsLoading(true);
                const data = await getServices();
                // Sort services based on the 'order' property
                const sortedData = data.sort((a, b) => a.order - b.order);
                setServicesData(sortedData);
            } catch (error) {
                console.error("Error fetching services:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchServices();
    }, []);

    return (
        <>
            <section id="services" className="scroll-mt-24 py-14">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
                        <div>
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">
                                <Sparkles size={14} /> {t(lang, "services_what_we_offer")}
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-[NeuwMachinaBold] text-slate-900 dark:text-white">
                                {t(lang, "services_heading")} <span className="text-gradient">{t(lang, "services_heading_2")}</span>
                            </h2>
                            <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-xl">
                                {t(lang, "services_subtitle")}
                            </p>
                        </div>
                        {/* <Link
                            to="/services"
                            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors self-start sm:self-auto py-2"
                        >
                            View All Available Services →
                        </Link> */}
                    </div>

                    <SkeletonTheme baseColor="#cbd5e1" highlightColor="#e2e8f0">
                        <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5 pt-8">
                            {isLoading
                                ? Array(6).fill().map((_, index) => (
                                    <SkeletonService key={index} />
                                ))
                                : servicesData.map((service, index) => (
                                    <Services
                                        key={service._id}
                                        serviceImage={service.serviceImage}
                                        serviceName={service.serviceName}
                                        onServiceClick={handleServiceClick}
                                        delay={index * 60}
                                    />
                                ))}
                        </div>
                    </SkeletonTheme>
                </div>
            </section>
            <PortalLayout
                isOpen={!!selectedService}
                onClose={() => setSelectedService(null)}
            >
                {selectedService && (
                    <ServiceDetails serviceName={selectedService} />
                )}
            </PortalLayout>
        </>
    );
}
