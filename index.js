const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('¡La API está funcionando perfectamente!');
});

app.get('/api/tasas', async (req, res) => {
    try {
        const apiKey = process.env.API_KEY;
        
        // Verificamos si la key se cargó en Render
        if (!apiKey) {
            return res.status(500).json({ error: "Falta configurar la API_KEY en las variables de entorno de Render." });
        }

        const response = await fetch('https://montosve.com/api/v1/fx/rates', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        // Capturamos el texto por si MontosVE devuelve un error en HTML o texto plano en vez de JSON
        const responseText = await response.text();
        
        try {
            const data = JSON.parse(responseText);
            res.json({
                estado_conexion: "Conectado con éxito a MontosVE",
                datos: data
            });
        } catch (e) {
            // Si no es un JSON válido, te mostrará qué devolvió la web de MontosVE
            res.status(500).json({ 
                error: "La respuesta de MontosVE no es un JSON válido", 
                respuesta_recibida: responseText,
                status_code: response.status 
            });
        }

    } catch (error) {
        res.status(500).json({ error: "Error de red", detalle: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
});
