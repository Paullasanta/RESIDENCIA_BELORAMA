import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed para entorno de producción/servidor...')
    
    // Limpiar BD en orden de dependencias
    await prisma.asistenciaComida.deleteMany()
    await prisma.menuResidencia.deleteMany()
    await prisma.menu.deleteMany()
    await prisma.historialLavanderia.deleteMany()
    await prisma.turnoFijo.deleteMany()
    await prisma.turnoLavanderia.deleteMany()
    await prisma.lavadora.deleteMany()
    await prisma.pago.deleteMany()
    await prisma.productoMarketplace.deleteMany()
    await prisma.publicacionHabitacion.deleteMany()
    await prisma.egreso.deleteMany()
    await prisma.reserva.deleteMany()
    await prisma.ticketMantenimiento.deleteMany()
    await prisma.reaccion.deleteMany()
    await prisma.aviso.deleteMany()
    await prisma.notificacion.deleteMany()
    await prisma.residente.deleteMany()
    await prisma.habitacion.deleteMany()
    await prisma.residencia.deleteMany()
    await prisma.rolePermission.deleteMany()
    await prisma.permission.deleteMany()
    await prisma.user.deleteMany()
    await prisma.role.deleteMany()

    console.log('🧹 Base de datos limpiada (tablas vacías)')

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
        { key: 'SYSTEM_CONFIG', description: 'Configuración técnica del sistema' },
        { key: 'AUDIT_LOGS', description: 'Ver registros de actividad y auditoría' },
        { key: 'STORAGE_MANAGER', description: 'Gestionar rutas de imágenes y archivos' },
    ]

    const createdPerms = await Promise.all(
        permissionsData.map(p => prisma.permission.create({ data: p }))
    )

    console.log(`🔑 ${createdPerms.length} permisos creados`)

    // 2. Crear Roles
    const roleSuperAdmin = await prisma.role.create({
        data: {
            name: 'SUPER_ADMIN',
            description: 'Desarrollador/Administrador total de la base de datos y archivos',
            permissions: {
                create: createdPerms.map(p => ({ permissionId: p.id }))
            }
        }
    })

    const roleAdmin = await prisma.role.create({
        data: {
            name: 'ADMIN',
            description: 'Administrador operativo del sistema',
            permissions: {
                create: createdPerms
                    .filter(p => !['SYSTEM_CONFIG', 'AUDIT_LOGS', 'STORAGE_MANAGER'].includes(p.key))
                    .map(p => ({ permissionId: p.id }))
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

    // 3. Crear el Administrador Inicial
    // 3. Crear el Administrador Maestro (Ustedes - Super Admin)
    const hashedPasswordSuper = await bcrypt.hash('Gr@wR2026@04', 10)
    await prisma.user.create({
        data: {
            nombre: 'Super Admin Belorama',
            email: 'admin@belorama.com',
            password: hashedPasswordSuper,
            roleId: roleSuperAdmin.id,
        }
    })

    // 4. Crear un Administrador Operativo (Opcional - Para uso diario)
    const hashedPasswordAdmin = await bcrypt.hash('BeloramaAdmin2026', 10)
    await prisma.user.create({
        data: {
            nombre: 'Gestor Operativo',
            email: 'gestion@belorama.com',
            password: hashedPasswordAdmin,
            roleId: roleAdmin.id,
        }
    })

    console.log('👤 Super Admin creado: admin@belorama.com (Acceso total)')
    console.log('👤 Admin Operativo creado: gestion@belorama.com')
    console.log('✅ Seed completado con éxito. Todo el resto de la base de datos está limpia para producción.')
}

main()
    .catch((e) => {
        console.error('❌ Error en el seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })