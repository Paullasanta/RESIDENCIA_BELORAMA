'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

export async function createProducto(data: any) {
  try {
    const session = await auth()
    if (!session) throw new Error('No autorizado')

    const { rol, email } = session.user

    // Buscar el residente asociado al usuario (si es admin, puede no tener uno, por eso buscamos con cuidado)
    const profile = await prisma.user.findUnique({
      where: { email: email as string },
      include: { residente: true }
    })

    if (!profile?.residente && rol !== 'ADMIN') {
        throw new Error('Solo los residentes plenamente registrados o administradores pueden publicar.')
    }

    const residenteId = profile?.residente?.id

    const producto = await prisma.productoMarketplace.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        precio: Number(data.precio),
        fotos: data.fotos || [],
        residenteId: residenteId || null, // Si es admin sin perfil residente, permitimos null
        estado: rol === 'ADMIN' ? 'APROBADO' : 'PENDIENTE'
      }
    })

    revalidatePath('/modules/marketplace')
    return { success: true, data: producto }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: error.message || 'Error al publicar el producto' }
  }
}

export async function moderarProducto(id: number, estado: 'APROBADO' | 'RECHAZADO') {
  try {
    const session = await auth()
    if (!session || session.user.rol !== 'ADMIN') throw new Error('No autorizado')

    await prisma.productoMarketplace.update({
      where: { id },
      data: { estado }
    })
    
    revalidatePath('/modules/marketplace')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al moderar el producto' }
  }
}

export async function eliminarProducto(id: number) {
  try {
    const session = await auth()
    if (!session) throw new Error('No autorizado')

    // Aquí idealmente verificaríamos que el usuario es el dueño o admin
    await prisma.productoMarketplace.delete({
      where: { id }
    })
    
    revalidatePath('/modules/marketplace')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al eliminar el producto' }
  }
}
