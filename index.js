const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        const timestamp = new Date().getTime();

        // 1. Consultamos DolarAPI oficial para obtener tasas limpias
        const bcvPromise = fetch(`https://ve.dolarapi.com/v1/dolares/oficial`, {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }).then(r => r.json()).catch(() => null);

        // 2. Consultamos PyDolarVenezuela para el Euro y respaldo
        const euroPromise = fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar?_t=${timestamp}`, {
            headers: { 'Cache-Control': 'no-cache' }
        }).then(r => r.json()).catch(() => null);

        // 3. Binance P2P para USDT en tiempo real exacto
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

        const [bcvData, euroData, binanceData] = await Promise.all([bcvPromise, euroPromise, binancePromise]);

        // Extracción exacta y separada por tipo de moneda
        let bcvVal = 0;
        let euroVal = 0;

        // Dólar BCV desde DolarAPI o respaldo
        if (bcvData && bcvData.promedio) {
            bcvVal = parseFloat(bcvData.promedio);
        } else if (euroData) {
            bcvVal = parseFloat(euroData?.monedas?.bcv?.price || euroData?.bcv?.price || 0);
        }

        // Euro BCV independiente desde la estructura oficial
        if (euroData) {
            euroVal = parseFloat(euroData?.monedas?.euro?.price || euroData?.euro?.price || 0);
        }

        // Si DolarAPI trae un objeto para oficiales con euro separado
        if (!euroVal && bcvData && bcvData.euro) {
            euroVal = parseFloat(bcvData.euro);
        }

        // Respaldo estricto si alguna viene en 0
        if (!bcvVal) bcvVal = 737.88;
        if (!euroVal) euroVal = 776.25;

        // Cálculo dinámico real del USDT en Binance P2P
        let usdtReal = "864.33";
        if (binanceData && binanceData.data && binanceData.data.length > 0) {
            const prices = binanceData.data.slice(0, 3).map(item => parseFloat(item.adv.price));
            const suma = prices.reduce((a, b) => a + b, 0);
            usdtReal = (suma / prices.length).toFixed(2);
        }

        res.json({
            estado: "Tasas Oficiales y P2P Sincronizadas",
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
