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
                    reject(new Error("Respuesta JSON inválida de " + url));
                }
            });
        }).on('error', err => reject(err));
    });
}

// Función para consultar la tasa oficial directa desde el BCV (o un servicio intermediario confiable de tasas oficiales de Venezuela)
function fetchBcvOficial() {
    return new Promise((resolve, reject) => {
        // Usamos una API pública de confianza orientada a tasas oficiales de Venezuela o el portal del BCV
        https.get('https://pydolarve.org/api/v1/dollar?monitor=bcv', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    // Extraemos el valor oficial del BCV actual / fecha valor
                    const precioBcv = parsed.price ? Number(parsed.price) : null;
                    resolve(precioBcv);
                } catch (e) {
                    reject(new Error("Error procesando tasa oficial BCV"));
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
        res.end(JSON.stringify({ mensaje: "Servidor de tasas optimizado activo con BCV" }));
        return;
    }

    if (req.url === '/api/tasas') {
        try {
            const [bcvOficial, currencyEur, openErUsd, openErEur, binanceP2P] = await Promise.allSettled([
                fetchBcvOficial(),
                fetchJson('https://latest.currency-api.pages.dev/v1/currencies/eur.json'),
                fetchJson('https://open.er-api.com/v6/latest/USD'),
                fetchJson('https://open.er-api.com/v6/latest/EUR'),
                fetchBinanceP2P()
            ]);

            let tasaBcvOficial = bcvOficial.status === 'fulfilled' ? bcvOficial.value : null;
            let tasaUsdOpenEr = openErUsd.status === 'fulfilled' ? openErUsd.value.rates?.VES : null;
            let tasaEurOpenEr = openErEur.status === 'fulfilled' ? openErEur.value.rates?.VES : null;
            let tasaEurCurrencyApi = currencyEur.status === 'fulfilled' ? currencyEur.value.eur?.ves : null;
            let promedioBinance = binanceP2P.status === 'fulfilled' ? binanceP2P.value : null;

            res.statusCode = 200;
            res.end(JSON.stringify({
                status: "success",
                actualizado: new Date().toISOString(),
                tasas_venezuela: {
                    dolar_bcv_oficial: tasaBcvOficial,
                    dolar_usdt_binance: promedioBinance,
                    dolar_open_er: tasaUsdOpenEr ? Number(tasaUsdOpenEr.toFixed(2)) : null,
                    euro_open_er: tasaEurOpenEr ? Number(tasaEurOpenEr.toFixed(2)) : null,
                    euro_currency_api: tasaEurCurrencyApi ? Number(tasaEurCurrencyApi.toFixed(2)) : null
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
