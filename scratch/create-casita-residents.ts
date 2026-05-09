import { PrismaClient, EstadoPago } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const residencia = await prisma.residencia.findFirst({
    where: { nombre: { contains: 'Casita', mode: 'insensitive' } },
    include: { habitaciones: { where: { estado: 'LIBRE' } } }
  })

  if (!residencia) {
    console.log('No se encontró la residencia Casita.')
    return
  }

  const hashedPassword = await bcrypt.hash('password123', 10)
  const roleResidente = await prisma.role.findUnique({ where: { name: 'RESIDENTE' } })

  if (!roleResidente) {
    console.log('No existe el rol RESIDENTE.')
    return
  }

  const dummyResidents = [
    { nombre: 'Sofia Castro', email: 'sofia@example.com', dni: '22334455' },
    { nombre: 'Miguel Angel', email: 'miguel@example.com', dni: '66778899' },
    { nombre: 'Elena Gomez', email: 'elena@example.com', dni: '99001122' },
    { nombre: 'Pablo Neruda', email: 'pablo@example.com', dni: '33445566' },
    { nombre: 'Isabel Allende', email: 'isabel@example.com', dni: '77889900' },
  ]

  let count = 0
  for (const habitacion of residencia.habitaciones) {
    if (count >= dummyResidents.length) break

    const data = dummyResidents[count]
    
    // Crear Usuario
    const user = await prisma.user.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password: hashedPassword,
        dni: data.dni,
        roleId: roleResidente.id,
        residenciaId: residencia.id,
      }
    })

    // Crear Residente
    const residente = await prisma.residente.create({
      data: {
        userId: user.id,
        habitacionId: habitacion.id,
        montoMensual: 650,
        montoGarantia: 650,
        diaPago: 1,
      }
    })

    // Crear Pago inicial
    await prisma.pago.create({
      data: {
        residenteId: residente.id,
        monto: 650,
        concepto: 'Mensualidad Mayo 2026',
        estado: EstadoPago.PENDIENTE,
        fechaVencimiento: new Date('2026-05-10'),
        mesCorrespondiente: '2026-05'
      }
    })

    // Actualizar habitación
    await prisma.habitacion.update({
      where: { id: habitacion.id },
      data: { estado: 'OCUPADO' }
    })

    console.log(`Creado residente ${data.nombre} en Casita, habitación ${habitacion.numero}`)
    count++
  }

  console.log('Finalizado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
