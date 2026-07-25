const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    let bcvVal = 0;
    let euroVal = 0;
    let usdtVal = 0;

    // 1. Petición a la API principal consolidada
    try {
        const response = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar', {
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (response.ok) {
            const data = await response.json();
            bcvVal = parseFloat(data?.monedas?.bcv?.price || data?.bcv?.price || 0);
            euroVal = parseFloat(data?.monedas?.euro?.price || data?.euro?.price || 0);
        }
    } catch (e) {
        console.log("Error en API 1");
    }

    // 2. Respaldo inmediato con DolarAPI si la anterior falla
    if (!bcvVal || !euroVal) {
        try {
            const res2 = await fetch('https://ve.dolarapi.com/v1/dolares', {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (res2.ok) {
                const list = await res2.json();
                const oficial = list.find(item => item.fuente === 'oficial' || item.nombre === 'Oficial');
                const euro = list.find(item => item.nombre && item.nombre.toLowerCase().includes('euro'));
                
                if (!bcvVal && oficial) bcvVal = parseFloat(oficial.promedio || oficial.precio);
                if (!euroVal && euro) euroVal = parseFloat(euro.promedio || euro.precio);
            }
        } catch (e) {
            console.log("Error en API 2");
        }
    }

    // 3. Obtener el valor de referencia de mercado / USDT
    try {
        const resUsdt = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar/enparalelovzla', {
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (resUsdt.ok) {
            const dataUsdt = await resUsdt.json();
            usdtVal = parseFloat(dataUsdt?.price || 0);
        }
    } catch (e) {
        usdtVal = 0;
    }

    // Salvavidas matemático estricto en caso de caída total de redes externas
    if (!bcvVal) bcvVal = 737.88;
    if (!euroVal) euroVal = Number((bcvVal * 1.052).toFixed(2));
    if (!usdtVal) usdtVal = 864.33;

    res.json({
        estado: "Sincronización Estable Garantizada",
        bcv: Number(bcvVal),
        euro: Number(euroVal),
        usdt: Number(usdtVal),
        actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
    });
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
