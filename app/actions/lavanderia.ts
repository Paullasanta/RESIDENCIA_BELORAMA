'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { EstadoTurno, TipoReserva, DiaSemana } from '@prisma/client'
import { checkAuth, checkResidenciaAccess } from '@/lib/auth-utils'
import { createNotification, notifyAdmins } from './notificaciones'

/**
 * ASIGNAR O SOLICITAR TURNO (Lógica 1+1)
 * - Si hay cupo y es el primer extra -> Directo (EXTRA)
 * - Si no hay cupo o ya tiene extras -> Solicitud (SOLICITUD)
 */
export async function reservarTurnoLavanderia(turnoId: number, residenteId: number) {
  try {
    const user = await checkAuth()
    
    const turno = await prisma.turnoLavanderia.findUnique({
      where: { id: turnoId },
      include: { residencia: true }
    })
    
    if (!turno) throw new Error('Turno no encontrado')
    checkResidenciaAccess(user, turno.residenciaId)

    // 1. Contar turnos actuales del residente en esta instancia (semana)
    // Consideramos OCUPADOS (su base + extras)
    const turnosOcupados = await prisma.turnoLavanderia.count({
      where: { 
        residenteId, 
        estado: EstadoTurno.OCUPADO,
        // Aquí podríamos filtrar por fecha si manejamos múltiples semanas
      }
    })

    // REGLA ESTRICTA: Solo 1 turno directo. 
    // Si ya tiene su BASE (1), cualquier EXTRA (2) pasa a ser SOLICITUD.
    // O si es ADMIN, siempre es directo.
    const esDirecto = (turno.estado === EstadoTurno.LIBRE && turnosOcupados < 1) || user.rol === 'ADMIN'

    if (esDirecto) {
      await prisma.$transaction([
        prisma.turnoLavanderia.update({
          where: { id: turnoId },
          data: {
            residenteId,
            estado: EstadoTurno.OCUPADO,
            tipoReserva: TipoReserva.EXTRA
          }
        }),
        // Usamos una forma más segura de acceder por si el cliente está desincronizado
        (prisma as any).historialLavanderia.create({
          data: {
            residenteId,
            accion: 'RESERVA_DIRECTA',
            detalle: `Reserva extra automática: ${turno.dia} ${turno.horaInicio}`
          }
        })
      ])
      
      revalidatePath('/modules/lavanderia')
      return { success: true, message: 'Turno reservado automáticamente' }
    } else {
      // Si no es directo, es una SOLICITUD
      await prisma.$transaction([
        prisma.turnoLavanderia.update({
          where: { id: turnoId },
          data: {
            residenteId,
            estado: EstadoTurno.SOLICITADO,
            tipoReserva: TipoReserva.SOLICITUD
          }
        }),
        (prisma as any).historialLavanderia.create({
          data: {
            residenteId,
            accion: 'SOLICITUD',
            detalle: `Solicitud de turno adicional [${user.rol}]: ${turno.dia} ${turno.horaInicio}`
          }
        })
      ])

      // Notificar a admins
      await notifyAdmins(
        turno.residenciaId,
        'Nueva Solicitud de Lavandería',
        `${user.nombre} ha solicitado un turno extra para el ${turno.dia}`,
        '/modules/lavanderia'
      )

      revalidatePath('/modules/lavanderia')
      return { success: true, message: 'Solicitud enviada al administrador' }
    }
  } catch (error: any) {
    console.error("Error en reservarTurnoLavanderia:", error)
    return { success: false, error: error.message || 'Error al procesar la reserva' }
  }
}

export async function cambiarTurnoLavanderia(turnoActualId: number, turnoNuevoId: number, residenteId: number) {
    try {
        await checkAuth()
        
        // Primero liberamos el actual
        await liberarTurnoLavanderia(turnoActualId)

        // Luego intentamos reservar el nuevo
        return reservarTurnoLavanderia(turnoNuevoId, Number(residenteId))
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al cambiar el turno' }
    }
}

