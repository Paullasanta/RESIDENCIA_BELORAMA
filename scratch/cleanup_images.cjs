const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

async function main() {
  try {
    const files = fs.readdirSync(uploadsDir).filter(f => fs.statSync(path.join(uploadsDir, f)).isFile());
    
    // Recopilar TODAS las imágenes usadas en la base de datos
    const usedPaths = new Set();
    
    // Pago.comprobante
    (await prisma.pago.findMany({ select: { comprobante: true } }))
      .forEach(p => p.comprobante && usedPaths.add(p.comprobante));
      
    // User.imagen
    (await prisma.user.findMany({ select: { imagen: true } }))
      .forEach(u => u.imagen && usedPaths.add(u.imagen));
      
    // Residencia.fotos
    (await prisma.residencia.findMany({ select: { fotos: true } }))
      .forEach(r => r.fotos.forEach(f => usedPaths.add(f)));
      
    // Habitacion.fotos
    (await prisma.habitacion.findMany({ select: { fotos: true } }))
      .forEach(h => h.fotos.forEach(f => usedPaths.add(f)));
      
    // PublicacionHabitacion.fotos
    (await prisma.publicacionHabitacion.findMany({ select: { fotos: true } }))
      .forEach(p => p.fotos.forEach(f => usedPaths.add(f)));
      
    // ProductoMarketplace.fotos
    (await prisma.productoMarketplace.findMany({ select: { fotos: true } }))
      .forEach(p => p.fotos.forEach(f => usedPaths.add(f)));
      
    // Aviso.fotos
    (await prisma.aviso.findMany({ select: { fotos: true } }))
      .forEach(a => a.fotos.forEach(f => usedPaths.add(f)));
      
    // TicketMantenimiento.fotos
    (await prisma.ticketMantenimiento.findMany({ select: { fotos: true } }))
      .forEach(t => t.fotos.forEach(f => usedPaths.add(f)));

    console.log(`Archivos en carpeta: ${files.length}`);
    console.log(`Rutas únicas en DB: ${usedPaths.size}`);
    
    let deletedCount = 0;
    for (const file of files) {
      const filePath = `/uploads/${file}`;
      if (!usedPaths.has(filePath)) {
        try {
            fs.unlinkSync(path.join(uploadsDir, file));
            deletedCount++;
        } catch (err) {
            console.error(`Error eliminando ${file}:`, err);
        }
      }
    }
    
    console.log(`Limpieza completada. Archivos eliminados: ${deletedCount}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
