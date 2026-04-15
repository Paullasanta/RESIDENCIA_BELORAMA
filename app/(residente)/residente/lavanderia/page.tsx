import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { WashingMachine } from 'lucide-react'

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const
const DIA_LABEL: Record<string, string> = {
    LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', JUEVES: 'Jueves',
    VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
}

export default async function LavanderiaResidentePage() {
    const session = await auth()

    const residente = await prisma.residente.findFirst({
        where: { user: { email: session!.user.email } },
        include: { habitacion: { include: { residencia: true } } },
    })

    const residenciaId = residente?.habitacion?.residenciaId

    const turnos = residenciaId
        ? await prisma.turnoLavanderia.findMany({
            where: { residenciaId },
            include: {
                lavadora: true,
                residente: { include: { user: true } },
            },
            orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }],
        })
        : []

    const lavadoras = residenciaId
        ? await prisma.lavadora.findMany({ where: { residenciaId }, orderBy: { nombre: 'asc' } })
        : []

    const misturnosIds = turnos
        .filter(t => t.residenteId === residente?.id)
        .map(t => t.id)

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Lavandería"
                description={residenciaId ? `Turnos de ${residente?.habitacion?.residencia?.nombre}` : 'Sin residencia asignada'}
            />

            {!residenciaId ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <EmptyState
                        icon={<WashingMachine size={48} />}
                        title="Sin residencia asignada"
                        description="Necesitas estar asignado a una habitación para ver los turnos de lavandería."
                    />
                </div>
            ) : lavadoras.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <EmptyState
                        icon={<WashingMachine size={48} />}
                        title="Sin lavadoras registradas"
                        description="Tu residencia aún no tiene lavadoras configuradas."
                    />
                </div>
            ) : (
                <>
                    {/* Mis turnos */}
                    {misturnosIds.length > 0 && (
                        <div className="bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-2xl p-5">
                            <h2 className="text-sm font-bold text-[#1D9E75] mb-3 uppercase tracking-wider">Mis Turnos</h2>
                            <div className="flex flex-wrap gap-3">
                                {turnos.filter(t => t.residenteId === residente?.id).map(t => (
                                    <div key={t.id} className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-[#1D9E75]/20">
                                        <p className="text-xs text-gray-500">{DIA_LABEL[t.dia]}</p>
                                        <p className="font-bold text-gray-900 text-sm">{t.horaInicio} – {t.horaFin}</p>
                                        <p className="text-xs text-[#1D9E75] mt-0.5">{t.lavadora.nombre}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Grilla semanal por lavadora */}
                    <div className="space-y-5">
                        {lavadoras.map(lav => (
                            <div key={lav.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                                    <WashingMachine size={18} className="text-[#1D9E75]" />
                                    <h3 className="font-bold text-[#072E1F]">{lav.nombre}</h3>
                                </div>
                                <div className="grid grid-cols-7 divide-x divide-gray-100">
                                    {DIAS.map(dia => {
                                        const turnosDia = turnos.filter(t => t.lavadoraId === lav.id && t.dia === dia)
                                        return (
                                            <div key={dia} className="min-h-[100px]">
                                                <div className="px-2 py-2 bg-gray-50 border-b border-gray-100 text-center">
                                                    <p className="text-xs font-bold text-gray-500">{DIA_LABEL[dia].slice(0, 3)}</p>
                                                </div>
                                                <div className="p-1.5 space-y-1">
                                                    {turnosDia.length === 0 ? (
                                                        <p className="text-xs text-gray-300 text-center mt-3 italic">—</p>
                                                    ) : turnosDia.map(t => {
                                                        const esMio = t.residenteId === residente?.id
                                                        return (
                                                            <div key={t.id} className={`rounded-lg p-1.5 text-xs border ${
                                                                esMio ? 'bg-[#1D9E75] text-white border-[#1D9E75]' :
                                                                t.estado === 'LIBRE' ? 'bg-green-50 text-green-700 border-green-100' :
                                                                t.estado === 'OCUPADO' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                            }`}>
                                                                <p className="font-semibold leading-tight">{t.horaInicio}</p>
                                                                <p className="opacity-80">{esMio ? 'Mío' : t.estado}</p>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
