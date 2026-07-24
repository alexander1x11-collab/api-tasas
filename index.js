const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// Ruta principal para que devuelva las tasas
app.get('/', (req, res) => {
    res.json({
        estado: "Activo",
        bcv: "36.50", // (Aquí iría la lógica o el valor que extraigas)
        euro: "39.20",
        usdt: "37.10",
        actualizado: new Date()
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
