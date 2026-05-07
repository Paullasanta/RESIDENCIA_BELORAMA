import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Wrench, Plus, Clock, CheckCircle2, AlertTriangle, MessageSquare, Calendar } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TicketActions } from '@/components/mantenimiento/TicketActions'

export default async function MantenimientoPage() {
    const session = await auth()
    const { rol, residenciaId } = session!.user
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(rol)

    // Aislamiento: Filtrar por residenciaId si no es global admin
    const whereClause: any = {}
    if (rol !== 'ADMIN' || residenciaId) {
        whereClause.residenciaId = residenciaId || -1
    }

    // Si es residente, solo ve sus propios tickets
    if (rol === 'RESIDENTE') {
        const residente = await prisma.residente.findFirst({
            where: { user: { email: session!.user.email as string } }
        })
        whereClause.residenteId = residente?.id || -1
    }

    const tickets = await prisma.ticketMantenimiento.findMany({
        where: whereClause,
        include: {
            residente: { include: { user: true } },
            residencia: true
        },
        orderBy: { createdAt: 'desc' }
    })

    const STATS_CONFIG = {
        PENDIENTE: { color: 'text-amber-500', icon: <Clock size={16} />, label: 'Pendiente' },
        EN_PROCESO: { color: 'text-blue-500', icon: <Wrench size={16} />, label: 'En Curso' },
        RESUELTO: { color: 'text-green-500', icon: <CheckCircle2 size={16} />, label: 'Resuelto' },
        CANCELADO: { color: 'text-gray-400', icon: <MessageSquare size={16} />, label: 'Cancelado' },
    }

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <PageHeader
                    title="Mantenimiento"
                    description={isAdmin ? "Gestión y seguimiento de incidencias técnicas." : "Reporta fallos en tu habitación o áreas comunes."}
                />
                {!isAdmin && (
                    <Link
                        href="/modules/mantenimiento/nuevo"
                        className="flex items-center justify-center gap-2 bg-[#072E1F] text-white px-8 py-4 rounded-2xl font-black hover:bg-[#1D9E75] transition-all shadow-xl shadow-[#072E1F]/20"
                    >
                        <Plus size={18} />
                        Reportar Avería
                    </Link>
                )}
            </div>

            {tickets.length === 0 ? (
                <EmptyState
                    icon={<Wrench size={64} className="opacity-10" />}
                    title="Sin incidencias"
                    description="Todo parece estar funcionando perfectamente. ¡Buen trabajo!"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tickets.map((ticket: any) => (
                        <div key={ticket.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all group">
                            <div className="p-6 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                                                ticket.prioridad === 'URGENTE' ? 'bg-red-50 text-red-600' : 
                                                ticket.prioridad === 'IMPORTANTE' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'
                                            }`}>
                                                {ticket.prioridad}
                                            </span>
                                            <p className="text-[10px] text-gray-300 font-bold uppercase">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <h3 className="text-lg font-black text-[#072E1F] truncate group-hover:text-[#1D9E75] transition-colors">{ticket.titulo}</h3>
                                        {(ticket.fechaInicio || ticket.fechaFin) && (
                                            <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-[#1D9E75] uppercase tracking-tighter bg-green-50/50 px-2 py-0.5 rounded w-fit border border-green-100/50">
                                                <Calendar size={10} />
                                                {ticket.fechaInicio ? new Date(ticket.fechaInicio).toLocaleDateString() : '?'} - {ticket.fechaFin ? new Date(ticket.fechaFin).toLocaleDateString() : '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`p-2 rounded-xl bg-gray-50 ${STATS_CONFIG[ticket.estado as keyof typeof STATS_CONFIG]?.color}`}>
                                        {STATS_CONFIG[ticket.estado as keyof typeof STATS_CONFIG]?.icon}
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed h-[2.5rem]">
                                    {ticket.descripcion}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-[#072E1F]">
                                            {ticket.residente.user.nombre.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-[#072E1F] leading-none mb-1">{ticket.residente.user.nombre}</p>
                                            <p className="text-[9px] text-gray-400 font-medium truncate uppercase tracking-tighter">{ticket.residencia.nombre}</p>
                                        </div>
                                    </div>
                                    
                                    <TicketActions ticket={ticket} isAdmin={isAdmin} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
