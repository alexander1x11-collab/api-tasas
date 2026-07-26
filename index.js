const https = require('https');

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error("Respuesta no válida"));
                }
            });
        }).on('error', err => reject(err));
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
            // Intentamos consultar una API pública y gratuita de alta disponibilidad
            const data = await fetchJson('https://ve.dolarapi.com/v1/dolares');
            
            res.statusCode = 200;
            res.end(JSON.stringify(data, null, 2));
        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ 
                error: "No se pudieron obtener las tasas en este momento", 
                detalle: error.message 
            }));
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
