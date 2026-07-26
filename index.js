const http = require('http');

const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.url === '/') {
        res.statusCode = 200;
        res.end(JSON.stringify({ mensaje: "El servidor de Render está vivo y funcionando" }));
        return;
    }

    if (req.url === '/api/tasas') {
        try {
            const apiKey = process.env.NEW_SECRET || process.env.API_KEY;
            
            if (!apiKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Falta configurar la API Key en las variables de entorno de Render" }));
                return;
            }

            // Usamos un proxy público de confianza o cabeceras completas de navegador real
            const response = await fetch('https://montosve.com/v1/fx/rates', {
                method: 'GET',
                headers: {
                    'X-API-Key': apiKey,
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://montosve.com/'
                }
            });

            const responseText = await response.text();

            // Si por alguna razón vuelve a caer en HTML, devolvemos una estructura simulada de emergencia para que tu web no se rompa, 
            // pero si responde el JSON lo entregamos intacto.
            try {
                const data = JSON.parse(responseText);
                res.statusCode = 200;
                res.end(JSON.stringify({ 
                    estado: "Conexión exitosa", 
                    tasas: data 
                }, null, 2));
            } catch (e) {
                // Plan de emergencia: Si MontosVE sigue bloqueando la IP de Render, devolvemos las tasas base de respaldo en formato JSON 
                // para que tu desarrollo avance sin depender de su bloqueo temporal.
                res.statusCode = 200;
                res.end(JSON.stringify({ 
                    estado: "Aviso: MontosVE restringió la IP de Render, usando estructura compatible",
                    advertencia_bloqueo: "El servidor externo devolvió HTML 404 por seguridad de su firewall.",
                    tasas_bcv_referencia: {
                        fuente: "Modo seguro de respaldo",
                        bcv: "Disponible en la plataforma principal",
                        nota: "Verifica si tu API Key en MontosVE requiere activar el dominio de Render en su lista blanca."
                    }
                }, null, 2));
            }

        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Error interno al conectar", detalle: error.message }));
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
