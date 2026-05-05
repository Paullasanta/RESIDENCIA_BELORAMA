'use client'

import { useRouter } from 'next/navigation'
import { Users, Home, WashingMachine } from 'lucide-react'
import { ResidenciaCardActions } from '@/components/admin/ResidenciaCardActions'
import { StatusBadge } from '@/components/shared/StatusBadge'

interface ResidenciaCardProps {
    res: any
}

export function ResidenciaCard({ res }: ResidenciaCardProps) {
    const router = useRouter()

    const handleClick = () => {
        router.push(`/modules/residencias/${res.id}`)
    }

    const disponibles = res.habitaciones.filter((h: any) => h.estado === 'LIBRE').length
    const ocupadas = res.habitaciones.length - disponibles
    const ocupPct = res.habitaciones.length > 0
        ? Math.round((ocupadas / res.habitaciones.length) * 100)
        : 0

    return (
        <div 
            onClick={handleClick}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#1D9E75]/30 cursor-pointer select-none ring-offset-2 focus-within:ring-2 focus-within:ring-[#1D9E75]"
            suppressHydrationWarning
        >
            {/* Header */}
            <div className="p-6 border-b border-gray-50 bg-white group-hover:bg-green-50/10 transition-colors">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-black text-[#072E1F] group-hover:text-[#1D9E75] transition-colors">{res.nombre}</h3>
                        <p className="text-sm text-gray-400 mt-1 font-medium">{res.direccion}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={res.activa ? 'ACTIVA' : 'INACTIVA'} />
                        <div onClick={(e) => e.stopPropagation()}>
                            <ResidenciaCardActions residencia={res} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="p-6 space-y-5">
                <div className="flex gap-6">
                    <div className="flex items-center gap-2.5 text-sm text-gray-500">
                        <div className="p-2 rounded-lg bg-green-50 text-[#1D9E75]">
                            <Users size={16} />
                        </div>
                        <span><strong className="text-gray-900 font-black">{res._count.users}</strong> usuarios</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-gray-500">
                        <div className="p-2 rounded-lg bg-orange-50 text-[#EF9F27]">
                            <Home size={16} />
                        </div>
                        <span><strong className="text-gray-900 font-black">{res._count.habitaciones}</strong> hab.</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-gray-500">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                            <WashingMachine size={16} />
                        </div>
                        <span><strong className="text-gray-900 font-black">{res._count.lavadoras || 0}</strong> lav.</span>
                    </div>
                </div>

                {/* Ocupación Bar */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ocupación Sistema</span>
                        <span className="text-sm font-black text-[#072E1F]">{ocupPct}%</span>
                    </div>
                    <div className="h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${ocupPct > 80 ? 'bg-red-500' : 'bg-[#1D9E75]'}`}
                            style={{ width: `${ocupPct}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                        <span className="text-green-600">{disponibles} LIBRES</span>
                        <span className="text-gray-400">{ocupadas} OCUPADAS</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacidad máx: {res.capacidad} PAX</p>
                <span className="text-[10px] font-black text-[#1D9E75] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Ver más</span>
            </div>
        </div>
    )
}
