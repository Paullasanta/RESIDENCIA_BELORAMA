const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pagos = await prisma.pago.findMany({ where: { residenteId: 17 } });
  console.log(JSON.stringify(pagos, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
