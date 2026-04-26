import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Home, Users, ArrowLeft, Upload, Plus } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ImportHabitacionesCSV } from '@/components/admin/ImportHabitacionesCSV'
import { AddHabitacionButton } from '@/components/admin/AddHabitacionButton'
import { ManageHabitacionModal } from '@/components/admin/ManageHabitacionModal'

export const dynamic = 'force-dynamic'

export default async function ResidenciaDetallePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    const { residenciaId, rol } = session!.user
    const { id: idStr } = await params
    const id = parseInt(idStr)

    // Protección: Si no es Admin Global, debe coincidir con su residenciaId
    if (rol !== 'ADMIN' || residenciaId) {
        if (id !== residenciaId) {
            redirect('/modules/residencias')
        }
    }
    
    const residencia = await prisma.residencia.findUnique({
        where: { id },
        include: {
            habitaciones: {
                orderBy: { numero: 'asc' },
                include: {
                    residentes: {
                        include: { user: true }
                    }
                }
            },
            _count: {
                select: { users: true, habitaciones: true }
            }
        }
    })

    if (!residencia) notFound()

    const stats = {
        total: residencia.habitaciones.length,
        libres: residencia.habitaciones.filter(h => h.estado === 'LIBRE').length,
        ocupadas: residencia.habitaciones.filter(h => h.estado === 'OCUPADO').length,
        reservadas: residencia.habitaciones.filter(h => h.estado === 'RESERVADO').length,
        porLiberar: residencia.habitaciones.filter(h => h.estado === 'POR_LIBERARSE').length
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header con Navegación */}
            <div className="flex flex-col gap-4">
                <Link 
                    href="/modules/residencias" 
                    className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#1D9E75] transition-colors w-fit"
                >
                    <ArrowLeft size={16} />
                    VOLVER A RESIDENCIAS
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <PageHeader 
                        title={residencia.nombre}
                        description={`Gestión de habitaciones y ocupación - ${residencia.direccion}`}
                    />
                    <div className="flex items-center gap-3">
                        <ImportHabitacionesCSV residenciaId={id} />
                        <AddHabitacionButton residenciaId={id} />
                    </div>
                </div>
            </div>

            {/* Panel de Estadísticas Senior */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Habitaciones', value: stats.total, color: 'bg-gray-50 text-gray-600', icon: <Home size={20} /> },
                    { label: 'Libres', value: stats.libres, color: 'bg-green-50 text-green-600', icon: <div className="w-2 h-2 rounded-full bg-green-500" /> },
                    { label: 'Ocupadas', value: stats.ocupadas, color: 'bg-indigo-50 text-indigo-600', icon: <div className="w-2 h-2 rounded-full bg-indigo-500" /> },
                    { label: 'Reservadas', value: stats.reservadas, color: 'bg-orange-50 text-orange-600', icon: <div className="w-2 h-2 rounded-full bg-orange-500" /> },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.color} p-6 rounded-[2rem] border border-white shadow-sm flex flex-col gap-2`}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{stat.label}</span>
                            {stat.icon}
                        </div>
                        <span className="text-3xl font-black">{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Listado de Habitaciones */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[#072E1F]">Inventario de Habitaciones</h2>
                        <p className="text-sm text-gray-400 font-medium">Control total de disponibilidad y residentes asigandos.</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">Nº Habitación</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">Piso</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">Capacidad</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">Estado</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">Residentes</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {residencia.habitaciones.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-medium">
                                        No hay habitaciones registradas. Empieza importando un CSV o agregando una manualmente.
                                    </td>
                                </tr>
                            ) : (
                                residencia.habitaciones.map((hab) => (
                                    <tr key={hab.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#072E1F] text-white flex items-center justify-center font-black text-xs">
                                                    {hab.numero}
                                                </div>
                                                <span className="font-bold text-gray-700">Habitación {hab.numero}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 font-bold text-gray-500">Piso {hab.piso}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-1.5 font-bold text-gray-600">
                                                <Users size={14} className="text-gray-400" />
                                                {hab.residentes.length} / {hab.capacidad}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <StatusBadge status={hab.estado} />
                                        </td>
                                        <td className="px-8 py-5">
                                            {hab.residentes.length > 0 ? (
                                                <div className="flex -space-x-2">
                                                    {hab.residentes.map((r, i) => (
                                                        <div key={i} title={r.user.nombre} className="w-8 h-8 rounded-full border-2 border-white bg-[#1D9E75] text-white flex items-center justify-center text-[10px] font-black">
                                                            {r.user.nombre.charAt(0)}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Sin asignar</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            <ManageHabitacionModal habitacion={hab} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
