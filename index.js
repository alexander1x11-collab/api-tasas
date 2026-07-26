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

            // Lista exhaustiva de variantes de rutas para dar con el endpoint correcto
            const rutasAProbar = [
                'https://montosve.com/api/fx/rates',
                'https://montosve.com/api/v1/rates',
                'https://montosve.com/v1/rates',
                'https://montosve.com/api/tasas',
                'https://montosve.com/fx/rates',
                'https://montosve.com/api/v1/fx/rates'
            ];

            let registroResultados = [];

            for (const url of rutasAProbar) {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'X-API-Key': apiKey,
                        'Accept': 'application/json'
                    }
                });

                const texto = await response.text();
                
                // Verificamos si responde con JSON válido (éxito)
                if (response.status === 200 && (texto.trim().startsWith('{') || texto.trim().startsWith('['))) {
                    res.statusCode = 200;
                    res.end(JSON.stringify({ 
                        estado: "¡Encontrado con éxito!", 
                        url_correcta: url, 
                        tasas: JSON.parse(texto) 
                    }, null, 2));
                    return;
                }

                registroResultados.push({
                    url_intentada: url,
                    status: response.status
                });
            }

            // Si ninguna devolvió JSON válido
            res.statusCode = 500;
            res.end(JSON.stringify({ 
                error: "Ninguna ruta devolvió un JSON válido. Todas respondieron con error o HTML.",
                detalles_intentos: registroResultados 
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
