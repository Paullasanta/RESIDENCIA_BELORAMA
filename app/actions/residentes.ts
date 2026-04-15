'use server'

import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export async function getResidenciasConHabitaciones() {
  return await prisma.residencia.findMany({
    include: {
      habitaciones: {
        where: { disponible: true },
        orderBy: { numero: 'asc' }
      }
    },
    orderBy: { nombre: 'asc' }
  })
}

export async function getResidente(id: string) {
  return await prisma.residente.findUnique({
    where: { id },
    include: {
      user: true,
      habitacion: {
        include: { residencia: true }
      }
    }
  })
}

export async function createResidente(data: any) {
  // Saneamiento: Convertir strings vacíos a undefined para que Prisma los ignore o use null
  const nombre = data.nombre as string
  const email = data.email as string
  const password = data.password as string
  const residenciaId = data.residenciaId === "" ? undefined : data.residenciaId as string
  const habitacionId = data.habitacionId === "" ? undefined : data.habitacionId as string

  console.log('Creando residente con datos:', { nombre, email, residenciaId, habitacionId })

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear Usuario (Acceso)
      const user = await tx.user.create({
        data: {
          nombre,
          email,
          password: hashedPassword,
          rol: Rol.RESIDENTE,
          residenciaId: residenciaId || null
        }
      })

      // 2. Crear Perfil de Residente
      const residente = await tx.residente.create({
        data: {
          userId: user.id,
          habitacionId: habitacionId || null,
          activo: true,
          fechaIngreso: new Date()
        }
      })

      // 3. Ocupar Habitación si se asignó una
      if (habitacionId) {
        await tx.habitacion.update({
          where: { id: habitacionId },
          data: { disponible: false }
        })
      }

      return residente
    })

    console.log('Residente creado con éxito:', result.id)
    revalidatePath('/admin/residentes')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('ERROR al crear residente:', error)
    return { success: false, error: error.message || 'Error al crear residente' }
  }
}

export async function updateResidente(id: string, data: any) {
  const nombre = data.nombre as string
  const email = data.email as string
  const password = data.password as string
  const residenciaId = data.residenciaId === "" ? undefined : data.residenciaId as string
  const habitacionId = data.habitacionId === "" ? undefined : data.habitacionId as string

  console.log('Actualizando residente ID:', id, { nombre, email, residenciaId, habitacionId })

  try {
    const currentResidente = await prisma.residente.findUnique({
      where: { id },
      include: { habitacion: true }
    })

    if (!currentResidente) throw new Error('Residente no encontrado')

    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar Usuario
      const userData: any = { 
        nombre, 
        email, 
        residenciaId: residenciaId || null 
      }
      
      if (password && password.trim() !== "") {
        userData.password = await bcrypt.hash(password, 10)
      }

      await tx.user.update({
        where: { id: currentResidente.userId },
        data: userData
      })

      // 2. Manejar cambio de Habitación
      if (currentResidente.habitacionId !== (habitacionId || null)) {
        // Liberar habitación anterior
        if (currentResidente.habitacionId) {
          await tx.habitacion.update({
            where: { id: currentResidente.habitacionId },
            data: { disponible: true }
          })
        }
        // Ocupar nueva habitación
        if (habitacionId) {
          await tx.habitacion.update({
            where: { id: habitacionId },
            data: { disponible: false }
          })
        }
      }

      // 3. Actualizar Residente
      const updated = await tx.residente.update({
        where: { id },
        data: { 
          habitacionId: habitacionId || null 
        }
      })

      return updated
    })

    console.log('Residente actualizado con éxito')
    revalidatePath('/admin/residentes')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('ERROR al actualizar residente:', error)
    return { success: false, error: error.message || 'Error al actualizar residente' }
  }
}

export async function deleteResidente(id: string) {
  try {
    const res = await prisma.residente.findUnique({
      where: { id },
      include: { habitacion: true }
    })

    if (!res) throw new Error('Residente no encontrado')

    await prisma.$transaction(async (tx) => {
      // Free room
      if (res.habitacionId) {
        await tx.habitacion.update({
          where: { id: res.habitacionId },
          data: { disponible: true }
        })
      }
      
      // Delete Residente
      await tx.residente.delete({ where: { id } })
      
      // Delete User
      await tx.user.delete({ where: { id: res.userId } })
    })

    revalidatePath('/admin/residentes')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
