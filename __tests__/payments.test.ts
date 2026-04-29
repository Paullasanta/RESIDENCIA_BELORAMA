import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createContrato } from '../app/actions/contratos'
import { prisma } from '../lib/prisma'

describe('createContrato', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe generar la cantidad correcta de pagos mensuales', async () => {
    const mockData = {
      residenteId: 1,
      fechaInicio: new Date(2026, 0, 1), // 1 de Enero
      fechaFin: new Date(2026, 2, 1),    // 1 de Marzo
      montoMensual: 1000,
      diaPago: 5
    }

    // Mock del retorno de prisma.contrato.create
    ;(prisma.contrato.create as any).mockResolvedValue({ id: 123, ...mockData })

    const result = await createContrato(mockData)

    expect(result.success).toBe(true)
    
    // Verificar que se llamó a createMany con 3 pagos
    const createManyCalls = (prisma.pago.createMany as any).mock.calls
    expect(createManyCalls[0][0].data).toHaveLength(3)
    
    // Verificar los conceptos generados
    const pagos = createManyCalls[0][0].data
    expect(pagos[0].concepto).toContain('Enero')
    expect(pagos[1].concepto).toContain('Febrero')
    expect(pagos[2].concepto).toContain('Marzo')
  })

  it('debe manejar errores si la base de datos falla', async () => {
    ;(prisma.contrato.create as any).mockRejectedValue(new Error('DB Error'))
    
    const result = await createContrato({
      residenteId: 1,
      fechaInicio: new Date(),
      fechaFin: new Date(),
      montoMensual: 1000,
      diaPago: 5
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Error')
  })
})
