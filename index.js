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
        res.end(JSON.stringify({ mensaje: "Servidor de tasas multi-fuente activo" }));
        return;
    }

    if (req.url === '/api/tasas') {
        try {
            // Consultamos en paralelo DolarApi, PyDolarVenezuela y Binance P2P
            const [dolarApi, pyDolar, binanceData] = await Promise.allSettled([
                fetchJson('https://ve.dolarapi.com/v1/dolares'),
                fetchJson('https://pydolarvenezuela-api.vercel.app/api/v1/dollar'),
                fetchBinanceP2P()
            ]);

            res.statusCode = 200;
            res.end(JSON.stringify({
                status: "success",
                bcv_y_paralelo: dolarApi.status === 'fulfilled' ? dolarApi.value : null,
                pydolar_venezuela: pyDolar.status === 'fulfilled' ? pyDolar.value : null,
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
