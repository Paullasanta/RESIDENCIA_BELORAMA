import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Receipt, TrendingDown, Plus } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'

export default async function EgresosPage() {
    const egresos = await prisma.egreso.findMany({
        include: {
            residencia: true,
            admin: true,
        },
        orderBy: { fecha: 'desc' },
    })

    const totalEgresos = egresos.reduce((acc, current) => acc + current.monto, 0)

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <PageHeader
                title="Egresos Operativos"
                description="Registro y control de gastos de las residencias."
            >
                <div className="flex items-center gap-3">
                    <div className="bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">
                        <p className="text-[10px] font-bold uppercase text-red-400 leading-none mb-1">Total Gastado</p>
                        <p className="text-xl font-black text-red-600 leading-none">${totalEgresos.toLocaleString('es-MX')}</p>
                    </div>
                </div>
            </PageHeader>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {egresos.length === 0 ? (
                    <EmptyState
                        icon={<Receipt size={48} />}
                        title="No hay egresos registrados"
                        description="Registra los gastos operativos aquí."
                    />
                ) : (
                    <table className="w-full text-sm text-gray-600">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="text-left px-6 py-5 font-bold uppercase tracking-wider text-xs">Concepto / Categoría</th>
                                <th className="text-left px-6 py-5 font-bold uppercase tracking-wider text-xs">Residencia</th>
                                <th className="text-left px-6 py-5 font-bold uppercase tracking-wider text-xs">Monto</th>
                                <th className="text-left px-6 py-5 font-bold uppercase tracking-wider text-xs">Administrador</th>
                                <th className="text-left px-6 py-5 font-bold uppercase tracking-wider text-xs">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {egresos.map((egreso: any) => (
                                <tr key={egreso.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900">{egreso.concepto}</p>
                                        <p className="text-xs text-gray-400 capitalize">{egreso.categoria}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">
                                            {egreso.residencia?.nombre || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-lg font-bold text-red-600">-${egreso.monto.toLocaleString('es-MX')}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#072E1F] text-white flex items-center justify-center text-[10px] font-bold">
                                                {egreso.admin.nombre.charAt(0)}
                                            </div>
                                            <span className="text-xs">{egreso.admin.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-400">
                                        {new Date(egreso.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
