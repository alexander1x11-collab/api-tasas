const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    let bcvVal = "No disponible";
    let euroVal = "No disponible";
    let usdtVal = "No disponible";

    // 1. Extracción directa desde la web del BCV vía fetch con agente de navegador
    try {
        const response = await fetch('https://www.bcv.org.ve/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Cache-Control': 'no-cache'
            }
        });

        if (response.ok) {
            const html = await response.text();

            // Expresiones regulares limpias para extraer el Dólar y el Euro directamente del DOM del BCV
            const dolarMatch = html.match(/id="dolar"[^>]*>[\s\S]*?<strong>\s*([0-9,.]+)\s*<\/strong>/i);
            const euroMatch = html.match(/id="euro"[^>]*>[\s\S]*?<strong>\s*([0-9,.]+)\s*<\/strong>/i);

            if (dolarMatch && dolarMatch[1]) {
                bcvVal = parseFloat(dolarMatch[1].replace(/\./g, '').replace(',', '.'));
            }
            if (euroMatch && euroMatch[1]) {
                euroVal = parseFloat(euroMatch[1].replace(/\./g, '').replace(',', '.'));
            }
        }
    } catch (e) {
        console.log("Fallo el scraping directo al BCV");
    }

    // 2. Respaldo inmediato con DolarAPI oficial si el BCV directo bloquea la IP de Render temporalmente
    if (bcvVal === "No disponible" || euroVal === "No disponible") {
        try {
            const backupRes = await fetch('https://ve.dolarapi.com/v1/dolares', {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (backupRes.ok) {
                const data = await backupRes.json();
                const oficial = data.find(item => item.fuente === 'oficial' || item.nombre === 'Oficial');
                const euro = data.find(item => item.nombre && item.nombre.toLowerCase().includes('euro'));
                
                if (bcvVal === "No disponible" && oficial) bcvVal = oficial.promedio || oficial.precio;
                if (euroVal === "No disponible" && euro) euroVal = euro.promedio || euro.precio;
            }
        } catch (e) {
            console.log("Fallo el respaldo secundario");
        }
    }

    // 3. Obtener USDT referencial del mercado abierto actual
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
        estado: "Conexión Directa en Tiempo Real",
        bcv: bcvVal,
        euro: euroVal,
        usdt: usdtVal,
        actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
    });
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
