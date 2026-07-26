const http = 'http';
const https = require('https');

// Función auxiliar para hacer peticiones con Node nativo garantizando compatibilidad total
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error("La respuesta no es un JSON válido"));
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
            // Usamos la API pública directa
            const data = await fetchJson('https://pydolarvenezuela.org/api/v1/dollar?page=all');
            
            res.statusCode = 200;
            res.end(JSON.stringify(data, null, 2));
        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Error al obtener las tasas", detalle: error.message }));
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
