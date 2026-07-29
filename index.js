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
        console.log("🔄 Consultando la API de MontosVE...");
        const apiKey = "tasasve_WfEcEhpgDzrvpJsbVHFAe86RhOV7G5rdPtQM6zhG3a9268f9";
        const response = await axios.get(`https://api.montosve.com/v1/rates?apikey=${apiKey}`);

        if (response.data) {
            ultimaTasaGuardada = response.data;
            ultimaTasaGuardada.ultimaActualizacion = new Date().toLocaleString();
            console.log("✅ Tasas actualizadas con éxito en el servidor.");
        }
    } catch (error) {
        console.error("❌ Error al actualizar la tasa:", error.message);
    }
}

// Ejecutar al arrancar para tener datos de inmediato
actualizarTasasDesdeMontosVE();

// Tarea programada (Cron Job) en las horas clave para ahorrar peticiones
cron.schedule('0 9,13,18,20 * * *', () => {
    actualizarTasasDesdeMontosVE();
});

// Ruta raíz (Bienvenida)
app.get('/', (req, res) => {
    res.json({
        "mensaje": "API de Corporativo",
        "autor": "Jandrey"
    });
});

// NUEVA RUTA para entregar las tasas guardadas a tu App DOLAR-VES
app.get('/api/tasas-actuales', (req, res) => {
    res.json({
        success: true,
        data: ultimaTasaGuardada
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
