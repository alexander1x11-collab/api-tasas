const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({ status: "API Online", endpoint: "/api/tasas" });
});

app.get('/api/tasas', async (req, res) => {
    try {
        const apiKey = process.env.API_KEY;
        
        const response = await fetch('https://montosve.com/api/v1/fx/rates', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error en MontosVE: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        res.json({
            success: true,
            tasas: data
        });
    } catch (error) {
        console.error('Detalle del error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'No se pudieron cargar las tasas', 
            detalle: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
