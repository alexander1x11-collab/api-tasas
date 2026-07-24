const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // Consultamos la API pública de alta precisión para Venezuela
        const response = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar');
        const data = await response.json();

        // Extraemos los valores de manera segura
        const monedas = data?.monedas || {};

        res.json({
            estado: "Sincronizado en tiempo real",
            bcv: monedas.bcv?.price || "Cargando...",
            euro: monedas.euro?.price || monedas.bcv?.price || "Cargando...",
            usdt: monedas.binance?.price || monedas.enparalelovzla?.price || "Cargando...",
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        // Si la principal falla, consultamos la ruta secundaria de respaldo automático
        try {
            const backupRes = await fetch('https://ve.dolarapi.com/v1/dolares');
            const backupData = await backupRes.json();
            
            const oficial = backupData.find(item => item.fuente === 'oficial') || {};
            const binance = backupData.find(item => item.fuente === 'binance' || item.fuente === 'enparalelovzla') || {};

            res.json({
                estado: "Modo Respaldo Activo",
                bcv: oficial.promedio || oficial.precio || "Actualizando",
                euro: oficial.euro || oficial.promedio || "Actualizando",
                usdt: binance.promedio || binance.precio || "Actualizando",
                actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
            });
        } catch (err) {
            res.status(500).json({ 
                error: "Error al conectar con las fuentes", 
                detalles: err.message 
            });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Servidor automático activo en puerto ${PORT}`);
});
