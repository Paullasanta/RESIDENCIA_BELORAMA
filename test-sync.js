const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const residente = await prisma.residente.findUnique({ where: { id: 17 } });
  
  const newFechaIngreso = residente.fechaIngreso;
  const newFechaFinal = residente.fechaFinal;
  const newDiaPago = residente.diaPago;
  const newMontoMensual = residente.montoMensual;

  console.log("Ingreso:", newFechaIngreso);
  console.log("Final:", newFechaFinal);
  
  if (newFechaFinal && newMontoMensual > 0) {
    let fechaActual = new Date(newFechaIngreso);
    const expectedMeses = [];
    
    do {
      const mesString = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
      let fechaVencimiento = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), newDiaPago);
      if (fechaVencimiento.getMonth() !== fechaActual.getMonth()) {
        fechaVencimiento.setDate(0); 
      }
      const nombreMes = fechaActual.toLocaleDateString('es-MX', { month: 'long' });
      const concepto = `Mensualidad ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${fechaActual.getFullYear()}`;
      
      expectedMeses.push({ mesCorrespondiente: mesString, fechaVencimiento, concepto });
      fechaActual.setMonth(fechaActual.getMonth() + 1);
    } while (fechaActual < newFechaFinal);

    console.log("Expected:", expectedMeses);
    
    const existingPagos = await prisma.pago.findMany({
      where: { residenteId: 17, concepto: { contains: 'Mensualidad' } }
    });
    const existingMeses = existingPagos.map(p => p.mesCorrespondiente);
    
    console.log("Existing:", existingMeses);
    
    const pagosToCreate = expectedMeses
      .filter(exp => !existingMeses.includes(exp.mesCorrespondiente))
      .map(exp => ({
        residenteId: 17,
        concepto: exp.concepto,
        mesCorrespondiente: exp.mesCorrespondiente,
        fechaVencimiento: exp.fechaVencimiento,
        monto: newMontoMensual,
        estado: 'PENDIENTE',
      }));
      
    console.log("To create:", pagosToCreate);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
