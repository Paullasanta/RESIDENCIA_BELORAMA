const http = require('http');

const INTERVAL_MINUTES = 1440;
const URL = 'http://localhost:3000/api/debug/sync-lavanderia';

console.log('🚀 Iniciando Monitor de Prueba de Lavandería...');
console.log(`⏱️ Sincronización automática cada ${INTERVAL_MINUTES} minutos.`);
console.log(`🔗 URL de destino: ${URL}`);
console.log('--------------------------------------------------');

function runSync() {
    console.log(`[${new Date().toLocaleTimeString()}] 📡 Enviando señal de sincronización...`);

    http.get(URL, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.success) {
                    console.log(`[${new Date().toLocaleTimeString()}] ✅ Sincronización EXITOSA. Los turnos volvieron a su Horario Base.`);
                } else {
                    console.log(`[${new Date().toLocaleTimeString()}] ⚠️ Error en la respuesta:`, result.error);
                }
            } catch (e) {
                console.log(`[${new Date().toLocaleTimeString()}] ❌ Error al procesar respuesta.`);
            }
        });
    }).on('error', (err) => {
        console.log(`[${new Date().toLocaleTimeString()}] ❌ Error de conexión: ¿Está el servidor Next.js corriendo en el puerto 3000?`);
    });
}
