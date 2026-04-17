/*
  Warnings:

  - The primary key for the `AsistenciaComida` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `AsistenciaComida` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Cuota` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Cuota` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Egreso` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Egreso` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `residenciaId` column on the `Egreso` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Habitacion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `disponible` on the `Habitacion` table. All the data in the column will be lost.
  - The `id` column on the `Habitacion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Lavadora` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Lavadora` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Menu` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Menu` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `MenuResidencia` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `MenuResidencia` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Pago` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Pago` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ProductoMarketplace` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ProductoMarketplace` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `residenteId` column on the `ProductoMarketplace` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PublicacionHabitacion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PublicacionHabitacion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Residencia` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Residencia` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Residente` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Residente` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `habitacionId` column on the `Residente` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `TurnoLavanderia` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `TurnoLavanderia` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `residenteId` column on the `TurnoLavanderia` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `rol` on the `User` table. All the data in the column will be lost.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `residenciaId` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `menuId` on the `AsistenciaComida` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `residenteId` on the `AsistenciaComida` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `pagoId` on the `Cuota` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `adminId` on the `Egreso` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `residenciaId` on the `Habitacion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `residenciaId` on the `Lavadora` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `menuId` on the `MenuResidencia` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `residenciaId` on the `MenuResidencia` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `residenteId` on the `Pago` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `habitacionId` on the `PublicacionHabitacion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `residenciaId` on the `PublicacionHabitacion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Residente` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lavadoraId` on the `TurnoLavanderia` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `residenciaId` on the `TurnoLavanderia` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EstadoHabitacion" AS ENUM ('LIBRE', 'OCUPADO', 'RESERVADO', 'POR_LIBERARSE');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('NORMAL', 'URGENTE', 'IMPORTANTE');

-- DropForeignKey
ALTER TABLE "AsistenciaComida" DROP CONSTRAINT "AsistenciaComida_menuId_fkey";

-- DropForeignKey
ALTER TABLE "AsistenciaComida" DROP CONSTRAINT "AsistenciaComida_residenteId_fkey";

-- DropForeignKey
ALTER TABLE "Cuota" DROP CONSTRAINT "Cuota_pagoId_fkey";

-- DropForeignKey
ALTER TABLE "Egreso" DROP CONSTRAINT "Egreso_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Egreso" DROP CONSTRAINT "Egreso_residenciaId_fkey";

-- DropForeignKey
ALTER TABLE "Habitacion" DROP CONSTRAINT "Habitacion_residenciaId_fkey";

-- DropForeignKey
ALTER TABLE "Lavadora" DROP CONSTRAINT "Lavadora_residenciaId_fkey";

-- DropForeignKey
ALTER TABLE "MenuResidencia" DROP CONSTRAINT "MenuResidencia_menuId_fkey";

-- DropForeignKey
ALTER TABLE "MenuResidencia" DROP CONSTRAINT "MenuResidencia_residenciaId_fkey";

-- DropForeignKey
ALTER TABLE "Pago" DROP CONSTRAINT "Pago_residenteId_fkey";

-- DropForeignKey
ALTER TABLE "ProductoMarketplace" DROP CONSTRAINT "ProductoMarketplace_residenteId_fkey";

-- DropForeignKey
ALTER TABLE "PublicacionHabitacion" DROP CONSTRAINT "PublicacionHabitacion_habitacionId_fkey";

-- DropForeignKey
ALTER TABLE "PublicacionHabitacion" DROP CONSTRAINT "PublicacionHabitacion_residenciaId_fkey";

-- DropForeignKey
ALTER TABLE "Residente" DROP CONSTRAINT "Residente_habitacionId_fkey";

-- DropForeignKey
ALTER TABLE "Residente" DROP CONSTRAINT "Residente_userId_fkey";

-- DropForeignKey
ALTER TABLE "TurnoLavanderia" DROP CONSTRAINT "TurnoLavanderia_lavadoraId_fkey";

-- DropForeignKey
ALTER TABLE "TurnoLavanderia" DROP CONSTRAINT "TurnoLavanderia_residenciaId_fkey";

-- DropForeignKey
ALTER TABLE "TurnoLavanderia" DROP CONSTRAINT "TurnoLavanderia_residenteId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_residenciaId_fkey";

-- AlterTable
ALTER TABLE "AsistenciaComida" DROP CONSTRAINT "AsistenciaComida_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "menuId",
ADD COLUMN     "menuId" INTEGER NOT NULL,
DROP COLUMN "residenteId",
ADD COLUMN     "residenteId" INTEGER NOT NULL,
ADD CONSTRAINT "AsistenciaComida_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Cuota" DROP CONSTRAINT "Cuota_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "pagoId",
ADD COLUMN     "pagoId" INTEGER NOT NULL,
ADD CONSTRAINT "Cuota_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Egreso" DROP CONSTRAINT "Egreso_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "adminId",
ADD COLUMN     "adminId" INTEGER NOT NULL,
DROP COLUMN "residenciaId",
ADD COLUMN     "residenciaId" INTEGER,
ADD CONSTRAINT "Egreso_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Habitacion" DROP CONSTRAINT "Habitacion_pkey",
DROP COLUMN "disponible",
ADD COLUMN     "estado" "EstadoHabitacion" NOT NULL DEFAULT 'LIBRE',
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "residenciaId",
ADD COLUMN     "residenciaId" INTEGER NOT NULL,
ADD CONSTRAINT "Habitacion_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Lavadora" DROP CONSTRAINT "Lavadora_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "residenciaId",
ADD COLUMN     "residenciaId" INTEGER NOT NULL,
ADD CONSTRAINT "Lavadora_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Menu" DROP CONSTRAINT "Menu_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Menu_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MenuResidencia" DROP CONSTRAINT "MenuResidencia_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "menuId",
ADD COLUMN     "menuId" INTEGER NOT NULL,
DROP COLUMN "residenciaId",
ADD COLUMN     "residenciaId" INTEGER NOT NULL,
ADD CONSTRAINT "MenuResidencia_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Pago" DROP CONSTRAINT "Pago_pkey",
ADD COLUMN     "concepto" TEXT NOT NULL DEFAULT 'Pago',
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "residenteId",
ADD COLUMN     "residenteId" INTEGER NOT NULL,
ADD CONSTRAINT "Pago_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProductoMarketplace" DROP CONSTRAINT "ProductoMarketplace_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "residenteId",
ADD COLUMN     "residenteId" INTEGER,
ADD CONSTRAINT "ProductoMarketplace_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PublicacionHabitacion" DROP CONSTRAINT "PublicacionHabitacion_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "habitacionId",
ADD COLUMN     "habitacionId" INTEGER NOT NULL,
DROP COLUMN "residenciaId",
ADD COLUMN     "residenciaId" INTEGER NOT NULL,
ADD CONSTRAINT "PublicacionHabitacion_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Residencia" DROP CONSTRAINT "Residencia_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Residencia_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Residente" DROP CONSTRAINT "Residente_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "habitacionId",
ADD COLUMN     "habitacionId" INTEGER,
ADD CONSTRAINT "Residente_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TurnoLavanderia" DROP CONSTRAINT "TurnoLavanderia_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "lavadoraId",
ADD COLUMN     "lavadoraId" INTEGER NOT NULL,
DROP COLUMN "residenciaId",
ADD COLUMN     "residenciaId" INTEGER NOT NULL,
DROP COLUMN "residenteId",
ADD COLUMN     "residenteId" INTEGER,
ADD CONSTRAINT "TurnoLavanderia_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "rol",
ADD COLUMN     "roleId" INTEGER,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "residenciaId",
ADD COLUMN     "residenciaId" INTEGER,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "Aviso" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'NORMAL',
    "fotos" TEXT[],
    "residenciaId" INTEGER,
    "autorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aviso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaccion" (
    "id" SERIAL NOT NULL,
    "emoji" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "avisoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" SERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Reaccion_userId_avisoId_emoji_key" ON "Reaccion"("userId", "avisoId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "Configuracion_clave_key" ON "Configuracion"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "PublicacionHabitacion_habitacionId_key" ON "PublicacionHabitacion"("habitacionId");

-- CreateIndex
CREATE UNIQUE INDEX "Residente_userId_key" ON "Residente"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "ProductoMarketplace" ADD CONSTRAINT "ProductoMarketplace_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaccion" ADD CONSTRAINT "Reaccion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaccion" ADD CONSTRAINT "Reaccion_avisoId_fkey" FOREIGN KEY ("avisoId") REFERENCES "Aviso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
