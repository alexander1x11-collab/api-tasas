const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // Consultamos la API pública directa que mantiene la data sincronizada al día
        const response = await fetch('https://ve.dolarapi.com/v1/dolares');
        const data = await response.json();

        // Buscamos con precisión quirúrgica los campos oficiales
        const oficial = data.find(item => item.fuente === 'oficial' || item.fuente === 'bcv') || {};
        const binance = data.find(item => item.fuente === 'binance' || item.fuente === 'enparalelovzla') || {};

        res.json({
            estado: "Sincronizado en tiempo real",
            bcv: oficial.promedio || oficial.precio || "No disponible",
            euro: oficial.euro || oficial.promedio || "No disponible",
            usdt: binance.promedio || binance.precio || "No disponible",
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });
    } catch (error) {
        res.status(500).json({ 
            error: "No se pudieron obtener las tasas", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
});
