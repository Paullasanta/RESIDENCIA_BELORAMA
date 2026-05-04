import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EstadoTurno } from '@prisma/client'

/**
 * API para Sincronización Forzada (Modo Test)
 * Restablece todos los turnos de lavandería a su estado BASE definido en TurnoFijo
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const force = searchParams.get('force') === 'true'
    
    // Obtener fecha actual en zona horaria local (Perú/Colombia UTC-5 aprox)
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Domingo, 1 = Lunes
    const hour = now.getHours()

    // LÓGICA DE PROTECCIÓN SEMANAL:
    // Solo permitimos el reset si:
    // 1. Es Domingo a partir de las 23:00 (Casi inicio de semana)
    // 2. Es Lunes antes de las 04:00 (Inicio de semana)
    // 3. Se usa el parámetro ?force=true
    const isSundayNight = dayOfWeek === 0 && hour >= 23
    const isMondayEarly = dayOfWeek === 1 && hour <= 4
    
    if (!force && !isSundayNight && !isMondayEarly) {
      console.log(`⚠️ [CRON] Intento de reset ignorado. Hoy es día ${dayOfWeek} a las ${hour}h. Solo se permite reset domingos noche o lunes madrugada.`)
      return NextResponse.json({ 
        success: false, 
        message: 'El reset semanal solo está permitido los Domingos a las 23:59 o Lunes de madrugada. Para forzarlo, usa ?force=true' 
      })
    }

    console.log('🔄 [CRON] Iniciando sincronización semanal con Horario Base...')
    
    // 1. Obtener todas las lavadoras
    const lavadoras = await prisma.lavadora.findMany()
    
    for (const lavadora of lavadoras) {
      await prisma.$transaction(async (tx) => {
        // A. Limpiar todos los turnos actuales de esta lavadora a LIBRE (Quitando extras y solicitudes de la semana pasada)
        await tx.turnoLavanderia.updateMany({
          where: { lavadoraId: lavadora.id },
          data: { 
            residenteId: null, 
            estado: EstadoTurno.LIBRE,
            tipoReserva: 'BASE' 
          }
        })

        // B. Obtener los Horarios Base (TurnoFijo)
        const fixedShifts = await tx.turnoFijo.findMany({
          where: { lavadoraId: lavadora.id }
        })

        // C. Re-aplicar cada Horario Base a la grilla semanal
        for (const fs of fixedShifts) {
          await tx.turnoLavanderia.updateMany({
            where: { 
              lavadoraId: lavadora.id, 
              dia: fs.dia, 
              horaInicio: fs.horaInicio.trim() 
            },
            data: { 
              residenteId: fs.residenteId, 
              estado: EstadoTurno.OCUPADO,
              tipoReserva: 'BASE'
            }
          })
        }
      })
    }

    console.log('✅ [CRON] Sincronización semanal completada. Calendario limpio para la nueva semana.')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sincronización semanal completada correctamente',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ [CRON] Error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
