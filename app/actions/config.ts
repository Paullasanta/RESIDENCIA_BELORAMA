'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

export async function getConfig(clave: string) {
    const config = await prisma.configuracion.findUnique({
        where: { clave }
    })
    return config?.valor || null
}

export async function updateConfig(data: Record<string, string>) {
    try {
        const session = await auth()
        if (!session || session.user.rol !== 'ADMIN') {
            throw new Error('No autorizado')
        }

        const updates = Object.entries(data).map(([clave, valor]) => 
            prisma.configuracion.upsert({
                where: { clave },
                update: { valor },
                create: { clave, valor }
            })
        )

        await prisma.$transaction(updates)
        
        revalidatePath('/')
        revalidatePath('/modules/configuracion')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: 'Error al guardar la configuración' }
    }
}
