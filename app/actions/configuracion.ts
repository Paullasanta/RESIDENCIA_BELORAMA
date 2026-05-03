'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getConfiguracion() {
  try {
    const config = await prisma.configuracion.findMany()
    return {
      success: true,
      data: config.reduce((acc: any, curr) => {
        acc[curr.clave] = curr.valor
        return acc
      }, {})
    }
  } catch (error) {
    return { success: false, error: 'Error al obtener la configuración' }
  }
}

export async function updateConfiguracion(datos: Record<string, string>) {
  try {
    await prisma.$transaction(
      Object.entries(datos).map(([clave, valor]) =>
        prisma.configuracion.upsert({
          where: { clave },
          update: { valor },
          create: { clave, valor }
        })
      )
    )
    
    revalidatePath('/')
    revalidatePath('/modules/configuracion/identidad')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al actualizar la configuración' }
  }
}
