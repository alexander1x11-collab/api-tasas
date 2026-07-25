const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        const timestamp = new Date().getTime();

        // 1. Fuente principal (PyDolarVenezuela)
        const primaryPromise = fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar?_t=${timestamp}`, {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }).then(r => r.json()).catch(() => null);

        // 2. Fuente de respaldo alternativa por si la principal se congela
        const backupPromise = fetch(`https://ve.dolarapi.com/v1/dolares/oficial`, {
            headers: { 'Cache-Control': 'no-cache' }
        }).then(r => r.json()).catch(() => null);

        // 3. Binance P2P para USDT
        const binancePromise = fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
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
        }).then(r => r.json()).catch(() => null);

        const [primaryData, backupData, binanceData] = await Promise.all([primaryPromise, backupPromise, binancePromise]);

        let bcvVal = 0;
        let euroVal = 0;

        // Intentar extraer de la principal, si falla usar el respaldo oficial (dolarapi)
        if (primaryData) {
            bcvVal = primaryData?.monedas?.bcv?.price || primaryData?.bcv?.price || 0;
            euroVal = primaryData?.monedas?.euro?.price || primaryData?.euro?.price || bcvVal;
        }

        if ((!bcvVal || bcvVal === 738) && backupData) {
            bcvVal = backupData.promedio || backupData.precio || bcvVal;
        }

        // Si aun así sigue sin actualizarse, toma el valor de respaldo seguro
        if (!bcvVal) bcvVal = 738.88;
        if (!euroVal) euroVal = bcvVal;

        let usdtReal = "No disponible";
        if (binanceData && binanceData.data && binanceData.data.length > 0) {
            const prices = binanceData.data.slice(0, 3).map(item => parseFloat(item.adv.price));
            const suma = prices.reduce((a, b) => a + b, 0);
            usdtReal = (suma / prices.length).toFixed(2);
        }

        res.json({
            estado: "Multi-Respaldo Activo",
            bcv: Number(bcvVal),
            euro: Number(euroVal),
            usdt: usdtReal,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        res.status(500).json({ 
            error: "Error al consultar los servidores", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
