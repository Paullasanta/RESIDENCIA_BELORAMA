'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { EstadoTurno } from '@prisma/client'
import { checkAuth, checkResidenciaAccess } from '@/lib/auth-utils'
import { createNotification, notifyAdmins } from './notificaciones'

export async function asignarTurnoLavanderia(turnoId: number, id: number, useUserId: boolean = false) {
  try {
    const user = await checkAuth()
    
    let residenteId = id;
    if (useUserId) {
        const profile = await prisma.residente.findUnique({ where: { userId: id } })
        if (!profile) {
            const newProfile = await prisma.residente.create({ data: { userId: id } })
            residenteId = newProfile.id
        } else {
            residenteId = profile.id
        }
    }
    
    const turno = await prisma.turnoLavanderia.findUnique({
        where: { id: turnoId }
    })
    
    if (!turno) throw new Error('Turno no encontrado')
    
    // Si no es admin, solo puede asignarse turnos de su propia residencia
    checkResidenciaAccess(user, turno.residenciaId)

    // Si el usuario no es admin, todos los turnos pasan por solicitud previa
    if (user.rol !== 'ADMIN') {
        return solicitarTurnoLavanderia(turnoId, residenteId)
    }

    const updatedTurno = await prisma.turnoLavanderia.update({
      where: { id: turnoId },
      data: {
        residenteId,
        estado: EstadoTurno.OCUPADO
      },
      include: { residente: true }
    })

    // Si un admin asignó el turno y no es para sí mismo, notificar al residente
    if (updatedTurno.residente && updatedTurno.residente.userId !== user.id) {
        await createNotification(
            updatedTurno.residente.userId,
            'Turno de Lavandería Asignado',
            `Se te ha asignado un turno el ${updatedTurno.dia} a las ${updatedTurno.horaInicio}`,
            'INFO',
            '/modules/lavanderia'
        )
    }
    
    revalidatePath('/modules/lavanderia')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al asignar el turno' }
  }
}

export async function solicitarTurnoLavanderia(turnoId: number, id: number, useUserId: boolean = false) {
    try {
        const user = await checkAuth()
        
        let residenteId = id;
        if (useUserId) {
            const profile = await prisma.residente.findUnique({ where: { userId: id } })
            if (!profile) {
                const newProfile = await prisma.residente.create({ data: { userId: id } })
                residenteId = newProfile.id
            } else {
                residenteId = profile.id
            }
        }
        
        const turno = await prisma.turnoLavanderia.findUnique({
            where: { id: turnoId }
        })
        
        if (!turno) throw new Error('Turno no encontrado')
        checkResidenciaAccess(user, turno.residenciaId)

        // LÓGICA DE ASIGNACIÓN INTELIGENTE:
        // 1. Contar cuántos turnos ya tiene OCUPADOS el usuario
        const turnosOcupados = await prisma.turnoLavanderia.count({
            where: { residenteId, estado: EstadoTurno.OCUPADO }
        })

        // 2. Si no tiene ninguno, se le asigna DIRECTO. Si ya tiene, es SOLICITUD.
        const esPrimerTurno = turnosOcupados === 0
        const nuevoEstado = esPrimerTurno ? EstadoTurno.OCUPADO : EstadoTurno.SOLICITADO

        await prisma.turnoLavanderia.update({
            where: { id: turnoId },
            data: {
                residenteId,
                estado: nuevoEstado
            }
        })

        // 3. Notificaciones según el caso
        if (esPrimerTurno) {
            // Notificar a los administradores de la asignación directa
            await notifyAdmins(
                turno.residenciaId,
                'Turno Asignado Directo',
                `${user.nombre} se ha asignado el turno del ${turno.dia} (${turno.horaInicio})`,
                '/modules/lavanderia'
            )
            revalidatePath('/modules/lavanderia')
            return { success: true, message: 'Turno asignado correctamente' }
        } else {
            // Notificar a los administradores de la solicitud adicional
            await notifyAdmins(
                turno.residenciaId,
                'Solicitud de Turno Adicional',
                `${user.nombre} solicita un segundo turno para el ${turno.dia} (${turno.horaInicio})`,
                '/modules/lavanderia'
            )
            revalidatePath('/modules/lavanderia')
            return { success: true, message: 'Se ha enviado tu solicitud para un turno adicional' }
        }
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al procesar el turno' }
    }
}

