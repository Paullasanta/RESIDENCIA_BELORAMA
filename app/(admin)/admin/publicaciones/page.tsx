import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Megaphone, MapPin, Home } from 'lucide-react'

export default async function PublicacionesPage() {
    const publicaciones = await prisma.publicacionHabitacion.findMany({
        include: {
            habitacion: true,
            residencia: true,
        },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Avisos de Habitaciones"
                description="Publicaciones de habitaciones disponibles para nuevos residentes."
            />

            {publicaciones.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <EmptyState
                        icon={<Megaphone size={48} />}
                        title="No hay publicaciones activas"
                        description="Cuando se publiquen habitaciones disponibles aparecerán aquí."
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {publicaciones.map(pub => (
                        <div key={pub.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${pub.activa ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                            {/* Color top bar */}
                            <div className={`h-1.5 ${pub.activa ? 'bg-[#1D9E75]' : 'bg-gray-300'}`} />
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-bold text-gray-900 leading-tight flex-1 pr-2">{pub.titulo}</h3>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${pub.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {pub.activa ? 'Activa' : 'Inactiva'}
                                    </span>
                                </div>
                                {pub.descripcion && <p className="text-sm text-gray-500 mb-4">{pub.descripcion}</p>}
                                <div className="space-y-1.5 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Home size={14} className="text-[#1D9E75]" />
                                        <span>{pub.residencia.nombre} — Hab. {pub.habitacion.numero}</span>
                                    </div>
                                    {(pub.coordLat || pub.coordLng) && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-[#EF9F27]" />
                                            <span className="text-xs text-gray-400">{pub.coordLat?.toFixed(4)}, {pub.coordLng?.toFixed(4)}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-4">
                                    {new Date(pub.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
