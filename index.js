const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // 1. Consultamos directamente la API oficial de Binance P2P para USDT/VES
        const binanceResponse = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            body: JSON.stringify({
                asset: "USDT",
                fiat: "VES",
                merchantCheck: false,
                page: 1,
                payTypes: [],
                publisherType: null,
                tradeType: "BUY", // Órdenes donde la gente compra USDT (precio real de mercado)
                transAmount: ""
            })
        });

        const binanceData = await binanceResponse.json();
        
        // Calculamos el promedio de las primeras 3 ofertas reales de Binance P2P
        let usdtReal = "No disponible";
        if (binanceData && binanceData.data && binanceData.data.length > 0) {
            const prices = binanceData.data.slice(0, 3).map(item => parseFloat(item.adv.price));
            const suma = prices.reduce((a, b) => a + b, 0);
            usdtReal = (suma / prices.length).toFixed(2); // Promedio exacto al centavo
        }

        // 2. Consultamos el BCV y Euro desde una fuente de alta velocidad con timestamp anti-cache
        const timestamp = new Date().getTime();
        const bcvResponse = await fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar?_t=${timestamp}`, {
            headers: { 'Cache-Control': 'no-cache' }
        });
        const bcvData = await bcvResponse.json();
        
        const bcvVal = bcvData?.monedas?.bcv?.price || "No disponible";
        const euroVal = bcvData?.monedas?.euro?.price || bcvVal;

        res.json({
            estado: "Conectado a Binance P2P Oficial",
            bcv: bcvVal,
            euro: euroVal,
            usdt: usdtReal,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        // Respaldo de emergencia por si la red de Binance parpadea
        try {
            const backupRes = await fetch('https://ve.dolarapi.com/v1/dolares');
            const backupData = await backupRes.json();
            const oficial = backupData.find(item => item.fuente === 'oficial') || {};
            const paralelo = backupData.find(item => item.fuente === 'enparalelovzla' || item.fuente === 'binance') || {};

            res.json({
                estado: "Modo Respaldo Activo",
                bcv: oficial.promedio || oficial.precio || "N/A",
                euro: oficial.euro || "N/A",
                usdt: paralelo.promedio || paralelo.precio || "N/A",
                actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
            });
        } catch (err) {
            res.status(500).json({ error: "Error al procesar las tasas", detalles: err.message });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de tasas P2P activo en puerto ${PORT}`);
});
