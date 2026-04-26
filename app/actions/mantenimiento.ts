'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

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
            fotos: data.fotos || []
        }
    })

    revalidatePath('/modules/mantenimiento')
    return ticket
}

export async function updateTicketStatus(id: number, estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'CANCELADO') {
    const ticket = await prisma.ticketMantenimiento.update({
        where: { id },
        data: { estado }
    })
    revalidatePath('/modules/mantenimiento')
    revalidatePath('/modules/dashboard')
    return ticket
}

export async function deleteTicket(id: number) {
    await prisma.ticketMantenimiento.delete({ where: { id } })
    revalidatePath('/modules/mantenimiento')
}
