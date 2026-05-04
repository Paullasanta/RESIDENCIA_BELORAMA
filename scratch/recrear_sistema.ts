import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Iniciando Carga de Datos Profesionales...')

    // 1. Limpiar datos previos (solo para asegurar consistencia)
    await prisma.turnoLavanderia.deleteMany()
    await prisma.lavadora.deleteMany()
    await prisma.residente.deleteMany()
    await prisma.habitacion.deleteMany()
    await prisma.residencia.deleteMany()

    // 2. Crear Residencias
    const res1 = await prisma.residencia.create({
        data: {
            nombre: 'Belorama Luxury',
            direccion: 'Calle Premium 123',
            descripcion: 'Nuestra sede con mejores acabados y áreas comunes.',
            capacidad: 10
        }
    })

    const res2 = await prisma.residencia.create({
        data: {
            nombre: 'Belorama City',
            direccion: 'Av. Central 456',
            descripcion: 'Ubicación estratégica en el corazón de la ciudad.',
            capacidad: 8
        }
    })

    console.log('✅ Residencias creadas.')

    // 3. Crear Habitaciones
    for (let i = 1; i <= 5; i++) {
        await prisma.habitacion.create({
            data: {
                residenciaId: res1.id,
                numero: `10${i}`,
                piso: 1,
                capacidad: 1,
                estado: 'LIBRE'
            }
        })
        await prisma.habitacion.create({
            data: {
                residenciaId: res2.id,
                numero: `20${i}`,
                piso: 2,
                capacidad: 1,
                estado: 'LIBRE'
            }
        })
    }
    console.log('✅ 10 Habitaciones creadas.')

    // 4. Crear Lavadoras (Hardware)
    const lav1 = await prisma.lavadora.create({
        data: { nombre: 'Lavadora A - LG 20kg', residenciaId: res1.id }
    })
    const lav2 = await prisma.lavadora.create({
        data: { nombre: 'Lavadora B - Samsung', residenciaId: res1.id }
    })
    const lav3 = await prisma.lavadora.create({
        data: { nombre: 'Lavadora Industrial 1', residenciaId: res2.id }
    })
    console.log('✅ Lavadoras instaladas.')

    // 5. Crear algunos Residentes de prueba
    const roleResidente = await prisma.role.findUnique({ where: { name: 'RESIDENTE' } })
    const residentesNames = ['Juan Perez', 'Maria Garcia', 'Carlos Ruiz', 'Ana Lopez']

    for (const name of residentesNames) {
        const email = `${name.toLowerCase().replace(' ', '.')}@test.com`
        const user = await prisma.user.create({
            data: {
                nombre: name,
                email: email,
                password: 'res123',
                roleId: roleResidente?.id,
                residenciaId: res1.id
            }
        })

        await prisma.residente.create({
            data: {
                userId: user.id,
                montoMensual: 1200,
                activo: true
            }
        })
    }

    console.log('✅ Residentes de prueba creados.')
    console.log('--- CARGA COMPLETADA ---')
    console.log('Ya puedes entrar con admin@belorama.com / admin123 y ver tu nuevo mundo.')
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect())
