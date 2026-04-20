'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: {
    nombre?: string,
    apellidos?: string,
    telefono?: string,
    imagen?: string,
    password?: string,
    emergenciaNombre?: string,
    emergenciaTelefono?: string,
    fechaNacimiento?: string
}) {
    const session = await auth()
    if (!session) return { success: false, error: 'No autorizado' }

    try {
        const updateData: any = {
            nombre: data.nombre,
            apellidos: data.apellidos,
            telefono: data.telefono,
            emergenciaNombre: data.emergenciaNombre,
            emergenciaTelefono: data.emergenciaTelefono,
        }

        if (data.imagen) updateData.imagen = data.imagen
        if (data.password && data.password.trim() !== '') {
            updateData.password = data.password
        }
        if (data.fechaNacimiento) {
            updateData.fechaNacimiento = new Date(data.fechaNacimiento)
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
        })

        revalidatePath('/modules/perfil')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al actualizar perfil' }
    }
}
