import { PrismaClient, EstadoPago } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const residentes = await prisma.residente.findMany({
    include: { user: true }
  })

  for (const residente of residentes) {
    // Verificar si ya tiene pagos
    const count = await prisma.pago.count({ where: { residenteId: residente.id } })
    if (count > 0) continue

    await prisma.pago.create({
      data: {
        residenteId: residente.id,
        monto: residente.montoMensual,
        concepto: 'Mensualidad Mayo 2026',
        estado: EstadoPago.PENDIENTE,
        fechaVencimiento: new Date('2026-05-15'),
        mesCorrespondiente: '2026-05'
      }
    })

    console.log(`Creado pago para ${residente.user.nombre}`)
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
