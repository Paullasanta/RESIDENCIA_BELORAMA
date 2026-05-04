/*
  Warnings:

  - You are about to drop the `Cuota` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[dni]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EstadoTicket" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CANCELADO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoPago" ADD VALUE 'EN_REVISION';
ALTER TYPE "EstadoPago" ADD VALUE 'RECHAZADO';
ALTER TYPE "EstadoPago" ADD VALUE 'VENCIDO';
ALTER TYPE "EstadoPago" ADD VALUE 'CRITICO';

-- AlterEnum
ALTER TYPE "EstadoProducto" ADD VALUE 'VENDIDO';

-- DropForeignKey
ALTER TABLE "Cuota" DROP CONSTRAINT "Cuota_pagoId_fkey";

-- AlterTable
ALTER TABLE "Aviso" ADD COLUMN     "fechaFin" TIMESTAMP(3),
ADD COLUMN     "fechaInicio" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "fechaLimite" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "fechaPago" TIMESTAMP(3),
ADD COLUMN     "fechaVencimiento" TIMESTAMP(3),
ADD COLUMN     "mesCorrespondiente" TEXT,
ADD COLUMN     "metodoPago" TEXT,
ADD COLUMN     "periodo" TEXT;

-- AlterTable
ALTER TABLE "Residente" ADD COLUMN     "alergias" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "diaPago" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "fechaFinal" TIMESTAMP(3),
ADD COLUMN     "montoGarantia" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "montoMensual" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "restriccionesAlimentarias" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "apellidoMaterno" TEXT,
ADD COLUMN     "apellidoPaterno" TEXT,
ADD COLUMN     "dni" TEXT,
ADD COLUMN     "emergenciaNombre" TEXT,
ADD COLUMN     "emergenciaParentesco" TEXT,
ADD COLUMN     "emergenciaTelefono" TEXT,
ADD COLUMN     "fechaNacimiento" TIMESTAMP(3),
ADD COLUMN     "imagen" TEXT,
ADD COLUMN     "telefono" TEXT;

-- DropTable
DROP TABLE "Cuota";

-- CreateTable
CREATE TABLE "Reserva" (
    "id" SERIAL NOT NULL,
    "habitacionId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidoPaterno" TEXT NOT NULL,
    "apellidoMaterno" TEXT,
    "dni" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "montoMensual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montoGarantia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pagoConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "comprobanteUrl" TEXT,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurnoFijo" (
    "id" SERIAL NOT NULL,
    "lavadoraId" INTEGER NOT NULL,
    "residenteId" INTEGER NOT NULL,
    "dia" "DiaSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TurnoFijo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMantenimiento" (
    "id" SERIAL NOT NULL,
    "residenteId" INTEGER NOT NULL,
    "residenciaId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'NORMAL',
    "estado" "EstadoTicket" NOT NULL DEFAULT 'PENDIENTE',
    "fotos" TEXT[],
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'INFO',
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TurnoFijo_lavadoraId_dia_horaInicio_key" ON "TurnoFijo"("lavadoraId", "dia", "horaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "User_dni_key" ON "User"("dni");

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_habitacionId_fkey" FOREIGN KEY ("habitacionId") REFERENCES "Habitacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoFijo" ADD CONSTRAINT "TurnoFijo_lavadoraId_fkey" FOREIGN KEY ("lavadoraId") REFERENCES "Lavadora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoFijo" ADD CONSTRAINT "TurnoFijo_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMantenimiento" ADD CONSTRAINT "TicketMantenimiento_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMantenimiento" ADD CONSTRAINT "TicketMantenimiento_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
