'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getResidenciasConHabitaciones() {
  return await prisma.residencia.findMany({
    include: {
      habitaciones: {
        where: { estado: 'LIBRE' },
        orderBy: { numero: 'asc' }
      }
    },
    orderBy: { nombre: 'asc' }
  })
}

export async function getResidente(id: number) {
  return await prisma.residente.findUnique({
    where: { id },
    include: {
      user: {
        include: { role: true }
      },
      habitacion: {
        include: { residencia: true }
      }
    }
  })
}

export async function createResidente(data: any) {
  const nombre = data.nombre as string
  const email = data.email as string
  const password = data.password as string
  const residenciaId = data.residenciaId === "" ? null : Number(data.residenciaId)
  const habitacionId = data.habitacionId === "" ? null : Number(data.habitacionId)

  const montoMensual = Number(data.montoMensual || 0)
  const montoGarantia = Number(data.montoGarantia || 0)
  const cuotasGarantia = Number(data.cuotasGarantia || 1)

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener el ID del rol de residente
      const role = await tx.role.findFirst({ where: { name: 'RESIDENTE' } })
      if (!role) throw new Error('Rol de residente no encontrado')

      // 2. Crear Usuario
      const user = await tx.user.create({
        data: {
          nombre,
          email,
          password,
          roleId: role.id,
          residenciaId: residenciaId
        }
      })

      // 3. Crear Perfil de Residente
      const residente = await tx.residente.create({
        data: {
          userId: user.id,
          habitacionId: habitacionId,
          activo: true,
          fechaIngreso: new Date()
        }
      })

      // 4. Marcar habitación como no disponible
      if (habitacionId) {
        await tx.habitacion.update({
          where: { id: habitacionId },
          data: { estado: 'OCUPADO' }
        })
      }

      // 5. Generar Cobros Iniciales
      if (montoMensual > 0) {
        await tx.pago.create({
          data: {
            residenteId: residente.id,
            concepto: 'Alquiler Inicial',
            monto: montoMensual,
            estado: 'PENDIENTE',
            cuotas: {
              create: {
                monto: montoMensual,
                fechaVencimiento: new Date()
              }
            }
          }
        })
      }

      if (montoGarantia > 0) {
        const montoPorCuota = montoGarantia / cuotasGarantia
        await tx.pago.create({
          data: {
            residenteId: residente.id,
            concepto: 'Garantía',
            monto: montoGarantia,
            estado: 'PENDIENTE',
            cuotas: {
              create: Array.from({ length: cuotasGarantia }).map((_, i) => {
                const fecha = new Date()
                fecha.setMonth(fecha.getMonth() + i)
                return {
                  monto: montoPorCuota,
                  fechaVencimiento: fecha
                }
              })
            }
          }
        })
      }

      return residente
    })

    revalidatePath('/admin/residentes')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Error creating residente:', error)
    return { success: false, error: error.message || 'Error al crear residente' }
  }
}

export async function updateResidente(id: number, data: any) {
  const nombre = data.nombre as string
  const email = data.email as string
  const password = data.password as string
  const residenciaId = data.residenciaId === "" ? null : Number(data.residenciaId)
  const habitacionId = data.habitacionId === "" ? null : Number(data.habitacionId)

  try {
    const currentResidente = await prisma.residente.findUnique({
      where: { id },
      include: { habitacion: true }
    })

    if (!currentResidente) throw new Error('Residente no encontrado')

    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar Usuario
      const userData: any = { nombre, email, residenciaId }
      if (password && password.trim() !== "") userData.password = password

      await tx.user.update({
        where: { id: currentResidente.userId },
        data: userData
      })

      // 2. Manejar cambio de Habitación
      if (currentResidente.habitacionId !== habitacionId) {
        if (currentResidente.habitacionId) {
          await tx.habitacion.update({
            where: { id: currentResidente.habitacionId },
            data: { estado: 'LIBRE' }
          })
        }
        if (habitacionId) {
          await tx.habitacion.update({
            where: { id: habitacionId },
            data: { estado: 'OCUPADO' }
          })
        }
      }

      // 3. Actualizar Residente
      return await tx.residente.update({
        where: { id },
        data: { habitacionId }
      })
    })

    revalidatePath('/admin/residentes')
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar residente' }
  }
}

export async function deleteResidente(id: number) {
  try {
    const res = await prisma.residente.findUnique({
      where: { id },
      include: { habitacion: true }
    })

    if (!res) throw new Error('Residente no encontrado')

    await prisma.$transaction(async (tx) => {
      if (res.habitacionId) {
        await tx.habitacion.update({
          where: { id: res.habitacionId },
          data: { estado: 'LIBRE' }
        })
      }
      await tx.residente.delete({ where: { id } })
      await tx.user.delete({ where: { id: res.userId } })
    })

    revalidatePath('/admin/residentes')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
