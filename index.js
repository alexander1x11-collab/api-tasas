const cron = require('node-cron');
const express = require('express');
const axios = require('axios');
const app = express();

// Variable en memoria del servidor que guarda la última tasa obtenida
let ultimaTasaGuardada = {
    bcv: 0,
    euro: 0,
    usdt: 0,
    ultimaActualizacion: "Esperando primera sincronización..."
};

// Función que consulta a MontosVE (solo se ejecuta en las horas clave)
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

// 1. Ejecutar una consulta al arrancar el servidor para no tener datos en cero
actualizarTasasDesdeMontosVE();

// 2. Configurar la Tarea Programada (Cron Job) en las horas clave (Apertura, mediodía y cierres)
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

// Ruta de consulta para tu App DOLAR-VES (lee directo de la memoria del servidor sin gastar peticiones)
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