export async function cambiarTurnoLavanderia(turnoActualId: number, turnoNuevoId: number, residenteId: number) {
    try {
        const user = await checkAuth()
        
        // Primero liberamos el actual
        await prisma.turnoLavanderia.update({
            where: { id: turnoActualId },
            data: {
                residenteId: null,
                estado: EstadoTurno.LIBRE
            }
        })

        // Luego asignamos el nuevo
        return asignarTurnoLavanderia(turnoNuevoId, residenteId)
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al cambiar el turno' }
    }
}

export async function aprobarTurnoSolicitado(turnoId: number) {
    try {
        const user = await checkAuth('MANAGE_LAVANDERIA')
        
        const turno = await prisma.turnoLavanderia.update({
            where: { id: turnoId },
            data: { estado: EstadoTurno.OCUPADO },
            include: { residente: true }
        })

        if (turno.residente) {
            await createNotification(
                turno.residente.userId,
                'Turno Aprobado',
                `Tu solicitud para el turno del ${turno.dia} ha sido aprobada.`,
                'INFO',
                '/modules/lavanderia'
            )
        }

        revalidatePath('/modules/lavanderia')
        return { success: true }
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
    await prisma.turnoLavanderia.update({
      where: { id: turnoId },
      data: {
        residenteId: null,
        estado: EstadoTurno.LIBRE
      }
    })
    
    revalidatePath('/modules/lavanderia')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al liberar el turno' }
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

        await prisma.$transaction(async (tx) => {
            // 0. Obtener turnos fijos para estos días
            let fixedShifts: any[] = []
            try {
                fixedShifts = await (tx as any).turnoFijo.findMany({
                    where: { lavadoraId, dia: { in: dias as any } }
                })
            } catch (e) {
                fixedShifts = await tx.$queryRaw`SELECT * FROM "TurnoFijo" WHERE "lavadoraId" = ${lavadoraId} AND "dia"::text IN (${dias.join(',')})`
            }

            // 1. Obtener todos los turnos que no son libres en los días seleccionados
            const preservedShifts = await tx.turnoLavanderia.findMany({
                where: {
                    lavadoraId,
                    dia: { in: dias as any },
                    estado: { not: 'LIBRE' }
                }
            })

            // 2. Borrar ABSOLUTAMENTE TODO para esos días y esa lavadora
            await tx.turnoLavanderia.deleteMany({
                where: {
                    lavadoraId,
                    dia: { in: dias as any }
                }
            })

            // 3. Re-insertar los preservados (limpiando posibles espacios en blanco)
            if (preservedShifts.length > 0) {
                await tx.turnoLavanderia.createMany({
                    data: preservedShifts.map(s => ({
                        lavadoraId: s.lavadoraId,
                        residenciaId: s.residenciaId,
                        dia: s.dia,
                        horaInicio: s.horaInicio.trim(),
                        horaFin: s.horaFin.trim(),
                        residenteId: s.residenteId,
                        estado: s.estado as EstadoTurno
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

                    // Verificar solapamiento con los preservados de ESTE día
                    const hasOverlap = preservedShifts.some(ex => {
                        if (ex.dia !== dia) return false
                        const exInicio = parseTime(ex.horaInicio.trim())
                        const exFin = parseTime(ex.horaFin.trim())
                        return slotInicio < exFin && slotFin > exInicio
                    })

                    if (!hasOverlap) {
                        // VERIFICAR SI HAY UN TURNO FIJO PARA ESTE HORARIO
                        const fixed = (fixedShifts as any[]).find((fs: any) => fs.dia === dia && fs.horaInicio === inicioStr)

                        newShifts.push({
                            lavadoraId,
                            residenciaId,
                            dia: dia as any,
                            horaInicio: inicioStr,
                            horaFin: finStr,
                            residenteId: fixed ? fixed.residenteId : null,
                            estado: fixed ? EstadoTurno.OCUPADO : EstadoTurno.LIBRE
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
                        estado: EstadoTurno.OCUPADO 
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
