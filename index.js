const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        const timestamp = new Date().getTime();
        
        // Consultamos múltiples fuentes en paralelo para asegurar que ninguna tasa quede vacía
        const [resPyDolar, resDolarApi] = await Promise.allSettled([
            fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar?_t=${timestamp}`).then(r => r.json()),
            fetch('https://ve.dolarapi.com/v1/dolares').then(r => r.json())
        ]);

        let bcvVal = "No disponible";
        let euroVal = "No disponible";
        let usdtVal = "No disponible";

        // 1. Intentamos extraer de PyDolarVenezuela
        if (resPyDolar.status === 'fulfilled' && resPyDolar.value?.monedas) {
            const m = resPyDolar.value.monedas;
            bcvVal = m.bcv?.price || bcvVal;
            euroVal = m.euro?.price || bcvVal;
            
            // Buscamos todas las variantes posibles de USDT / Binance / Paralelo
            usdtVal = m.binance?.price || m.enparalelovzla?.price || m.usdt?.price || usdtVal;
        }

        // 2. Si el USDT o el BCV siguen sin cargar, los completamos de inmediato con DolarAPI
        if (usdtVal === "No disponible" || bcvVal === "No disponible" && resDolarApi.status === 'fulfilled' && Array.isArray(resDolarApi.value)) {
            const arr = resDolarApi.value;
            const oficial = arr.find(item => item.fuente === 'oficial') || {};
            const binance = arr.find(item => item.fuente === 'binance' || item.fuente === 'enparalelovzla' || item.fuente === ' paralelo') || {};

            if (bcvVal === "No disponible") bcvVal = oficial.promedio || oficial.precio || "No disponible";
            if (euroVal === "No disponible") euroVal = oficial.euro || oficial.promedio || "No disponible";
            if (usdtVal === "No disponible") usdtVal = binance.promedio || binance.precio || binance.valor || "No disponible";
        }

        res.json({
            estado: "Sincronizado y Completo",
            bcv: bcvVal,
            euro: euroVal,
            usdt: usdtVal,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        res.status(500).json({ 
            error: "Error procesando las tasas", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de tasas activo en puerto ${PORT}`);
});
