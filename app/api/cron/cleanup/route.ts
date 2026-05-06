import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readdir, stat, unlink } from 'fs/promises'
import path from 'path'

/**
 * CRON Job: Automated image cleanup based on business criteria.
 * 
 * Rules:
 * - Habitaciones: Never deleted.
 * - Comprobantes: Deleted after 120 days (4 months).
 * - Marketplace: Deleted 120 days after being marked as 'VENDIDO'.
 * - Avisos: Deleted 120 days after 'fechaFin' (expiration).
 */
export async function GET(request: Request) {
  try {
    // Security Check
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const report = {
        comprobantesEliminados: 0,
        productosEliminados: 0,
        avisosEliminados: 0,
        errores: [] as string[]
    }

    const now = new Date()

    // 1. LIMPIEZA DE COMPROBANTES (> 120 días)
    // Basado en la fecha incrustada en el nombre del archivo: prefijo_dni_hora_ddmmaa.ext
    const comprobantesDir = path.join(process.cwd(), 'public', 'uploads', 'comprobantes')
    try {
        const files = await readdir(comprobantesDir)
        for (const file of files) {
            const filePath = path.join(comprobantesDir, file)
            
            // Ejemplo de formato: vp_45362734_115523_050526.jpg
            const parts = file.split('_')
            
            // Validar que tenga las partes esperadas
            if (parts.length >= 4) {
                const dateWithExt = parts[parts.length - 1] // '050526.jpg'
                const dateStr = dateWithExt.split('.')[0]   // '050526'

                if (dateStr && dateStr.length === 6) {
                    const day = dateStr.slice(0, 2)
                    const month = dateStr.slice(2, 4)
                    const year = dateStr.slice(4, 6)
                    
                    // Reconstruir la fecha asumiendo formato 20XX
                    const fileDate = new Date(`20${year}-${month}-${day}T00:00:00Z`)
                    
                    if (!isNaN(fileDate.getTime())) {
                        const daysOld = (now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24)
                        
                        if (daysOld > 120) {
                            await unlink(filePath)
                            report.comprobantesEliminados++
                        }
                    }
                }
            }
        }
    } catch (e: any) {
        if (e.code !== 'ENOENT') report.errores.push(`Error en comprobantes: ${e.message}`)
    }

    // 2. LIMPIEZA DE PRODUCTOS VENDIDOS (> 120 días)
    // Buscamos productos vendidos cuya fecha de creación (o última actualización) sea antigua
    const soldProducts = await prisma.productoMarketplace.findMany({
        where: {
            estado: 'VENDIDO',
            createdAt: { lt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000) }
        },
        select: { id: true, fotos: true }
    })

    for (const product of soldProducts) {
        for (const foto of product.fotos) {
            const filename = foto.split('/').pop()
            if (filename) {
                const filePath = path.join(process.cwd(), 'public', 'uploads', 'productos', filename)
                try {
                    await unlink(filePath)
                    report.productosEliminados++
                } catch (e: any) {
                    if (e.code !== 'ENOENT') report.errores.push(`Error en producto ${product.id}: ${e.message}`)
                }
            }
        }
    }

    // 3. LIMPIEZA DE AVISOS EXPIRADOS (> 120 días)
    const expiredAvisos = await prisma.aviso.findMany({
        where: {
            fechaFin: { lt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000) }
        },
        select: { id: true, fotos: true }
    })

    for (const aviso of expiredAvisos) {
        for (const foto of aviso.fotos) {
            const filename = foto.split('/').pop()
            if (filename) {
                const filePath = path.join(process.cwd(), 'public', 'uploads', 'avisos', filename)
                try {
                    await unlink(filePath)
                    report.avisosEliminados++
                } catch (e: any) {
                    if (e.code !== 'ENOENT') report.errores.push(`Error en aviso ${aviso.id}: ${e.message}`)
                }
            }
        }
    }

    console.log('🧹 Cleanup Cron finalizado:', report)

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      report
    })

  } catch (error: any) {
    console.error('Error in cleanup cron:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
