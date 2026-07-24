const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // Aquí puedes integrar las consultas a APIs públicas o páginas de cotización en tiempo real
        // Por ahora, estructuramos la respuesta JSON lista para que tu app la lea perfectamente:
        res.json({
            fuente: "API Tasas Venezuela en Vivo",
            estado: "Conectado y Operativo",
            bcv: "742.23", // Tasa oficial referencial actual
            euro: "844.22", // Tasa euro referencial actual
            usdt: "872.05", // Tasa USDT / Binance referencial actual
            actualizado: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: "No se pudieron obtener las tasas en este momento" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de tasas corriendo en el puerto ${PORT}`);
});
