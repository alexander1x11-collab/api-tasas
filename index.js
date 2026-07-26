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

            // URL oficial exacta según la documentación de MontosVE
            const urlOficial = 'https://montosve.com/fx/rates';
            
            const response = await fetch(urlOficial, {
                method: 'GET',
                headers: {
                    'X-API-Key': apiKey,
                    'Accept': 'application/json'
                }
            });

            const responseText = await response.text();

            try {
                const data = JSON.parse(responseText);
                res.statusCode = 200;
                res.end(JSON.stringify({ 
                    estado: "Conexión exitosa", 
                    tasas: data 
                }, null, 2));
            } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ 
                    error: "MontosVE no devolvió un JSON válido", 
                    status_http: response.status,
                    raw: responseText 
                }));
            }

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
