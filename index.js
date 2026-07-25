const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        const timestamp = new Date().getTime();

        // Consultamos 3 fuentes totalmente diferentes al mismo tiempo para evitar que ninguna se quede congelada
        const [pydolarRes, dolarApiRes, peticionMonitors] = await Promise.allSettled([
            fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar?_t=${timestamp}`).then(r => r.json()),
            fetch(`https://ve.dolarapi.com/v1/dolares?_t=${timestamp}`).then(r => r.json()),
            fetch(`https://papi.pydolarvenezuela.com/api/v1/dollar/bcv?_t=${timestamp}`).then(r => r.json())
        ]);

        let bcvVal = null;
        let euroVal = null;
        let usdtVal = null;

        // 1. Intentar rescatar de la fuente directa de BCV de PyDolarVenezuela
        if (peticionMonitors.status === 'fulfilled' && peticionMonitors.value?.price) {
            bcvVal = peticionMonitors.value.price;
        }

        // 2. Intentar rescatar de la primera fuente general
        if (!bcvVal && pydolarRes.status === 'fulfilled' && pydolarRes.value?.monedas) {
            bcvVal = pydolarRes.value.monedas.bcv?.price;
            euroVal = pydolarRes.value.monedas.euro?.price;
            usdtVal = pydolarRes.value.monedas.binance?.price || pydolarRes.value.monedas.enparalelovzla?.price;
        }

        // 3. Si algo falta, usar DolarAPI como respaldo masivo
        if ((!bcvVal || !usdtVal) && dolarApiRes.status === 'fulfilled' && Array.isArray(dolarApiRes.value)) {
            const dataArr = dolarApiRes.value;
            const oficial = dataArr.find(item => item.fuente === 'oficial') || {};
            const paralelo = dataArr.find(item => item.fuente === 'binance' || item.fuente === 'enparalelovzla' || item.fuente === ' paralelo') || {};

            if (!bcvVal) bcvVal = oficial.promedio || oficial.precio;
            if (!euroVal) euroVal = oficial.euro || oficial.promedio;
            if (!usdtVal) usdtVal = paralelo.promedio || paralelo.precio;
        }

        res.json({
            estado: "Sistema Multi-Respaldo Activo",
            bcv: bcvVal || "No disponible",
            euro: euroVal || bcvVal || "No disponible",
            usdt: usdtVal || "No disponible",
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        res.status(500).json({ 
            error: "Fallo general en los servidores externos", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
