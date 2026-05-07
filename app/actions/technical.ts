'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function getSystemStats() {
    const session = await auth()
    if (session?.user.rol !== 'SUPER_ADMIN') {
        throw new Error('No autorizado')
    }

    const [
        users, roles, residencias, habitaciones, 
        pagos, menus, productos, egresos, 
        avisos, tickets, configs
    ] = await Promise.all([
        prisma.user.count(),
        prisma.role.count(),
        prisma.residencia.count(),
        prisma.habitacion.count(),
        prisma.pago.count(),
        prisma.menu.count(),
        prisma.productoMarketplace.count(),
        prisma.egreso.count(),
        prisma.aviso.count(),
        prisma.ticketMantenimiento.count(),
        prisma.configuracion.count(),
    ])

    return {
        users, roles, residencias, habitaciones,
        pagos, menus, productos, egresos,
        avisos, tickets, configs
    }
}

export async function getStorageAudit() {
    const session = await auth()
    if (session?.user.rol !== 'SUPER_ADMIN') {
        throw new Error('No autorizado')
    }

    // Recopilar algunas rutas de imágenes de diferentes modelos
    const [resS, habS, userS, prodS, pagoS] = await Promise.all([
        prisma.residencia.findMany({ where: { fotos: { isEmpty: false } }, select: { id: true, nombre: true, fotos: true }, take: 10 }),
        prisma.habitacion.findMany({ where: { fotos: { isEmpty: false } }, select: { id: true, numero: true, fotos: true }, take: 10 }),
        prisma.user.findMany({ where: { imagen: { not: null } }, select: { id: true, nombre: true, imagen: true }, take: 10 }),
        prisma.productoMarketplace.findMany({ where: { fotos: { isEmpty: false } }, select: { id: true, titulo: true, fotos: true }, take: 10 }),
        prisma.pago.findMany({ where: { comprobante: { not: null } }, select: { id: true, concepto: true, comprobante: true }, take: 10 }),
    ])

    return {
        residencias: resS.map(r => ({ id: r.id, name: r.nombre, urls: r.fotos, model: 'residencia' })),
        habitaciones: habS.map(h => ({ id: h.id, name: `Hab. ${h.numero}`, urls: h.fotos, model: 'habitacion' })),
        usuarios: userS.map(u => ({ id: u.id, name: u.nombre, urls: [u.imagen!], model: 'user' })),
        productos: prodS.map(p => ({ id: p.id, name: p.titulo, urls: p.fotos, model: 'producto' })),
        pagos: pagoS.map(p => ({ id: p.id, name: p.concepto, urls: [p.comprobante!], model: 'pago' })),
    }
}

export async function deleteModelImage(id: number, model: string, url: string) {
    const session = await auth()
    if (session?.user.rol !== 'SUPER_ADMIN') throw new Error('No autorizado')

    if (model === 'producto') {
        const prod = await prisma.productoMarketplace.findUnique({ where: { id } })
        if (!prod) return
        await prisma.productoMarketplace.update({
            where: { id },
            data: { fotos: prod.fotos.filter(f => f !== url) }
        })
    } else if (model === 'habitacion') {
        const hab = await prisma.habitacion.findUnique({ where: { id } })
        if (!hab) return
        await prisma.habitacion.update({
            where: { id },
            data: { fotos: hab.fotos.filter(f => f !== url) }
        })
    } else if (model === 'residencia') {
        const res = await prisma.residencia.findUnique({ where: { id } })
        if (!res) return
        await prisma.residencia.update({
            where: { id },
            data: { fotos: res.fotos.filter(f => f !== url) }
        })
    } else if (model === 'user') {
        await prisma.user.update({
            where: { id },
            data: { imagen: null }
        })
    } else if (model === 'pago') {
        await prisma.pago.update({
            where: { id },
            data: { comprobante: null }
        })
    }
}

