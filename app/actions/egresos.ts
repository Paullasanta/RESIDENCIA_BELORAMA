'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

export async function createEgreso(data: any) {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'No autorizado' }

  try {
    const egreso = await prisma.egreso.create({
      data: {
        adminId: session.user.id,
        residenciaId: Number(data.residenciaId),
        concepto: data.concepto,
        monto: Number(data.monto),
        categoria: data.categoria || 'General',
      }
    })

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/egresos')
    return { success: true, data: egreso }
  } catch (error: any) {
    return { success: false, error: 'Error al registrar el egreso' }
  }
}

export async function deleteEgreso(id: number) {
  try {
    await prisma.egreso.delete({ where: { id } })
    revalidatePath('/admin/egresos')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al eliminar el egreso' }
  }
}
