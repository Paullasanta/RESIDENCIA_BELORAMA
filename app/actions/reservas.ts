'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { EstadoHabitacion } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { capitalizeName } from '@/lib/utils'

export async function createReserva(data: any) {
  try {
    const { habitacionId, ...reservaData } = data

    // 1. VALIDACIONES DE IDENTIDAD (Evitar duplicados)
    const existingResidente = await prisma.residente.findFirst({
      where: {
        activo: true,
        user: {
          OR: [
            { dni: reservaData.dni },
            { email: reservaData.email || undefined },
            {
              AND: [
                { nombre: reservaData.nombre },
                { apellidoPaterno: reservaData.apellidoPaterno },
                { apellidoMaterno: reservaData.apellidoMaterno || undefined }
              ]
            }
          ]
        }
      }
    })

    if (existingResidente) {
      throw new Error('Esta persona ya es un residente activo en el sistema.')
    }

    const existingReserva = await prisma.reserva.findFirst({
      where: {
        estado: 'PENDIENTE',
        OR: [
          { dni: reservaData.dni },
          { email: reservaData.email || undefined }
        ]
      }
    })

    if (existingReserva) {
      throw new Error('Ya existe una reserva pendiente para esta persona.')
    }

    const result = await prisma.$transaction(async (tx) => {
      // 2. Crear la reserva
      const reserva = await tx.reserva.create({
        data: {
          habitacionId: parseInt(habitacionId),
          nombre: capitalizeName(reservaData.nombre),
          apellidoPaterno: capitalizeName(reservaData.apellidoPaterno),
          apellidoMaterno: capitalizeName(reservaData.apellidoMaterno),
          dni: reservaData.dni,
          email: reservaData.email,
          telefono: reservaData.telefono,
          fechaIngreso: new Date(reservaData.fechaIngreso),
          montoMensual: parseFloat(reservaData.montoMensual || '0'),
          montoGarantia: parseFloat(reservaData.montoGarantia || '0'),
          notas: reservaData.notas,
        }
      })

      // 3. Cambiar estado de la habitación
      await tx.habitacion.update({
        where: { id: parseInt(habitacionId) },
        data: { estado: EstadoHabitacion.RESERVADO }
      })

      return reserva
    })

    revalidatePath('/modules/residentes')
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al crear la reserva' }
  }
}

export async function cancelReserva(reservaId: number) {
  try {
    await prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({ where: { id: reservaId } })
      if (!reserva) throw new Error('Reserva no encontrada')

      // 1. Eliminar reserva
      await tx.reserva.delete({ where: { id: reservaId } })

      // 2. Liberar habitación
      await tx.habitacion.update({
        where: { id: reserva.habitacionId },
        data: { estado: EstadoHabitacion.LIBRE }
      })
    })

    revalidatePath('/modules/residentes')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al cancelar la reserva' }
  }
}

export async function confirmReserva(reservaId: number) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener la reserva
      const reserva = await tx.reserva.findUnique({
        where: { id: reservaId },
        include: { habitacion: true }
      })

      if (!reserva) throw new Error('Reserva no encontrada')

      // 2. Obtener el ID del rol de residente
      const role = await tx.role.findFirst({ where: { name: 'RESIDENTE' } })
      if (!role) throw new Error('Rol de residente no encontrado')
      
      // Buscamos si el usuario ya existe por DNI o Email
      let user = await tx.user.findFirst({
        where: {
          OR: [
            { dni: reserva.dni },
            { email: reserva.email || undefined }
          ]
        }
      })

      if (!user) {
        // Crear usuario automático usando su DNI hasheado como contraseña inicial
        const hashedPassword = await bcrypt.hash(reserva.dni, 10)
        user = await tx.user.create({
          data: {
            dni: reserva.dni,
            nombre: reserva.nombre,
            apellidoPaterno: reserva.apellidoPaterno,
            apellidoMaterno: reserva.apellidoMaterno,
            email: reserva.email || `${reserva.dni}@growresidencial.com`,
            password: hashedPassword,
            telefono: reserva.telefono,
            roleId: role.id,
            residenciaId: reserva.habitacion.residenciaId,
          }
        })
      } else {
        // Si el usuario ya existe, aseguramos que tenga el rol de residente
        await tx.user.update({
          where: { id: user.id },
          data: { roleId: role.id }
        })
      }

      // 3. Crear Residente
      const residente = await tx.residente.create({
        data: {
          userId: user.id,
          habitacionId: reserva.habitacionId,
          fechaIngreso: reserva.fechaIngreso,
          montoMensual: reserva.montoMensual,
          montoGarantia: reserva.montoGarantia,
          activo: true
        }
      })

      // 4. Actualizar habitación a OCUPADO
      await tx.habitacion.update({
        where: { id: reserva.habitacionId },
        data: { estado: EstadoHabitacion.OCUPADO }
      })

      // 5. Marcar reserva como CONFIRMADA
      await tx.reserva.update({
        where: { id: reservaId },
        data: { estado: 'CONFIRMADA' }
      })

      return residente
    })

    revalidatePath('/modules/residentes')
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al confirmar la reserva' }
  }
}

export async function getReservas() {
  return await prisma.reserva.findMany({
    where: { estado: 'PENDIENTE' },
    include: { habitacion: { include: { residencia: true } } },
    orderBy: { fechaIngreso: 'asc' }
  })
}
