export default function DashboardLoading() {
    return (
        <div className="w-full h-full p-10 space-y-8 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="space-y-3">
                    <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
                    <div className="h-4 w-72 bg-gray-100 rounded-md"></div>
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 shadow-sm"></div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="h-12 bg-gray-50 border-b border-gray-100"></div>
                <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-8 bg-gray-50 rounded-lg"></div>
                    ))}
                </div>
            </div>
        </div>
    )
}
