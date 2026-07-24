const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/tasas', async (req, res) => {
    try {
        const respuesta = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar/all');
        const data = await respuesta.json();

        res.json({
            status: "success",
            actualizado: new Date().toLocaleString(),
            monitors: data.monitors
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            mensaje: "No se pudieron obtener las tasas",
            detalle: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
