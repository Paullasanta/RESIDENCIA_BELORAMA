const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const menus = await prisma.menu.findMany({
        where: { activo: true },
    });
    console.log({ menusCount: menus.length, menus });
}

main().catch(console.error).finally(() => prisma.$disconnect());
