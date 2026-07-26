const http = require('http');

const server = http.createServer(async (req, res) => {
    // Configurar cabeceras para que devuelva JSON
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.url === '/') {
        res.statusCode = 200;
        res.end(JSON.stringify({ mensaje: "El servidor de Render está vivo y funcionando" }));
        return;
    }

    if (req.url === '/api/tasas') {
        try {
            const apiKey = process.env.API_KEY;
            
            if (!apiKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Falta configurar la API_KEY en las variables de entorno de Render" }));
                return;
            }

            const response = await fetch('https://montosve.com/api/v1/fx/rates', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json'
                }
            });

            const responseText = await response.text();

            try {
                const data = JSON.parse(responseText);
                res.statusCode = 200;
                res.end(JSON.stringify({ estado: "Conexión exitosa", tasas: data }, null, 2));
            } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "MontosVE no devolvió un JSON válido", raw: responseText }));
            }

        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Error interno al conectar", detalle: error.message }));
        }
        return;
    }

    // Si entra a cualquier otra ruta
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Ruta no encontrada" }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor nativo corriendo en puerto ${PORT}`);
});
