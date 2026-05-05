'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function updateProfile(data: {
    nombre?: string,
    apellidoPaterno?: string,
    apellidoMaterno?: string,
    telefono?: string,
    password?: string,
    emergenciaNombre?: string,
    emergenciaTelefono?: string,
    emergenciaParentesco?: string,
    fechaNacimiento?: string,
    alergias?: string,
    restriccionesAlimentarias?: string
}) {
    const session = await auth()
    if (!session) return { success: false, error: 'No autorizado' }

    try {
        const updateData: any = {
            nombre: data.nombre,
            apellidoPaterno: data.apellidoPaterno,
            apellidoMaterno: data.apellidoMaterno,
            telefono: data.telefono,
            emergenciaNombre: data.emergenciaNombre,
            emergenciaTelefono: data.emergenciaTelefono,
            emergenciaParentesco: data.emergenciaParentesco,
        }

        if (data.password && data.password.trim() !== '') {
            updateData.password = await bcrypt.hash(data.password, 10)
        }
        
        if (data.fechaNacimiento && data.fechaNacimiento !== "") {
            updateData.fechaNacimiento = new Date(data.fechaNacimiento)
        }

        // Si hay datos de salud, actualizarlos en el perfil de residente
        if (data.alergias !== undefined || data.restriccionesAlimentarias !== undefined) {
            updateData.residente = {
                update: {
                    alergias: data.alergias,
                    restriccionesAlimentarias: data.restriccionesAlimentarias
                }
            }
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
