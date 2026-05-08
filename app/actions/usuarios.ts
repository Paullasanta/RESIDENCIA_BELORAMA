'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

/**
 * Obtiene todos los usuarios que NO son residentes (Staff)
 */
export async function getStaff() {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: {
          name: { notIn: ['RESIDENTE', 'SUPER_ADMIN'] }
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
        telefono: data.telefono || null,
        roleId: Number(data.roleId),
        residenciaId: data.residenciaId ? Number(data.residenciaId) : null,
      }
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10)
      }

      const user = await prisma.user.update({
        where: { id: Number(data.id) },
        data: updateData,
        include: { role: true }
      })

      if (user.role?.name === 'COCINERO') {
        await prisma.residente.upsert({
          where: { userId: user.id },
          create: { userId: user.id, activo: true },
          update: { activo: true }
        })
      }
    } else {
      // Create
      const user = await prisma.user.create({
        data: {
          nombre: data.nombre,
          email: data.email,
          telefono: data.telefono || null,
          password: await bcrypt.hash(data.password || 'belo123', 10),
          roleId: Number(data.roleId),
          residenciaId: data.residenciaId ? Number(data.residenciaId) : null,
        },
        include: { role: true }
      })

      // Si es cocinero, crearle perfil de residente automático para que pueda usar lavandería
      if (user.role?.name === 'COCINERO') {
        await prisma.residente.upsert({
          where: { userId: user.id },
          create: { userId: user.id, activo: true },
          update: { activo: true }
        })
      }
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
