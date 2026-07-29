const https = require('https');

// Función directa para obtener la tasa oficial desde una API JSON estable
function fetchBcvOficial() {
    return new Promise((resolve) => {
        https.get('https://pydolarve.org/api/v1/dollar?monitor=bcv', { 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
            } 
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    // Extraemos directamente el precio y la fecha oficial
                    resolve({
                        precio: parsed.price ? Number(parsed.price) : null,
                        fecha: parsed.last_update || null
                    });
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

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
                    const precios = parsed.data ? parsed.data.map(item => parseFloat(item.adv.price)) : [];
                    const promedio = precios.length > 0 ? (precios.reduce((a, b) => a + b, 0) / precios.length).toFixed(2) : null;
                    resolve(promedio ? Number(promedio) : null);
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
        res.end(JSON.stringify({ mensaje: "Servidor de tasas optimizado activo" }));
        return;
    }

    if (req.url === '/api/tasas') {
        try {
            const [bcvData, binanceP2P] = await Promise.allSettled([
                fetchBcvOficial(),
                fetchBinanceP2P()
            ]);

            let bcv = bcvData.status === 'fulfilled' ? bcvData.value : null;
            let promedioBinance = binanceP2P.status === 'fulfilled' ? binanceP2P.value : null;

            res.statusCode = 200;
            res.end(JSON.stringify({
                status: "success",
                actualizado: new Date().toISOString(),
                tasas_venezuela: {
                    dolar_bcv_oficial: bcv ? bcv.precio : null,
                    fecha_tasa: bcv ? bcv.fecha : null,
                    dolar_usdt_binance: promedioBinance
                }
            }, null, 2));

        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Error al procesar las tasas", detalle: error.message }));
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
