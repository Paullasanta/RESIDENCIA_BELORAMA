-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'RESIDENTE', 'COCINERO');

-- CreateEnum
CREATE TYPE "TipoReserva" AS ENUM ('BASE', 'EXTRA', 'SOLICITUD');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('LIBRE', 'OCUPADO', 'SOLICITADO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADO', 'EN_REVISION', 'RECHAZADO', 'VENCIDO', 'CRITICO');

-- CreateEnum
CREATE TYPE "EstadoProducto" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'VENDIDO');

-- CreateEnum
CREATE TYPE "EstadoHabitacion" AS ENUM ('LIBRE', 'OCUPADO', 'RESERVADO', 'POR_LIBERARSE');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('NORMAL', 'URGENTE', 'IMPORTANTE');

-- CreateEnum
CREATE TYPE "EstadoTicket" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoMenu" AS ENUM ('DESAYUNO', 'ALMUERZO', 'CENA');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "dni" TEXT,
    "nombre" TEXT NOT NULL,
    "apellidoPaterno" TEXT,
    "apellidoMaterno" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" TEXT,
    "imagen" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "emergenciaNombre" TEXT,
    "emergenciaTelefono" TEXT,
    "emergenciaParentesco" TEXT,
    "roleId" INTEGER,
    "residenciaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "Residencia" (
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
    "residenciaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "piso" INTEGER NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "estado" "EstadoHabitacion" NOT NULL DEFAULT 'LIBRE',
    "fotos" TEXT[],

    CONSTRAINT "Habitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Residente" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "habitacionId" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFinal" TIMESTAMP(3),
    "diaPago" INTEGER NOT NULL DEFAULT 1,
    "montoMensual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montoGarantia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alergias" TEXT,
    "restriccionesAlimentarias" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Residente_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "Lavadora" (
    "id" SERIAL NOT NULL,
    "residenciaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Lavadora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurnoLavanderia" (
    "id" SERIAL NOT NULL,
    "lavadoraId" INTEGER NOT NULL,
    "residenciaId" INTEGER NOT NULL,
    "dia" "DiaSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "residenteId" INTEGER,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'LIBRE',
    "tipoReserva" "TipoReserva" NOT NULL DEFAULT 'BASE',
    "fecha" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TurnoLavanderia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialLavanderia" (
    "id" SERIAL NOT NULL,
    "residenteId" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialLavanderia_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "residenteId" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL DEFAULT 'Pago',
    "mesCorrespondiente" TEXT,
    "fechaVencimiento" TIMESTAMP(3),
    "monto" DOUBLE PRECISION NOT NULL,
    "montoPagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comprobante" TEXT,
    "metodoPago" TEXT,
    "periodo" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "fechaPago" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoMenu" NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fechaLimite" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuResidencia" (
    "id" SERIAL NOT NULL,
    "menuId" INTEGER NOT NULL,
    "residenciaId" INTEGER NOT NULL,

    CONSTRAINT "MenuResidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsistenciaComida" (
    "id" SERIAL NOT NULL,
    "menuId" INTEGER NOT NULL,
    "residenteId" INTEGER NOT NULL,
    "asiste" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AsistenciaComida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicacionHabitacion" (
    "id" SERIAL NOT NULL,
    "habitacionId" INTEGER NOT NULL,
    "residenciaId" INTEGER NOT NULL,
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
    "id" SERIAL NOT NULL,
    "residenteId" INTEGER,
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
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "categoria" TEXT NOT NULL,
    "residenciaId" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Egreso_pkey" PRIMARY KEY ("id")
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
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
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
CREATE TABLE "Configuracion" (
    "id" SERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "User_dni_key" ON "User"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Residente_userId_key" ON "Residente"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TurnoFijo_lavadoraId_dia_horaInicio_key" ON "TurnoFijo"("lavadoraId", "dia", "horaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "PublicacionHabitacion_habitacionId_key" ON "PublicacionHabitacion"("habitacionId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaccion_userId_avisoId_emoji_key" ON "Reaccion"("userId", "avisoId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "Configuracion_clave_key" ON "Configuracion"("clave");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habitacion" ADD CONSTRAINT "Habitacion_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Residente" ADD CONSTRAINT "Residente_habitacionId_fkey" FOREIGN KEY ("habitacionId") REFERENCES "Habitacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Residente" ADD CONSTRAINT "Residente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_habitacionId_fkey" FOREIGN KEY ("habitacionId") REFERENCES "Habitacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lavadora" ADD CONSTRAINT "Lavadora_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoLavanderia" ADD CONSTRAINT "TurnoLavanderia_lavadoraId_fkey" FOREIGN KEY ("lavadoraId") REFERENCES "Lavadora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoLavanderia" ADD CONSTRAINT "TurnoLavanderia_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoLavanderia" ADD CONSTRAINT "TurnoLavanderia_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialLavanderia" ADD CONSTRAINT "HistorialLavanderia_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoFijo" ADD CONSTRAINT "TurnoFijo_lavadoraId_fkey" FOREIGN KEY ("lavadoraId") REFERENCES "Lavadora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoFijo" ADD CONSTRAINT "TurnoFijo_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaccion" ADD CONSTRAINT "Reaccion_avisoId_fkey" FOREIGN KEY ("avisoId") REFERENCES "Aviso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaccion" ADD CONSTRAINT "Reaccion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMantenimiento" ADD CONSTRAINT "TicketMantenimiento_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "Residencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMantenimiento" ADD CONSTRAINT "TicketMantenimiento_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

