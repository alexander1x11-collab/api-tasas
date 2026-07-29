const express = require('express');
const axios = require('axios');
const app = express();

// Middleware para evitar caché en las respuestas
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Endpoint único en index.js
app.get('/api/tasa', async (req, res) => {
    try {
        // Fecha actual en la zona horaria de Venezuela
        const fechaVenezuela = new Date().toLocaleDateString('es-VE', {
            timeZone: 'America/Caracas',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        // Petición a la fuente oficial/abierta de tasas (PyDolarVenezuela / DolarApi)
        const respuesta = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial');
        
        const datosTasa = {
            fuente: "BCV",
            precio: respuesta.data.promedio,
            moneda: respuesta.data.nombre,
            fechaConsulta: fechaVenezuela,
            actualizado: new Date().toLocaleTimeString('es-VE', { timeZone: 'America/Caracas' })
        };

        return res.json(datosTasa);

    } catch (error) {
        console.error("Error al actualizar la tasa:", error.message);
        return res.status(500).json({ error: "No se pudo obtener la tasa actual", detalle: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
