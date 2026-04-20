'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createPago(data: any) {
  try {
    const residenteId = Number(data.residenteId)
    const monto = Number(data.monto)
    const concepto = (data.concepto as string) || 'Pago General'
    const cuotasCount = Number(data.numCuotas || 1)
    const periodo = data.periodo as string || null
    const metodoPago = data.metodoPago as string || null
    const yaPagado = data.yaPagado === true || data.yaPagado === 'true'

    const pago = await prisma.pago.create({
      data: {
        residenteId,
        monto,
        concepto,
        periodo,
        metodoPago,
        montoPagado: yaPagado ? monto : 0,
        estado: yaPagado ? 'PAGADO' : 'PENDIENTE',
        cuotas: {
          create: Array.from({ length: cuotasCount }, (_, i) => ({
            monto: monto / cuotasCount,
            pagado: yaPagado,
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

export async function approveVoucher(pagoId: number) {
  try {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: { cuotas: true }
    })

    if (!pago) throw new Error('Pago no encontrado')

    await prisma.$transaction([
      prisma.pago.update({
        where: { id: pagoId },
        data: {
          estado: 'PAGADO',
          montoPagado: pago.monto
        }
      }),
      prisma.cuota.updateMany({
        where: { pagoId: pagoId },
        data: { pagado: true }
      })
    ])

    revalidatePath('/modules/pagos')
    return { success: true }
  } catch (error: any) {
    console.error('Error approving voucher:', error)
    return { success: false, error: 'Error al aprobar el comprobante' }
  }
}

export async function rejectVoucher(pagoId: number) {
  try {
    await prisma.pago.update({
      where: { id: pagoId },
      data: {
        estado: 'RECHAZADO',
        comprobante: null // Opcional: limpiar comprobante si es inválido
      }
    })

    revalidatePath('/modules/pagos')
    return { success: true }
  } catch (error: any) {
    console.error('Error rejecting voucher:', error)
    return { success: false, error: 'Error al rechazar el comprobante' }
  }
}

export async function updateCuota(id: number, pagado: boolean) {
  // ... (keeping existing logic but adding support for new statuses)
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

export async function payAllCuotas(pagoId: number) {
  try {
    // Update all cuotas
    await prisma.cuota.updateMany({
      where: { pagoId },
      data: { pagado: true }
    })

    const pago = await prisma.pago.findUnique({ where: { id: pagoId } })
    
    // Update the main payment
    await prisma.pago.update({
      where: { id: pagoId },
      data: {
        montoPagado: pago?.monto || 0,
        estado: 'PAGADO'
      }
    })

    revalidatePath('/modules/pagos')
    revalidatePath(`/modules/pagos/${pagoId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error in payAllCuotas:', error)
    return { success: false, error: 'Error al cobrar todo el saldo' }
  }
}

export async function enviarComprobantePago(data: { pagoId: number, comprobante: string, metodoPago: string }) {
  try {
    const { pagoId, comprobante, metodoPago } = data

    await prisma.pago.update({
      where: { id: pagoId },
      data: {
        comprobante,
        metodoPago,
        estado: 'EN_REVISION'
      }
    })

    revalidatePath('/modules/pagos')
    revalidatePath(`/modules/pagos/${pagoId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error in enviarComprobantePago:', error)
    return { success: false, error: 'Error al enviar el comprobante' }
  }
}
