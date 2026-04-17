'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createPago(data: any) {
  try {
    const residenteId = Number(data.residenteId)
    const monto = Number(data.monto)
    const concepto = (data.concepto as string) || 'Pago General'
    const cuotasCount = Number(data.numCuotas || 1)

    const pago = await prisma.pago.create({
      data: {
        residenteId,
        monto,
        concepto,
        montoPagado: 0,
        estado: 'PENDIENTE',
        cuotas: {
          create: Array.from({ length: cuotasCount }, (_, i) => ({
            monto: monto / cuotasCount,
            pagado: false,
            fechaVencimiento: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
          }))
        }
      }
    })

    revalidatePath('/modules/pagos')
    return { success: true, data: pago }
  } catch (error: any) {
    console.error('Error in createPago:', error)
    return { success: false, error: 'Error al registrar el pago' }
  }
}

export async function updateCuota(id: number, pagado: boolean) {
  try {
    const cuota = await prisma.cuota.update({
      where: { id },
      data: { pagado },
      include: { pago: true }
    })

    // Actualizar estado del pago general
    const todas = await prisma.cuota.findMany({ where: { pagoId: cuota.pagoId } })
    const pagadas = todas.filter(c => c.pagado)
    const totalPagado = pagadas.reduce((s, c) => s + c.monto, 0)

    let estado = 'PARCIAL' as any
    if (pagadas.length === todas.length) estado = 'PAGADO'
    if (pagadas.length === 0) estado = 'PENDIENTE'

    await prisma.pago.update({
      where: { id: cuota.pagoId },
      data: { montoPagado: totalPagado, estado }
    })

    revalidatePath('/modules/pagos')
    revalidatePath(`/modules/pagos/${cuota.pagoId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateCuota:', error)
    return { success: false, error: 'Error al actualizar cuota' }
  }
}
