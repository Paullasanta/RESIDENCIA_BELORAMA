import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock de Prisma para evitar tocar la DB real durante los tests
vi.mock('./lib/prisma', () => ({
  prisma: {
    contrato: {
      create: vi.fn(),
    },
    pago: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    residente: {
      findUnique: vi.fn(),
    }
  },
}))

// Mock de Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))
