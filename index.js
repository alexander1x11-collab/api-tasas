const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        console.log("Intentando conectar con la API externa...");
        const response = await fetch('https://ve.dolarapi.com/v1/dolares');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Datos recibidos de la API:", JSON.stringify(data));

        const oficial = data.find(item => item.fuente === 'oficial') || {};
        const binance = data.find(item => item.fuente === 'binance') || {};

        res.json({
            debug: "Código nuevo cargado correctamente",
            bcv: oficial.promedio || oficial.precio || "No encontrado",
            euro: oficial.euro || "No encontrado",
            usdt: binance.promedio || binance.precio || "No encontrado",
            crudo: data
        });
    } catch (error) {
        console.error("Error en el servidor:", error.message);
        res.status(500).json({ 
            error: "Fallo la conexión", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de depuración corriendo en el puerto ${PORT}`);
});