export async function aprobarTurnoSolicitado(turnoId: number) {
    try {
        const user = await checkAuth('MANAGE_LAVANDERIA')
        
        const turno = await prisma.turnoLavanderia.update({
            where: { id: turnoId },
            data: { 
                estado: EstadoTurno.OCUPADO,
                tipoReserva: TipoReserva.EXTRA
            },
            include: { residente: true }
        })

        if (turno.residente) {
            await createNotification(
                turno.residente.userId,
                'Turno Aprobado',
                `Tu solicitud para el turno del ${turno.dia} ha sido aprobada.`,
                'INFO',
                '/modules/lavanderia'
            );

            await (prisma as any).historialLavanderia.create({
                data: {
                    residenteId: turno.residenteId!,
                    accion: 'APROBACION',
                    detalle: `Aprobación de turno: ${turno.dia} ${turno.horaInicio}`
                }
            });
        }

        revalidatePath('/modules/lavanderia')
        return { success: true, message: 'Turno aprobado correctamente' }
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al aprobar el turno' }
    }
}

export async function updateTurnoTime(turnoId: number, data: { dia: any, horaInicio: string, horaFin: string }) {
    try {
        await checkAuth('MANAGE_LAVANDERIA')
        
        await prisma.turnoLavanderia.update({
            where: { id: turnoId },
            data: {
                dia: data.dia,
                horaInicio: data.horaInicio,
                horaFin: data.horaFin
            }
        })

        revalidatePath('/modules/lavanderia')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al actualizar el turno' }
    }
}

export async function liberarTurnoLavanderia(turnoId: number) {
  try {
    const user = await checkAuth()
    
    const turno = await prisma.turnoLavanderia.findUnique({ 
        where: { id: turnoId },
        include: { residencia: true }
    })
    
    if (!turno || !turno.residenteId) return { success: false, error: 'Turno no válido' }

    // 1. Verificar si este slot tiene un dueño permanente (TurnoFijo)
    const fixed = await prisma.turnoFijo.findFirst({
        where: {
            lavadoraId: turno.lavadoraId,
            dia: turno.dia,
            horaInicio: turno.horaInicio.trim()
        }
    })

    const esCancelacion = turno.estado === EstadoTurno.SOLICITADO
    const esDuenioOriginal = fixed && fixed.residenteId === turno.residenteId

    // Si el que libera es el DUEÑO ORIGINAL, el turno queda LIBRE.
    // Si el que libera es OTRO (o una solicitud), se RESTAURA al dueño.
    const nuevoResidenteId = (fixed && !esDuenioOriginal) ? fixed.residenteId : null
    const nuevoEstado = (fixed && !esDuenioOriginal) ? EstadoTurno.OCUPADO : EstadoTurno.LIBRE

    await prisma.$transaction([
        prisma.turnoLavanderia.update({
            where: { id: turnoId },
            data: {
                residenteId: nuevoResidenteId,
                estado: nuevoEstado,
                tipoReserva: TipoReserva.BASE
            }
        }),
        (prisma as any).historialLavanderia.create({
            data: {
                residenteId: turno.residenteId,
                accion: esCancelacion ? 'CANCELACION_SOLICITUD' : 'LIBERACION',
                detalle: `${esCancelacion ? 'Canceló solicitud' : 'Liberó turno'}: ${turno.dia} ${turno.horaInicio}`
            }
        })
    ])
    
    revalidatePath('/modules/lavanderia')
    return { success: true, message: esCancelacion ? 'Solicitud cancelada' : 'Turno liberado' }
  } catch (error: any) {
    return { success: false, error: 'Error al procesar la acción' }
  }
}

export async function updateEstadoLavadora(id: number, activa: boolean) {
    try {
        await prisma.lavadora.update({
            where: { id },
            data: { activa }
        })
        revalidatePath('/modules/lavanderia')
        return { success: true }
    } catch (e) {
        return { success: false, error: 'No se pudo actualizar la lavadora' }
    }
}

export async function createLavadora(residenciaId: number, nombre: string) {
    try {
        await prisma.lavadora.create({
            data: { residenciaId, nombre }
        })
        revalidatePath('/modules/lavanderia')
        revalidatePath('/modules/residencias')
        return { success: true }
    } catch (e) {
        return { success: false, error: 'No se pudo crear la lavadora.' }
    }
}

