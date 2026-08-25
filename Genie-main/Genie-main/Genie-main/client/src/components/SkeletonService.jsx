export default function SkeletonService() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="skeleton w-full h-28 sm:h-32" />
            <div className="p-3 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                <div className="skeleton h-3 w-3/4 rounded-full" />
                <div className="skeleton h-3 w-1/2 rounded-full" />
            </div>
        </div>
    );
}
