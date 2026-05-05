'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { EstadoPago } from '@prisma/client'
import { checkAuth, checkResidenciaAccess } from '@/lib/auth-utils'
import { createNotification, notifyAdmins } from './notificaciones'

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
        estado: yaPagado ? EstadoPago.PAGADO : EstadoPago.PENDIENTE,
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
        estado: EstadoPago.PAGADO,
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
        estado: isVencido ? EstadoPago.VENCIDO : EstadoPago.PENDIENTE,
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
          estado: pagado ? EstadoPago.PAGADO : EstadoPago.PENDIENTE,
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
        estado: EstadoPago.PAGADO,
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
        estado: EstadoPago.EN_REVISION
      },
      include: { residente: { include: { user: true } } }
    })

    // Notificar a los admins locales y globales
    await notifyAdmins(
        pago.residente.user.residenciaId,
        'Nuevo Comprobante de Pago',
        `${pago.residente.user.nombre} ha subido un comprobante para ${pago.concepto}.`,
        '/modules/pagos'
    )

    revalidatePath('/modules/pagos')
    revalidatePath(`/modules/pagos/${pagoId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error in enviarComprobantePago:', error)
    return { success: false, error: 'Error al enviar el comprobante' }
  }
}


export async function sendPaymentReminder(residenteId: number) {
  try {
    const user = await checkAuth('MANAGE_PAYMENTS')

    const residente = await prisma.residente.findUnique({
      where: { id: residenteId },
      include: {
        user: true,
        pagos: {
          where: {
            estado: { in: ['PENDIENTE', 'VENCIDO', 'CRITICO'] }
          },
          orderBy: { fechaVencimiento: 'asc' },
          take: 1
        }
      }
    })

    if (!residente) throw new Error('Residente no encontrado')
    if (residente.pagos.length === 0) throw new Error('No hay pagos pendientes para este residente')

    const pago = residente.pagos[0]
    const fechaVenc = pago.fechaVencimiento?.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) || 'No definida'
    
    await createNotification(
      residente.userId,
      '⚠️ Recordatorio de Pago',
      `Hola ${residente.user.nombre}, te recordamos que tienes un pago pendiente (${pago.concepto}) en estado ${pago.estado}. Vence el: ${fechaVenc}.`,
      'PAGO',
      '/modules/pagos'
    )

    return { success: true }
  } catch (error: any) {
    console.error('Error in sendPaymentReminder:', error)
    return { success: false, error: error.message || 'Error al enviar recordatorio' }
  }
}
