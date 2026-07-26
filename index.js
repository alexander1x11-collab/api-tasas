const https = require('https');

function fetchJson(url, options = {}) {
    return new Promise((resolve, reject) => {
        const reqOptions = {
            headers: { 'User-Agent': 'Mozilla/5.0', ...options.headers }
        };
        https.get(url, reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error("Respuesta JSON inválida de " + url));
                }
            });
        }).on('error', err => reject(err));
    });
}

// Función especial para POST de Binance P2P
acentosBinance = () => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            asset: "USDT",
            fiat: "VES",
            merchantCheck: false,
            page: 1,
            payTypes: [],
            publisherType: null,
            rows: 10,
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
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error("Error parseando Binance P2P"));
                }
            });
        });

        req.on('error', err => reject(err));
        req.write(data);
        req.end();
    });
};

const server = require('http').createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.url === '/') {
        res.statusCode = 200;
        res.end(JSON.stringify({ 
            mensaje: "Servidor de Render activo y operativo",
            rutas_disponibles: [
                "/api/tasas",
                "/api/exchangerate",
                "/api/dolarapi",
                "/api/currency-api",
                "/api/binance"
            ]
        }));
        return;
    }

    // Ruta unificada con todas las tasas principales
    if (req.url === '/api/tasas') {
        try {
            const [exRateUSD, dolarApi, currencyApi, binanceP2P] = await Promise.allSettled([
                fetchJson('https://api.exchangerate-api.com/v4/latest/USD'),
                fetchJson('https://ve.dolarapi.com/v1/dolares'),
                fetchJson('https://latest.currency-api.pages.dev/v1/currencies/usd.json'),
                acentosBinance()
            ]);

            res.statusCode = 200;
            res.end(JSON.stringify({
                status: "success",
                exchangerate_api: exRateUSD.status === 'fulfilled' ? exRateUSD.value : null,
                dolarapi_ve: dolarApi.status === 'fulfilled' ? dolarApi.value : null,
                currency_api: currencyApi.status === 'fulfilled' ? currencyApi.value : null,
                binance_p2p: binanceP2P.status === 'fulfilled' ? binanceP2P.value : null
            }, null, 2));
        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Error al consolidar las tasas", detalle: error.message }));
        }
        return;
    }

    // Rutas individuales por proveedor
    if (req.url === '/api/exchangerate') {
        try {
            const data = await fetchJson('https://api.exchangerate-api.com/v4/latest/USD');
            res.statusCode = 200;
            res.end(JSON.stringify(data, null, 2));
        } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    if (req.url === '/api/dolarapi') {
        try {
            const data = await fetchJson('https://ve.dolarapi.com/v1/dolares');
            res.statusCode = 200;
            res.end(JSON.stringify(data, null, 2));
        } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    if (req.url === '/api/currency-api') {
        try {
            const data = await fetchJson('https://latest.currency-api.pages.dev/v1/currencies/usd.json');
            res.statusCode = 200;
            res.end(JSON.stringify(data, null, 2));
        } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    if (req.url === '/api/binance') {
        try {
            const data = await acentosBinance();
            res.statusCode = 200;
            res.end(JSON.stringify(data, null, 2));
        } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Ruta no encontrada" }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor multi-API corriendo en puerto ${PORT}`);
});
