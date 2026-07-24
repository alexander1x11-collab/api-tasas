const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // Consultamos las fuentes de DolarAPI
        const responseDolar = await fetch('https://ve.dolarapi.com/v1/dolares');
        const dataDolar = await responseDolar.json();

        // Extraemos BCV oficial y el Euro oficial (DolarAPI suele traer el euro en la misma ruta o en otra dependiente)
        const bcvData = dataDolar.find(item => item.fuente === 'oficial') || {};
        const euroData = dataDolar.find(item => item.fuente === 'bcv' && item.nombre === 'Euro') || bcvData;

        // Buscamos específicamente la fuente de cripto/binance o en paralelo si prefieres el tope máximo
        const usdtData = dataDolar.find(item => item.fuente === 'binance' || item.fuente === 'enparalelovzla') || {};

        res.json({
            estado: "Sincronizado en tiempo real",
            bcv: bcvData.promedio || bcvData.precio || "No disponible",
            euro: euroData.euro || bcvData.promedio || "No disponible", // Ajustado para reflejar el valor real
            usdt: usdtData.promedio || usdtData.precio || "No disponible",
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
