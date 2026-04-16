-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'RESIDENTE', 'COCINERO');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('LIBRE', 'OCUPADO', 'SOLICITADO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADO');

-- CreateEnum
CREATE TYPE "EstadoProducto" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "TipoMenu" AS ENUM ('DESAYUNO', 'ALMUERZO', 'CENA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'RESIDENTE',
    "residenciaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Residencia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "descripcion" TEXT,
    "fotos" TEXT[],
    "capacidad" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Residencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habitacion" (
    "id" TEXT NOT NULL,
    "residenciaId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "piso" INTEGER NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "fotos" TEXT[],

    CONSTRAINT "Habitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Residente" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "habitacionId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Residente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lavadora" (
    "id" TEXT NOT NULL,
    "residenciaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Lavadora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurnoLavanderia" (
    "id" TEXT NOT NULL,
    "lavadoraId" TEXT NOT NULL,
    "residenciaId" TEXT NOT NULL,
    "dia" "DiaSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "residenteId" TEXT,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'LIBRE',

    CONSTRAINT "TurnoLavanderia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "residenteId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "montoPagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comprobante" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuota" (
    "id" TEXT NOT NULL,
    "pagoId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMenu" NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuResidencia" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "residenciaId" TEXT NOT NULL,

    CONSTRAINT "MenuResidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsistenciaComida" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "residenteId" TEXT NOT NULL,
    "asiste" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AsistenciaComida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicacionHabitacion" (
    "id" TEXT NOT NULL,
    "habitacionId" TEXT NOT NULL,
    "residenciaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fotos" TEXT[],
    "coordLat" DOUBLE PRECISION,
    "coordLng" DOUBLE PRECISION,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicacionHabitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoMarketplace" (
    "id" TEXT NOT NULL,
    "residenteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "fotos" TEXT[],
    "estado" "EstadoProducto" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductoMarketplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Egreso" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "categoria" TEXT NOT NULL,
    "residenciaId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Egreso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Residente_userId_key" ON "Residente"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicacionHabitacion_habitacionId_key" ON "PublicacionHabitacion"("habitacionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habitacion" ADD CONSTRAINT "Habitacion_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Residente" ADD CONSTRAINT "Residente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Residente" ADD CONSTRAINT "Residente_habitacionId_fkey" FOREIGN KEY ("habitacionId") REFERENCES "Habitacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lavadora" ADD CONSTRAINT "Lavadora_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoLavanderia" ADD CONSTRAINT "TurnoLavanderia_lavadoraId_fkey" FOREIGN KEY ("lavadoraId") REFERENCES "Lavadora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoLavanderia" ADD CONSTRAINT "TurnoLavanderia_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoLavanderia" ADD CONSTRAINT "TurnoLavanderia_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuota" ADD CONSTRAINT "Cuota_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuResidencia" ADD CONSTRAINT "MenuResidencia_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuResidencia" ADD CONSTRAINT "MenuResidencia_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsistenciaComida" ADD CONSTRAINT "AsistenciaComida_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsistenciaComida" ADD CONSTRAINT "AsistenciaComida_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicacionHabitacion" ADD CONSTRAINT "PublicacionHabitacion_habitacionId_fkey" FOREIGN KEY ("habitacionId") REFERENCES "Habitacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicacionHabitacion" ADD CONSTRAINT "PublicacionHabitacion_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoMarketplace" ADD CONSTRAINT "ProductoMarketplace_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
