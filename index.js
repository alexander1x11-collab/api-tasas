const express = require('expre`ss');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    let bcvVal = null;
    let euroVal = null;
    let usdtVal = null;

    // 1. Petición directa a la API de PyDolarVenezuela para obtener tasas oficiales frescas
    try {
        const response = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar/bcv', {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        if (response.ok) {
            const data = await response.json();
            // Extracción limpia de la estructura oficial de PyDolarVenezuela
            bcvVal = parseFloat(data?.monedas?.dolar?.price || data?.price || 0);
            euroVal = parseFloat(data?.monedas?.euro?.price || 0);
        }
    } catch (e) {
        console.log("Fallo al conectar con PyDolarVenezuela oficial");
    }

    // 2. Si la anterior no trajo algo, consultamos el endpoint general de monitores oficiales
    if (!bcvVal || !euroVal) {
        try {
            const resGeneral = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar', {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (resGeneral.ok) {
                const jsonGeneral = await resGeneral.json();
                if (!bcvVal) bcvVal = parseFloat(jsonGeneral?.monedas?.bcv?.price || jsonGeneral?.bcv?.price || 0);
                if (!euroVal) euroVal = parseFloat(jsonGeneral?.monedas?.euro?.price || jsonGeneral?.euro?.price || 0);
            }
        } catch (e) {
            console.log("Fallo en endpoint secundario de respaldo");
        }
    }

    // 3. Obtención en tiempo real estricta para USDT (Binance P2P directo)
    try {
        const binanceRes = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
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
        });
        if (binanceRes.ok) {
            const binanceJson = await binanceRes.json();
            if (binanceJson && binanceJson.data && binanceJson.data.length > 0) {
                const prices = binanceJson.data.slice(0, 3).map(item => parseFloat(item.adv.price));
                const suma = prices.reduce((a, b) => a + b, 0);
                usdtVal = parseFloat((suma / prices.length).toFixed(2));
            }
        }
    } catch (e) {
        console.log("Binance P2P bloqueado por Cloudflare, usando respaldo de mercado paralelo");
    }

    // 4. Si Binance se bloqueó, usamos el promedio del paralelo en vivo como tasa USDT real
    if (!usdtVal) {
        try {
            const paraleloRes = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar/enparalelovzla', {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (paraleloRes.ok) {
                const paraleloData = await paraleloRes.json();
                usdtVal = parseFloat(paraleloData?.price || 0);
            }
        } catch (e) {
            console.log("Fallo al obtener respaldo paralelo");
        }
    }

    res.json({
        estado: "Sincronización Real en Vivo",
        bcv: bcvVal ? Number(bcvVal) : "No disponible",
        euro: euroVal ? Number(euroVal) : "No disponible",
        usdt: usdtVal ? Number(usdtVal) : "No disponible",
        actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
    });
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
