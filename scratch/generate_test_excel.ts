import ExcelJS from 'exceljs';
import path from 'path';

async function generateExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Pruebas Funcionales');

  sheet.columns = [
    { header: 'Módulo', key: 'modulo', width: 20 },
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Prueba', key: 'prueba', width: 30 },
    { header: 'Descripción', key: 'descripcion', width: 50 },
    { header: 'Resultado Esperado', key: 'resultado', width: 50 },
    { header: 'Estado', key: 'estado', width: 15 },
  ];

  const data = [
    // Autenticación
    ['Autenticación', 'AUTH-01', 'Inicio de sesión exitoso', 'Ingresar con credenciales válidas (DNI/Email y Password).', 'El usuario es redirigido al dashboard correspondiente a su rol.', ''],
    ['Autenticación', 'AUTH-02', 'Inicio de sesión fallido', 'Ingresar con credenciales incorrectas.', 'Se muestra un mensaje de error claro ("Credenciales inválidas").', ''],
    ['Autenticación', 'AUTH-03', 'Visualización de Password', 'Hacer clic en el icono de "ojo" en el campo de contraseña.', 'El texto de la contraseña se hace visible/oculto.', ''],
    ['Autenticación', 'AUTH-04', 'Registro de nuevo usuario', 'Completar el formulario de registro con datos válidos.', 'El usuario se crea correctamente y se le asigna el rol base (Residente).', ''],
    ['Autenticación', 'AUTH-05', 'Protección de rutas', 'Intentar acceder a /modules/dashboard sin haber iniciado sesión.', 'El sistema redirige automáticamente al /auth/login.', ''],
    ['Autenticación', 'AUTH-06', 'Logout', 'Hacer clic en el botón de cerrar sesión.', 'La sesión se destruye y el usuario vuelve al login.', ''],

    // Lavandería
    ['Lavandería', 'LAV-01', 'Visualización de turnos', 'Acceder a la sección de lavandería como Residente.', 'Se muestra la grilla de turnos semanal con los estados correctos (Libre/Ocupado).', ''],
    ['Lavandería', 'LAV-02', 'Reserva de turno base', 'Seleccionar un turno "Libre" dentro de los límites permitidos.', 'El turno cambia a "Ocupado" y queda asignado al residente.', ''],
    ['Lavandería', 'LAV-03', 'Solicitud de turno extra', 'Intentar reservar un turno cuando ya se alcanzó el límite semanal.', 'El sistema permite solicitarlo como "EXTRA" o "SOLICITUD".', ''],
    ['Lavandería', 'LAV-04', 'Liberación de turno', 'Un residente cancela su propio turno.', 'El turno vuelve a estar "Libre" para otros residentes.', ''],
    ['Lavandería', 'LAV-05', 'Aprobación de turnos (Admin)', 'Un administrador aprueba una solicitud de turno extra.', 'El turno cambia de estado "Solicitado" a "Ocupado".', ''],
    ['Lavandería', 'LAV-06', 'Reset semanal', 'Verificar que los turnos se reinicien los domingos por la noche.', 'Los turnos se limpian y se proyectan los nuevos según turnos fijos.', ''],

    // Marketplace
    ['Marketplace', 'MKT-01', 'Publicar producto', 'Crear un anuncio con título, descripción, precio, fotos y contacto.', 'El producto aparece en la grilla (estado PENDIENTE).', ''],
    ['Marketplace', 'MKT-02', 'Moderación de Admin', 'Un administrador aprueba un producto nuevo.', 'El producto se vuelve visible para todos.', ''],
    ['Marketplace', 'MKT-03', 'Marcar como Vendido', 'El dueño del producto lo marca como "Vendido".', 'Cambia a "Vendido" y deja de mostrar contacto.', ''],
    ['Marketplace', 'MKT-04', 'Contacto WhatsApp', 'Hacer clic en el botón de WhatsApp (+51...).', 'Se abre chat directo al vendedor.', ''],

    // Pagos
    ['Pagos', 'RES-01', 'Alta de Residente', 'Crear un residente asignándole habitación y monto.', 'Aparece en la tabla y tiene acceso.', ''],
    ['Pagos', 'RES-02', 'Generación de Pago', 'Verificar generación automática de registro de pago.', 'El residente ve su deuda pendiente.', ''],
    ['Pagos', 'RES-03', 'Registro de Pago', 'El residente sube foto de comprobante.', 'Estado cambia a "EN REVISION".', ''],
    ['Pagos', 'RES-04', 'Validación de Pago', 'El admin aprueba el comprobante.', 'Estado cambia a "PAGADO".', ''],

    // Mantenimiento
    ['Mantenimiento', 'MAN-01', 'Crear Ticket', 'Reportar avería con fotos y descripción.', 'Se crea ticket PENDIENTE y notifica al admin.', ''],
    ['Mantenimiento', 'MAN-02', 'Gestión de Ticket', 'Admin cambia estado a EN PROCESO -> RESUELTO.', 'Residente recibe notificación y ve progreso.', ''],

    // Comedor
    ['Comedor', 'COM-01', 'Publicar Menú', 'Publicar el menú del día/semana.', 'Residentes pueden ver desayuno/almuerzo/cena.', ''],
    ['Comedor', 'COM-02', 'Confirmación Asistencia', 'Marcar si asistirá o no.', 'Cocinero ve lista consolidada.', ''],

    // Admin
    ['Admin', 'ADM-01', 'Configuración Global', 'Cambiar nombre de residencia o parámetros.', 'Reflejado en toda la app.', ''],
    ['Admin', 'ADM-02', 'Gestión de Roles', 'Cambiar rol de Residente a Cocinero.', 'Permisos cambian al recargar.', ''],
  ];

  data.forEach(row => sheet.addRow(row));

  // Styling
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  const outputPath = path.join(process.cwd(), 'public', 'pruebas_funcionales_belorama.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Archivo generado en: ${outputPath}`);
}

generateExcel().catch(console.error);
