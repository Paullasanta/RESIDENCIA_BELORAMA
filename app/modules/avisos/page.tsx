import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Megaphone, Plus, Calendar, MapPin, Trash2, Bell, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { deleteAviso } from '@/app/actions/avisos'
import { revalidatePath } from 'next/cache'

const PRIORIDAD_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
    URGENTE: { label: 'Urgente', color: 'bg-red-50 text-red-600 border-red-100', icon: <AlertTriangle size={14} /> },
    IMPORTANTE: { label: 'Importante', color: 'bg-orange-50 text-orange-600 border-orange-100', icon: <Bell size={14} /> },
    NORMAL: { label: 'Normal', color: 'bg-green-50 text-green-600 border-green-100', icon: <Megaphone size={14} /> },
}

import { AvisoFeed } from '@/components/avisos/AvisoFeed'

export default async function AvisosPage() {
    const session = await auth()
    const { rol } = session!.user
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(rol)

    // Si es residente, obtener su residencia
    let myResidenciaId: number | null = null
    if (rol === 'RESIDENTE') {
        const profile = await prisma.residente.findFirst({
            where: { user: { email: session!.user.email as string } },
            select: { habitacion: { select: { residenciaId: true } } }
        })
        myResidenciaId = profile?.habitacion?.residenciaId ?? null
    }

    const avisos = await prisma.aviso.findMany({
        where: {
            OR: [
                { residenciaId: null }, // Globales
                ...(myResidenciaId ? [{ residenciaId: myResidenciaId }] : []), // De su residencia
                ...(isAdmin ? [{ residenciaId: { not: null } }] : []) // Si es admin, ve todos
            ]
        },
        include: {
            autor: { select: { nombre: true, email: true } },
            residencia: { select: { nombre: true } },
            reacciones: {
                include: { user: { select: { email: true } } }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 max-w-4xl mx-auto">
                <PageHeader
                    title="Muro de Avisos"
                    description="Enterate de lo último en Grow Residencial."
                />
                {isAdmin && (
                    <Link
                        href="/modules/avisos/nuevo"
                        className="flex items-center justify-center gap-3 bg-[#072E1F] text-white px-8 py-4 rounded-[2rem] font-black hover:bg-[#1D9E75] transition-all shadow-2xl shadow-[#072E1F]/20 group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        Crear Publicación
                    </Link>
                )}
            </div>

            {avisos.length === 0 ? (
                <div className="max-w-2xl mx-auto w-full">
                    <EmptyState
                        icon={<Megaphone size={64} className="text-gray-100" />}
                        title="Muro despejado"
                        description="Aún no hay avisos publicados. ¡Buen día!"
                    />
                </div>
            ) : (
                <AvisoFeed 
                    avisos={avisos} 
                    isAdmin={isAdmin} 
                    currentUserEmail={session!.user.email!} 
                />
            )}
        </div>
    )
}
