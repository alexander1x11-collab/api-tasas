// Función mejorada para extraer las tasas reales desde el HTML de montosve.com
function fetchMontosVe() {
    return new Promise((resolve) => {
        https.get('https://montosve.com/', { 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
            } 
        }, (res) => {
            let html = '';
            res.on('data', chunk => html += chunk);
            res.on('end', () => {
                try {
                    // Buscamos patrones comunes donde montosve.com o sitios similares imprimen los valores
                    // Por ejemplo, buscando etiquetas numéricas seguidas de Bs o clases de precios
                    // Vamos a extraer coincidencias de precios estilo "844" o similares dentro del texto
                    
                    const matches = html.match(/>\s*([0-9]{2,4}[,\.][0-9]{2})\s*</g);
                    let valoresEncontrados = matches ? matches.map(m => m.replace(/>|</g, '').trim()) : [];

                    resolve({
                        fuente: "montosve.com",
                        estado: "extraido",
                        muestra_valores: valoresEncontrados.slice(0, 5) // Mostramos los primeros valores detectados para verificar
                    });
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}
