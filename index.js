const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // Consultamos una API directa de cotizaciones actualizadas para Venezuela
        const response = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv');
        const data = await response.json();

        // Intentamos obtener también la data general de monitores y paralelo/binance
        const responseGeneral = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar');
        const dataGeneral = await responseGeneral.json();

        const bcvPrice = data?.monedas?.bcv?.price || dataGeneral?.monedas?.bcv?.price || "No disponible";
        const euroPrice = data?.monedas?.euro?.price || dataGeneral?.monedas?.euro?.price || "No disponible";
        const usdtPrice = data?.monedas?.binance?.price || dataGeneral?.monedas?.enparalelovzla?.price || "No disponible";

        res.json({
            estado: "Sincronizado con fuentes directas",
            bcv: bcvPrice,
            euro: euroPrice,
            usdt: usdtPrice,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });
    } catch (error) {
        // Respaldo secundario por si la API directa llega a presentar intermitencia
        try {
            const backupRes = await fetch('https://ve.dolarapi.com/v1/dolares');
            const backupData = await backupRes.json();
            const oficial = backupData.find(item => item.fuente === 'oficial') || {};
            const paralelo = backupData.find(item => item.fuente === 'enparalelovzla') || {};

            res.json({
                estado: "Modo Respaldo Activo",
                bcv: oficial.promedio || oficial.precio || "N/A",
                euro: oficial.euro || "N/A",
                usdt: paralelo.promedio || paralelo.precio || "N/A",
                actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
            });
        } catch (err) {
            res.status(500).json({ error: "No se pudieron conectar las fuentes de tasas", detalle: error.message });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de tasas preciso corriendo en el puerto ${PORT}`);
});