export async function generateBulkShifts(lavadoraId: number, residenciaId: number, data: { dias: string[], horaInicio: string, horaFin: string, intervaloMin: number }) {
    try {
        const user = await checkAuth('MANAGE_LAVANDERIA')
        checkResidenciaAccess(user, residenciaId)

        const { dias, horaInicio, horaFin, intervaloMin } = data

        const parseTime = (time: string) => {
            const [h, m] = time.split(':').map(Number)
            return h * 60 + m
        }

        const formatTime = (mins: number) => {
            const h = Math.floor(mins / 60).toString().padStart(2, '0')
            const m = (mins % 60).toString().padStart(2, '0')
            return `${h}:${m}`
        }

        const startMins = parseTime(horaInicio.trim())
        const endMins = parseTime(horaFin.trim())

        if (startMins >= endMins) throw new Error("La hora de inicio debe ser menor a la hora de fin")

        const lId = Number(lavadoraId)
        const rId = Number(residenciaId)

        await prisma.$transaction(async (tx) => {
            // 0. Obtener turnos fijos para estos días
            let fixedShifts: any[] = []
            try {
                // Intentamos acceso normal
                fixedShifts = await (tx as any).turnoFijo.findMany({
                    where: { lavadoraId: lId, dia: { in: dias as any } }
                })
            } catch (e) {
                // Fallback con tipos más seguros
                fixedShifts = await tx.$queryRawUnsafe(
                    `SELECT * FROM "TurnoFijo" WHERE "lavadoraId" = $1 AND "dia"::text = ANY($2)`,
                    lId,
                    dias
                )
            }

            // 1. Obtener todos los turnos que no son libres en los días seleccionados
            const preservedShifts = await tx.turnoLavanderia.findMany({
                where: {
                    lavadoraId: lId,
                    dia: { in: dias as any },
                    estado: { not: 'LIBRE' }
                }
            })

            // 2. Borrar ABSOLUTAMENTE TODO para esos días y esa lavadora
            await tx.turnoLavanderia.deleteMany({
                where: {
                    lavadoraId: lId,
                    dia: { in: dias as any }
                }
            })

            // 3. Re-insertar los preservados
            if (preservedShifts.length > 0) {
                await tx.turnoLavanderia.createMany({
                    data: preservedShifts.map(s => ({
                        lavadoraId: s.lavadoraId,
                        residenciaId: s.residenciaId,
                        dia: s.dia,
                        horaInicio: s.horaInicio.trim(),
                        horaFin: s.horaFin.trim(),
                        residenteId: s.residenteId,
                        estado: s.estado,
                        tipoReserva: s.tipoReserva || TipoReserva.BASE
                    }))
                })
            }

            // 4. Generar nuevos turnos
            const newShifts = []
            for (const dia of dias) {
                let current = startMins
                while (current + intervaloMin <= endMins) {
                    const slotInicio = current
                    const slotFin = current + intervaloMin
                    const inicioStr = formatTime(slotInicio)
                    const finStr = formatTime(slotFin)

                    const hasOverlap = preservedShifts.some(ex => {
                        if (ex.dia !== dia) return false
                        const exInicio = parseTime(ex.horaInicio.trim())
                        const exFin = parseTime(ex.horaFin.trim())
                        return slotInicio < exFin && slotFin > exInicio
                    })

                    if (!hasOverlap) {
                        // El objeto fixed de $queryRaw podría tener nombres con guiones o minúsculas
                        const fixed = fixedShifts.find((fs: any) => {
                            const fsDia = fs.dia || fs.Dia
                            const fsInicio = (fs.horaInicio || fs.horainicio || '').trim()
                            return fsDia === dia && fsInicio === inicioStr
                        })

                        newShifts.push({
                            lavadoraId: lId,
                            residenciaId: rId,
                            dia: dia as DiaSemana,
                            horaInicio: inicioStr,
                            horaFin: finStr,
                            residenteId: fixed ? (fixed.residenteId || fixed.residenteid) : null,
                            estado: fixed ? EstadoTurno.OCUPADO : EstadoTurno.LIBRE,
                            tipoReserva: TipoReserva.BASE
                        })
                    }
                    current += intervaloMin
                }
            }

            if (newShifts.length > 0) {
                await tx.turnoLavanderia.createMany({ data: newShifts })
            }
        })

        revalidatePath('/modules/lavanderia')
        return { success: true, message: 'Calendario reconstruido correctamente' }

    } catch (e: any) {
        return { success: false, error: e.message || 'Error al generar turnos.' }
    }
}

