'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createContrato(data: {
  residenteId: number
  fechaInicio: Date
  fechaFin: Date
  montoMensual: number
  diaPago: number
  archivoContrato?: string
}) {
  try {
    // 1. Crear el contrato
    const contrato = await prisma.contrato.create({
      data: {
        residenteId: data.residenteId,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        montoMensual: data.montoMensual,
        diaPago: data.diaPago,
        archivoContrato: data.archivoContrato,
      }
    });

    // 2. Generar todos los pagos mensuales
    let fechaActual = new Date(data.fechaInicio);
    const fechaFin = new Date(data.fechaFin);
    const pagosToCreate = [];

    while (fechaActual <= fechaFin) {
      // Calcular fecha de vencimiento. Ej: si diaPago es 5, vencimiento es el 5 del mes iterado
      let fechaVencimiento = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), data.diaPago);
      
      // Ajuste si el diaPago es mayor a los días del mes (ej: 31 de febrero)
      if (fechaVencimiento.getMonth() !== fechaActual.getMonth()) {
        fechaVencimiento.setDate(0); 
      }

      const mesString = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
      const nombreMes = fechaActual.toLocaleDateString('es-MX', { month: 'long' });
      const concepto = `Mensualidad ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${fechaActual.getFullYear()}`;

      pagosToCreate.push({
        contratoId: contrato.id,
        residenteId: data.residenteId,
        concepto: concepto,
        mesCorrespondiente: mesString,
        fechaVencimiento: fechaVencimiento,
        monto: data.montoMensual,
        estado: 'PENDIENTE' as const,
      });

      // Avanzar al siguiente mes
      fechaActual.setMonth(fechaActual.getMonth() + 1);
    }

    if (pagosToCreate.length > 0) {
      await prisma.pago.createMany({
        data: pagosToCreate
      });
    }

    revalidatePath('/modules/residentes');
    revalidatePath('/modules/pagos');

    return { success: true, data: contrato };
  } catch (error: any) {
    console.error('Error creating contrato:', error);
    return { success: false, error: 'Error al crear el contrato y generar los pagos.' };
  }
}
