import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const residencias = await prisma.residencia.findMany({
    include: { habitaciones: true }
  })

  if (residencias.length === 0) {
    console.log('No hay residencias. Crea una primero.')
    return
  }

  const hashedPassword = await bcrypt.hash('password123', 10)
  const roleResidente = await prisma.role.findUnique({ where: { name: 'RESIDENTE' } })

  if (!roleResidente) {
    console.log('No existe el rol RESIDENTE. Por favor ejecuta el seed primero.')
    return
  }

  const dummyResidents = [
    { nombre: 'Juan Perez', email: 'juan@example.com', dni: '12345678' },
    { nombre: 'Maria Garcia', email: 'maria@example.com', dni: '87654321' },
    { nombre: 'Carlos Ruiz', email: 'carlos@example.com', dni: '11223344' },
    { nombre: 'Ana Lopez', email: 'ana@example.com', dni: '44332211' },
    { nombre: 'Luis Torres', email: 'luis@example.com', dni: '55667788' },
  ]

  let residentCount = 0

  for (const residencia of residencias) {
    const habitacionesLibres = residencia.habitaciones.filter(h => h.estado === 'LIBRE')
    
    for (const habitacion of habitacionesLibres) {
      if (residentCount >= dummyResidents.length) break

      const data = dummyResidents[residentCount]
      
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
      await prisma.residente.create({
        data: {
          userId: user.id,
          habitacionId: habitacion.id,
          montoMensual: 500 + (Math.random() * 200),
          montoGarantia: 500,
          diaPago: 5,
        }
      })

      // Actualizar habitación
      await prisma.habitacion.update({
        where: { id: habitacion.id },
        data: { estado: 'OCUPADO' }
      })

      console.log(`Creado residente ${data.nombre} en ${residencia.nombre}, habitación ${habitacion.numero}`)
      residentCount++
    }
    if (residentCount >= dummyResidents.length) break
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
