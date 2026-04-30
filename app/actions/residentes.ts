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
      },
      pagos: true
    }
  })
}

export async function createResidente(data: any) {
  const nombre = data.nombre as string
  const apellidoPaterno = data.apellidoPaterno as string
  const apellidoMaterno = data.apellidoMaterno as string
  const dni = data.dni as string
  const email = data.email as string
  const password = dni // Contraseña por defecto es el DNI
  const telefono = data.telefono as string
  
  const emergenciaNombre = data.emergenciaNombre as string
  const emergenciaTelefono = data.emergenciaTelefono as string
  const emergenciaParentesco = data.emergenciaParentesco as string

  const residenciaId = (data.residenciaId && data.residenciaId !== "") ? Number(data.residenciaId) : null
  const habitacionId = (data.habitacionId && data.habitacionId !== "") ? Number(data.habitacionId) : null

  const montoMensual = Math.max(0, Number(data.montoMensual || 0))
  const montoGarantia = Math.max(0, Number(data.montoGarantia || 0))
  const cuotasGarantia = Math.max(1, Number(data.cuotasGarantia || 1))
  const diaPagoFinal = Math.max(1, Math.min(31, Number(data.diaPago || 1)))

  // Nuevos campos para confirmación de pago
  const pagoConfirmado = data.pagoConfirmado === true || data.pagoConfirmado === 'true'
  const comprobanteUrl = data.comprobanteUrl as string || null

  try {
    // Verificar si el correo o DNI ya existen
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { dni: dni || undefined },
          {
            AND: [
              { nombre: { equals: nombre, mode: 'insensitive' } },
              { apellidoPaterno: { equals: apellidoPaterno, mode: 'insensitive' } },
              { apellidoMaterno: { equals: apellidoMaterno, mode: 'insensitive' } }
            ]
          }
        ]
      }
    })

    if (existing) {
      if (existing.dni === dni) throw new Error('DNI ya existente en el sistema')
      if (existing.email === email) throw new Error('Correo electrónico ya registrado')
      if (
        existing.nombre.toLowerCase() === nombre.toLowerCase() &&
        existing.apellidoPaterno?.toLowerCase() === apellidoPaterno.toLowerCase() &&
        existing.apellidoMaterno?.toLowerCase() === apellidoMaterno.toLowerCase()
      ) {
        throw new Error('Ya existe un residente con los mismos nombres y apellidos')
      }
      throw new Error('Usuario ya existente')
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
          apellidoPaterno,
          apellidoMaterno,
          email,
          password,
          telefono,
          emergenciaNombre,
          emergenciaTelefono,
          emergenciaParentesco,
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
          fechaIngreso: (data.fechaIngreso && data.fechaIngreso !== "") ? new Date(data.fechaIngreso) : new Date(),
          fechaFinal: (data.fechaFinal && data.fechaFinal !== "") ? new Date(data.fechaFinal) : null,
          diaPago: diaPagoFinal,
          montoMensual: montoMensual,
          montoGarantia: montoGarantia,
          alergias: data.alergias || null,
          restriccionesAlimentarias: data.restriccionesAlimentarias || null
        }
      })

      // 4. Marcar habitación como no disponible
      if (habitacionId) {
        await tx.habitacion.update({
          where: { id: habitacionId },
          data: { estado: 'OCUPADO' }
        })
      }

      // 5. Generar Pagos Mensuales
      if (montoMensual > 0) {
        const fechaInicio = (data.fechaIngreso && data.fechaIngreso !== "") ? new Date(data.fechaIngreso) : new Date();
        const fechaFin = (data.fechaFinal && data.fechaFinal !== "") ? new Date(data.fechaFinal) : new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        let fechaActual = new Date(fechaInicio);
        const pagosToCreate: any[] = [];

        do {
          let fechaVencimiento = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), diaPagoFinal);
          if (fechaVencimiento.getMonth() !== fechaActual.getMonth()) {
            fechaVencimiento.setDate(0); 
          }

          const mesString = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
          const nombreMes = fechaActual.toLocaleDateString('es-MX', { month: 'long' });
          const concepto = `Mensualidad ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${fechaActual.getFullYear()}`;
          const isFirstPayment: boolean = pagosToCreate.length === 0;

          pagosToCreate.push({
            residenteId: residente.id,
            concepto: concepto,
            mesCorrespondiente: mesString,
            fechaVencimiento: fechaVencimiento,
            monto: montoMensual,
            estado: (isFirstPayment && pagoConfirmado) ? 'EN_REVISION' : 'PENDIENTE',
            comprobante: (isFirstPayment && pagoConfirmado) ? comprobanteUrl : null
          });

          fechaActual.setMonth(fechaActual.getMonth() + 1);
        } while (fechaActual < fechaFin);

        if (pagosToCreate.length > 0) {
          await tx.pago.createMany({ data: pagosToCreate });
        }
      }

      if (montoGarantia > 0) {
        const montoPrimerPago = Number(data.montoGarantiaPrimerPago || (montoGarantia / cuotasGarantia))
        const montoRestante = Math.max(0, montoGarantia - montoPrimerPago)
        const montoOtrasCuotas = cuotasGarantia > 1 ? (montoRestante / (cuotasGarantia - 1)) : 0

        const garantiasToCreate = Array.from({ length: cuotasGarantia }).map((_, i) => {
          const fecha = new Date()
          fecha.setMonth(fecha.getMonth() + i)
          const montoCuota = i === 0 ? montoPrimerPago : montoOtrasCuotas
          const isFirstPayment = i === 0;

          return {
            residenteId: residente.id,
            concepto: `Garantía (Cuota ${i + 1}/${cuotasGarantia})`,
            monto: montoCuota,
            montoPagado: 0,
            fechaVencimiento: fecha,
            estado: ((isFirstPayment && pagoConfirmado) ? 'EN_REVISION' : 'PENDIENTE') as any,
            comprobante: (isFirstPayment && pagoConfirmado) ? comprobanteUrl : null
          }
        });

        await tx.pago.createMany({ data: garantiasToCreate });
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
  const apellidoPaterno = data.apellidoPaterno as string
  const apellidoMaterno = data.apellidoMaterno as string
  const email = data.email as string
  const password = data.password as string
  const telefono = data.telefono as string
  
  const emergenciaNombre = data.emergenciaNombre as string
  const emergenciaTelefono = data.emergenciaTelefono as string
  const emergenciaParentesco = data.emergenciaParentesco as string

  const residenciaId = (data.residenciaId && data.residenciaId !== "") ? Number(data.residenciaId) : null
  const habitacionId = (data.habitacionId && data.habitacionId !== "") ? Number(data.habitacionId) : null

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
      const userData: any = { 
        dni, 
        nombre, 
        apellidoPaterno, 
        apellidoMaterno, 
        email, 
        residenciaId, 
        telefono,
        emergenciaNombre,
        emergenciaTelefono,
        emergenciaParentesco
      }
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
      const residente = await tx.residente.update({
        where: { id },
        data: { 
          habitacionId,
          fechaIngreso: (data.fechaIngreso && data.fechaIngreso !== "") ? new Date(data.fechaIngreso) : undefined,
          fechaFinal: (data.fechaFinal && data.fechaFinal !== "") ? new Date(data.fechaFinal) : null,
          diaPago: data.diaPago ? Number(data.diaPago) : undefined,
          montoMensual: data.montoMensual !== undefined && data.montoMensual !== "" ? Number(data.montoMensual) : undefined,
          montoGarantia: data.montoGarantia !== undefined && data.montoGarantia !== "" ? Number(data.montoGarantia) : undefined,
          alergias: data.alergias,
          restriccionesAlimentarias: data.restriccionesAlimentarias
        }
      })

      // 4. Actualizar Montos Financieros (Solo si no están pagados completamente)
      const parsedMontoMensual = data.montoMensual !== undefined && data.montoMensual !== "" ? Number(data.montoMensual) : null
      const parsedMontoGarantia = data.montoGarantia !== undefined && data.montoGarantia !== "" ? Number(data.montoGarantia) : null

      if (parsedMontoMensual !== null) {
        await tx.pago.updateMany({
          where: { 
            residenteId: id, 
            concepto: { contains: 'Mensualidad' },
            estado: { in: ['PENDIENTE', 'RECHAZADO'] }
          },
          data: { monto: parsedMontoMensual }
        })
      }

      if (parsedMontoGarantia !== null) {
        await tx.pago.updateMany({
          where: { 
            residenteId: id, 
            concepto: { contains: 'Garantía' },
            estado: { in: ['PENDIENTE', 'EN_REVISION', 'RECHAZADO'] }
          },
          data: { monto: parsedMontoGarantia }
        })
      }

      // 5. Sincronizar meses si cambiaron las fechas
      const newFechaIngreso = residente.fechaIngreso;
      const newFechaFinal = residente.fechaFinal;
      const newDiaPago = residente.diaPago;
      const newMontoMensual = residente.montoMensual;

      if (newFechaFinal && newMontoMensual > 0) {
        let fechaActual = new Date(newFechaIngreso);
        const expectedMeses = [];
        
        do {
          const mesString = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
          let fechaVencimiento = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), newDiaPago);
          if (fechaVencimiento.getMonth() !== fechaActual.getMonth()) {
            fechaVencimiento.setDate(0); 
          }
          const nombreMes = fechaActual.toLocaleDateString('es-MX', { month: 'long' });
          const concepto = `Mensualidad ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${fechaActual.getFullYear()}`;
          
          expectedMeses.push({ mesCorrespondiente: mesString, fechaVencimiento, concepto });
          fechaActual.setMonth(fechaActual.getMonth() + 1);
        } while (fechaActual < newFechaFinal);

        const existingPagos = await tx.pago.findMany({
          where: { residenteId: id, concepto: { contains: 'Mensualidad' } }
        });
        const existingMeses = existingPagos.map(p => p.mesCorrespondiente);
        
        const pagosToCreate = expectedMeses
          .filter(exp => !existingMeses.includes(exp.mesCorrespondiente))
          .map(exp => ({
            residenteId: id,
            concepto: exp.concepto,
            mesCorrespondiente: exp.mesCorrespondiente,
            fechaVencimiento: exp.fechaVencimiento,
            monto: newMontoMensual,
            estado: 'PENDIENTE' as any,
          }));
          
        if (pagosToCreate.length > 0) {
          await tx.pago.createMany({ data: pagosToCreate });
        }
        
        const expectedMesesStrings = expectedMeses.map(e => e.mesCorrespondiente);
        const pagosToDelete = existingPagos.filter(p => 
          p.mesCorrespondiente && !expectedMesesStrings.includes(p.mesCorrespondiente) && 
          ['PENDIENTE', 'EN_REVISION'].includes(p.estado)
        );
        
        if (pagosToDelete.length > 0) {
          await tx.pago.deleteMany({
            where: { id: { in: pagosToDelete.map(p => p.id) } }
          });
        }
      }

      return residente
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
      // 1. Liberar la habitación
      if (res.habitacionId) {
        await tx.habitacion.update({
          where: { id: res.habitacionId },
          data: { estado: 'LIBRE' }
        })
      }

      // 2. Eliminar registros relacionados para evitar errores de FK
      
      // Pagos y sus cuotas
      const pagos = await tx.pago.findMany({ where: { residenteId: id } })
      const pagoIds = pagos.map(p => p.id)
      await tx.pago.deleteMany({ where: { residenteId: id } })

      // Turnos de lavandería (los liberamos en lugar de borrarlos)
      await tx.turnoLavanderia.updateMany({
        where: { residenteId: id },
        data: { residenteId: null, estado: 'LIBRE' }
      })

      // Asistencias a comida
      await tx.asistenciaComida.deleteMany({ where: { residenteId: id } })

      // Tickets de mantenimiento
      await tx.ticketMantenimiento.deleteMany({ where: { residenteId: id } })

      // Productos en marketplace
      await tx.productoMarketplace.deleteMany({ where: { residenteId: id } })

      // Reacciones del usuario
      await tx.reaccion.deleteMany({ where: { userId: res.userId } })

      // 3. Finalmente eliminar el residente y el usuario
      await tx.residente.delete({ where: { id } })
      await tx.user.delete({ where: { id: res.userId } })
    })

    revalidatePath('/admin/residentes')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
