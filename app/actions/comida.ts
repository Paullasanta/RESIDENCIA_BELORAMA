'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TipoMenu } from '@prisma/client'

export async function createMenu(data: any) {
  try {
    const menu = await prisma.menu.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo as TipoMenu,
        fecha: new Date(data.fecha),
        activo: true,
        residencias: {
          create: data.residenciaIds.map((id: number) => ({
            residenciaId: id
          }))
        }
      }
    })

    revalidatePath('/admin/comida')
    return { success: true, data: menu }
  } catch (error: any) {
    return { success: false, error: 'Error al crear el menú' }
  }
}

export async function registrarAsistenciaComida(residenteId: number, menuId: number, asiste: boolean) {
  try {
    const existing = await prisma.asistenciaComida.findFirst({
      where: { residenteId, menuId }
    })

    if (asiste) {
      if (existing) {
        await prisma.asistenciaComida.update({
          where: { id: existing.id },
          data: { asiste: true }
        })
      } else {
        await prisma.asistenciaComida.create({
          data: { residenteId, menuId, asiste: true }
        })
      }
    } else {
      if (existing) {
        await prisma.asistenciaComida.delete({
          where: { id: existing.id }
        })
      }
    }

    revalidatePath('/admin/comida')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al registrar asistencia' }
  }
}

export async function toggleMenuEstado(id: number, activo: boolean) {
  try {
    await prisma.menu.update({
      where: { id },
      data: { activo }
    })
    revalidatePath('/admin/comida')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar estado del menú' }
  }
}
