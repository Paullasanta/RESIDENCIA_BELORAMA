'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

/**
 * Obtiene todos los roles con sus permisos
 */
export async function getRoles() {
  return prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true }
      }
    },
    orderBy: { name: 'asc' }
  })
}

/**
 * Crea o actualiza un Rol
 */
export async function upsertRole(data: { id?: number, name: string, description?: string }) {
  try {
    const session = await auth()
    if (session?.user.rol !== 'ADMIN') throw new Error('No autorizado')

    if (data.id) {
      await prisma.role.update({
        where: { id: data.id },
        data: { name: data.name, description: data.description }
      })
    } else {
      await prisma.role.create({
        data: { name: data.name, description: data.description }
      })
    }

    revalidatePath('/modules/configuracion')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al guardar rol' }
  }
}

/**
 * Activa/Desactiva un permiso para un rol
 */
export async function toggleRolePermission(roleId: number, permissionId: number) {
  try {
    const session = await auth()
    if (session?.user.rol !== 'ADMIN') throw new Error('No autorizado')

    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: { roleId, permissionId }
      }
    })

    if (existing) {
      await prisma.rolePermission.delete({
        where: {
          roleId_permissionId: { roleId, permissionId }
        }
      })
    } else {
      await prisma.rolePermission.create({
        data: { roleId, permissionId }
      })
    }

    revalidatePath('/modules/configuracion')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al cambiar permiso' }
  }
}
