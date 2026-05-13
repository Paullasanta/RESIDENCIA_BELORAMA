-- CreateEnum
CREATE TYPE "TipoReserva" AS ENUM ('BASE', 'EXTRA', 'SOLICITUD');

-- AlterTable
ALTER TABLE "ProductoMarketplace" ADD COLUMN     "categoria" TEXT DEFAULT 'Otros',
ADD COLUMN     "telefonoContacto" TEXT,
ADD COLUMN     "whatsappContacto" TEXT;

-- AlterTable
ALTER TABLE "Residente" ADD COLUMN     "comentarios" TEXT,
ADD COLUMN     "garantiaNoReembolsable" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TurnoLavanderia" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fecha" TIMESTAMP(3),
ADD COLUMN     "tipoReserva" "TipoReserva" NOT NULL DEFAULT 'BASE';

-- CreateTable
CREATE TABLE "HistorialLavanderia" (
    "id" SERIAL NOT NULL,
    "residenteId" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialLavanderia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HistorialLavanderia" ADD CONSTRAINT "HistorialLavanderia_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
