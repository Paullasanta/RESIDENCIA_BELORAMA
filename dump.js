const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const h = await prisma.habitacion.findMany({ select: { id: true, numero: true, residenciaId: true, fotos: true } })
  console.log(JSON.stringify(h, null, 2))
}

main().finally(() => prisma.$disconnect())
