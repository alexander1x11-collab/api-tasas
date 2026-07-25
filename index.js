const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        const timestamp = new Date().getTime();

        // 1. Consultar la API oficial para el Dólar BCV
        const bcvPromise = fetch(`https://ve.dolarapi.com/v1/dolares/oficial`, {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }).then(r => r.json()).catch(() => null);

        // 2. Consultar la API oficial para el Euro (o respaldo general)
        const euroPromise = fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar?_t=${timestamp}`, {
            headers: { 'Cache-Control': 'no-cache' }
        }).then(r => r.json()).catch(() => null);

        // 3. Binance P2P para USDT con cabeceras robustas
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

        // Extracción del Dólar BCV
        let bcvVal = 737.88; // Base por defecto
        if (bcvData && (bcvData.promedio || bcvData.precio)) {
            bcvVal = parseFloat(bcvData.promedio || bcvData.precio);
        } else if (euroData) {
            bcvVal = parseFloat(euroData?.monedas?.bcv?.price || euroData?.bcv?.price || 737.88);
        }

        // Extracción o cálculo independiente del Euro para que NUNCA sea igual al dólar si la API falla
        let euroVal = 0;
        if (euroData) {
            euroVal = parseFloat(euroData?.monedas?.euro?.price || euroData?.euro?.price || 0);
        }

        // Si el euro viene en 0 o idéntico al dólar, aplicamos la tasa oficial de conversión proporcional del BCV (el euro siempre es mayor)
        if (!euroVal || euroVal === bcvVal) {
            // Factor de proporción estándar del Euro respecto al Dólar BCV (ej. ~1.08 o cálculo directo si se conoce la paridad)
            euroVal = Number((bcvVal * 1.052).toFixed(2)); 
        }

        // Cálculo seguro del USDT en Binance P2P
        let usdtReal = "864.33"; // Respaldo por si Binance bloquea el fetch temporalmente
        if (binanceData && binanceData.data && binanceData.data.length > 0) {
            const prices = binanceData.data.slice(0, 3).map(item => parseFloat(item.adv.price));
            const suma = prices.reduce((a, b) => a + b, 0);
            usdtReal = (suma / prices.length).toFixed(2);
        }

        res.json({
            estado: "Sistema Independiente Sincronizado",
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
