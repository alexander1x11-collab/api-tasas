const https = require('https');

// Función automática que extrae la tasa de la web de montosve.com sin intervención manual
function fetchMontosVe() {
    return new Promise((resolve) => {
        https.get('https://montosve.com/ilsy-socorro-morenos-team/dashboard', { 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
            } 
        }, (res) => {
            let html = '';
            res.on('data', chunk => html += chunk);
            res.on('end', () => {
                try {
                    // Lee automáticamente el HTML y busca el valor del dólar BCV y la fecha
                    const matchDolar = html.match(/BCV[\s\S]*?([0-9]+\.[0-9]{2})\s*<\/div>\s*<p[^>]*>USD\/VES<\/p>/i);
                    const matchEuro = html.match(/EUR\/VES<\/p>\s*<p[^>]*>([0-9]+\.[0-9]{2})<\/p>/i);
                    const matchFecha = html.match(/data-flux-text="">([0-9]{2}\/[0-9]{2}\/[0-9]{4})<\/p>/i);

                    resolve({
                        dolar_bcv: matchDolar ? Number(matchDolar[1]) : null,
                        euro_bcv: matchEuro ? Number(matchEuro[1]) : null,
                        fecha: matchFecha ? matchFecha[1] : null
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
        res.end(JSON.stringify({ mensaje: "Servidor sincronizado automáticamente con MontosVe y Binance" }));
        return;
    }

    if (req.url === '/api/tasas') {
        try {
            const [montosData, binanceP2P] = await Promise.allSettled([
                fetchMontosVe(),
                fetchBinanceP2P()
            ]);

            let montos = montosData.status === 'fulfilled' ? montosData.value : null;
            let promedioBinance = binanceP2P.status === 'fulfilled' ? binanceP2P.value : null;

            res.statusCode = 200;
            res.end(JSON.stringify({
                status: "success",
                actualizado: new Date().toISOString(),
                tasas_venezuela: {
                    dolar_bcv_oficial: montos ? montos.dolar_bcv : null,
                    euro_bcv_oficial: montos ? montos.euro_bcv : null,
                    fecha_tasa: montos ? montos.fecha : null,
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
