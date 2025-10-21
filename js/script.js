// js/script.js (Reemplaza tu archivo con este código)

// --- URLs de la API (Coinlore) ---
const URL_COINS = `https://api.coinlore.net/api/tickers/`;
const EXCHANGES_URL = "https://api.coinlore.net/api/exchanges/";

// --- Variables Globales ---
let exchangesData = [],
    coinsData = [],
    chartCoins,
    chartExchanges;

// --- Helper para seleccionar elementos ---
const el = (id) => document.getElementById(id);

/**
 * Función principal para cargar y refrescar todos los datos.
 */
const refresh = async () => {
    try {
        const [resCoins, resExchanges] = await Promise.all([
            axios.get(URL_COINS),
            axios.get(EXCHANGES_URL)
        ]);

        // 1. Procesar datos
        coinsData = resCoins.data.data;
        exchangesData = Object.values(resExchanges.data);

        // 2. Actualizar el Dashboard
        updateKPIs(coinsData, exchangesData); // <-- LLAMADA A LA FUNCIÓN DE KPIs

        const top10Coins = [...coinsData]
            .sort((a, b) => parseFloat(b.price_usd) - parseFloat(a.price_usd))
            .slice(0, 10);
        renderCoinChart(top10Coins);

        const top10Exchanges = [...exchangesData]
            .sort((a, b) => parseFloat(b.volume_usd) - parseFloat(a.volume_usd))
            .slice(0, 10);
        renderExchangeChart(top10Exchanges);

    } catch (error) {
        console.error("Error al cargar datos de la API:", error);
    }
};

/**
 * REQUISITO: Mostrar total, precio medio y moneda más cara.
 * (NUEVA FUNCIÓN)
 */
function updateKPIs(coins, exchanges) {
    // 1. Mostrar el total de casas de cambio
    el('total-exchanges').textContent = exchanges.length;

    // 2. Mostrar el precio medio de cambio (del Top 100 de monedas)
    const avgPrice = coins.reduce((sum, coin) => sum + parseFloat(coin.price_usd), 0) / coins.length;
    el('avg-price').textContent = fmtUSD(avgPrice);

    // 3. Mostrar la moneda más cara (del Top 100)
    const mostExpensiveCoin = [...coins].sort((a, b) => parseFloat(b.price_usd) - parseFloat(a.price_usd))[0];
    el('top-coin').textContent = mostExpensiveCoin.name;
}


// --- Funciones Helpers y de Gráficas (sin cambios) ---

const getColorPalette = (count) => {
    const base = [
        "#06d6a0", "#4cc9f0", "#f72585", "#ffd166", "#48bfe3", "#8338ec",
        "#ff7b00", "#80ed99", "#00f5d4", "#a2d2ff", "#ef476f", "#06b6d4",
        "#22c55e", "#f59e0b", "#38bdf8",
    ];
    return Array.from({ length: count }, (_, i) => base[i % base.length]);
};

const fmtUSD = (n) => {
    n = parseFloat(n);
    if (!n) return "—";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(2) + "K";
    return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

function renderCoinChart(dataTop) {
    const labels = dataTop.map((x) => x.name);
    const volumes = dataTop.map((x) => parseFloat(x.price_usd));
    const colors = getColorPalette(labels.length);
    const ctx = el("chartCoin").getContext("2d");
    if (chartCoins) chartCoins.destroy();
    chartCoins = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Precio (USD)",
                data: volumes,
                backgroundColor: colors.map((c) => c + "cc"),
                borderColor: colors,
                borderWidth: 1.5,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: window.devicePixelRatio, // <-- Mejora la nitidez
            scales: {
                y: { ticks: { callback: (v) => fmtUSD(v) } }
            },
            plugins: { legend: { display: false } },
        },
    });
}

function renderExchangeChart(dataTop) {
    const labels = dataTop.map((x) => x.name);
    const volumes = dataTop.map((x) => parseFloat(x.volume_usd));
    const colors = getColorPalette(labels.length);
    const ctx = el("chartExchanges").getContext("2d");
    if (chartExchanges) chartExchanges.destroy();
    chartExchanges = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Volumen 24h (USD)",
                data: volumes,
                backgroundColor: colors.map((c) => c + "cc"),
                borderColor: colors,
                borderWidth: 1.5,
            }],
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: window.devicePixelRatio, // <-- Mejora la nitidez
            scales: {
                x: { ticks: { callback: (v) => fmtUSD(v) } }
            },
            plugins: { legend: { display: false } },
        },
    });
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    refresh();
    el("btnReload").addEventListener("click", () => refresh());
 
});