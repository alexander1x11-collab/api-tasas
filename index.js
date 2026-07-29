app.get('/api/tasas', async (req, res) => {
    try {
        const fechaVenezuela = new Date().toLocaleDateString('es-VE', {
            timeZone: 'America/Caracas',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const respuesta = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await respuesta.json();
        
        const datosTasa = {
            fuente: "BCV",
            precio: data.promedio,
            moneda: data.nombre,
            fechaConsulta: fechaVenezuela,
            actualizado: new Date().toLocaleTimeString('es-VE', { timeZone: 'America/Caracas' })
        };

        return res.json(datosTasa);

    } catch (error) {
        console.error("Error al actualizar la tasa:", error.message);
        return res.status(500).json({ error: "No se pudo obtener la tasa actual", detalle: error.message });
    }
});
