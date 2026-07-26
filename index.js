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

            // Petición directa a la URL oficial documentada por MontosVE
            const response = await fetch('https://montosve.com/v1/fx/rates', {
                method: 'GET',
                headers: {
                    'X-API-Key': apiKey,
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                redirect: 'follow'
            });

            const responseText = await response.text();

            // Verificamos si respondieron con JSON o si arrojó HTML
            if (response.ok && (responseText.trim().startsWith('{') || responseText.trim().startsWith('['))) {
                const data = JSON.parse(responseText);
                res.statusCode = 200;
                res.end(JSON.stringify({ 
                    estado: "Conexión exitosa", 
                    tasas: data 
                }, null, 2));
            } else {
                res.statusCode = response.status;
                res.end(JSON.stringify({ 
                    error: "El servidor externo rechazó la petición o devolvió HTML", 
                    status_http: response.status,
                    respuesta_cruda: responseText 
                }, null, 2));
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
