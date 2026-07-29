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
        
        // Tu clave API exacta
        const apiKey = "tasasve_WfEcEhpgDzrvpJsbVHFAe86RhOV7G5rdPtQM6zhG3a9268f9";

        // Realizamos la petición a la API de MontosVE pasando tu apikey
        const response = await axios.get(`https://api.montosve.com/v1/rates?apikey=${apiKey}`);

        // Guardamos los datos que devuelve su respuesta
        if (response.data) {
            ultimaTasaGuardada = response.data;
            ultimaTasaGuardada.ultimaActualizacion = new Date().toLocaleString();
            console.log("✅ Tasas actualizadas con éxito en el servidor.");
        }
    } catch (error) {
        console.error("❌ Error al actualizar la tasa:", error.message);
    }
}

// Ejecutar una vez al arrancar el servidor para no tener los datos en 0
actualizarTasasDesdeMontosVE();

// Tarea programada en las horas clave (Apertura, mediodía y cierres del BCV)
cron.schedule('0 9,13,18,20 * * *', () => {
    actualizarTasasDesdeMontosVE();
});

// Endpoint limpio que consultará tu App DOLAR-VES de forma ilimitada
app.get('/api/tasas-actuales', (req, res) => {
    res.json({
        success: true,
        data: ultimaTasaGuardada
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de DOLAR-VES corriendo en el puerto ${PORT}`);
});
