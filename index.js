const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // Variables limpias. No hay números hardcodeados ni salvavidas escritos por mí.
        let bcvVal = "No disponible";
        let euroVal = "No disponible";
        let usdtReal = "No disponible";

        // 1. Obtener BCV Oficial en tiempo real (DolarAPI)
        try {
            const bcvRes = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (bcvRes.ok) {
                const bcvJson = await bcvRes.json();
                bcvVal = parseFloat(bcvJson.promedio || bcvJson.precio);
            }
        } catch (e) {
            console.log("Error al conectar con la API del BCV");
        }

        // 2. Obtener EURO en tiempo real (DolarAPI)
        try {
            const euroRes = await fetch('https://ve.dolarapi.com/v1/dolares/euro', {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (euroRes.ok) {
                const euroJson = await euroRes.json();
                euroVal = parseFloat(euroJson.promedio || euroJson.precio);
            }
        } catch (e) {
            console.log("Error al conectar con la API del Euro");
        }

        // 3. Obtener USDT en tiempo real (Binance P2P)
        try {
            const binanceRes = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
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
            if (binanceRes.ok) {
                const binanceJson = await binanceRes.json();
                if (binanceJson && binanceJson.data && binanceJson.data.length > 0) {
                    const prices = binanceJson.data.slice(0, 3).map(item => parseFloat(item.adv.price));
                    const suma = prices.reduce((a, b) => a + b, 0);
                    usdtReal = (suma / prices.length).toFixed(2);
                }
            }
        } catch (e) {
            console.log("Error al conectar con Binance P2P");
        }

        res.json({
            estado: "Extracción 100% en Vivo (Sin datos fijos)",
            bcv: bcvVal,
            euro: euroVal,
            usdt: usdtReal === "No disponible" ? usdtReal : Number(usdtReal),
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        res.status(500).json({ 
            error: "Error del servidor", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
