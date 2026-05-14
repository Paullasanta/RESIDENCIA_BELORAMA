'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TipoMenu } from '@prisma/client'
import { createNotification } from './notificaciones'
import { getLimaNow } from '@/lib/utils'

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

    // Validación de fecha: No permitir fechas pasadas (usando hora de Lima)
    const todayLima = getLimaNow();
    const todayUTC = new Date(Date.UTC(todayLima.getFullYear(), todayLima.getMonth(), todayLima.getDate()));
    
    // Comparación estricta de medianoche UTC
    if (baseDate < todayUTC) {
      throw new Error('No se pueden publicar menús para fechas pasadas.');
    }

    // 1. Limpiar asociaciones de residencias previas para todos los menús de esta fecha
    const existingMenus = await prisma.menu.findMany({ where: { fecha: baseDate } });
    const existingIds = existingMenus.map(m => m.id);
    await prisma.menuResidencia.deleteMany({ where: { menuId: { in: existingIds } } });

    // 2. Procesar cada tipo de comida (Upsert manual)
    const tiposConfig = [
      { tipo: 'DESAYUNO' as TipoMenu, data: desayuno },
      { tipo: 'ALMUERZO' as TipoMenu, data: almuerzo },
      { tipo: 'CENA' as TipoMenu, data: cena }
    ];

    for (const item of tiposConfig) {
      const existing = existingMenus.find(m => m.tipo === item.tipo);
      
      if (item.data?.nombre) {
        if (existing) {
          // Actualizar
          await prisma.menu.update({
            where: { id: existing.id },
            data: {
              nombre: item.data.nombre,
              descripcion: item.data.descripcion,
              fechaLimite: limitDate,
              residencias: {
                create: residenciaIds.map((id: number) => ({ residenciaId: id }))
              }
            }
          });
        } else {
          // Crear nuevo
          await prisma.menu.create({
            data: {
              tipo: item.tipo,
              nombre: item.data.nombre,
              descripcion: item.data.descripcion,
              fecha: baseDate,
              fechaLimite: limitDate,
              residencias: {
                create: residenciaIds.map((id: number) => ({ residenciaId: id }))
              }
            }
          });
        }
      } else if (existing) {
        // Si antes existía y ahora se dejó vacío, se elimina
        await prisma.asistenciaComida.deleteMany({ where: { menuId: existing.id } });
        await prisma.menu.delete({ where: { id: existing.id } });
      }
    }

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

    if (menu.fechaLimite && getLimaNow() > menu.fechaLimite) {
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
export async function deleteDailyPlan(fechaStr: string) {
  try {
    const baseDate = new Date(fechaStr);
    
    // Encontramos los IDs de los menús para ese día
    const menusToDelete = await prisma.menu.findMany({
      where: { fecha: baseDate },
      select: { id: true }
    });

    const menuIds = menusToDelete.map(m => m.id);

    await prisma.$transaction([
      // Limpiar relaciones primero
      prisma.asistenciaComida.deleteMany({ where: { menuId: { in: menuIds } } }),
      prisma.menuResidencia.deleteMany({ where: { menuId: { in: menuIds } } }),
      // Borrar los menús
      prisma.menu.deleteMany({ where: { id: { in: menuIds } } })
    ]);

    revalidatePath('/modules/comida');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting daily plan:', error);
    return { success: false, error: 'Error al eliminar la programación del día' };
  }
}

export async function getDailyPlanByDate(fechaStr: string) {
  try {
    const baseDate = new Date(fechaStr);
    const menus = await prisma.menu.findMany({
      where: { fecha: baseDate },
      include: {
        residencias: true
      }
    });
    return { success: true, data: menus };
  } catch (error: any) {
    return { success: false, error: 'Error al obtener el plan del día' };
  }
}
