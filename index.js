const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // Consultamos la API pública de cotizaciones de Venezuela en tiempo real
        const response = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar');
        const data = await response.json();

        res.json({
            estado: "Sincronizado con fuentes oficiales y P2P",
            bcv: data.monedas?.bcv?.price || "Actualizando...",
            en_paralelo: data.monedas?.enparalelovzla?.price || "Actualizando...",
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });
    } catch (error) {
        // Plan de respaldo si falla la principal
        try {
            const backupRes = await fetch('https://ve.dolarapi.com/v1/dolares');
            const backupData = await backupRes.json();
            const bcvOficial = backupData.find(item => item.fuente === 'oficial') || {};
            const paralelo = backupData.find(item => item.fuente === 'enparalelovzla') || {};

            res.json({
                estado: "Modo Respaldo Activo",
                bcv: bcvOficial.promedio || "N/A",
                en_paralelo: paralelo.promedio || "N/A",
                actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
            });
        } catch (err) {
            res.status(500).json({ error: "No se pudieron conectar las fuentes de tasas" });
        }
    }
});

app.listen(PORT, () => {
    console.log(`API de tasas con respaldo corriendo en puerto ${PORT}`);
});
