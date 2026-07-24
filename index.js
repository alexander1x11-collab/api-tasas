const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // Consultamos la API principal de DolarAPI Venezuela
        const response = await fetch('https://ve.dolarapi.com/v1/dolares');
        const data = await response.json();

        const oficial = data.find(item => item.fuente === 'oficial') || {};
        const paralelo = data.find(item => item.fuente === 'enparalelovzla') || {};
        const usdtBinance = data.find(item => item.fuente === 'binance') || paralelo;

        res.json({
            estado: "En línea y sincronizado",
            bcv: oficial.promedio || oficial.precio || "No disponible",
            euro: oficial.euro || "Consultar oficial", // O fuente equivalente
            usdt: usdtBinance.promedio || usdtBinance.precio || "No disponible",
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Error temporal conectando con los servidores de tasas",
            detalle: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT}`);
});
