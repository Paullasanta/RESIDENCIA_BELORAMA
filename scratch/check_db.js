const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const total = await prisma.habitacion.count();
    const libres = await prisma.habitacion.count({ where: { estado: 'LIBRE' } });
    const ocupadas = await prisma.habitacion.count({ where: { estado: 'OCUPADO' } });
    console.log({ total, libres, ocupadas });
}

main().catch(console.error).finally(() => prisma.$disconnect());
