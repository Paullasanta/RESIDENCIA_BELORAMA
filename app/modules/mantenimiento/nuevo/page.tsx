import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { TicketForm } from '@/components/forms/TicketForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NuevoTicketPage() {
    const session = await auth()
    
    // Obtener la residencia del usuario para pre-asignarla
    const profile = await prisma.residente.findFirst({
        where: { user: { email: session!.user.email as string } },
        select: { habitacion: { select: { residenciaId: true, residencia: { select: { nombre: true } } } } }
    })

    const residencia = profile?.habitacion ? {
        id: profile.habitacion.residenciaId,
        nombre: profile.habitacion.residencia.nombre
    } : null

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex items-center gap-4">
                <Link href="/modules/mantenimiento" className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-sm">
                    <ArrowLeft size={20} className="text-gray-400" />
                </Link>
                <PageHeader 
                    title="Nueva Solicitud" 
                    description="Describe el fallo para que podamos ayudarte lo antes posible." 
                />
            </div>

            <div className="max-w-2xl">
                <TicketForm residencia={residencia} />
            </div>
        </div>
    )
}
