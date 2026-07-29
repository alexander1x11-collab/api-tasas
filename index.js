const https = require('https');

// Función mejorada para leer directamente la tasa oficial desde la web del BCV
function fetchBcvDirecto() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'www.bcv.org.ve',
            port: 443,
            path: '/',
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml'
            }
        };

        const req = https.request(options, (res) => {
            let html = '';
            res.on('data', chunk => html += chunk);
            res.on('end', () => {
                try {
                    // Buscamos el bloque del dólar en el HTML del BCV usando expresiones regulares
                    // El BCV almacena la tasa dentro de un div con id "dolar" o etiqueta strong
                    const dolarMatch = html.match(/id="dolar"[^>]*>[\s\S]*?<strong>\s*([0-9,.]+)\s*<\/strong>/i);
                    if (dolarMatch && dolarMatch[1]) {
                        // Limpiamos el formato (reemplazamos coma por punto si es necesario)
                        let valorStr = dolarMatch[1].replace(/\./g, '').replace(',', '.');
                        resolve(Number(valorStr));
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        });

        req.on('error', () => resolve(null));
        req.setTimeout(5000, () => {
            req.destroy();
            resolve(null);
        });
        req.end();
    });
}
