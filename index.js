const express = require('express');
const axios = require('axios'); // O fetch si usas Node nativo
const app = express();

// Middleware para evitar caché en las respuestas (vital para Render)
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Endpoint único en index.js
app.get('/api/tasa', async (req, res) => {
    try {
        // Obtener la fecha actual exactamente en la zona horaria de Venezuela
        const fechaVenezuela = new Date().toLocaleString('en-US', {
            timeZone: 'America/Caracas',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }); // Formato MM/DD/YYYY, lo puedes ajustar según necesites

        // Aquí haces tu petición a la API externa de tasas
        const respuesta = await axios.get('TU_URL_DE_FUENTE_DE_TASAS'); 
        
        const datosTasa = {
            tasa: respuesta.data, // Reemplaza según la estructura que devuelva tu fuente
            fechaConsulta: fechaVenezuela,
            actualizado: new Date().toLocaleTimeString('en-US', { timeZone: 'America/Caracas' })
        };

        return res.json(datosTasa);

    } catch (error) {
        console.error("Error al actualizar la tasa:", error.message);
        return res.status(500).json({ error: "No se pudo obtener la tasa actual" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
