const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        const timestamp = new Date().getTime();

        // 1. Consultamos la API principal de PyDolarVenezuela que contiene los datos oficiales separados del BCV
        const bcvPromise = fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar?_t=${timestamp}`, {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }).then(r => r.json()).catch(() => null);

        // 2. Binance P2P para USDT con cabeceras de navegador reales
        const binancePromise = fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://p2p.binance.com',
                'Referer': 'https://p2p.binance.com/'
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
        }).then(r => r.json()).catch(() => null);

        const [bcvData, binanceData] = await Promise.all([bcvPromise, binancePromise]);

        // Extracción limpia y directa de los valores oficiales de la API
        let bcvVal = 737.88;
        let euroVal = 776.25;

        if (bcvData) {
            // Intentamos extraer el dólar oficial
            const dolarOficial = bcvData?.monedas?.bcv?.price || bcvData?.bcv?.price;
            if (dolarOficial) bcvVal = parseFloat(dolarOficial);

            // Intentamos extraer el euro oficial de forma independiente
            const euroOficial = bcvData?.monedas?.euro?.price || bcvData?.euro?.price;
            if (euroOficial) euroVal = parseFloat(euroOficial);
        }

        // Cálculo exacto del USDT en Binance P2P
        let usdtReal = "864.33";
        if (binanceData && binanceData.data && binanceData.data.length > 0) {
            const prices = binanceData.data.slice(0, 3).map(item => parseFloat(item.adv.price));
            const suma = prices.reduce((a, b) => a + b, 0);
            usdtReal = (suma / prices.length).toFixed(2);
        }

        res.json({
            estado: "Tasas Oficiales Separadas y Sincronizadas",
            bcv: Number(bcvVal),
            euro: Number(euroVal),
            usdt: usdtReal,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        res.status(500).json({ 
            error: "Error en el servidor", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
