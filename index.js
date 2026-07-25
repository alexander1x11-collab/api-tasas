const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    let bcvVal = null;
    let euroVal = null;
    let usdtVal = null;

    try {
        const response = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar', {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        if (response.ok) {
            const data = await response.json();
            bcvVal = data?.monedas?.bcv?.price || data?.bcv?.price || null;
            euroVal = data?.monedas?.euro?.price || data?.euro?.price || null;
        }
    } catch (e) {
        console.log("Error principal");
    }

    try {
        const p2pRes = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar/enparalelovzla', {
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (p2pRes.ok) {
            const p2pData = await p2pRes.json();
            usdtVal = p2pData?.price || null;
        }
    } catch (e) {
        console.log("Error secundario");
    }

    res.json({
        estado: "Datos Directos",
        bcv: bcvVal ? Number(bcvVal) : "No disponible",
        euro: euroVal ? Number(euroVal) : "No disponible",
        usdt: usdtVal ? Number(usdtVal) : "No disponible",
        actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
    });
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
