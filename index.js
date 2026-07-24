const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // Intentamos consultar múltiples fuentes de forma simultánea para asegurar el dato real
        const [resPydolar, resDolarApi] = await Promise.allSettled([
            fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar').then(r => r.json()),
            fetch('https://ve.dolarapi.com/v1/dolares').then(r => r.json())
        ]);

        let bcvVal = "No disponible";
        let euroVal = "No disponible";
        let usdtVal = "No disponible";

        // 1. Intentamos sacar de PydolarVenezuela (la más precisa)
        if (resPydolar.status === 'fulfilled' && resPydolar.value?.monedas) {
            const m = resPydolar.value.monedas;
            bcvVal = m.bcv?.price || bcvVal;
            euroVal = m.euro?.price || euroVal;
            usdtVal = m.binance?.price || m.enparalelovzla?.price || usdtVal;
        }

        // 2. Si alguna quedó vacía, completamos con DolarAPI al instante
        if ((bcvVal === "No disponible" || usdtVal === "No disponible") && resDolarApi.status === 'fulfilled' && Array.isArray(resDolarApi.value)) {
            const arr = resDolarApi.value;
            const oficial = arr.find(item => item.fuente === 'oficial') || {};
            const binance = arr.find(item => item.fuente === 'binance' || item.fuente === 'enparalelovzla') || {};

            if (bcvVal === "No disponible") bcvVal = oficial.promedio || oficial.precio || "No disponible";
            if (euroVal === "No disponible") euroVal = oficial.euro || "No disponible";
            if (usdtVal === "No disponible") usdtVal = binance.promedio || binance.precio || "No disponible";
        }

        res.json({
            estado: "Sincronizado y Automatizado",
            bcv: bcvVal,
            euro: euroVal,
            usdt: usdtVal,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        res.status(500).json({ 
            error: "Error interno procesando las tasas", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor maestro activo en el puerto ${PORT}`);
});
