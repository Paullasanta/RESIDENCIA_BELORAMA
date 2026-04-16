'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function moderarProducto(id: number, estado: 'APROBADO' | 'RECHAZADO') {
  try {
    await prisma.productoMarketplace.update({
      where: { id },
      data: { estado }
    })
    
    revalidatePath('/admin/marketplace')
    revalidatePath('/residente/marketplace')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al moderar el producto' }
  }
}

export async function eliminarProducto(id: number) {
  try {
    await prisma.productoMarketplace.delete({
      where: { id }
    })
    
    revalidatePath('/admin/marketplace')
    revalidatePath('/residente/marketplace')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al eliminar el producto' }
  }
}
