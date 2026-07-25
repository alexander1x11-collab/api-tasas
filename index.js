const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        const timestamp = new Date().getTime();

        // 1. Petición a DolarAPI (más estable)
        let bcvVal = 0;
        let euroVal = 0;

        try {
            const bcvRes = await fetch(`https://ve.dolarapi.com/v1/dolares/oficial`, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            const bcvJson = await bcvRes.json();
            if (bcvJson && (bcvJson.promedio || bcvJson.precio)) {
                bcvVal = parseFloat(bcvJson.promedio || bcvJson.precio);
            }
        } catch (e) {
            console.log("Fallo DolarAPI oficial, usando respaldo...");
        }

        // 2. Si la anterior falló, intentamos con PyDolarVenezuela de forma segura
        if (!bcvVal) {
            try {
                const response = await fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar?_t=${timestamp}`, {
                    headers: { 'Cache-Control': 'no-cache' }
                });
                const textData = await response.text();
                // Verificamos que sea un JSON válido antes de parsearlo
                if (textData.startsWith('{')) {
                    const data = JSON.parse(textData);
                    bcvVal = parseFloat(data?.monedas?.bcv?.price || data?.bcv?.price || 737.88);
                    euroVal = parseFloat(data?.monedas?.euro?.price || data?.euro?.price || 776.25);
                }
            } catch (e) {
                console.log("Fallo PyDolarVenezuela también.");
            }
        }

        // Valores de respaldo definitivos si ambas APIs fallan o están caídas
        if (!bcvVal) bcvVal = 737.88;
        if (!euroVal) euroVal = 776.25;

        // 3. Binance P2P para el USDT
        let usdtReal = "864.33";
        try {
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
            const binanceText = await binanceRes.text();
            if (binanceText.startsWith('{')) {
                const binanceData = JSON.parse(binanceText);
                if (binanceData && binanceData.data && binanceData.data.length > 0) {
                    const prices = binanceData.data.slice(0, 3).map(item => parseFloat(item.adv.price));
                    const suma = prices.reduce((a, b) => a + b, 0);
                    usdtReal = (suma / prices.length).toFixed(2);
                }
            }
        } catch (e) {
            console.log("Fallo Binance P2P temporalmente.");
        }

        res.json({
            estado: "API Blindada contra Errores",
            bcv: Number(bcvVal),
            euro: Number(euroVal),
            usdt: usdtReal,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        res.status(500).json({ 
            error: "Error crítico en el servidor", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor blindado activo en puerto ${PORT}`);
});
