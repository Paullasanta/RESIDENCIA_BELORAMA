'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { EstadoTurno } from '@prisma/client'

export async function asignarTurnoLavanderia(turnoId: number, residenteId: number) {
  try {
    await prisma.turnoLavanderia.update({
      where: { id: turnoId },
      data: {
        residenteId,
        estado: EstadoTurno.OCUPADO
      }
    })
    
    revalidatePath('/admin/lavanderia')
    revalidatePath('/residente/lavanderia')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al asignar el turno' }
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
    
    revalidatePath('/admin/lavanderia')
    revalidatePath('/residente/lavanderia')
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
        revalidatePath('/admin/lavanderia')
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
