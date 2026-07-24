const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        const responseDolar = await fetch('https://ve.dolarapi.com/v1/dolares');
        const dataDolar = await responseDolar.json();

        // Extraemos las fuentes de forma segura
        const oficial = dataDolar.find(item => item.fuente === 'oficial') || {};
        const paralelo = dataDolar.find(item => item.fuente === 'enparalelovzla') || {};
        
        // Buscamos USDT o tomamos el paralelo como respaldo si el campo varía
        const usdtBinance = dataDolar.find(item => item.fuente === 'binance' || item.fuente === 'cripto') || paralelo;

        res.json({
            estado: "Sincronizado en tiempo real",
            bcv: oficial.promedio || oficial.precio || "No disponible",
            euro: oficial.euro || oficial.promedio || "No disponible", 
            usdt: usdtBinance.promedio || usdtBinance.precio || paralelo.promedio || "No disponible",
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Error al obtener las tasas", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor automático corriendo en el puerto ${PORT}`);
});
