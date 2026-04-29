'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { checkAuth } from '@/lib/auth-utils'

export async function getNotifications() {
    try {
        const user = await checkAuth()
        const notificaciones = await prisma.notificacion.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        })
        return notificaciones
    } catch (error) {
        return []
    }
}

export async function markAsRead(id: number) {
    try {
        await checkAuth()
        await prisma.notificacion.update({
            where: { id },
            data: { leida: true }
        })
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        return { success: false }
    }
}

export async function createNotification(userId: number, titulo: string, mensaje: string, tipo: string = 'INFO', link?: string) {
    try {
        // Esta función se llama desde otras acciones del servidor, no necesita checkAuth aquí 
        // porque se asume que la acción padre ya validó al administrador.
        await prisma.notificacion.create({
            data: {
                userId,
                titulo,
                mensaje,
                tipo,
                link
            }
        })
        return { success: true }
    } catch (error) {
        return { success: false }
    }
}
