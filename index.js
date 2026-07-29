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

// Variable temporal para diagnóstico en pantalla
let ultimoRawDeMontosVE = "Aún no se ha consultado";

async function actualizarTasasDesdeMontosVE() {
    try {
        console.log("🔄 Consultando la API externa de MontosVE...");
        const apiKey = "tasasve_WfEcEhpgDzrvpJsbVHFAe86RhOV7G5rdPtQM6zhG3a9268f9";
        const response = await axios.get(`https://api.montosve.com/v1/rates?apikey=${apiKey}`);

        // Guardamos lo que respondió exactamente para que lo veas en la web
        ultimoRawDeMontosVE = response.data;
        console.log("📦 Respuesta de MontosVE:", JSON.stringify(response.data));

        if (response.data) {
            // Intentamos extraer los valores adaptándonos a cualquier formato posible
            const datos = response.data.data || response.data;
            
            ultimaTasaGuardada = {
                bcv: datos.bcv || datos.BCV || datos.tasa_bcv || 0,
                euro: datos.euro || datos.Euro || datos.tasa_euro || 0,
                usdt: datos.usdt || datos.USDT || datos.tasa_usdt || 0,
                ultimaActualizacion: new Date().toLocaleString()
            };
            console.log("✅ Tasas procesadas y guardadas correctamente.");
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

// NUEVA RUTA DE DIAGNÓSTICO: Entra aquí para forzar y ver exactamente qué respondió MontosVE en tu pantalla
app.get('/api/debug-montosve', async (req, res) => {
    await actualizarTasasDesdeMontosVE();
    res.json({
        success: true,
        respuestaCrudaDeMontosVE: ultimoRawDeMontosVE,
        tasasProcesadasEnServidor: ultimaTasaGuardada
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
