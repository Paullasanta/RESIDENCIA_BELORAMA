'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { checkAuth, checkResidenciaAccess } from '@/lib/auth-utils'
import { createNotification } from './notificaciones'

export async function createPago(data: any) {
  try {
    const residenteId = Number(data.residenteId)
    const monto = Number(data.monto)
    const concepto = (data.concepto as string) || 'Pago General'
    const cuotasCount = Number(data.numCuotas || 1)
    const periodo = data.periodo as string || null
    const metodoPago = data.metodoPago as string || null
    const yaPagado = data.yaPagado === true || data.yaPagado === 'true'

    const pagosData = Array.from({ length: cuotasCount }).map((_, i) => ({
        residenteId,
        monto: monto / cuotasCount,
        concepto: cuotasCount > 1 ? `${concepto} (Cuota ${i + 1}/${cuotasCount})` : concepto,
        periodo,
        metodoPago,
        montoPagado: yaPagado ? (monto / cuotasCount) : 0,
        estado: yaPagado ? 'PAGADO' as any : 'PENDIENTE' as any,
        fechaVencimiento: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
    }));

    await prisma.pago.createMany({ data: pagosData });

    revalidatePath('/modules/pagos')
    return { success: true }
  } catch (error: any) {
    console.error('Error in createPago:', error)
    return { success: false, error: 'Error al registrar el pago' }
  }
}

export async function approveVoucher(pagoId: number) {
  try {
    const user = await checkAuth('MANAGE_PAYMENTS')

    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: { residente: { include: { user: true } } }
    })

    if (!pago) throw new Error('Pago no encontrado')

    // Validar que el admin pertenece a la misma residencia que el pago
    checkResidenciaAccess(user, pago.residente.user.residenciaId)

    await prisma.pago.update({
      where: { id: pagoId },
      data: {
        montoPagado: pago.monto,
        estado: 'PAGADO',
        fechaPago: new Date(),
      }
    })

    // Enviar notificación al residente
    await createNotification(
      pago.residente.userId,
      '¡Pago Aprobado!',
      `Tu pago por concepto de ${pago.concepto} ha sido validado correctamente.`,
      'PAGO',
      '/modules/pagos'
    )

    revalidatePath('/modules/pagos')
    return { success: true }
  } catch (error: any) {
    console.error('Error approving voucher:', error)
    return { success: false, error: 'Error al aprobar el comprobante' }
  }
}

export async function rejectVoucher(pagoId: number) {
  try {
    const user = await checkAuth('MANAGE_PAYMENTS')

    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: { residente: { include: { user: true } } }
    })

    if (!pago) throw new Error('Pago no encontrado')

    // Validar acceso
    checkResidenciaAccess(user, pago.residente.user.residenciaId)

    // Si la fecha de vencimiento ya pasó, debe ser VENCIDO, si no PENDIENTE
    const isVencido = pago.fechaVencimiento && pago.fechaVencimiento < new Date()

    await prisma.pago.update({
      where: { id: pagoId },
      data: {
        estado: isVencido ? 'VENCIDO' : 'PENDIENTE',
        comprobante: null,
        metodoPago: null
      }
    })

    // Enviar notificación al residente
    await createNotification(
      pago.residente.userId,
      'Pago Rechazado',
      `Tu comprobante de pago para ${pago.concepto} fue rechazado. Por favor, sube uno válido.`,
      'PAGO',
      '/modules/pagos'
    )

    revalidatePath('/modules/pagos')
    return { success: true }
  } catch (error: any) {
    console.error('Error rejecting voucher:', error)
    return { success: false, error: 'Error al rechazar el comprobante' }
  }
}

export async function togglePagoStatus(id: number, pagado: boolean) {
  try {
    const pago = await prisma.pago.findUnique({ where: { id } })
    if (!pago) throw new Error('Pago no encontrado')

    await prisma.pago.update({
      where: { id },
      data: { 
          montoPagado: pagado ? pago.monto : 0,
          estado: pagado ? 'PAGADO' : 'PENDIENTE',
          fechaPago: pagado ? new Date() : null
      }
    })

    revalidatePath('/modules/pagos')
    revalidatePath(`/modules/pagos/${id}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error in togglePagoStatus:', error)
    return { success: false, error: 'Error al actualizar pago' }
  }
}

export async function payPago(pagoId: number) {
  try {
    const pago = await prisma.pago.findUnique({ where: { id: pagoId } })
    
    await prisma.pago.update({
      where: { id: pagoId },
      data: {
        montoPagado: pago?.monto || 0,
        estado: 'PAGADO',
        fechaPago: new Date()
      }
    })

    revalidatePath('/modules/pagos')
    revalidatePath(`/modules/pagos/${pagoId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error in payPago:', error)
    return { success: false, error: 'Error al cobrar saldo' }
  }
}

export async function enviarComprobantePago(data: { pagoId: number, comprobante: string, metodoPago: string }) {
  try {
    const { pagoId, comprobante, metodoPago } = data

    const pago = await prisma.pago.update({
      where: { id: pagoId },
      data: {
        comprobante,
        metodoPago,
        estado: 'EN_REVISION'
      },
      include: { residente: { include: { user: true } } }
    })

    // Notificar a los admins locales y globales
    const admins = await prisma.user.findMany({
        where: {
            OR: [
                { residenciaId: pago.residente.user.residenciaId },
                { residenciaId: null }
            ],
            role: { name: 'ADMIN' }
        },
        select: { id: true }
    })

    for (const admin of admins) {
        await createNotification(
            admin.id,
            'Nuevo Comprobante de Pago',
            `${pago.residente.user.nombre} ha subido un comprobante para ${pago.concepto}.`,
            'PAGO',
            '/modules/pagos'
        )
    }

    revalidatePath('/modules/pagos')
    revalidatePath(`/modules/pagos/${pagoId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error in enviarComprobantePago:', error)
    return { success: false, error: 'Error al enviar el comprobante' }
  }
}

