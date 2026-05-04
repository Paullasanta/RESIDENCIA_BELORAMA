const http = require('http');

/**
 * MONITOR SEMANAL DE LAVANDERÍA - BELORAMA
 * Este script actúa como un "vigilante". Revisa cada hora si ya es momento
 * de limpiar los turnos (Domingos 23:59:59).
 */

const INTERVAL_MINUTES = 60; // Revisar cada hora para no perder el hilo
const URL = 'http://localhost:3000/api/debug/sync-lavanderia';

console.log('🚀 Monitor de Lavandería Belorama Activado...');
console.log(`⏱️ Verificando estado del calendario cada hora.`);
console.log('--------------------------------------------------');

function checkAndSync() {
    const now = new Date();
    const day = now.getDay(); // 0 = Domingo, 1 = Lunes
    const hour = now.getHours();
    const min = now.getMinutes();

    const daysLabel = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    console.log(`[${now.toLocaleTimeString()}] 📅 Hoy es ${daysLabel[day]}.`);

    // Lógica: Solo disparamos si es Domingo después de las 23:00
    // O si es Lunes muy temprano (por si el servidor estuvo apagado)
    const isResetTime = (day === 0 && hour === 23) || (day === 1 && hour === 0);

    if (isResetTime) {
        console.log('🔔 ¡MOMENTO DE RESET DETECTADO! Enviando señal a la API...');
        
        http.get(URL, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.success) {
                        console.log('✅ ÉXITO: El calendario semanal ha sido reiniciado correctamente.');
                    } else {
                        console.log('⚠️ AVISO:', result.message);
                    }
                } catch (e) {
                    console.log('❌ Error al procesar la respuesta del servidor.');
                }
            });
        }).on('error', (err) => {
            console.log('❌ Error de conexión: Asegúrate de que npm run dev esté activo.');
        });
    } else {
        // Cálculo amigable de días faltantes
        const daysToSunday = day === 0 ? 0 : 7 - day;
        console.log(`⏳ Esperando al Domingo noche... Faltan aprox. ${daysToSunday} día(s).`);
    }
}

// Ejecutar ahora y luego cada hora
checkAndSync();
setInterval(checkAndSync, INTERVAL_MINUTES * 60 * 1000);
