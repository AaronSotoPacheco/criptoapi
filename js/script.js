// --- URLs de la API (Coinlore) ---
// (URL_COINS ya trae las 100 principales por defecto)
const URL_COINS = `https://api.coinlore.net/api/tickers/`; 
// (Esta es la URL correcta para la lista de casas de cambio)
const EXCHANGES_URL = "https://api.coinlore.net/api/exchanges/";

// --- Variables Globales ---
let exchangesData = [], // Almacenará todas las casas de cambio
    coinsData = [],     // Almacenará todas las monedas
    chartCoins,         // Instancia del gráfico de monedas
    chartExchanges;     // Instancia del gráfico de casas de cambio

// --- Helper para seleccionar elementos ---
const el = (id) => document.getElementById(id);

/**
 * Función principal para cargar y refrescar todos los datos.
 */
let refresh = async () => {
    try {
        console.log("Cargando datos...");
        
        // Hacemos las peticiones en paralelo para más velocidad
        const [resCoins, resExchanges] = await Promise.all([
            axios.get(URL_COINS),
            axios.get(EXCHANGES_URL)
        ]);

        // --- 1. Procesar Datos de Monedas ---
        coinsData = resCoins.data.data;
        console.log("Data API COINS:", coinsData);

        // --- 2. Procesar Datos de Casas de Cambio ---
        // (La API de Exchanges devuelve un objeto, lo convertimos a array)
        exchangesData = Object.values(resExchanges.data);
        console.log("Data API EXCHANGES:", exchangesData);

        // --- 3. Actualizar el Dashboard ---
        
        // Rellenar las tarjetas KPI
        updateKPIs(coinsData, exchangesData);

        // Graficar Top 10 Monedas (por precio)
        const top10Coins = [...coinsData]
            .sort((a, b) => parseFloat(b.price_usd) - parseFloat(a.price_usd))
            .slice(0, 10);
        renderCoinChart(top10Coins);

        // Graficar Top 10 Casas de Cambio (por volumen)
        const top10Exchanges = [...exchangesData]
            .sort((a, b) => parseFloat(b.volume_usd) - parseFloat(a.volume_usd))
            .slice(0, 10);
        renderExchangeChart(top10Exchanges);

        console.log("Dashboard actualizado.");

    } catch (error) {
        console.error("Error al cargar datos de la API:", error);
        // Aquí podrías mostrar un error al usuario
    }
}

/**
 * REQUISITO: Mostrar total, precio medio y moneda más cara.
 */
function updateKPIs(coins, exchanges) {
    // Asegúrate de tener estos IDs en tu HTML
    if (el('total-exchanges')) {
        el('total-exchanges').textContent = exchanges.length;
    }

    if (el('avg-price')) {
        const avgPrice = coins.reduce((sum, coin) => sum + parseFloat(coin.price_usd), 0) / coins.length;
        el('avg-price').textContent = fmtUSD(avgPrice);
    }
    
    if (el('top-coin')) {
        // (Ya vienen ordenadas por market cap, pero para "más cara" re-ordenamos por precio)
        const topCoin = [...coins].sort((a, b) => parseFloat(b.price_usd) - parseFloat(a.price_usd))[0];
        el('top-coin').textContent = topCoin.name;
    }
}

// --- Funciones Helpers (Color y Formato) ---

const getColorPalette = (count) => {
    const base = [
        "#06d6a0", "#4cc9f0", "#f72585", "#ffd166", "#48bfe3",
        "#8338ec", "#ff7b00", "#80ed99", "#00f5d4", "#a2d2ff",
        "#ef476f", "#06b6d4", "#22c55e", "#f59e0b", "#38bdf8",
    ];
    return Array.from({ length: count }, (_, i) => base[i % base.length]);
};

const fmtUSD = (n) => {
    n = parseFloat(n); // Asegurarse de que es un número
    if (!n) return "—";
    if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(2) + "K";
    return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

/**
 * REQUISITO: Graficar el top 10 de monedas.
 * (Tu función original, solo cambié el nombre de la variable global)
 */
function renderCoinChart(dataTop) {
    const labels = dataTop.map((x) => x.name);
    const volumes = dataTop.map((x) => parseFloat(x.price_usd)); // Usar parseFloat
    const colors = getColorPalette(labels.length);
    
    // Asegúrate de que tu canvas tenga id="chartCoin"
    const ctx = el("chartCoin").getContext("2d");

    if (chartCoins) chartCoins.destroy(); // CORREGIDO: Usar variable chartCoins
    
    chartCoins = new Chart(ctx, { // CORREGIDO: Usar variable chartCoins
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Precio (USD)", // Etiqueta corregida
                    data: volumes,
                    backgroundColor: colors.map((c) => c + "cc"),
                    borderColor: colors,
                    borderWidth: 1.5,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: "#c2c8d6" },
                    grid: { color: "rgba(255,255,255,0.06)" },
                },
                y: {
                    ticks: { color: "#c2c8d6", callback: (v) => fmtUSD(v) },
                    grid: { color: "rgba(255,255,255,0.06)" },
                },
            },
            plugins: { 
                legend: { 
                    labels: { color: "#d6dbea" },
                    display: false // Oculto para parecerse a la imagen
                } 
            },
        },
    });
}

/**
 * REQUISITO: Graficar el top 10 de casas de cambio.
 * (NUEVA FUNCIÓN)
 */
function renderExchangeChart(dataTop) {
    const labels = dataTop.map((x) => x.name);
    const volumes = dataTop.map((x) => parseFloat(x.volume_usd)); // Usar volume_usd
    const colors = getColorPalette(labels.length);

    // Asegúrate de que tu canvas tenga id="chartExchanges"
    const ctx = el("chartExchanges").getContext("2d");

    if (chartExchanges) chartExchanges.destroy();
    
    chartExchanges = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Volumen 24h (USD)",
                    data: volumes,
                    backgroundColor: colors.map((c) => c + "cc"),
                    borderColor: colors,
                    borderWidth: 1.5,
                },
            ],
        },
        options: {
            indexAxis: 'y', // <-- HACE LA GRÁFICA HORIZONTAL
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: "#c2c8d6", callback: (v) => fmtUSD(v) },
                    grid: { color: "rgba(255,255,255,0.06)" },
                },
                y: {
                    ticks: { color: "#c2c8d6" },
                    grid: { display: false }, // Ocultar líneas de grid en Y
                },
            },
            plugins: { 
                legend: { 
                    labels: { color: "#d6dbea" },
                    display: false // Oculto para parecerse a la imagen
                } 
            },
        },
    });
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    refresh();
    
    // Evento para el botón de recargar
    if (el("btnReload")) {
        el("btnReload").addEventListener("click", () => refresh());
    }

    /**
     * REQUISITO: Programar el buscador por tabla.
     */
    if (el("exchange-search")) {
        el("exchange-search").addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            // Filtramos la lista COMPLETA
            const filtered = exchangesData.filter(ex => 
                ex.name.toLowerCase().includes(searchTerm)
            );

            // Ordenamos y tomamos el Top 10 de los resultados filtrados
            const top10Filtered = filtered
                .sort((a, b) => parseFloat(b.volume_usd) - parseFloat(a.volume_usd))
                .slice(0, 10);
            
            // Volvemos a renderizar la gráfica con los datos filtrados
            renderExchangeChart(top10Filtered);
        });
    }
});