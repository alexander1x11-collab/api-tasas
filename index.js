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

async function actualizarTasasDesdeMontosVE() {
    try {
        console.log("🔄 Consultando la API externa de MontosVE...");
        const apiKey = "tasasve_WfEcEhpgDzrvpJsbVHFAe86RhOV7G5rdPtQM6zhG3a9268f9";
        const response = await axios.get(`https://api.montosve.com/v1/rates?apikey=${apiKey}`);

        if (response.data) {
            ultimaTasaGuardada = response.data;
            ultimaTasaGuardada.ultimaActualizacion = new Date().toLocaleString();
            console.log("✅ Tasas guardadas en el servidor con éxito.");
        }
    } catch (error) {
        console.error("❌ Error al actualizar la tasa externa:", error.message);
    }
}

// 1. Ejecutar una consulta al arrancar el servidor
actualizarTasasDesdeMontosVE();

// 2. Configurar la Tarea Programada (Cron Job) en las horas clave para ahorrar peticiones
cron.schedule('0 9,13,18,20 * * *', () => {
    actualizarTasasDesdeMontosVE();
});

// Ruta raíz (Tu bienvenida original)
app.get('/', (req, res) => {
    res.json({
        "mensaje": "API de Corporativo",
        "autor": "Jandrey"
    });
});

// Ruta para entregar las tasas guardadas a tu App DOLAR-VES (sin gastar peticiones)
app.get('/api/tasas-actuales', (req, res) => {
    res.json({
        success: true,
        data: ultimaTasaGuardada
    });
});

// Ruta manual por si quieres forzar la actualización de las tasas al instante desde el navegador
app.get('/api/actualizar-ahora', async (req, res) => {
    await actualizarTasasDesdeMontosVE();
    res.json({ 
        success: true, 
        mensaje: "Sincronización forzada ejecutada correctamente", 
        data: ultimaTasaGuardada 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
