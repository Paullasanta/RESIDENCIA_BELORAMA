import { PrismaClient, Rol, DiaSemana, EstadoTurno, TipoMenu } from '@prisma/client'


const prisma = new PrismaClient()

async function main() {
    // Limpiar BD
    await prisma.asistenciaComida.deleteMany()
    await prisma.menuResidencia.deleteMany()
    await prisma.menu.deleteMany()
    await prisma.turnoLavanderia.deleteMany()
    await prisma.lavadora.deleteMany()
    await prisma.cuota.deleteMany()
    await prisma.pago.deleteMany()
    await prisma.productoMarketplace.deleteMany()
    await prisma.publicacionHabitacion.deleteMany()
    await prisma.egreso.deleteMany()
    await prisma.residente.deleteMany()
    await prisma.habitacion.deleteMany()
    await prisma.residencia.deleteMany()
    await prisma.user.deleteMany()

    // Crear Admin
    const admin = await prisma.user.create({
        data: {
            nombre: 'Admin Belorama',
            email: 'admin@belorama.com',
            password: 'admin123',
            rol: Rol.ADMIN,
        }
    })

    // Crear Cocinero
    const cocinero = await prisma.user.create({
        data: {
            nombre: 'Carlos Cocinero',
            email: 'cocinero@belorama.com',
            password: 'cocina123',
            rol: Rol.COCINERO,
        }
    })

    // Crear Residencias
    const res1 = await prisma.residencia.create({
        data: {
            nombre: 'Residencia Norte',
            direccion: 'Av. Norte 123',
            descripcion: 'Residencia moderna cerca del campus',
            capacidad: 20,
            fotos: [],
        }
    })

    const res2 = await prisma.residencia.create({
        data: {
            nombre: 'Residencia Sur',
            direccion: 'Av. Sur 456',
            descripcion: 'Residencia tranquila con jardín',
            capacidad: 15,
            fotos: [],
        }
    })

    // Crear Habitaciones
    const habitaciones1 = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
            prisma.habitacion.create({
                data: {
                    residenciaId: res1.id,
                    numero: `10${i + 1}`,
                    piso: 1,
                    capacidad: 2,
                    disponible: i >= 3,
                }
            })
        )
    )

    const habitaciones2 = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
            prisma.habitacion.create({
                data: {
                    residenciaId: res2.id,
                    numero: `20${i + 1}`,
                    piso: 2,
                    capacidad: 2,
                    disponible: i >= 2,
                }
            })
        )
    )

    // Crear Residentes
    const residentesData = [
        { nombre: 'Ana García', email: 'ana@belorama.com', habIdx: 0, resId: res1.id },
        { nombre: 'Luis Pérez', email: 'luis@belorama.com', habIdx: 1, resId: res1.id },
        { nombre: 'María López', email: 'maria@belorama.com', habIdx: 2, resId: res1.id },
        { nombre: 'Jorge Díaz', email: 'jorge@belorama.com', habIdx: 0, resId: res2.id },
        { nombre: 'Sofia Ruiz', email: 'sofia@belorama.com', habIdx: 1, resId: res2.id },
    ]

    const residentes = await Promise.all(
        residentesData.map(async (r, i) => {
            const hab = i < 3 ? habitaciones1[r.habIdx] : habitaciones2[r.habIdx]
            const user = await prisma.user.create({
                data: {
                    nombre: r.nombre,
                    email: r.email,
                    password: 'res123',
                    rol: Rol.RESIDENTE,
                    residenciaId: r.resId,
                }
            })
            return prisma.residente.create({
                data: {
                    userId: user.id,
                    habitacionId: hab.id,
                }
            })
        })
    )

    // Crear Lavadoras y Turnos
    const dias = [DiaSemana.LUNES, DiaSemana.MARTES, DiaSemana.MIERCOLES]

    for (const residencia of [res1, res2]) {
        const lav1 = await prisma.lavadora.create({
            data: { residenciaId: residencia.id, nombre: 'Lavadora A' }
        })
        const lav2 = await prisma.lavadora.create({
            data: { residenciaId: residencia.id, nombre: 'Lavadora B' }
        })

        for (const lavadora of [lav1, lav2]) {
            for (const dia of dias) {
                await prisma.turnoLavanderia.create({
                    data: {
                        lavadoraId: lavadora.id,
                        residenciaId: residencia.id,
                        dia,
                        horaInicio: '08:00',
                        horaFin: '10:00',
                        estado: EstadoTurno.LIBRE,
                    }
                })
                await prisma.turnoLavanderia.create({
                    data: {
                        lavadoraId: lavadora.id,
                        residenciaId: residencia.id,
                        dia,
                        horaInicio: '10:00',
                        horaFin: '12:00',
                        estado: EstadoTurno.LIBRE,
                    }
                })
            }
        }
    }

    // Crear Menús
    const hoy = new Date()
    for (const tipo of [TipoMenu.DESAYUNO, TipoMenu.ALMUERZO, TipoMenu.CENA]) {
        const menu = await prisma.menu.create({
            data: {
                tipo,
                nombre: tipo === TipoMenu.DESAYUNO ? 'Desayuno continental' :
                    tipo === TipoMenu.ALMUERZO ? 'Almuerzo del día' : 'Cena ligera',
                descripcion: 'Menú nutritivo y balanceado',
                fecha: hoy,
            }
        })
        await prisma.menuResidencia.create({
            data: { menuId: menu.id, residenciaId: res1.id }
        })
        await prisma.menuResidencia.create({
            data: { menuId: menu.id, residenciaId: res2.id }
        })
    }

    // Crear Pagos
    await prisma.pago.create({
        data: {
            residenteId: residentes[0].id,
            monto: 500,
            montoPagado: 500,
            estado: 'PAGADO',
        }
    })
    await prisma.pago.create({
        data: {
            residenteId: residentes[1].id,
            monto: 500,
            montoPagado: 250,
            estado: 'PARCIAL',
            cuotas: {
                create: [
                    { monto: 250, pagado: true, fechaVencimiento: new Date() },
                    { monto: 250, pagado: false, fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
                ]
            }
        }
    })

    // Crear Egresos
    await prisma.egreso.create({
        data: {
            adminId: admin.id,
            concepto: 'Limpieza mensual',
            monto: 150,
            categoria: 'Mantenimiento',
            residenciaId: res1.id,
        }
    })

    console.log('✅ Seed completado')
    console.log('Admin: admin@belorama.com / admin123')
    console.log('Cocinero: cocinero@belorama.com / cocina123')
    console.log('Residentes: ana@belorama.com / res123 (y los demás igual)')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())