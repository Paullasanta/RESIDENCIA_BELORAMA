'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TipoMenu } from '@prisma/client'
import { createNotification } from './notificaciones'

export async function createMenu(data: any) {
  try {
    const menu = await prisma.menu.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo as TipoMenu,
        fecha: new Date(data.fecha),
        fechaLimite: data.fechaLimite ? new Date(data.fechaLimite) : null,
        activo: true,
        residencias: {
          create: data.residenciaIds.map((id: number) => ({
            residenciaId: id
          }))
        }
      }
    })

    revalidatePath('/modules/comida')
    return { success: true, data: menu }
  } catch (error: any) {
    return { success: false, error: 'Error al crear el menú' }
  }
}

export async function publishDailyMenu(data: any) {
  try {
    const { fecha, fechaLimite, residenciaIds, desayuno, almuerzo, cena } = data;
    const baseDate = new Date(fecha);
    const limitDate = fechaLimite ? new Date(fechaLimite) : null;

    const createPromises = [];

    // Desayuno
    if (desayuno?.nombre) {
      createPromises.push(prisma.menu.create({
        data: {
          tipo: 'DESAYUNO',
          nombre: desayuno.nombre,
          descripcion: desayuno.descripcion,
          fecha: baseDate,
          fechaLimite: limitDate,
          residencias: { create: residenciaIds.map((id: number) => ({ residenciaId: id })) }
        }
      }));
    }

    // Almuerzo
    if (almuerzo?.nombre) {
      createPromises.push(prisma.menu.create({
        data: {
          tipo: 'ALMUERZO',
          nombre: almuerzo.nombre,
          descripcion: almuerzo.descripcion,
          fecha: baseDate,
          fechaLimite: limitDate,
          residencias: { create: residenciaIds.map((id: number) => ({ residenciaId: id })) }
        }
      }));
    }

    // Cena
    if (cena?.nombre) {
      createPromises.push(prisma.menu.create({
        data: {
          tipo: 'CENA',
          nombre: cena.nombre,
          descripcion: cena.descripcion,
          fecha: baseDate,
          fechaLimite: limitDate,
          residencias: { create: residenciaIds.map((id: number) => ({ residenciaId: id })) }
        }
      }));
    }

    await Promise.all(createPromises);

    // Notificar a los residentes de las residencias seleccionadas
    const residents = await prisma.user.findMany({
        where: {
            role: { name: 'RESIDENTE' },
            residenciaId: { in: residenciaIds }
        },
        select: { id: true }
    })

    for (const resident of residents) {
        await createNotification(
            resident.id,
            'Nuevo Menú Publicado',
            `Ya puedes consultar y confirmar tu asistencia para el ${new Date(fecha).toLocaleDateString()}`,
            'INFO',
            '/modules/comida'
        )
    }

    revalidatePath('/modules/comida')
    return { success: true }
  } catch (error: any) {
    console.error(error);
    return { success: false, error: 'Error al publicar los menús del día' }
  }
}

export async function registrarAsistenciaComida(residenteId: number, menuId: number, asiste: boolean) {
  try {
    const menu = await prisma.menu.findUnique({ where: { id: menuId } });
    if (!menu) return { success: false, error: 'Menú no encontrado' }

    if (menu.fechaLimite && new Date() > menu.fechaLimite) {
      return { success: false, error: 'La fecha límite de confirmación ha expirado' }
    }

    const existing = await prisma.asistenciaComida.findFirst({
      where: { residenteId, menuId }
    })

    if (existing) {
      await prisma.asistenciaComida.update({
        where: { id: existing.id },
        data: { asiste }
      })
    } else {
      await prisma.asistenciaComida.create({
        data: { residenteId, menuId, asiste }
      })
    }

    revalidatePath('/modules/comida')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al registrar asistencia' }
  }
}

export async function toggleMenuEstado(id: number, activo: boolean) {
  try {
    await prisma.menu.update({
      where: { id },
      data: { activo }
    })
    revalidatePath('/modules/comida')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar estado del menú' }
  }
}