export async function clearAllShifts(lavadoraId: number, residenciaId: number) {
    try {
        const user = await checkAuth('MANAGE_LAVANDERIA')
        checkResidenciaAccess(user, residenciaId)

        await prisma.$transaction(async (tx) => {
            // 1. Limpiar todo a LIBRE
            await tx.turnoLavanderia.updateMany({
                where: { lavadoraId },
                data: { residenteId: null, estado: EstadoTurno.LIBRE }
            })

            // 2. Obtener turnos fijos
            let fixedShifts: any[] = []
            try {
                fixedShifts = await (tx as any).turnoFijo.findMany({
                    where: { lavadoraId }
                })
            } catch (e) {
                fixedShifts = await tx.$queryRaw`SELECT * FROM "TurnoFijo" WHERE "lavadoraId" = ${lavadoraId}`
            }

            // 3. Re-aplicar turnos fijos
            for (const fs of fixedShifts) {
                await tx.turnoLavanderia.updateMany({
                    where: { 
                        lavadoraId, 
                        dia: fs.dia, 
                        horaInicio: fs.horaInicio.trim() 
                    },
                    data: { 
                        residenteId: fs.residenteId, 
                        estado: EstadoTurno.OCUPADO,
                        tipoReserva: TipoReserva.BASE
                    }
                })
            }
        })

        revalidatePath('/modules/lavanderia')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || 'Error al limpiar turnos.' }
    }
}

export async function toggleRecurringShift(turnoId: number, isRecurring: boolean) {
    try {
        const user = await checkAuth('MANAGE_LAVANDERIA')
        
        const turno = await prisma.turnoLavanderia.findUnique({
            where: { id: turnoId }
        })

        if (!turno || !turno.residenteId) throw new Error('Turno o residente no encontrado')
        checkResidenciaAccess(user, turno.residenciaId)

        if (isRecurring) {
            try {
                await (prisma as any).turnoFijo.upsert({
                    where: {
                        lavadoraId_dia_horaInicio: { 
                            lavadoraId: turno.lavadoraId, 
                            dia: turno.dia, 
                            horaInicio: turno.horaInicio.trim() 
                        }
                    },
                    update: { residenteId: turno.residenteId, horaFin: turno.horaFin.trim() },
                    create: { 
                        lavadoraId: turno.lavadoraId, 
                        dia: turno.dia, 
                        horaInicio: turno.horaInicio.trim(), 
                        horaFin: turno.horaFin.trim(), 
                        residenteId: turno.residenteId 
                    }
                })
            } catch (e) {
                // Fallback RAW SQL
                await prisma.$executeRaw`
                    INSERT INTO "TurnoFijo" ("lavadoraId", "dia", "horaInicio", "horaFin", "residenteId")
                    VALUES (${turno.lavadoraId}, ${turno.dia}::"DiaSemana", ${turno.horaInicio.trim()}, ${turno.horaFin.trim()}, ${turno.residenteId})
                    ON CONFLICT ("lavadoraId", "dia", "horaInicio") 
                    DO UPDATE SET "residenteId" = EXCLUDED."residenteId", "horaFin" = EXCLUDED."horaFin"
                `
            }
        } else {
            try {
                await (prisma as any).turnoFijo.deleteMany({
                    where: {
                        lavadoraId: turno.lavadoraId,
                        dia: turno.dia,
                        horaInicio: turno.horaInicio.trim()
                    }
                })
            } catch (e) {
                await prisma.$executeRaw`
                    DELETE FROM "TurnoFijo" 
                    WHERE "lavadoraId" = ${turno.lavadoraId} 
                    AND "dia"::text = ${turno.dia}
                    AND "horaInicio" = ${turno.horaInicio.trim()}
                `
            }
        }

        revalidatePath('/modules/lavanderia')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
