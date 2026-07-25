const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    let bcvVal = null;
    let euroVal = null;
    let usdtVal = null;

    try {
        const response = await fetch('https://ve.dolarapi.com/v1/dolares', {
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (response.ok) {
            const data = await response.json();
            const oficial = data.find(item => item.fuente === 'oficial' || item.nombre === 'Oficial');
            const euro = data.find(item => item.nombre && item.nombre.toLowerCase().includes('euro'));
            
            if (oficial) bcvVal = oficial.promedio || oficial.precio;
            if (euro) euroVal = euro.promedio || euro.precio;
        }
    } catch (e) {
        console.log("Error dolarapi");
    }

    try {
        const paraleloRes = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar/enparalelovzla', {
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (paraleloRes.ok) {
            const paraleloData = await paraleloRes.json();
            usdtVal = paraleloData?.price || null;
        }
    } catch (e) {
        console.log("Error paralelo");
    }

    res.json({
        estado: "Operativo",
        bcv: bcvVal ? Number(bcvVal) : 737.88,
        euro: euroVal ? Number(euroVal) : 776.25,
        usdt: usdtVal ? Number(usdtVal) : 864.33,
        actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
    });
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
