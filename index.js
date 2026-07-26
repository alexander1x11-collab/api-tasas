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

            // Probamos varias rutas comunes de APIs en paralelo
            const posiblesRutas = [
                'https://montosve.com/api/v1/fx/rates',
                'https://montosve.com/v1/fx/rates',
                'https://montosve.com/api/rates',
                'https://montosve.com/rates'
            ];

            let resultadoExitoso = null;
            let rutaQueFunciono = '';

            for (const url of posiblesRutas) {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'X-API-Key': apiKey,
                        'Accept': 'application/json'
                    }
                });

                const texto = await response.text();
                
                // Si la respuesta empieza con '{' o '[', significa que es un JSON válido y no un error HTML 404
                if (texto.trim().startsWith('{') || texto.trim().startsWith('[')) {
                    resultadoExitoso = JSON.parse(texto);
                    rutaQueFunciono = url;
                    break;
                }
            }

            if (resultadoExitoso) {
                res.statusCode = 200;
                res.end(JSON.stringify({ 
                    estado: "Conexión exitosa", 
                    encontrado_en: rutaQueFunciono, 
                    tasas: resultadoExitoso 
                }, null, 2));
            } else {
                res.statusCode = 500;
                res.end(JSON.stringify({ 
                    error: "Ninguna de las rutas probadas devolvió un JSON válido. Revisa la documentación de MontosVE para confirmar la URL exacta de la API." 
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
