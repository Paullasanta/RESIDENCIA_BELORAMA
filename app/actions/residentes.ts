'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Parsea un string 'YYYY-MM-DD' como mediodia UTC (12:00:00Z).
 * Esto evita que al almacenar medianoche UTC la fecha se muestre
 * como el dia anterior en timezones con offset negativo (ej. Lima UTC-5).
 */
function utcNoon(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
}

/**
 * Crea la fecha de vencimiento para un mes dado y un dia de pago.
 * Si el dia no existe en ese mes (ej. dia 31 en abril), usa el ultimo dia del mes.
 */
function calcFechaVencimiento(year: number, month: number, diaPago: number): Date {
  // Intenta crear la fecha con el dia de pago
  const fecha = new Date(Date.UTC(year, month, diaPago, 12, 0, 0))
  // Si el mes se desbordó (ej. abril dia 31 → mayo), retroceder al ultimo dia del mes original
  if (fecha.getUTCMonth() !== month) {
    fecha.setUTCDate(0) // último día del mes anterior (= mes original)
  }
  return fecha
}

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
    // Verificar capacidad de habitación si se asigna una
    if (habitacionId) {
      const room = await prisma.habitacion.findUnique({
        where: { id: habitacionId },
        include: { residentes: { where: { activo: true } } }
      })
      if (room && room.residentes.length >= room.capacidad) {
        throw new Error(`La habitación ${room.numero} ya alcanzó su capacidad máxima (${room.capacidad}).`)
      }
    }

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
      const hasResidente = !!(await prisma.residente.findUnique({ where: { userId: existing.id } }))
      const orphanSuffix = !hasResidente ? ' (el usuario existe pero no tiene perfil de residente. Contacte al administrador para limpiar el registro si es necesario)' : ''

      if (existing.dni === dni) throw new Error(`DNI ya existente en el sistema${orphanSuffix}`)
      if (existing.email === email) throw new Error(`Correo electrónico ya registrado${orphanSuffix}`)
      if (
        existing.nombre.toLowerCase() === nombre.toLowerCase() &&
        existing.apellidoPaterno?.toLowerCase() === apellidoPaterno.toLowerCase() &&
        existing.apellidoMaterno?.toLowerCase() === apellidoMaterno.toLowerCase()
      ) {
        throw new Error(`Ya existe un residente con los mismos nombres y apellidos${orphanSuffix}`)
      }
      throw new Error(`Usuario ya existente${orphanSuffix}`)
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
          fechaNacimiento: (data.fechaNacimiento && data.fechaNacimiento !== "") ? new Date(data.fechaNacimiento) : undefined,
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
          fechaIngreso: (data.fechaIngreso && data.fechaIngreso !== "") ? utcNoon(data.fechaIngreso) : new Date(),
          fechaFinal: (data.fechaFinal && data.fechaFinal !== "") ? utcNoon(data.fechaFinal) : null,
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
        const fIngreso = (data.fechaIngreso && data.fechaIngreso !== "") ? utcNoon(data.fechaIngreso) : new Date();
        const fFinal = (data.fechaFinal && data.fechaFinal !== "") ? utcNoon(data.fechaFinal) : null;
        
        let numMeses = 1;
        if (fFinal) {
          const totalDays = Math.floor((fFinal.getTime() - fIngreso.getTime()) / (1000 * 60 * 60 * 24))
          // Si son 31 días o menos, es 1 solo mes. Solo a partir del día 32 contamos el segundo mes.
          numMeses = Math.max(1, Math.ceil(totalDays / 30.44))
          if (totalDays <= 31) numMeses = 1
        } else {
          // Si no hay fecha final, generamos el primer mes por defecto
          numMeses = 1;
        }

        const now = new Date();
        now.setUTCHours(0, 0, 0, 0);

        const pagosToCreate = Array.from({ length: numMeses }, (_, i) => {
          const isFirstPayment = i === 0;
          const targetDate = new Date(fIngreso);
          targetDate.setUTCMonth(fIngreso.getUTCMonth() + i);
          
          const fechaVencimiento = isFirstPayment ? new Date(fIngreso) : calcFechaVencimiento(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), diaPagoFinal);
          const mesString = `${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}`;
          const nombreMes = targetDate.toLocaleDateString('es-MX', { timeZone: 'UTC', month: 'long' });
          const concepto = `Mensualidad ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${targetDate.getUTCFullYear()}`;

          return {
            residenteId: residente.id,
            concepto: concepto,
            mesCorrespondiente: mesString,
            fechaVencimiento: fechaVencimiento,
            monto: montoMensual,
            estado: (isFirstPayment && pagoConfirmado) ? 'EN_REVISION' : (fechaVencimiento < now ? 'VENCIDO' : 'PENDIENTE'),
            comprobante: (isFirstPayment && pagoConfirmado) ? comprobanteUrl : null
          };
        });

        if (pagosToCreate.length > 0) {
          await tx.pago.createMany({ data: pagosToCreate });
        }
      }

      if (montoGarantia > 0) {
        const fIngresoG = (data.fechaIngreso && data.fechaIngreso !== "") ? utcNoon(data.fechaIngreso) : new Date();
        const fFinalG = (data.fechaFinal && data.fechaFinal !== "") ? utcNoon(data.fechaFinal) : null;
        let stayMonths = 12;
        if (fFinalG) {
          const totalDays = Math.round((fFinalG.getTime() - fIngresoG.getTime()) / (1000 * 60 * 60 * 24))
          stayMonths = totalDays <= 31 ? 1 : Math.max(1, Math.ceil(totalDays / 30.44))
        }
        
        // Usar las cuotas solicitadas directamente
        const finalCuotas = cuotasGarantia;
        const nowG = new Date();
        nowG.setUTCHours(0, 0, 0, 0);
        
        const montoPrimerPago = Number(data.montoGarantiaPrimerPago || (montoGarantia / finalCuotas))
        const montoRestante = Math.max(0, montoGarantia - montoPrimerPago)
        const montoOtrasCuotas = finalCuotas > 1 ? (montoRestante / (finalCuotas - 1)) : 0

        const garantiasToCreate = Array.from({ length: finalCuotas }).map((_, i) => {
          const fecha = new Date(fIngresoG)
          fecha.setUTCMonth(fecha.getUTCMonth() + i)
          const montoCuota = i === 0 ? montoPrimerPago : montoOtrasCuotas
          const isFirstPayment = i === 0;

          const fechaVencimiento = isFirstPayment ? new Date(fIngresoG) : calcFechaVencimiento(fecha.getUTCFullYear(), fecha.getUTCMonth(), diaPagoFinal);
          const defaultStatus = fechaVencimiento < nowG ? 'VENCIDO' : 'PENDIENTE';

          return {
            residenteId: residente.id,
            concepto: `Garantía (Cuota ${i + 1}/${finalCuotas})`,
            monto: montoCuota,
            montoPagado: 0,
            fechaVencimiento: fechaVencimiento,
            estado: ((isFirstPayment && pagoConfirmado) ? 'EN_REVISION' : defaultStatus) as any,
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
    // Verificar capacidad de habitación si ha cambiado
    if (habitacionId && currentResidente.habitacionId !== habitacionId) {
      const room = await prisma.habitacion.findUnique({
        where: { id: habitacionId },
        include: { 
          residentes: { 
            where: { 
              activo: true,
              NOT: { id: id }
            } 
          } 
        }
      })
      if (room && room.residentes.length >= room.capacidad) {
        throw new Error(`La habitación ${room.numero} ya alcanzó su capacidad máxima (${room.capacidad}).`)
      }
    }

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
        emergenciaParentesco,
        fechaNacimiento: (data.fechaNacimiento && data.fechaNacimiento !== "") ? new Date(data.fechaNacimiento) : undefined
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
          fechaIngreso: (data.fechaIngreso && data.fechaIngreso !== "") ? utcNoon(data.fechaIngreso) : undefined,
          fechaFinal: (data.fechaFinal && data.fechaFinal !== "") ? utcNoon(data.fechaFinal) : null,
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
        // Actualizar monto en pagos no finalizados (excluye PAGADO y EN_REVISION)
        await tx.pago.updateMany({
          where: { 
            residenteId: id,
            OR: [
              { concepto: { contains: 'Mensua', mode: 'insensitive' } },
              { concepto: { contains: 'Mes', mode: 'insensitive' } },
              { concepto: { contains: 'Alquiler', mode: 'insensitive' } },
            ],
            estado: { in: ['PENDIENTE', 'RECHAZADO', 'VENCIDO', 'CRITICO'] }
          },
          data: { monto: parsedMontoMensual }
        })
      }

      if (parsedMontoGarantia !== null) {
        // Obtener cuotas de garantía actuales (solo las de la estancia vigente)
        const existingGarantias = await tx.pago.findMany({
          where: { 
            residenteId: id, 
            concepto: { contains: 'Garantía', mode: 'insensitive' },
            estado: { not: 'RECHAZADO' },
            fechaVencimiento: { gte: currentResidente.fechaIngreso }
          },
          orderBy: { fechaVencimiento: 'asc' }
        })

        const newTotalCuotas = data.cuotasGarantia ? Number(data.cuotasGarantia) : existingGarantias.length

        // Solo recalcular si el admin realmente cambió el monto o el número de cuotas
        // Comparamos contra los valores guardados en BD para evitar falsos positivos
        const hasAmountChanged = Math.abs(parsedMontoGarantia - (currentResidente.montoGarantia || 0)) > 0.01
        const hasCuotasChanged = newTotalCuotas !== existingGarantias.length

        if (hasAmountChanged || hasCuotasChanged) {
          // Identificar pagos que NO podemos tocar (finalizados o en revisión)
          const finalizados = existingGarantias.filter(p => p.estado === 'PAGADO' || p.estado === 'EN_REVISION')
          // Identificar pagos que SÍ podemos modificar o eliminar
          const modificables = existingGarantias.filter(p => p.estado !== 'PAGADO' && p.estado !== 'EN_REVISION')
          
          const montoComprometido = finalizados.reduce((sum, p) => sum + p.monto, 0)
          const montoRestante = Math.max(0, parsedMontoGarantia - montoComprometido)
          const numCuotasRestantes = Math.max(0, newTotalCuotas - finalizados.length)

          if (numCuotasRestantes > 0 || modificables.length > 0) {
            // Eliminar los modificables para regenerarlos con el nuevo monto/distribución
            if (modificables.length > 0) {
              await tx.pago.deleteMany({
                where: { id: { in: modificables.map(p => p.id) } }
              })
            }

            if (numCuotasRestantes > 0) {
              const montoPorCuota = Number((montoRestante / numCuotasRestantes).toFixed(2))
              const pagosToCreate = []
              
              for (let i = 0; i < numCuotasRestantes; i++) {
                const installmentNum = finalizados.length + i + 1
                const baseDate = new Date(residente.fechaIngreso)
                
                // REGLA: El primer pago (Cuota 1) siempre vence el día de ingreso.
                // Los siguientes (Cuota 2, 3...) vencen en los meses siguientes según el diaPago.
                let fechaVenc;
                if (installmentNum === 1) {
                  fechaVenc = new Date(baseDate)
                } else {
                  fechaVenc = calcFechaVencimiento(
                    baseDate.getUTCFullYear(),
                    baseDate.getUTCMonth() + (installmentNum - 1),
                    residente.diaPago
                  )
                }

                pagosToCreate.push({
                  residenteId: id,
                  concepto: `Garantía (Cuota ${installmentNum}/${newTotalCuotas})`,
                  monto: i === numCuotasRestantes - 1 
                    ? Number((montoRestante - (montoPorCuota * (numCuotasRestantes - 1))).toFixed(2))
                    : montoPorCuota,
                  fechaVencimiento: fechaVenc,
                  estado: 'PENDIENTE' as any
                })
              }
              if (pagosToCreate.length > 0) {
                await tx.pago.createMany({ data: pagosToCreate })
              }
            }

            // Actualizar conceptos de los pagos que NO se borraron (los finalizados)
            for (const f of finalizados) {
              const match = f.concepto.match(/Cuota (\d+)\//)
              const currentNum = match ? match[1] : "1"
              await tx.pago.update({
                where: { id: f.id },
                data: { concepto: `Garantía (Cuota ${currentNum}/${newTotalCuotas})` }
              })
            }
          }
        }
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
          const mesString = `${fechaActual.getUTCFullYear()}-${String(fechaActual.getUTCMonth() + 1).padStart(2, '0')}`;
          const fechaVencimiento = calcFechaVencimiento(fechaActual.getUTCFullYear(), fechaActual.getUTCMonth(), newDiaPago);
          const nombreMes = fechaActual.toLocaleDateString('es-MX', { timeZone: 'UTC', month: 'long' });
          const concepto = `Mensualidad ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${fechaActual.getUTCFullYear()}`;
          
          expectedMeses.push({ mesCorrespondiente: mesString, fechaVencimiento, concepto });
          fechaActual.setUTCMonth(fechaActual.getUTCMonth() + 1);
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

        const expectedMesesStrings = expectedMeses.map(exp => exp.mesCorrespondiente);
        const pagosToDelete = existingPagos.filter(p => 
          p.mesCorrespondiente && !expectedMesesStrings.includes(p.mesCorrespondiente) && 
          p.estado !== 'PAGADO' && p.estado !== 'EN_REVISION'
        );

        if (pagosToDelete.length > 0) {
          await tx.pago.deleteMany({
            where: { id: { in: pagosToDelete.map(p => p.id) } }
          });
        }

      }

      // --- Sincronización Global de Pagos (Fuera del bloque de fechaFinal para que afecte a todos) ---
      const now = new Date()
      now.setUTCHours(0, 0, 0, 0)

      // 6. Mensualidades (Búsqueda más amplia para evitar fallos por concepto o acentos)
      const allMensualidades = await tx.pago.findMany({
        where: {
          residenteId: id,
          OR: [
            { concepto: { contains: 'Mensua', mode: 'insensitive' } },
            { concepto: { contains: 'Mes', mode: 'insensitive' } },
            { concepto: { contains: 'Alquiler', mode: 'insensitive' } }
          ],
          estado: { in: ['PENDIENTE', 'RECHAZADO', 'VENCIDO'] }
        }
      })

      for (const p of allMensualidades) {
        let year, month;
        if (p.mesCorrespondiente) {
          const parts = p.mesCorrespondiente.split('-');
          year = parseInt(parts[0]);
          month = parseInt(parts[1]) - 1;
        } else {
          year = p.fechaVencimiento!.getUTCFullYear();
          month = p.fechaVencimiento!.getUTCMonth();
        }

        const newFecha = calcFechaVencimiento(year, month, newDiaPago);
        const newStatus = newFecha < now ? 'VENCIDO' : 'PENDIENTE';

        await tx.pago.update({
          where: { id: p.id },
          data: {
            fechaVencimiento: newFecha,
            estado: (p.estado === 'PENDIENTE' || p.estado === 'VENCIDO') ? newStatus : p.estado
          }
        })
      }

      // 7. Garantías
      const allGarantias = await tx.pago.findMany({
        where: {
          residenteId: id,
          concepto: { contains: 'Garantía', mode: 'insensitive' },
          estado: { in: ['PENDIENTE', 'EN_REVISION', 'RECHAZADO', 'VENCIDO'] }
        }
      })

      for (const g of allGarantias) {
        const match = g.concepto.match(/Cuota (\d+)\/(\d+)/)
        if (match) {
          const i = parseInt(match[1]) - 1
          const base = new Date(newFechaIngreso)
          const newFecha = calcFechaVencimiento(
            base.getUTCFullYear(),
            base.getUTCMonth() + i,
            newDiaPago
          )
          const gStatus = newFecha < now ? 'VENCIDO' : 'PENDIENTE'
          
          await tx.pago.update({
            where: { id: g.id },
            data: {
              fechaVencimiento: newFecha,
              estado: (g.estado === 'PENDIENTE' || g.estado === 'VENCIDO') ? gStatus : g.estado
            }
          })
        }
      }

      return residente
    })

    revalidatePath('/modules/residentes')
    revalidatePath(`/modules/residentes/${id}`)
    revalidatePath(`/modules/residentes/${id}/editar`)
    revalidatePath('/modules/pagos')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Error updating residente:', error)
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

      // 2. Desactivar el residente (Soft Delete) - Mantenemos habitacionId para posible restauración
      await tx.residente.update({
        where: { id },
        data: { 
          activo: false,
          deletedAt: new Date()
        }
      })

      // 3. Liberar turnos de lavandería
      await tx.turnoLavanderia.updateMany({
        where: { residenteId: id },
        data: { residenteId: null, estado: 'LIBRE' }
      })

      // 4. Limpiar turnos fijos
      await tx.turnoFijo.deleteMany({
        where: { residenteId: id }
      })

      // 5. Desactivar productos en marketplace
      await tx.productoMarketplace.updateMany({
        where: { residenteId: id },
        data: { estado: 'RECHAZADO' }
      })

      // Nota: Mantenemos pagos, tickets de mantenimiento, asistencias y el usuario
      // para conservar el historial financiero y administrativo de la sede.
    })

    revalidatePath('/modules/residentes')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function reactivateResidente(id: number, mode: 'restore' | 'reentry', data?: any) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      if (mode === 'restore') {
        const current = await tx.residente.findUnique({ 
          where: { id },
          include: { 
            habitacion: {
              include: { 
                residentes: { where: { activo: true } }
              }
            }
          }
        })
        
        if (current?.habitacionId) {
          // DEBUG: Log de seguridad para rastrear por qué permite restaurar
          const activeOccupants = await tx.residente.findMany({
            where: {
              habitacionId: current.habitacionId,
              activo: true,
              NOT: { id: id }
            },
            include: { user: true }
          })

          console.log(`[RESTORE DEBUG] Residente ${id} intentando volver a Habitación ID ${current.habitacionId}`);
          console.log(`[RESTORE DEBUG] Ocupantes activos encontrados: ${activeOccupants.length}`);
          activeOccupants.forEach(o => console.log(` - Ocupante: ${o.user.nombre} (ID: ${o.id})`));

          if (activeOccupants.length > 0) {
            throw new Error(`No se puede restaurar: la habitación ${current.habitacion?.numero} ya está siendo ocupada por ${activeOccupants[0].user.nombre}.`)
          }

          await tx.habitacion.update({
            where: { id: current.habitacionId },
            data: { estado: 'OCUPADO' }
          })
        }

        return await tx.residente.update({
          where: { id },
          data: { 
            activo: true,
            deletedAt: null
          }
        })
      }

      if (mode === 'reentry') {
        const { residenciaId, habitacionId, montoMensual, montoGarantia, cuotasGarantia, diaPago, fechaIngreso } = data
        
        // Validar capacidad de la nueva habitación
        const targetRoom = await tx.habitacion.findUnique({
          where: { id: parseInt(habitacionId) },
          include: { residentes: { where: { activo: true } } }
        })

        if (targetRoom && targetRoom.residentes.length >= targetRoom.capacidad) {
          throw new Error(`La habitación ${targetRoom.numero} ya alcanzó su capacidad máxima (${targetRoom.capacidad}).`)
        }

        const diaPagoInt = parseInt(diaPago || '1')
        const ingresoDate = new Date(fechaIngreso)
        ingresoDate.setUTCHours(12, 0, 0, 0)

        // 1. Actualizar usuario (para que coincida la sede)
        const residenteData = await tx.residente.findUnique({ where: { id } })
        if (residenteData) {
          await tx.user.update({
            where: { id: residenteData.userId },
            data: { residenciaId: parseInt(residenciaId) }
          })

          // 1b. Limpiar pagos pendientes previos para evitar acumulación
          await tx.pago.updateMany({
            where: {
              residenteId: id,
              estado: { in: ['PENDIENTE', 'VENCIDO', 'CRITICO', 'EN_REVISION'] }
            },
            data: {
              estado: 'RECHAZADO'
            }
          })

          // 1c. Limpiar turnos y asignaciones previas (empezar de cero)
          await tx.turnoLavanderia.deleteMany({ where: { residenteId: id } })
          await tx.turnoFijo.deleteMany({ where: { residenteId: id } })
        }

        // 2. Actualizar residente
        const res = await tx.residente.update({
          where: { id },
          data: {
            activo: true,
            deletedAt: null,
            habitacionId: parseInt(habitacionId),
            montoMensual: parseFloat(montoMensual),
            montoGarantia: parseFloat(montoGarantia || '0'),
            diaPago: diaPagoInt,
            fechaIngreso: ingresoDate,
            fechaFinal: data.fechaFinal ? new Date(data.fechaFinal) : null
          }
        })

        // 2. Ocupar habitación
        await tx.habitacion.update({
          where: { id: parseInt(habitacionId) },
          data: { estado: 'OCUPADO' }
        })

        const now = new Date()
        now.setUTCHours(0, 0, 0, 0)

        // 3. Calcular duración de la estadía primero
        const fechaFinal = data.fechaFinal ? utcNoon(data.fechaFinal) : null
        let numMeses = 1
        const start = new Date(ingresoDate)
        start.setUTCHours(12, 0, 0, 0)

        if (fechaFinal) {
          const totalDays = Math.round((fechaFinal.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          // Si son 31 días o menos, es 1 solo mes. Solo a partir del día 32 contamos el segundo mes.
          numMeses = Math.max(1, Math.ceil(totalDays / 30.44))
          if (totalDays <= 31) numMeses = 1
        }

        // 3. Generar pagos de garantía
        const mGarantia = parseFloat(montoGarantia || '0')
        const requestedCuotas = parseInt(cuotasGarantia || '1')
        // Generar pagos de garantía respetando las cuotas solicitadas
        const finalCuotasGarantia = requestedCuotas

        if (mGarantia > 0) {
          // Dividir el monto total entre las cuotas finales permitidas
          const montoPorCuota = parseFloat((mGarantia / finalCuotasGarantia).toFixed(2))
          const pagosGarantia = Array.from({ length: finalCuotasGarantia }, (_, i) => {
            const isFirstPayment = i === 0;
            // La primera cuota vence el mismo día de ingreso, las siguientes usan el diaPago
            const fVenc = isFirstPayment ? new Date(ingresoDate) : calcFechaVencimiento(ingresoDate.getUTCFullYear(), ingresoDate.getUTCMonth() + i, diaPagoInt)
            
            let status = fVenc < now ? 'VENCIDO' : 'PENDIENTE'
            let comprobante = null

            if (isFirstPayment && data.pagoConfirmado) {
              status = 'EN_REVISION'
              comprobante = data.comprobanteUrl
            }

            return {
              residenteId: id,
              concepto: `Garantía (Cuota ${i + 1}/${finalCuotasGarantia})`,
              monto: i === finalCuotasGarantia - 1 ? parseFloat((mGarantia - (montoPorCuota * (finalCuotasGarantia - 1))).toFixed(2)) : montoPorCuota,
              fechaVencimiento: fVenc,
              estado: status as any,
              comprobante: comprobante
            }
          })
          await tx.pago.createMany({ data: pagosGarantia })
        }

        // 5. Generar mensualidades según numMeses ya calculado
        const pagosMensualidades = Array.from({ length: numMeses }, (_, i) => {
          const isFirstMonth = i === 0;
          const targetDate = new Date(ingresoDate)
          targetDate.setUTCMonth(ingresoDate.getUTCMonth() + i)
          const nombreMes = targetDate.toLocaleDateString('es-MX', { timeZone: 'UTC', month: 'long' })
          
          // El primer mes vence el mismo día de ingreso, los siguientes usan el diaPago
          const fVencMes = isFirstMonth ? new Date(ingresoDate) : calcFechaVencimiento(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), diaPagoInt)
          
          let statusMes = fVencMes < now ? 'VENCIDO' : 'PENDIENTE'
          let comprobanteMes = null

          if (isFirstMonth && data.pagoConfirmado) {
            statusMes = 'EN_REVISION'
            comprobanteMes = data.comprobanteUrl
          }
          
          return {
            residenteId: id,
            concepto: `Mensualidad ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${targetDate.getUTCFullYear()}`,
            mesCorrespondiente: `${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}`,
            fechaVencimiento: fVencMes,
            monto: parseFloat(montoMensual),
            estado: statusMes as any,
            comprobante: comprobanteMes
          }
        })

        await tx.pago.createMany({ data: pagosMensualidades })

        return res
      }
    })

    revalidatePath('/modules/residentes')
    revalidatePath('/modules/pagos')
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function hardDeleteResidente(id: number) {
  try {
    const residente = await prisma.residente.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!residente) throw new Error('Residente no encontrado')

    await prisma.$transaction(async (tx) => {
      // 1. Eliminar datos vinculados al Residente
      await tx.pago.deleteMany({ where: { residenteId: id } })
      await tx.turnoLavanderia.deleteMany({ where: { residenteId: id } })
      await tx.turnoFijo.deleteMany({ where: { residenteId: id } })
      await tx.asistenciaComida.deleteMany({ where: { residenteId: id } })
      await tx.ticketMantenimiento.deleteMany({ where: { residenteId: id } })
      await tx.productoMarketplace.deleteMany({ where: { residenteId: id } })

      // 2. Eliminar datos vinculados al Usuario
      const userId = residente.userId
      await tx.notificacion.deleteMany({ where: { userId } })
      await tx.reaccion.deleteMany({ where: { userId } })
      await tx.aviso.deleteMany({ where: { autorId: userId } })
      
      // 3. Eliminar Perfil de Residente
      await tx.residente.delete({ where: { id } })

      // 4. Eliminar Usuario
      await tx.user.delete({ where: { id: userId } })
    })

    revalidatePath('/modules/residentes')
    revalidatePath('/modules/pagos')
    return { success: true }
  } catch (error: any) {
    console.error('Error in hardDeleteResidente:', error)
    return { success: false, error: error.message || 'Error al eliminar registro completo' }
  }
}
