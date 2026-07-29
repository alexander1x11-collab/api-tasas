const express = require('express');
const app = express();

// Middleware para evitar caché en Render
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

app.get('/api/tasas', async (req, res) => {
    let bcvDolar = 0;
    let bcvEuro = 0;
    let paralelo = 0;
    let usdtBinance = 0;

    try {
        const [respBcvDolar, respBcvEuro, respParalelo, respBinance] = await Promise.allSettled([
            fetch('https://ve.dolarapi.com/v1/dolares/oficial', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
            fetch('https://ve.dolarapi.com/v1/euros/oficial', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
            fetch('https://ve.dolarapi.com/v1/dolares/paralelo', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
            fetch('https://pydolarvenezuela-api.onrender.com/api/v1/dollar/enparalelo', { headers: { 'User-Agent': 'Mozilla/5.0' } })
        ]);

        // 1. Dólar BCV
        if (respBcvDolar.status === 'fulfilled' && respBcvDolar.value.ok) {
            const json = await respBcvDolar.value.json();
            bcvDolar = json.promedio || json.price || 0;
        }

        // 2. Euro BCV
        if (respBcvEuro.status === 'fulfilled' && respBcvEuro.value.ok) {
            const json = await respBcvEuro.value.json();
            bcvEuro = json.promedio || json.price || 0;
        }

        // 3. Paralelo (DolarApi)
        if (respParalelo.status === 'fulfilled' && respParalelo.value.ok) {
            const json = await respParalelo.value.json();
            paralelo = json.promedio || json.price || 0;
        }

        // 4. USDT / Paralelo de respaldo (PyDolarVenezuela)
        if (respBinance.status === 'fulfilled' && respBinance.value.ok) {
            const json = await respBinance.value.json();
            // Captura flexible según la estructura de PyDolarVenezuela
            usdtBinance = json.monedas?.enparalelo?.precio || json.price || json.promedio || 0;
            if (paralelo === 0) paralelo = usdtBinance; // Si el paralelo de DolarApi falló, usa este
        }

    } catch (error) {
        console.error("Error recolectando las tasas:", error.message);
    }

    const fechaVenezuela = new Date().toLocaleDateString('es-VE', {
        timeZone: 'America/Caracas',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const horaVenezuela = new Date().toLocaleTimeString('es-VE', { 
        timeZone: 'America/Caracas',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    return res.json({
        actualizado_en: `${fechaVenezuela} a las ${horaVenezuela}`,
        fuente_principal: "Consolidado Multifuente en Tiempo Real",
        tasas: {
            bcv: bcvDolar,
            euro: bcvEuro,
            paralelo: paralelo,
            usdt: usdtBinance || paralelo
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de tasas corriendo en puerto ${PORT}`);
});
