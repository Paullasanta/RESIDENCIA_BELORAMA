import { prisma } from './lib/prisma'

async function debugNotifs() {
    const total = await prisma.notificacion.count()
    const last = await prisma.notificacion.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
    })
    
    console.log('--- DEBUG NOTIFICACIONES ---')
    console.log('Total en DB:', total)
    last.forEach(n => {
        console.log(`[${n.createdAt.toISOString()}] Para: ${n.user.email} - ${n.titulo}`)
    })
}

debugNotifs()
