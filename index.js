const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // Usamos una ruta directa y limpia optimizada para servidores externos
        const response = await fetch('https://ve.dolarapi.com/v1/dolares');
        
        if (!response.ok) {
            throw new Error(`Error en la respuesta: ${response.status}`);
        }

        const data = await response.json();

        // Extraemos limpiamente los valores reales
        const bcv = data.find(item => item.fuente === 'oficial') || {};
        const binance = data.find(item => item.fuente === 'binance' || item.fuente === 'enparalelovzla') || {};

        res.json({
            status: "success",
            bcv: bcv.promedio || bcv.precio || 0,
            euro: bcv.euro || bcv.promedio || 0,
            usdt: binance.promedio || binance.precio || 0,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        res.status(500).json({ 
            status: "error",
            mensaje: "No se pudieron obtener las tasas", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
