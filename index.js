const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        const timestamp = new Date().getTime();

        // 1. Scraping DIRECTO y en vivo a la página oficial del BCV (sin intermediarios perezosos)
        const bcvPromise = fetch(`https://www.bcv.org.ve/`, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        }).then(r => r.text()).catch(() => null);

        // 2. Respaldo por si la web del BCV llega a bloquear temporalmente la conexión
        const backupPromise = fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar?_t=${timestamp}`, {
            headers: { 'Cache-Control': 'no-cache' }
        }).then(r => r.json()).catch(() => null);

        // 3. Binance P2P para el USDT en tiempo real 24/7
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

        const [bcvHtml, backupData, binanceData] = await Promise.all([bcvPromise, backupPromise, binancePromise]);

        let bcvVal = 0;
        let euroVal = 0;

        // Intentar extraer el Dólar y el Euro directamente del HTML oficial del BCV
        if (bcvHtml) {
            try {
                // Buscamos las etiquetas donde el BCV aloja las tasas en su web oficial
                const dollarMatch = bcvHtml.match(/id="dolar"[^>]*>[\s\S]*?<strong>\s*([0-9,.]+)\s*<\/strong>/i);
                const euroMatch = bcvHtml.match(/id="euro"[^>]*>[\s\S]*?<strong>\s*([0-9,.]+)\s*<\/strong>/i);

                if (dollarMatch && dollarMatch[1]) {
                    bcvVal = parseFloat(dollarMatch[1].replace(/\./g, '').replace(',', '.'));
                }
                if (euroMatch && euroMatch[1]) {
                    euroVal = parseFloat(euroMatch[1].replace(/\./g, '').replace(',', '.'));
                }
            } catch (e) {
                console.log("Error haciendo parsing del HTML del BCV:", e.message);
            }
        }

        // Si el scraping directo falló o no encontró los datos, usamos la API de respaldo de inmediato
        if (!bcvVal && backupData) {
            bcvVal = backupData?.monedas?.bcv?.price || backupData?.bcv?.price || 0;
        }
        if (!euroVal && backupData) {
            euroVal = backupData?.monedas?.euro?.price || backupData?.euro?.price || bcvVal;
        }

        // Si todo lo demás falla, dejamos un valor de seguridad
        if (!bcvVal) bcvVal = 737.88;
        if (!euroVal) euroVal = bcvVal;

        // Cálculo exacto del USDT en Binance P2P
        let usdtReal = "No disponible";
        if (binanceData && binanceData.data && binanceData.data.length > 0) {
            const prices = binanceData.data.slice(0, 3).map(item => parseFloat(item.adv.price));
            const suma = prices.reduce((a, b) => a + b, 0);
            usdtReal = (suma / prices.length).toFixed(2);
        }

        res.json({
            estado: "Scraping BCV Directo y Binance Activos",
            bcv: Number(bcvVal),
            euro: Number(euroVal),
            usdt: usdtReal,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        res.status(500).json({ 
            error: "Error en el servidor de scraping", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de tasas directas activo en puerto ${PORT}`);
});
