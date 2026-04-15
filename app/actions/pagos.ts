'use server'

import { prisma } from '@/lib/prisma'
import { EstadoPago } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function createPago(data: any) {
  const { residenteId, monto, numCuotas, periodicidad } = data
  const montoTotal = parseFloat(monto)

  try {
    const pago = await prisma.$transaction(async (tx) => {
      const nuevoPago = await tx.pago.create({
        data: {
          residenteId,
          monto: montoTotal,
          montoPagado: 0,
          estado: EstadoPago.PENDIENTE,
        }
      })

      // Generar cuotas automáticamente
      if (numCuotas && numCuotas > 0) {
        const montoCuota = montoTotal / numCuotas
        const promesasCuotas = []

        for (let i = 0; i < numCuotas; i++) {
          const fechaVencimiento = new Date()
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i)

          promesasCuotas.push(
            tx.cuota.create({
              data: {
                pagoId: nuevoPago.id,
                monto: montoCuota,
                pagado: false,
                fechaVencimiento
              }
            })
          )
        }
        await Promise.all(promesasCuotas)
      }

      return nuevoPago
    })

    revalidatePath('/admin/pagos')
    revalidatePath('/residente/pagos')
    return { success: true, data: pago }
  } catch (error: any) {
    console.error('Error al crear pago:', error)
    return { success: false, error: error.message || 'Error al registrar el pago' }
  }
}

export async function toggleCuota(cuotaId: string, pagado: boolean) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar la cuota
      const cuotaActualizada = await tx.cuota.update({
        where: { id: cuotaId },
        data: { pagado },
        include: { pago: { include: { cuotas: true } } }
      })

      const pago = cuotaActualizada.pago
      const todasLasCuotas = pago.cuotas
      
      // 2. Recalcular monto pagado y estado del pago
      const montoPagado = todasLasCuotas
        .filter(c => c.pagado)
        .reduce((sum, c) => sum + c.monto, 0)

      let nuevoEstado: EstadoPago = EstadoPago.PENDIENTE
      if (todasLasCuotas.every(c => c.pagado)) {
        nuevoEstado = EstadoPago.PAGADO
      } else if (todasLasCuotas.some(c => c.pagado)) {
        nuevoEstado = EstadoPago.PARCIAL
      }

      await tx.pago.update({
        where: { id: pago.id },
        data: { 
          montoPagado,
          estado: nuevoEstado
        }
      })

      return cuotaActualizada
    })

    revalidatePath('/admin/pagos')
    revalidatePath('/residente/pagos')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Error al actualizar cuota:', error)
    return { success: false, error: error.message }
  }
}

export async function deletePago(id: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // Borrar primero las cuotas (Prisma lo haría si hay cascade, pero aseguramos)
      await tx.cuota.deleteMany({ where: { pagoId: id } })
      await tx.pago.delete({ where: { id } })
    })

    revalidatePath('/admin/pagos')
    revalidatePath('/residente/pagos')
    return { success: true }
  } catch (error: any) {
    console.error('Error al eliminar pago:', error)
    return { success: false, error: error.message }
  }
}

export async function getPago(id: string) {
  return await prisma.pago.findUnique({
    where: { id },
    include: {
      residente: { include: { user: true } },
      cuotas: { orderBy: { fechaVencimiento: 'asc' } }
    }
  })
}
