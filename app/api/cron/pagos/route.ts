import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    // Para mayor seguridad en producción, se recomienda verificar el header Authorization o usar Vercel Cron Token
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hoy = new Date()
    const limiteCritico = new Date(hoy)
    limiteCritico.setDate(limiteCritico.getDate() - 30)

    // 1. Pasar PENDIENTE -> VENCIDO
    // Aquellos pagos con estado PENDIENTE cuya fechaVencimiento sea menor a la fecha actual
    const updateVencidos = await prisma.pago.updateMany({
      where: {
        estado: 'PENDIENTE',
        fechaVencimiento: { lt: hoy }
      },
      data: {
        estado: 'VENCIDO'
      }
    })

    // 2. Pasar VENCIDO -> CRITICO
    // Aquellos pagos con estado VENCIDO cuya fechaVencimiento sea menor a la fecha actual - 30 dias
    const updateCriticos = await prisma.pago.updateMany({
      where: {
        estado: 'VENCIDO',
        fechaVencimiento: { lt: limiteCritico }
      },
      data: {
        estado: 'CRITICO'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Estados actualizados correctamente',
      actualizadosAVencido: updateVencidos.count,
      actualizadosACritico: updateCriticos.count,
    })

  } catch (error) {
    console.error('Error executing cron job:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
