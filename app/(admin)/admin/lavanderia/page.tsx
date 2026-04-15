import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { WashingMachine } from 'lucide-react'

const DIAS: Array<'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO'> = [
    'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'
]

const DIA_LABEL: Record<string, string> = {
    LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié', JUEVES: 'Jue',
    VIERNES: 'Vie', SABADO: 'Sáb', DOMINGO: 'Dom',
}

export default async function LavanderiaPage() {
    const turnos = await prisma.turnoLavanderia.findMany({
        include: {
            lavadora: true,
            residente: { include: { user: true } },
        },
        orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }],
    })

    const lavadoras = await prisma.lavadora.findMany({ orderBy: { nombre: 'asc' } })

    // Group by lavadora
    const turnosByLavadora = lavadoras.map(lav => ({
        lavadora: lav,
        days: DIAS.map(dia => ({
            dia,
            turnos: turnos.filter(t => t.lavadoraId === lav.id && t.dia === dia),
        })),
    }))

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Lavandería"
                description="Vista semanal de turnos por lavadora."
            />

            {lavadoras.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <EmptyState
                        icon={<WashingMachine size={48} />}
                        title="No hay lavadoras registradas"
                        description="Agrega lavadoras a las residencias para gestionar los turnos."
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    {turnosByLavadora.map(({ lavadora, days }) => (
                        <div key={lavadora.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                <WashingMachine size={20} className="text-[#1D9E75]" />
                                <h3 className="font-bold text-[#072E1F]">{lavadora.nombre}</h3>
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${lavadora.activa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                    {lavadora.activa ? 'Operativa' : 'Fuera de servicio'}
                                </span>
                            </div>
                            <div className="grid grid-cols-7 divide-x divide-gray-100">
                                {days.map(({ dia, turnos: turnosDia }) => (
                                    <div key={dia} className="min-h-[140px]">
                                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-center">
                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{DIA_LABEL[dia]}</p>
                                        </div>
                                        <div className="p-2 space-y-1.5">
                                            {turnosDia.length === 0 ? (
                                                <p className="text-xs text-gray-300 text-center mt-2 italic">—</p>
                                            ) : turnosDia.map(t => (
                                                <div key={t.id} className={`rounded-lg p-2 text-xs ${
                                                    t.estado === 'LIBRE' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                    t.estado === 'OCUPADO' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                    'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                                }`}>
                                                    <p className="font-semibold">{t.horaInicio}–{t.horaFin}</p>
                                                    {t.residente && <p className="truncate mt-0.5">{t.residente.user.nombre}</p>}
                                                    <span className="mt-1 inline-block opacity-70">{t.estado}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
