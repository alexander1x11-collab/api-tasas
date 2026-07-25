const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        const timestamp = new Date().getTime();

        // 1. Fuente Principal 1 (PyDolarVenezuela)
        const p1 = fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar?_t=${timestamp}`, {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }).then(r => r.json()).catch(() => null);

        // 2. Fuente de Respaldo Automática 2 (DolarAPI Venezuela Oficial)
        const p2 = fetch(`https://ve.dolarapi.com/v1/dolares/oficial`, {
            headers: { 'Cache-Control': 'no-cache' }
        }).then(r => r.json()).catch(() => null);

        // 3. Fuente de Respaldo Automática 3 (Monitoreo general de divisas)
        const p3 = fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar/bcv`, {
            headers: { 'Cache-Control': 'no-cache' }
        }).then(r => r.json()).catch(() => null);

        // 4. Binance P2P para USDT en tiempo real
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

        const [res1, res2, res3, binanceData] = await Promise.all([p1, p2, p3, binancePromise]);

        let bcvVal = 0;
        let euroVal = 0;

        // Comprobación automática en cascada entre las fuentes disponibles
        if (res1) {
            bcvVal = res1?.monedas?.bcv?.price || res1?.bcv?.price || 0;
            euroVal = res1?.monedas?.euro?.price || res1?.euro?.price || 0;
        }

        // Si la fuente 1 no dio el dólar o euro, intenta con la fuente 2 (DolarAPI)
        if (!bcvVal && res2) {
            bcvVal = res2.promedio || res2.precio || 0;
        }
        if (!euroVal && res2) {
            // Si DolarAPI tiene el euro separado, lo busca, si no, usa el del dólar
            euroVal = res2.euro || bcvVal;
        }

        // Si la fuente 1 y 2 fallaron, intenta con la fuente 3
        if (!bcvVal && res3) {
            bcvVal = res3?.price || res3?.monedas?.bcv?.price || 737.88;
        }

        // Valores finales por defecto si ninguna responde
        if (!bcvVal) bcvVal = 737.88;
        if (!euroVal) euroVal = bcvVal;

        // Cálculo automático del USDT en Binance P2P
        let usdtReal = "No disponible";
        if (binanceData && binanceData.data && binanceData.data.length > 0) {
            const prices = binanceData.data.slice(0, 3).map(item => parseFloat(item.adv.price));
            const suma = prices.reduce((a, b) => a + b, 0);
            usdtReal = (suma / prices.length).toFixed(2);
        }

        res.json({
            estado: "Multi-APIs Automáticas Sincronizadas",
            bcv: Number(bcvVal),
            euro: Number(euroVal),
            usdt: usdtReal,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        res.status(500).json({ 
            error: "Error en el servidor multifuente", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor multifuente activo en puerto ${PORT}`);
});
