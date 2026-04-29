
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testPaymentLogic() {
  console.log('🚀 Iniciando prueba de lógica de pagos...')

  try {
    // 1. Buscar o crear un usuario base para el residente
    const user = await prisma.user.create({
      data: {
        nombre: 'Test',
        apellidoPaterno: 'Sistema',
        apellidoMaterno: 'Pagos',
        dni: 'TEST' + Math.floor(Math.random() * 10000),
        email: `test${Math.floor(Math.random() * 10000)}@test.com`,
        password: 'password123',
        role: { connect: { name: 'RESIDENTE' } }
      }
    })

    // 2. Crear Residente
    const residente = await prisma.residente.create({
      data: {
        userId: user.id,
        fechaIngreso: new Date('2026-01-01'),
        fechaFinal: new Date('2026-03-01'), // 3 meses (Ene, Feb, Mar)
        montoMensual: 1200,
        diaPago: 5,
        activo: true
      }
    })

    console.log('✅ Residente de prueba creado.')

    // 3. Simular la creación de contrato (lo que hace el server action)
    // Importamos la lógica o la replicamos aquí para el test
    const { createContrato } = require('../app/actions/contratos')
    
    const result = await createContrato({
      residenteId: residente.id,
      fechaInicio: residente.fechaIngreso,
      fechaFin: residente.fechaFinal!,
      montoMensual: residente.montoMensual,
      diaPago: residente.diaPago
    })

    if (result.success) {
      console.log('✅ Contrato y pagos generados exitosamente.')
      
      // 4. Validar cantidad de pagos
      const pagos = await prisma.pago.findMany({
        where: { residenteId: residente.id }
      })

      console.log(`📊 Pagos generados: ${pagos.length}`)
      if (pagos.length === 3) {
        console.log('✨ TEST EXITOSO: Se generaron exactamente 3 mensualidades.')
      } else {
        console.error('❌ ERROR: Se esperaban 3 pagos, pero se encontraron ' + pagos.length)
      }
    } else {
      console.error('❌ ERROR en createContrato:', result.error)
    }

    // Limpieza
    await prisma.pago.deleteMany({ where: { residenteId: residente.id } })
    await prisma.contrato.deleteMany({ where: { residenteId: residente.id } })
    await prisma.residente.delete({ where: { id: residente.id } })
    await prisma.user.delete({ where: { id: user.id } })
    console.log('🧹 Base de datos limpia.')

  } catch (error) {
    console.error('💥 Error durante la prueba:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPaymentLogic()
