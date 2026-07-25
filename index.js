const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    let bcvVal = null;
    let euroVal = null;
    let usdtVal = null;

    // 1. Scraping directo, limpio y blindado a la web oficial del BCV
    try {
        const response = await fetch('https://www.bcv.org.ve/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            signal: AbortSignal.timeout(8000) // Timeout de seguridad de 8 segundos
        });

        if (response.ok) {
            const html = await response.text();

            // Buscamos los bloques exactos donde el BCV aloja el Dólar y el Euro en su HTML
            // El BCV usa divs con ids específicos como id="dolar" e id="euro"
            const dolarMatch = html.match(/id="dolar"[^>]*>[\s\S]*?<strong>\s*([0-9,.]+)\s*<\/strong>/i);
            const euroMatch = html.match(/id="euro"[^>]*>[\s\S]*?<strong>\s*([0-9,.]+)\s*<\/strong>/i);

            if (dolarMatch && dolarMatch[1]) {
                // Limpiamos los puntos de miles y cambiamos la coma por punto decimal
                bcvVal = parseFloat(dolarMatch[1].replace(/\./g, '').replace(',', '.'));
            }

            if (euroMatch && euroMatch[1]) {
                euroVal = parseFloat(euroMatch[1].replace(/\./g, '').replace(',', '.'));
            }
        }
    } catch (e) {
        console.log("Falla temporal en conexión directa al BCV:", e.message);
    }

    // 2. Si por algún motivo el BCV bloquea el HTML directo, usamos una fuente alternativa de respaldo en tiempo real
    if (!bcvVal || !euroVal) {
        try {
            const altRes = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar', {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (altRes.ok) {
                const altData = await altRes.json();
                if (!bcvVal) bcvVal = altData?.monedas?.bcv?.price || altData?.bcv?.price || null;
                if (!euroVal) euroVal = altData?.monedas?.euro?.price || altData?.euro?.price || null;
            }
        } catch (e) {
            console.log("Falla en respaldo alternativo");
        }
    }

    // 3. Obtener tasa paralela / USDT de referencia abierta
    try {
        const p2pRes = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar/enparalelovzla', {
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (p2pRes.ok) {
            const p2pData = await p2pRes.json();
            if (p2pData && p2pData.price) {
                usdtVal = p2pData.price;
            }
        }
    } catch (e) {
        usdtVal = "No disponible";
    }

    res.json({
        estado: "Extracción Directa BCV Activa",
        bcv: bcvVal ? Number(bcvVal) : "No disponible",
        euro: euroVal ? Number(euroVal) : "No disponible",
        usdt: usdtVal,
        actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
    });
});

app.listen(PORT, () => {
    console.log(`Servidor de tasas directas activo en puerto ${PORT}`);
});
