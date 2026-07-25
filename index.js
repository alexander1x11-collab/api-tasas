const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        const timestamp = new Date().getTime();

        // 1. Petición directa a PyDolarVenezuela v1 con parámetros limpios
        const response = await fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar?_t=${timestamp}`, {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        const data = await response.json();

        // 2. Binance P2P para el USDT
        const binanceRes = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
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
                tradeType: "BUY",
                transAmount: ""
            })
        });
        const binanceData = await binanceRes.json();

        // Extracción directa de los campos exactos del JSON de PyDolarVenezuela
        let bcvVal = data?.monedas?.bcv?.price || 0;
        let euroVal = data?.monedas?.euro?.price || 0;

        // Si por alguna razón la estructura cambia, buscamos alternativas en el mismo JSON
        if (!bcvVal && data?.bcv) {
            bcvVal = data.bcv.price || data.bcv;
        }
        if (!euroVal && data?.euro) {
            euroVal = data.euro.price || data.euro;
        }

        // Cálculo exacto del USDT en Binance P2P
        let usdtReal = "No disponible";
        if (binanceData && binanceData.data && binanceData.data.length > 0) {
            const prices = binanceData.data.slice(0, 3).map(item => parseFloat(item.adv.price));
            const suma = prices.reduce((a, b) => a + b, 0);
            usdtReal = (suma / prices.length).toFixed(2);
        }

        res.json({
            estado: "API Oficial Sincronizada",
            bcv: Number(bcvVal),
            euro: Number(euroVal),
            usdt: usdtReal,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        res.status(500).json({ 
            error: "Error al procesar las tasas", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
