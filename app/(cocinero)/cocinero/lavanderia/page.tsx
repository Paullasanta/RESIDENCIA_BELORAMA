import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { WashingMachine } from 'lucide-react'

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const
const DIA_LABEL: Record<string, string> = {
    LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié', JUEVES: 'Jue',
    VIERNES: 'Vie', SABADO: 'Sáb', DOMINGO: 'Dom',
}

export default async function LavanderiaCocineroPage() {
    const session = await auth()

    const userDb = await prisma.user.findUnique({
        where: { email: session!.user.email },
        include: { residencia: true },
    })

    const residenciaId = userDb?.residenciaId

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

    const libres = turnos.filter(t => t.estado === 'LIBRE').length
    const ocupados = turnos.filter(t => t.estado === 'OCUPADO').length

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Lavandería (Personal)"
                description={userDb?.residencia?.nombre ?? 'Tu residencia'}
            />

            {!residenciaId ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <EmptyState
                        icon={<WashingMachine size={48} />}
                        title="Sin residencia asignada"
                        description="Contacta al administrador para ser asignado a una residencia."
                    />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-2xl font-extrabold text-green-600">{libres}</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Turnos Libres</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-2xl font-extrabold text-red-500">{ocupados}</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Turnos Ocupados</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-2xl font-extrabold text-[#085041]">{lavadoras.length}</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Lavadoras</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-2xl font-extrabold text-gray-800">{turnos.length}</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">Total Turnos</p>
                        </div>
                    </div>

                    {lavadoras.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <EmptyState
                                icon={<WashingMachine size={48} />}
                                title="Sin lavadoras configuradas"
                                description="El administrador debe agregar lavadoras a esta residencia."
                            />
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {lavadoras.map(lav => (
                                <div key={lav.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                                        <WashingMachine size={18} className="text-[#085041]" />
                                        <h3 className="font-bold text-[#085041]">{lav.nombre}</h3>
                                        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${lav.activa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                            {lav.activa ? 'Operativa' : 'Fuera de servicio'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-7 divide-x divide-gray-100">
                                        {DIAS.map(dia => {
                                            const turnosDia = turnos.filter(t => t.lavadoraId === lav.id && t.dia === dia)
                                            return (
                                                <div key={dia} className="min-h-[100px]">
                                                    <div className="px-2 py-2 bg-gray-50 border-b border-gray-100 text-center">
                                                        <p className="text-xs font-bold text-gray-500">{DIA_LABEL[dia]}</p>
                                                    </div>
                                                    <div className="p-1.5 space-y-1">
                                                        {turnosDia.length === 0 ? (
                                                            <p className="text-xs text-gray-300 text-center mt-3 italic">—</p>
                                                        ) : turnosDia.map(t => (
                                                            <div key={t.id} className={`rounded-lg p-1.5 text-xs border ${
                                                                t.estado === 'LIBRE' ? 'bg-green-50 text-green-700 border-green-100' :
                                                                t.estado === 'OCUPADO' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                            }`}>
                                                                <p className="font-semibold">{t.horaInicio}</p>
                                                                <p className="opacity-70 truncate">{t.residente?.user.nombre ?? t.estado}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
