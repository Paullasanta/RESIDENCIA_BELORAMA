import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Users, UserPlus, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { DeleteResidenteButton } from '@/components/shared/DeleteResidenteButton'

export default async function ResidentesPage() {
    const residentes = await prisma.residente.findMany({
        include: {
            user: true,
            habitacion: {
                include: { residencia: true },
            },
            pagos: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
        orderBy: { fechaIngreso: 'desc' },
    })

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Residentes"
                description={`${residentes.length} residente${residentes.length !== 1 ? 's' : ''} en el sistema.`}
            >
                <Link
                    href="/admin/residentes/nuevo"
                    className="flex items-center gap-2 bg-[#1D9E75] hover:bg-[#167e5d] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-[#1D9E75]/20 text-sm"
                >
                    <UserPlus size={18} />
                    Añadir Nuevo
                </Link>
            </PageHeader>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {residentes.length === 0 ? (
                    <EmptyState
                        icon={<Users size={48} />}
                        title="No hay residentes registrados"
                        description="Los residentes aparecerán aquí una vez que se den de alta en el sistema."
                    />
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/80">
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Residente</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Habitación</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Residencia</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Último Pago</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Estado</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Ingreso</th>
                                <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {residentes.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] font-bold text-sm">
                                                {r.user.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{r.user.nombre}</p>
                                                <p className="text-xs text-gray-400">{r.user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {r.habitacion ? `Hab. ${r.habitacion.numero} — Piso ${r.habitacion.piso}` : <span className="text-gray-400 italic">Sin asignar</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {r.habitacion?.residencia?.nombre ?? <span className="text-gray-400 italic">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {r.pagos[0] ? `$${r.pagos[0].monto.toLocaleString('es-MX')}` : <span className="text-gray-400 italic">Sin pagos</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {r.pagos[0] ? (
                                            <StatusBadge status={r.pagos[0].estado as any} />
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {new Date(r.fechaIngreso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                href={`/admin/residentes/${r.id}/editar`}
                                                className="p-2 text-gray-400 hover:text-[#1D9E75] hover:bg-[#1D9E75]/5 rounded-lg transition-colors"
                                                title="Editar residente"
                                            >
                                                <Edit2 size={16} />
                                            </Link>
                                            <DeleteResidenteButton id={r.id} nombre={r.user.nombre} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
