const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        // Obtenemos la fecha y hora exacta en Caracas para manejar cierres y fines de semana
        const fechaCaracas = new Date().toLocaleString("en-US", { timeZone: "America/Caracas" });
        const fechaActual = new Date(fechaCaracas);
        const diaSemana = fechaActual.getDay(); // 0 = Domingo, 6 = Sábado
        const horaActual = fechaActual.getHours();

        // Indicador de fin de semana o fuera de horario de oficina (después de las 4 PM)
        let mensajeEstado = "En horario hábil";
        if (diaSemana === 0 || diaSemana === 6) {
            mensajeEstado = "Fin de semana (Usando último cierre oficial y P2P activo)";
        } else if (horaActual >= 16) {
            mensajeEstado = "Post-cierre 4:00 PM (Mostrando tasa oficial vigente y cierre)";
        }

        // Consultamos la API de alta disponibilidad con parámetro anti-cache dinámico
        const timestamp = fechaActual.getTime();
        const response = await fetch(`https://pydolarvenezuela-api.vercel.app/api/v1/dollar?_t=${timestamp}`, {
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        const data = await response.json();
        const monedas = data?.monedas || {};

        const bcvVal = monedas.bcv?.price;
        const euroVal = monedas.euro?.price;
        const usdtVal = monedas.binance?.price || monedas.enparalelovzla?.price;

        if (bcvVal) {
            return res.json({
                estado: mensajeEstado,
                bcv: bcvVal,
                euro: euroVal || bcvVal,
                usdt: usdtVal || "No disponible",
                actualizado_en_venezuela: fechaActual.toLocaleString("es-VE")
            });
        }

        throw new Error("No se pudo obtener el valor principal");

    } catch (error) {
        // Respaldo secundario infalible si la principal llega a fallar
        try {
            const backupRes = await fetch('https://ve.dolarapi.com/v1/dolares');
            const backupData = await backupRes.json();
            
            const oficial = backupData.find(item => item.fuente === 'oficial') || {};
            const binance = backupData.find(item => item.fuente === 'binance' || item.fuente === 'enparalelovzla') || {};

            res.json({
                estado: "Modo Respaldo Activo (Cierre / Finde)",
                bcv: oficial.promedio || oficial.precio || "N/A",
                euro: oficial.euro || oficial.promedio || "N/A",
                usdt: binance.promedio || binance.precio || "N/A",
                actualizado_en_venezuela: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
            });
        } catch (err) {
            res.status(500).json({ 
                error: "Error crítico al sincronizar las tasas de cierre", 
                detalles: err.message 
            });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de tasas continuas activo en el puerto ${PORT}`);
});
