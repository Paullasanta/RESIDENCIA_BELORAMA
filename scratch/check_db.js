const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const userCount = await prisma.user.count();
    const residenciaCount = await prisma.residencia.count();
    const residenteCount = await prisma.residente.count();
    console.log('Counts:');
    console.log('Users:', userCount);
    console.log('Residencias:', residenciaCount);
    console.log('Residentes:', residenteCount);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
