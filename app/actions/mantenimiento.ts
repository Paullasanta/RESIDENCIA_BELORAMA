'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { createNotification, notifyAdmins } from './notificaciones'

export async function createTicket(data: {
    titulo: string
    descripcion: string
    prioridad: 'NORMAL' | 'URGENTE' | 'IMPORTANTE'
    residenciaId: number
    fotos?: string[]
}) {
    const session = await auth()
    if (!session) throw new Error('No autorizado')

    // Obtener el residenteId vinculado al usuario
    const residente = await prisma.residente.findFirst({
        where: { user: { email: session.user.email as string } }
    })

    if (!residente) throw new Error('Usuario no perfilado como residente')

    const ticket = await prisma.ticketMantenimiento.create({
        data: {
            ...data,
            residenteId: residente.id,
            estado: 'PENDIENTE',
            fotos: data.fotos || [],
            fechaInicio: (data as any).fechaInicio ? new Date((data as any).fechaInicio) : null,
            fechaFin: (data as any).fechaFin ? new Date((data as any).fechaFin) : null,
        }
    })

    // Notificar a los administradores de esta residencia Y a los administradores globales
    await notifyAdmins(
        data.residenciaId,
        'Nuevo Ticket de Mantenimiento',
        `El residente ${session.user.nombre} ha reportado: ${data.titulo}`,
        '/modules/mantenimiento'
    )

    revalidatePath('/modules/mantenimiento')
    return ticket
}

export async function updateTicketStatus(id: number, data: { estado?: any, fechaInicio?: string, fechaFin?: string }) {
    const updateData: any = {}
    if (data.estado) updateData.estado = data.estado
    if (data.fechaInicio) updateData.fechaInicio = new Date(data.fechaInicio)
    if (data.fechaFin) updateData.fechaFin = new Date(data.fechaFin)

    const ticket = await prisma.ticketMantenimiento.update({
        where: { id },
        data: updateData,
        include: { residente: { include: { user: true } } }
    })

    // Notificar al residente sobre el cambio de estado si se cambió
    if (data.estado) {
        await createNotification(
            ticket.residente.userId,
            'Actualización de Mantenimiento',
            `Tu ticket "${ticket.titulo}" ahora está en estado: ${data.estado}`,
            'TICKET',
            '/modules/mantenimiento'
        )
    }

    revalidatePath('/modules/mantenimiento')
    revalidatePath('/modules/dashboard')
    return ticket
}

export async function deleteTicket(id: number) {
    await prisma.ticketMantenimiento.delete({ where: { id } })
    revalidatePath('/modules/mantenimiento')
}
