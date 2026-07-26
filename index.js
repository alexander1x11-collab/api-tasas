const http = require('http');

const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.url === '/') {
        res.statusCode = 200;
        res.end(JSON.stringify({ mensaje: "El servidor de Render está vivo y funcionando" }));
        return;
    }

    if (req.url === '/api/tasas') {
        try {
            const apiKey = process.env.NEW_SECRET || process.env.API_KEY;
            
            if (!apiKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Falta configurar la API Key en las variables de entorno de Render" }));
                return;
            }

            // Probamos conectarnos a la raíz del dominio o al portal general para ver qué responde
            const urlObjetivo = 'https://montosve.com/';
            
            const response = await fetch(urlObjetivo, {
                method: 'GET',
                headers: {
                    'X-API-Key': apiKey,
                    'Accept': 'application/json'
                }
            });

            const responseText = await response.text();

            res.statusCode = 200;
            res.end(JSON.stringify({ 
                estado_prueba: "Conexión realizada con éxito al dominio base",
                status_recibido: response.status,
                cuerpo_respuesta: responseText.substring(0, 500) // Muestra los primeros 500 caracteres para analizarlo
            }, null, 2));

        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Error interno al conectar", detalle: error.message }));
        }
        return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Ruta no encontrada" }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor nativo corriendo en puerto ${PORT}`);
});
