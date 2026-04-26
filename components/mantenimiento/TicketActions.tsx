'use client'

import { useState } from 'react'
import { updateTicketStatus, deleteTicket } from '@/app/actions/mantenimiento'
import { 
    MoreVertical, CheckCircle2, Wrench, XCircle, 
    Trash2, Loader2, Play 
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation'

export function TicketActions({ ticket, isAdmin }: { ticket: any, isAdmin: boolean }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleUpdateStatus = async (newStatus: string) => {
        setLoading(true)
        try {
            await updateTicketStatus(ticket.id, newStatus as any)
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('¿Seguro que deseas eliminar este ticket?')) return
        setLoading(true)
        try {
            await deleteTicket(ticket.id)
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            {loading ? (
                <Loader2 size={16} className="animate-spin text-gray-400" />
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical size={16} className="text-gray-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100">
                        {isAdmin && (
                            <>
                                <p className="text-[10px] font-black uppercase text-gray-400 px-3 py-2 tracking-widest">Cambiar Estado</p>
                                <DropdownMenuItem onClick={() => handleUpdateStatus('EN_PROCESO')} className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                                    <Play size={16} className="text-blue-500" />
                                    <span className="font-bold text-sm">Iniciar Reparación</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus('RESUELTO')} className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                                    <CheckCircle2 size={16} className="text-green-500" />
                                    <span className="font-bold text-sm">Marcar como Resuelto</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus('CANCELADO')} className="rounded-xl flex items-center gap-3 py-3 cursor-pointer text-red-600 focus:text-red-700">
                                    <XCircle size={16} />
                                    <span className="font-bold text-sm">Cancelar Ticket</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2 bg-gray-50" />
                            </>
                        )}
                        
                        <DropdownMenuItem 
                            onClick={handleDelete}
                            className="rounded-xl flex items-center gap-3 py-3 cursor-pointer text-red-600 focus:text-red-700"
                        >
                            <Trash2 size={16} />
                            <span className="font-bold text-sm">Eliminar Registro</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    )
}
