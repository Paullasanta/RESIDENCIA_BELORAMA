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
  const apellidos = data.apellidos as string
  const dni = data.dni as string
  const email = data.email as string
  const password = dni // Contraseña por defecto es el DNI
  const telefono = data.telefono as string
  
  const residenciaId = data.residenciaId === "" ? null : Number(data.residenciaId)
  const habitacionId = data.habitacionId === "" ? null : Number(data.habitacionId)

  const montoMensual = Number(data.montoMensual || 0)
  const montoGarantia = Number(data.montoGarantia || 0)
  const cuotasGarantia = Number(data.cuotasGarantia || 1)

  // Nuevos campos para confirmación de pago
  const pagoConfirmado = data.pagoConfirmado === true || data.pagoConfirmado === 'true'
  const comprobanteUrl = data.comprobanteUrl as string || null

  try {
    // Verificar si el correo o DNI ya existen
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { dni }
        ]
      }
    })

    if (existing) {
      if (existing.email === email) throw new Error('El correo electrónico ya está registrado')
      if (existing.dni === dni) throw new Error('El DNI ya está registrado')
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener el ID del rol de residente
      const role = await tx.role.findFirst({ where: { name: 'RESIDENTE' } })
      if (!role) throw new Error('Rol de residente no encontrado')

      // 2. Crear Usuario
      const user = await tx.user.create({
        data: {
          dni,
          nombre,
          apellidos,
          email,
          password,
          telefono,
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
            montoPagado: 0,
            comprobante: pagoConfirmado ? comprobanteUrl : null,
            estado: pagoConfirmado ? 'EN_REVISION' : 'PENDIENTE',
            cuotas: {
              create: {
                monto: montoMensual,
                pagado: false,
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
            montoPagado: 0,
            comprobante: pagoConfirmado ? comprobanteUrl : null,
            estado: pagoConfirmado ? 'EN_REVISION' : 'PENDIENTE',
            cuotas: {
              create: Array.from({ length: cuotasGarantia }).map((_, i) => {
                const fecha = new Date()
                fecha.setMonth(fecha.getMonth() + i)
                return {
                  monto: montoPorCuota,
                  pagado: false,
                  fechaVencimiento: fecha
                }
              })
            }
          }
        })
      }

      return residente
    })

    revalidatePath('/modules/residentes')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Error creating residente:', error)
    return { success: false, error: error.message || 'Error al crear residente' }
  }
}

export async function updateResidente(id: number, data: any) {
  const dni = data.dni as string
  const nombre = data.nombre as string
  const apellidos = data.apellidos as string
  const email = data.email as string
  const password = data.password as string
  const telefono = data.telefono as string
  
  const residenciaId = data.residenciaId === "" ? null : Number(data.residenciaId)
  const habitacionId = data.habitacionId === "" ? null : Number(data.habitacionId)

  try {
    const currentResidente = await prisma.residente.findUnique({
      where: { id },
      include: { user: true, habitacion: true }
    })

    if (!currentResidente) throw new Error('Residente no encontrado')

    // Verificar conflictos con otros usuarios
    const conflict = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { dni }
        ],
        NOT: { id: currentResidente.userId }
      }
    })

    if (conflict) {
      if (conflict.email === email) throw new Error('El correo electrónico ya está en uso por otro usuario')
      if (conflict.dni === dni) throw new Error('El DNI ya está en uso por otro usuario')
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar Usuario
      const userData: any = { dni, nombre, apellidos, email, residenciaId, telefono }
      if (password && password.trim() !== "") userData.password = password

      if (data.imagen) userData.imagen = data.imagen

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

    revalidatePath('/modules/residentes')
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
