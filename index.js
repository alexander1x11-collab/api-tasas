const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        let bcvVal = 0;
        let euroVal = 0;

        // Petición directa a la API abierta de DolarAPI Venezuela
        const response = await fetch('https://ve.dolarapi.com/v1/dolares', {
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Extraer Dólar Oficial
            const oficial = data.find(item => item.fuente === 'oficial' || item.nombre === 'Oficial');
            if (oficial) {
                bcvVal = oficial.promedio || oficial.precio;
            }

            // Extraer Euro Oficial
            const euro = data.find(item => item.nombre && item.nombre.toLowerCase().includes('euro'));
            if (euro) {
                euroVal = euro.promedio || euro.precio;
            }
        }

        res.json({
            estado: "Sincronizado Correctamente",
            bcv: bcvVal,
            euro: euroVal,
            actualizado: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
        });

    } catch (error) {
        res.status(500).json({ 
            error: "No se pudieron obtener las tasas en este momento", 
            detalles: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
