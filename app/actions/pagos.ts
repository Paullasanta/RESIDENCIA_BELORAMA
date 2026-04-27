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

    await prisma.$transaction(async (tx) => {
      // Encontrar la cuota pendiente más antigua o las cuotas vencidas
      const cuotasPendientes = pago.cuotas
        .filter(c => !c.pagado)
        .sort((a, b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime())

      if (cuotasPendientes.length === 0) return

      // Por ahora, aprobamos la primera cuota pendiente (la más antigua)
      // Esto asume que el voucher es por una cuota.
      const cuotaAPagar = cuotasPendientes[0]

      await tx.cuota.update({
        where: { id: cuotaAPagar.id },
        data: { pagado: true }
      })

      const nuevoMontoPagado = pago.montoPagado + cuotaAPagar.monto
      const todosPagados = cuotasPendientes.length === 1

      await tx.pago.update({
        where: { id: pagoId },
        data: {
          montoPagado: nuevoMontoPagado,
          estado: todosPagados ? 'PAGADO' : 'PARCIAL',
          comprobante: null // Limpiamos para el próximo pago si es parcial
        }
      })
    })

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

export async function generarCobrosMensuales() {
  try {
    const residentes = await prisma.residente.findMany({
      where: { activo: true },
      include: { pagos: true }
    })

    const today = new Date()
    let generados = 0

    for (const res of residentes) {
      if (res.montoMensual <= 0) continue

      const fechaInicio = new Date(res.fechaIngreso)
      const fechaLimite = res.fechaFinal ? new Date(res.fechaFinal) : null
      
      // Calcular cuántos meses de mensualidad le corresponden en total
      let mesesTotales = 999 // Por defecto, sin límite
      if (fechaLimite) {
          // Diferencia básica de meses
          mesesTotales = (fechaLimite.getFullYear() - fechaInicio.getFullYear()) * 12 + (fechaLimite.getMonth() - fechaInicio.getMonth())
          
          // Si el día de salida es posterior al día de entrada, significa que ha iniciado un nuevo mes
          // Ej: Entrada 26 Abr, Salida 27 May -> Son 2 meses (Abril-Mayo y el inicio de Mayo-Junio)
          if (fechaLimite.getDate() > fechaInicio.getDate()) {
              mesesTotales++
          }
      }

      let iterDate = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1)
      const currentYear = today.getFullYear()
      const currentMonth = today.getMonth()
      const endDate = new Date(currentYear, currentMonth + 1, 1)

      let mesesGeneradosParaEsteResidente = 0

      while (iterDate <= endDate) {
        // console.log(`Generando para ${res.id}: ${iterDate.toISOString()} (Mes ${mesesGeneradosParaEsteResidente} de ${mesesTotales})`)
        // Si ya llegamos al número de meses contratados, parar
        if (mesesGeneradosParaEsteResidente >= mesesTotales) break

        const periodoStr = iterDate.toISOString().slice(0, 7) // YYYY-MM
        
        // Verificar si ya existe un pago de alquiler para este periodo
        const existe = res.pagos.some(p => 
          p.periodo === periodoStr && 
          (p.concepto.includes('Alquiler') || p.concepto.includes('Mensualidad'))
        )

        if (!existe) {
          // Crear el cobro para este mes
          const nombreMes = iterDate.toLocaleDateString('es-MX', { month: 'long' })
          const concepto = `Mensualidad ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${iterDate.getFullYear()}`
          
          // Calcular fecha de vencimiento basada en el diaPago del residente
          const fechaVencimiento = new Date(iterDate.getFullYear(), iterDate.getMonth(), res.diaPago)
          // Ajustar si el día excede el fin de mes
          if (fechaVencimiento.getMonth() !== iterDate.getMonth()) {
            fechaVencimiento.setDate(0) // Último día del mes anterior (que es el mes correcto)
          }

          await prisma.pago.create({
            data: {
              residenteId: res.id,
              concepto,
              monto: res.montoMensual,
              periodo: periodoStr,
              estado: 'PENDIENTE',
              cuotas: {
                create: {
                  monto: res.montoMensual,
                  pagado: false,
                  fechaVencimiento: fechaVencimiento
                }
              }
            }
          })
          generados++
        }

        mesesGeneradosParaEsteResidente++
        iterDate.setMonth(iterDate.getMonth() + 1)
      }
    }

    /* 
    if (generados > 0) {
      revalidatePath('/modules/pagos')
    }
    */

    return { success: true, generados }
  } catch (error) {
    console.error('Error generating monthly payments:', error)
    return { success: false, error: 'Error al generar cobros mensuales' }
  }
}
