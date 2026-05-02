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

export async function deleteNotification(id: number) {
    try {
        await checkAuth()
        await prisma.notificacion.delete({
            where: { id }
        })
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        return { success: false }
    }
}

export async function createNotification(userId: number, titulo: string, mensaje: string, tipo: string = 'INFO', link?: string) {
    try {
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

export async function notifyAdmins(residenciaId: number | null, titulo: string, mensaje: string, link?: string) {
    try {
        // Buscar todos los usuarios con rol ADMIN que pertenezcan a esa residencia o sean globales
        const admins = await prisma.user.findMany({
            where: {
                role: { name: 'ADMIN' },
                OR: [
                    { residenciaId: residenciaId },
                    { residenciaId: null }
                ]
            },
            select: { id: true }
        })

        for (const admin of admins) {
            await createNotification(admin.id, titulo, mensaje, 'INFO', link)
        }
        return { success: true }
    } catch (error) {
        return { success: false }
    }
}
