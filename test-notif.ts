import { prisma } from './lib/prisma'

async function testNotif() {
    const user = await prisma.user.findFirst()
    if (!user) return
    
    await prisma.notificacion.create({
        data: {
            userId: user.id,
            titulo: '¡Prueba de Notificación!',
            mensaje: 'Esto es una prueba para ver si el icono de la campana funciona correctamente.',
            tipo: 'INFO',
            link: '/modules/dashboard'
        }
    })
    console.log('Notificación de prueba creada para:', user.email)
}

testNotif()
