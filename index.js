const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        const timestamp = new Date().getTime();

        // 1. Fuente oficial primaria (DolarAPI Venezuela Oficial)
        const p1 = fetch(`https://ve.dolarapi.com/v1/dolares/oficial`, {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }).then(r => r.json()).catch(() => null);

        // 2. Fuente de respaldo secundaria (PyDolarVenezuela)
        const p2 = fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar?_t=${timestamp}`, {
            headers: { 'Cache-Control': 'no-cache' }
        }).then(r => r.json()).catch(() => null);

        // 3. Binance P2P para USDT con parámetros estables
        const binancePromise = fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
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

        const [data1, data2, binanceData] = await Promise.all([p1, p2, binancePromise]);

        let bcvVal = 0;
        let euroVal = 0;

        // Intentar obtener de DolarAPI oficial
        if (data1) {
            bcvVal = data1.promedio || data1.precio || 0;
            euroVal = data1.euro || bcvVal;
        }

        // Si no hay datos, usar PyDolarVenezuela
        if (!bcvVal && data2) {
            bcvVal = data2?.monedas?.bcv?.price || data2?.bcv?.price || 0;
            euroVal = data2?.monedas?.euro?.price || data2?.euro?.price || bcvVal;
        }

        // Valor de seguridad por defecto si todo falla
        if (!bcvVal) bcvVal = 737.88;
        if (!euroVal) euroVal = bcvVal;

        // Cálculo seguro de Binance P2P
        let usdtReal = "No disponible";
        if (binanceData && binanceData.data && binanceData.data.length > 0) {
            const prices = binanceData.data.slice(0, 3).map(item => parseFloat(item.adv.price));
            const suma = prices.reduce((a, b) => a + b, 0);
            usdtReal = (suma / prices.length).toFixed(2);
        }

        res.json({
            estado: "API Multifuente Sincronizada",
            bcv: Number(bcvVal),
            euro: Number(euroVal),
            usdt: usdtReal,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        res.status(500).json({ 
            error: "Error interno en el servidor", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
