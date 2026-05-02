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

        await prisma.turnoLavanderia.update({
            where: { id: turnoId },
            data: {
                residenteId,
                estado: EstadoTurno.SOLICITADO
            }
        })

        // Notificar a los administradores de la sede y globales
        await notifyAdmins(
            turno.residenciaId,
            'Nueva Solicitud de Lavandería',
            `${user.nombre} ha solicitado el turno del ${turno.dia} (${turno.horaInicio})`,
            '/modules/lavanderia'
        )

        revalidatePath('/modules/lavanderia')
        return { success: true, message: 'Tu solicitud de turno ha sido enviada para aprobación' }
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al solicitar el turno' }
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

        const startMins = parseTime(horaInicio)
        const endMins = parseTime(horaFin)

        if (startMins >= endMins) throw new Error("La hora de inicio debe ser menor a la hora de fin")

        const newShifts = []

        for (const dia of dias) {
            let currentStr = startMins

            // Limpiar turnos LIBRES previos para ese día y lavadora en específico para evitar duplicados
            await prisma.turnoLavanderia.deleteMany({
                where: {
                    lavadoraId,
                    dia: dia as any,
                    estado: 'LIBRE'
                }
            })

            while (currentStr + intervaloMin <= endMins) {
                newShifts.push({
                    lavadoraId,
                    residenciaId,
                    dia: dia as any,
                    horaInicio: formatTime(currentStr),
                    horaFin: formatTime(currentStr + intervaloMin),
                    estado: 'LIBRE' as any
                })
                currentStr += intervaloMin
            }
        }

        await prisma.turnoLavanderia.createMany({
            data: newShifts,
            skipDuplicates: true
        })

        revalidatePath('/modules/lavanderia')
        return { success: true, count: newShifts.length }

    } catch (e: any) {
        return { success: false, error: e.message || 'Error al generar turnos.' }
    }
}
