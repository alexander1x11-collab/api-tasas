const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('¡La API está funcionando perfectamente!');
});

app.get('/api/tasas', async (req, res) => {
    try {
        const apiKey = process.env.API_KEY;
        
        const response = await fetch('https://montosve.com/api/v1/fx/rates', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
});
