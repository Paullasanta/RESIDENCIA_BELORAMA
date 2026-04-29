export default function LoadingDashboard() {
    return (
        <div className="space-y-10 animate-pulse p-4">
            <div className="h-20 bg-gray-100 rounded-[2rem] w-1/3"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-gray-50 rounded-[2rem]"></div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-96 bg-gray-50 rounded-[2rem]"></div>
                <div className="h-96 bg-gray-50 rounded-[2rem]"></div>
            </div>
        </div>
    )
}
