import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readdir, stat, unlink } from 'fs/promises'
import path from 'path'

/**
 * CRON Job: Automated image cleanup based on business criteria.
 * 
 * Rules:
 * - Habitaciones: Never deleted.
 * - Comprobantes: Deleted after 21 days (3 weeks).
 * - Marketplace: Deleted 30 days after being marked as 'VENDIDO'.
 * - Avisos: Deleted 7 days after 'fechaFin' (expiration).
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

    // 1. LIMPIEZA DE COMPROBANTES (> 21 días)
    // Basado en archivos físicos para asegurar espacio en disco
    const comprobantesDir = path.join(process.cwd(), 'public', 'uploads', 'comprobantes')
    try {
        const files = await readdir(comprobantesDir)
        for (const file of files) {
            const filePath = path.join(comprobantesDir, file)
            const stats = await stat(filePath)
            const daysOld = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)
            
            if (daysOld > 21) {
                await unlink(filePath)
                report.comprobantesEliminados++
            }
        }
    } catch (e: any) {
        if (e.code !== 'ENOENT') report.errores.push(`Error en comprobantes: ${e.message}`)
    }

    // 2. LIMPIEZA DE PRODUCTOS VENDIDOS (> 30 días)
    // Buscamos productos vendidos cuya fecha de creación (o última actualización) sea antigua
    const soldProducts = await prisma.productoMarketplace.findMany({
        where: {
            estado: 'VENDIDO',
            createdAt: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
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

    // 3. LIMPIEZA DE AVISOS EXPIRADOS (> 7 días)
    const expiredAvisos = await prisma.aviso.findMany({
        where: {
            fechaFin: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
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
