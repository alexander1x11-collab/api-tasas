const https = require('https');

function consultarMontosVE(apiKey) {
    return new Promise((resolve, reject) => {
        const opciones = {
            hostname: 'montosve.com',
            path: '/api/v1/fx/rates',
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        };

        const req = https.request(opciones, (res) => {
            let datos = '';
            res.on('data', chunk => datos += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(datos) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: datos });
                }
            });
        });

        req.on('error', err => reject(err));
        req.end();
    });
}

const server = require('http').createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.url === '/') {
        res.statusCode = 200;
        res.end(JSON.stringify({ mensaje: "El servidor de Render está vivo y funcionando" }));
        return;
    }

    if (req.url === '/api/tasas') {
        try {
            // Toma la clave que configuraste en Render
            const apiKey = process.env.API_KEY || process.env.NEW_SECRET;

            if (!apiKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Falta configurar la API Key en las variables de entorno de Render" }));
                return;
            }

            const resultado = await consultarMontosVE(apiKey);

            res.statusCode = resultado.status;
            res.end(JSON.stringify(resultado.body, null, 2));

        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Error interno al conectar con MontosVE", detalle: error.message }));
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
