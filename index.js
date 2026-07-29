const express = require('express');
const app = express();

// Middleware estricto para evitar caché en Render y forzar lectura inmediata
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Endpoint unificado para todas las tasas reales
app.get('/api/tasas', async (req, res) => {
    let bcvData = null;
    let paraleloData = null;
    let binanceData = null;

    // Ejecutamos las peticiones en paralelo para máxima velocidad
    try {
        const [respBcv, respPy, respBinance] = await Promise.allSettled([
            fetch('https://ve.dolarapi.com/v1/dolares/oficial', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
            fetch('https://pydolarvenezuela-api.onrender.com/api/v1/dollar/bcv', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
            fetch('https://pydolarvenezuela-api.onrender.com/api/v1/dollar/enparalelo', { headers: { 'User-Agent': 'Mozilla/5.0' } })
        ]);

        // Procesar fuente BCV principal (DolarApi)
        if (respBcv.status === 'fulfilled' && respBcv.value.ok) {
            const json = await respBcv.value.json();
            bcvData = json.promedio || json.price;
        }

        // Respaldo BCV si falla el primero (PyDolarVenezuela)
        if (!bcvData && respPy.status === 'fulfilled' && respPy.value.ok) {
            const jsonPy = await respPy.value.json();
            bcvData = jsonPy.monedas?.bcv?.precio || jsonPy.price;
        }

        // Procesar Paralelo
        if (respBinance.status === 'fulfilled' && respBinance.value.ok) {
            const jsonParalelo = await respBinance.value.json();
            paraleloData = jsonParalelo.monedas?.enparalelo?.precio || jsonParalelo.promedio;
        }

    } catch (error) {
        console.error("Error recolectando las fuentes:", error.message);
    }

    // Si de forma crítica ninguna fuente responde
    if (!bcvData && !paraleloData) {
        return res.status(500).json({ 
            error: "Imposible conectar con las fuentes de tasas en este momento." 
        });
    }

    // Fecha y hora exacta de Venezuela para marcar el cambio al instante
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

    // Respuesta limpia y estructurada que lee tu aplicación de inmediato
    return res.json({
        actualizado_en: `${fechaVenezuela} a las ${horaVenezuela}`,
        fuente_principal: "Consolidado en Tiempo Real",
        tasas: {
            bcv: bcvData || 0,
            paralelo: paraleloData || 0
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de tasas corriendo en puerto ${PORT}`);
});
