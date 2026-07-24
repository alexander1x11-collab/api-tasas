const express = fetApp = require('express');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // Consultamos la API más rápida y precisa para Venezuela en tiempo real
        const response = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar');
        const data = await response.json();

        // Extraemos los valores exactos de cada moneda de sus campos nativos
        const bcvOficial = data?.monedas?.bcv?.price || "Actualizando...";
        const euroOficial = data?.monedas?.euro?.price || "Actualizando...";
        const usdtBinance = data?.monedas?.binance?.price || data?.monedas?.enparalelovzla?.price || "Actualizando...";

        res.json({
            estado: "Sincronizado 100% automático",
            bcv: bcvOficial,
            euro: euroOficial,
            usdt: usdtBinance,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        // Plan de respaldo automático inmediato si la principal parpadea
        try {
            const backupRes = await fetch('https://ve.dolarapi.com/v1/dolares');
            const backupData = await backupRes.json();
            
            const bcvB = backupData.find(item => item.fuente === 'oficial') || {};
            const paraleloB = backupData.find(item => item.fuente === 'enparalelovzla' || item.fuente === 'binance') || {};

            res.json({
                estado: "Modo Automático con Respaldo",
                bcv: bcvB.promedio || bcvB.precio || "N/A",
                euro: bcvB.euro || "N/A",
                usdt: paraleloB.promedio || paraleloB.precio || "N/A",
                actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
            });
        } catch (err) {
            res.status(500).json({ 
                error: "Error crítico al sincronizar las tasas automáticamente", 
                detalles: err.message 
            });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Servidor automático en tiempo real corriendo en el puerto ${PORT}`);
});
