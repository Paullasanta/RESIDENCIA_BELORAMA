'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { createNotification } from './notificaciones'

export async function createAviso(data: any) {
  try {
    const session = await auth()
    if (!session) throw new Error('No autorizado')

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    })

    if (!user) throw new Error('Usuario no encontrado')

    const aviso = await prisma.aviso.create({
      data: {
        titulo: data.titulo,
        contenido: data.contenido,
        prioridad: data.prioridad,
        fotos: data.fotos || [],
        residenciaId: data.residenciaId ? Number(data.residenciaId) : null,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        autorId: user.id
      }
    })

    // Notificar a todos los residentes de la residencia (o a todos si es global)
    const targetResidenciaId = data.residenciaId ? Number(data.residenciaId) : null
    
    const residents = await prisma.user.findMany({
        where: {
            role: { name: 'RESIDENTE' },
            ...(targetResidenciaId ? { residenciaId: targetResidenciaId } : {})
        },
        select: { id: true }
    })

    for (const resident of residents) {
        await createNotification(
            resident.id,
            'Nuevo Aviso Publicado',
            `Se ha publicado: ${data.titulo}`,
            'AVISO',
            '/modules/avisos'
        )
    }

    revalidatePath('/modules/avisos')
    return { success: true, data: aviso }
  } catch (error: any) {
    return { success: false, error: 'Error al crear el aviso' }
  }
}

export async function updateAviso(id: number, data: any) {
  try {
    const session = await auth()
    if (!session || session.user.rol !== 'ADMIN') throw new Error('No autorizado')

    const aviso = await prisma.aviso.update({
      where: { id },
      data: {
        titulo: data.titulo,
        contenido: data.contenido,
        prioridad: data.prioridad,
        fotos: data.fotos || [],
        residenciaId: data.residenciaId ? Number(data.residenciaId) : null,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
      }
    })

    revalidatePath('/modules/avisos')
    return { success: true, data: aviso }
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar el aviso' }
  }
}

export async function toggleReaccion(avisoId: number, emoji: string) {
    try {
        const session = await auth()
        if (!session) throw new Error('No autorizado')

        const user = await prisma.user.findUnique({
            where: { email: session.user.email as string }
        })
        if (!user) throw new Error('Usuario no encontrado')

        // Verificar si ya existe la reacción
        const existing = await prisma.reaccion.findUnique({
            where: {
                userId_avisoId_emoji: {
                    userId: user.id,
                    avisoId,
                    emoji
                }
            }
        })

        if (existing) {
            // Si existe, la eliminamos (toggle off)
            await prisma.reaccion.delete({
                where: { id: existing.id }
            })
        } else {
            // Si no existe, la creamos (toggle on)
            await prisma.reaccion.create({
                data: {
                    userId: user.id,
                    avisoId,
                    emoji
                }
            })
        }

        revalidatePath('/modules/avisos')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: 'Error al reaccionar' }
    }
}

import { unlink } from 'fs/promises'
import path from 'path'

export async function deleteAviso(id: number) {
  try {
    const session = await auth()
    if (!session || session.user.rol !== 'ADMIN') throw new Error('No autorizado')

    // Find the aviso to get its photos before deleting
    const aviso = await prisma.aviso.findUnique({
      where: { id },
      select: { fotos: true }
    })

    if (aviso && aviso.fotos.length > 0) {
      for (const foto of aviso.fotos) {
        const filename = foto.split('/').pop()
        if (filename) {
          const filepath = path.join(process.cwd(), 'public', 'uploads', 'avisos', filename)
          try { await unlink(filepath) } catch (e) { /* file might strictly not exist anymore */ }
        }
      }
    }

    // Eliminar reacciones primero si existen (aunque Prisma cascade podría manejarlo si lo configuramos, pero hagámoslo explícito o confiemos en el schema)
    // Para simplificar, eliminamos el aviso
    await prisma.aviso.delete({
      where: { id }
    })
    
    revalidatePath('/modules/avisos')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al eliminar el aviso' }
  }
}
