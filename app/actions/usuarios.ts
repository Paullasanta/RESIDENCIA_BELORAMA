'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

/**
 * Obtiene todos los usuarios que NO son residentes (Staff)
 */
export async function getStaff() {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: {
          name: { not: 'RESIDENTE' }
        }
      },
      include: {
        role: true,
        residencia: { select: { nombre: true } }
      },
      orderBy: { nombre: 'asc' }
    })
    return staff
  } catch (error) {
    console.error('getStaff error:', error)
    return []
  }
}

/**
 * Crea o actualiza un miembro del personal
 */
export async function upsertUsuario(data: any) {
  try {
    const session = await auth()
    if (session?.user.rol !== 'ADMIN') throw new Error('No autorizado')

    if (data.id) {
      // Update
      const updateData: any = {
        nombre: data.nombre,
        email: data.email,
        roleId: Number(data.roleId),
        residenciaId: data.residenciaId ? Number(data.residenciaId) : null,
      }
      if (data.password) updateData.password = data.password

      await prisma.user.update({
        where: { id: Number(data.id) },
        data: updateData
      })
    } else {
      // Create
      await prisma.user.create({
        data: {
          nombre: data.nombre,
          email: data.email,
          password: data.password || 'belo123',
          roleId: Number(data.roleId),
          residenciaId: data.residenciaId ? Number(data.residenciaId) : null,
        }
      })
    }

    revalidatePath('/modules/configuracion')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al guardar usuario' }
  }
}

/**
 * Elimina un usuario del personal
 */
export async function eliminarUsuario(id: number) {
  try {
    const session = await auth()
    if (session?.user.rol !== 'ADMIN') throw new Error('No autorizado')

    // Evitar auto-eliminación
    const me = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (me?.id === id) throw new Error('No puedes eliminarte a ti mismo')

    await prisma.user.delete({
      where: { id }
    })

    revalidatePath('/modules/configuracion')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al eliminar usuario' }
  }
}
