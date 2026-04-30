import { PrismaClient, DiaSemana, EstadoTurno, TipoMenu } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed...')
    
    // Limpiar BD en orden de dependencias
    await prisma.asistenciaComida.deleteMany()
    await prisma.menuResidencia.deleteMany()
    await prisma.menu.deleteMany()
    await prisma.turnoLavanderia.deleteMany()
    await prisma.lavadora.deleteMany()

    await prisma.pago.deleteMany()
    await prisma.productoMarketplace.deleteMany()
    await prisma.publicacionHabitacion.deleteMany()
    await prisma.egreso.deleteMany()
    await prisma.residente.deleteMany()
    await prisma.habitacion.deleteMany()
    await prisma.residencia.deleteMany()
    await prisma.rolePermission.deleteMany()
    await prisma.permission.deleteMany()
    await prisma.user.deleteMany()
    await prisma.role.deleteMany()

    console.log('🧹 Base de datos limpiada')

    // 1. Crear Permisos Básicos
    const permissionsData = [
        { key: 'ADMIN_ACCESS', description: 'Acceso total al sistema' },
        { key: 'MANAGE_RESIDENCIAS', description: 'Crear, editar y eliminar residencias' },
        { key: 'MANAGE_RESIDENTES', description: 'Gestión completa de residentes' },
        { key: 'MANAGE_HABITACIONES', description: 'Publicar y gestionar habitaciones' },
        { key: 'MANAGE_PAYMENTS', description: 'Aprobar pagos y gestionar cuotas' },
        { key: 'MARKETPLACE_APPROVE', description: 'Moderar publicaciones del marketplace' },
        { key: 'MARKETPLACE_POST', description: 'Publicar en el marketplace' },
        { key: 'LAVANDERIA_USER', description: 'Uso básico de lavandería' },
        { key: 'COMIDAS_POST', description: 'Publicar menús' },
        { key: 'COMIDAS_VIEW', description: 'Ver menús y marcar asistencia' },
    ]

    const createdPerms = await Promise.all(
        permissionsData.map(p => prisma.permission.create({ data: p }))
    )

    console.log(`🔑 ${createdPerms.length} permisos creados`)

    // 2. Crear Roles
    const roleAdmin = await prisma.role.create({
        data: {
            name: 'ADMIN',
            description: 'Administrador del sistema con todos los permisos',
            permissions: {
                create: createdPerms.map(p => ({ permissionId: p.id }))
            }
        }
    })

    const roleResidente = await prisma.role.create({
        data: {
            name: 'RESIDENTE',
            description: 'Usuario residente del coliving',
            permissions: {
                create: createdPerms
                    .filter(p => ['MARKETPLACE_POST', 'LAVANDERIA_USER', 'COMIDAS_VIEW'].includes(p.key))
                    .map(p => ({ permissionId: p.id }))
            }
        }
    })

    const roleCocinero = await prisma.role.create({
        data: {
            name: 'COCINERO',
            description: 'Personal de cocina',
            permissions: {
                create: createdPerms
                    .filter(p => ['COMIDAS_POST', 'COMIDAS_VIEW', 'LAVANDERIA_USER'].includes(p.key))
                    .map(p => ({ permissionId: p.id }))
            }
        }
    })

    console.log('🎭 Roles creados (ADMIN, RESIDENTE, COCINERO)')

    // 3. Crear Usuarios Iniciales
    const adminUser = await prisma.user.create({
        data: {
            nombre: 'Admin Belorama',
            email: 'admin@belorama.com',
            password: 'admin123',
            roleId: roleAdmin.id,
        }
    })

    const cocineroUser = await prisma.user.create({
        data: {
            nombre: 'Carlos Cocinero',
            email: 'cocinero@belorama.com',
            password: 'cocina123',
            roleId: roleCocinero.id,
        }
    })

    // Crear Residencias
    const res1 = await prisma.residencia.create({
        data: {
            nombre: 'Residencia Norte',
            direccion: 'Av. Norte 123',
            descripcion: 'Residencia moderna cerca del campus',
            capacidad: 20,
        }
    })

    const res2 = await prisma.residencia.create({
        data: {
            nombre: 'Residencia Sur',
            direccion: 'Av. Sur 456',
            descripcion: 'Residencia tranquila con jardín',
            capacidad: 15,
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
                    estado: i >= 3 ? 'LIBRE' : 'OCUPADO',
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
                    estado: i >= 2 ? 'LIBRE' : 'OCUPADO',
                }
            })
        )
    )

    // Crear Residentes
    const residentesList = [
        { nombre: 'Ana García', email: 'ana@belorama.com', habIdx: 0, resId: res1.id },
        { nombre: 'Luis Pérez', email: 'luis@belorama.com', habIdx: 1, resId: res1.id },
        { nombre: 'María López', email: 'maria@belorama.com', habIdx: 2, resId: res1.id },
        { nombre: 'Jorge Díaz', email: 'jorge@belorama.com', habIdx: 0, resId: res2.id },
        { nombre: 'Sofia Ruiz', email: 'sofia@belorama.com', habIdx: 1, resId: res2.id },
    ]

    const residentes = await Promise.all(
        residentesList.map(async (r, i) => {
            const hab = i < 3 ? habitaciones1[r.habIdx] : habitaciones2[r.habIdx]
            const user = await prisma.user.create({
                data: {
                    nombre: r.nombre,
                    email: r.email,
                    password: 'res123',
                    roleId: roleResidente.id,
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

        for (const dia of dias) {
            await prisma.turnoLavanderia.create({
                data: {
                    lavadoraId: lav1.id,
                    residenciaId: residencia.id,
                    dia,
                    horaInicio: '08:00',
                    horaFin: '10:00',
                    estado: EstadoTurno.LIBRE,
                }
            })
        }
    }

    // Crear Pagos de ejemplo
    await prisma.pago.create({
        data: {
            residenteId: residentes[0].id,
            monto: 500,
            montoPagado: 500,
            estado: 'PAGADO',
        }
    })

    // Crear Egresos
    await prisma.egreso.create({
        data: {
            adminId: adminUser.id,
            concepto: 'Limpieza mensual',
            monto: 150,
            categoria: 'Mantenimiento',
            residenciaId: res1.id,
        }
    })

    console.log('✅ Seed completado con éxito')
}

main()
    .catch((e) => {
        console.error('❌ Error en el seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })