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
                    reject(new Error("Respuesta JSON inválida"));
                }
            });
        }).on('error', err => reject(err));
    });
}

// Función limpia para extraer y limpiar los precios de Binance P2P
function fetchBinanceP2P() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            asset: "USDT",
            fiat: "VES",
            merchantCheck: false,
            page: 1,
            payTypes: [],
            publisherType: null,
            rows: 5,
            tradeType: "BUY"
        });

        const options = {
            hostname: 'p2p.binance.com',
            path: '/bapi/c2c/v2/friendly/c2c/adv/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    // Extraemos solo los precios reales y los convertimos a número con 2 decimales
                    const precios = parsed.data ? parsed.data.map(item => parseFloat(item.adv.price)) : [];
                    const promedio = precios.length > 0 ? (precios.reduce((a, b) => a + b, 0) / precios.length).toFixed(2) : null;
                    resolve({
                        promedio_p2p: promedio ? Number(promedio) : null,
                        ofertas: precios
                    });
                } catch (e) {
                    reject(new Error("Error procesando Binance P2P"));
                }
            });
        });

        req.on('error', err => reject(err));
        req.write(data);
        req.end();
    });
}

const server = require('http').createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.url === '/') {
        res.statusCode = 200;
        res.end(JSON.stringify({ mensaje: "Servidor de tasas activo y limpio" }));
        return;
    }

    if (req.url === '/api/tasas') {
        try {
            const [dolarApi, binanceData] = await Promise.allSettled([
                fetchJson('https://ve.dolarapi.com/v1/dolares'),
                fetchBinanceP2P()
            ]);

            // Formateamos DolarApi para que muestre nombres limpios y valores bien redondeados
            let tasasLocales = {};
            if (dolarApi.status === 'fulfilled' && Array.isArray(dolarApi.value)) {
                dolarApi.value.forEach(item => {
                    if (item.fuente && item.promedio) {
                        tasasLocales[item.fuente] = {
                            nombre: item.nombre || item.fuente,
                            precio: Number(item.promedio.toFixed(2)),
                            actualizado: item.ultimaActualizacion
                        };
                    } else if (item.nombre && item.precio) {
                        tasasLocales[item.nombre.toLowerCase()] = {
                            nombre: item.nombre,
                            precio: Number(item.precio.toFixed(2)),
                            actualizado: item.ultimaActualizacion
                        };
                    }
                });
            }

            res.statusCode = 200;
            res.end(JSON.stringify({
                status: "success",
                bcv_y_paralelo: dolarApi.status === 'fulfilled' ? dolarApi.value : null,
                binance_promedio_usdt: binanceData.status === 'fulfilled' ? binanceData.value : null
            }, null, 2));

        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Error al obtener tasas", detalle: error.message }));
        }
        return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Ruta no encontrada" }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
