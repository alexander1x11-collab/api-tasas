const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // Consultamos una fuente pública o API externa en tiempo real
        const response = await fetch('https://ve.dolarapi.com/v1/dolares');
        const data = await response.json();

        // Filtramos o estructuramos los valores que necesitas (BCV, Paralelo, USDT, etc.)
        const bcvData = data.find(item => item.fuente === 'oficial') || {};
        const usdtData = data.find(item => item.fuente === 'binance' || item.fuente === 'enparalelovzla') || {};

        res.json({
            estado: "Actualizado automáticamente",
            bcv: bcvData.promedio || "No disponible",
            euro: "Consultar fuente", // Puedes añadir más lógica si deseas el euro exacto
            usdt: usdtData.promedio || "No disponible",
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Error al obtener las tasas en tiempo real", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor automático corriendo en el puerto ${PORT}`);
});
