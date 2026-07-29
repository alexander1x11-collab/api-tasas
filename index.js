const cron = require('node-cron');
const express = require('express');
const axios = require('axios');
const app = express();

let ultimaTasaGuardada = {
    bcv: 0,
    euro: 0,
    usdt: 0,
    ultimaActualizacion: "Esperando primera sincronización..."
};

let ultimoRawDeMontosVE = "Aún no se ha consultado";

async function actualizarTasasDesdeMontosVE() {
    try {
        console.log("🔄 Consultando la nueva API de MontosVE...");
        
        // Configuración correcta exigida por MontosVE (Header X-API-Key y endpoint /v1/fx/rates)
        const response = await axios.get('https://api.montosve.com/v1/fx/rates', {
            headers: {
                'X-API-Key': 'tasasve_WfEcEhpgDzrvpJsbVHFAe86RhOV7G5rdPtQM6zhG3a9268f9'
            }
        });

        ultimoRawDeMontosVE = response.data;
        console.log("📦 Respuesta de MontosVE:", JSON.stringify(response.data));

        if (response.data) {
            // Adaptado para leer la estructura de la nueva respuesta
            const dataRates = response.data.data || response.data;

            ultimaTasaGuardada = {
                bcv: dataRates.bcv || dataRates.USD?.bcv || 0,
                euro: dataRates.euro || dataRates.EUR?.bcv || 0,
                usdt: dataRates.usdt || dataRates.USDT?.p2p || 0,
                ultimaActualizacion: new Date().toLocaleString()
            };
            console.log("✅ Tasas actualizadas con éxito.");
        }
    } catch (error) {
        console.error("❌ Error al conectar con MontosVE:", error.response ? error.response.data : error.message);
    }
}

// Ejecutar al arrancar
actualizarTasasDesdeMontosVE();

// Tarea programada en las horas clave
cron.schedule('0 9,13,18,20 * * *', () => {
    actualizarTasasDesdeMontosVE();
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        "mensaje": "API de Corporativo",
        "autor": "Jandrey"
    });
});

// Ruta principal para tu app
app.get('/api/tasas-actuales', (req, res) => {
    res.json({
        success: true,
        data: ultimaTasaGuardada
    });
});

// Ruta para forzar la actualización manual y verificar
app.get('/api/actualizar-ahora', async (req, res) => {
    await actualizarTasasDesdeMontosVE();
    res.json({ 
        success: true, 
        mensaje: "Sincronización forzada ejecutada", 
        raw: ultimoRawDeMontosVE,
        data: ultimaTasaGuardada 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
