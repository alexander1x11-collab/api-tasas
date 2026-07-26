const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/tasas', async (req, res) => {
    try {
        const response = await fetch('https://montosve.com/api/v1/fx/rates', {
            method: 'GET',
            headers: {
                'X-API-Key': process.env.API_KEY
            }
        });

        const data = await response.json();
        
        res.json({
            success: true,
            tasas: data
        });
    } catch (error) {
        console.error('Error al obtener las tasas:', error);
        res.status(500).json({ success: false, error: 'No se pudieron cargar las tasas' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
