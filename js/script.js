
// --- URLs de la API (Coinlore) ---
const URL_COINS = `https://api.coinlore.net/api/tickers/`; 
const EXCHANGES_URL = "https://api.coinlore.net/api/exchanges/";

// --- Variables Globales ---
let exchangesData = [], // Guardará el Top 100 de exchanges
    coinsData = [],     // Guardará el Top 100 de monedas
    chartCoins,
    chartExchanges;

// --- Helper para seleccionar elementos ---
const el = (id) => document.getElementById(id);

const refresh = async () => {
    try {
        const [resCoins, resExchanges] = await Promise.all([
            axios.get(URL_COINS),
            axios.get(EXCHANGES_URL)
        ]);

        // 1. Procesar datos de Monedas
        coinsData = resCoins.data.data; // Ya son el Top 100

        // 2. Procesar datos de Exchanges
      
        const allExchanges = Object.values(resExchanges.data);
        const top100Exchanges = [...allExchanges]
            .sort((a, b) => parseFloat(b.volume_usd) - parseFloat(a.volume_usd))
            .slice(0, 100); 
        
        exchangesData = top100Exchanges;
    


        // 3. Actualizar KPIs
        // (Ahora exchangesData.length será 100)
        updateKPIs(coinsData, exchangesData);

        // 4. Actualizar Gráficas (Top 10)
        const top10Coins = [...coinsData]
            .sort((a, b) => parseFloat(b.price_usd) - parseFloat(a.price_usd))
            .slice(0, 10);
        renderCoinChart(top10Coins);

        // (exchangesData ya está ordenado, solo tomamos los 10 primeros)
        const top10Exchanges = exchangesData.slice(0, 10);
        renderExchangeChart(top10Exchanges);

        // 5. Actualizar Tablas (con los datos Top 100)
        renderCoinsTable(coinsData);
        renderExchangesTable(exchangesData);

    } catch (error) {
        console.error("Error al cargar datos de la API:", error);
    }
};


function updateKPIs(coins, exchanges) {
    // el('total-exchanges') ahora mostrará 100
    el('total-exchanges').textContent = exchanges.length;

    const avgPrice = coins.reduce((sum, coin) => sum + parseFloat(coin.price_usd), 0) / coins.length;
    el('avg-price').textContent = fmtUSD(avgPrice);

    const mostExpensiveCoin = coins.reduce((max, coin) => 
        parseFloat(coin.price_usd) > parseFloat(max.price_usd) ? coin : max, coins[0]);
    el('top-coin').textContent = mostExpensiveCoin.name;
}

// --- Funciones Helpers (Formato y Color) ---
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

// --- Funciones de Gráficas ---

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
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1.5,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: window.devicePixelRatio,
            scales: { y: { ticks: { callback: (v) => fmtUSD(v) } } },
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
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1.5,
            }],
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: window.devicePixelRatio,
            scales: { x: { ticks: { callback: (v) => fmtUSD(v) } } },
            plugins: { legend: { display: false } },
        },
    });
}

// --- Funciones de Tabla ---


function renderCoinsTable(coins) {
    const tableBody = el('coins-table-body');
    tableBody.innerHTML = ''; // Limpiar tabla
    
    // --- MODIFICACIÓN: Ordenar por precio ---
    const sortedCoins = [...coins].sort((a, b) => 
        parseFloat(b.price_usd) - parseFloat(a.price_usd)
    );
    // --- FIN DE MODIFICACIÓN ---

    const rows = sortedCoins.map(coin => `
        <tr>
            <td>${coin.rank}</td>
            <td>${coin.name}</td>
            <td>${coin.symbol}</td>
            <td>${fmtUSD(coin.price_usd)}</td>
        </tr>
    `);
    
    tableBody.innerHTML = rows.join('');
}


function renderExchangesTable(exchanges) {
    const tableBody = el('exchanges-table-body');
    tableBody.innerHTML = '';
    
    // (Este array 'exchanges' ya es el Top 100)
    // Ordenamos por si acaso (ej. después de un filtro)
    const sortedExchanges = [...exchanges].sort((a, b) => parseFloat(b.volume_usd) - parseFloat(a.volume_usd));

    const rows = sortedExchanges.map((ex, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${ex.name}</td>
            <td>${fmtUSD(ex.volume_usd)}</td>
        </tr>
    `);
    
    tableBody.innerHTML = rows.join('');
}


// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    refresh();
    el("btnReload").addEventListener("click", () => refresh());
    
    el("coin-search").addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();

        // Filtra la lista global de Top 100 monedas
        const filteredCoins = coinsData.filter(coin =>
            coin.name.toLowerCase().includes(searchTerm) ||
            coin.symbol.toLowerCase().includes(searchTerm)
        );
        
        renderCoinsTable(filteredCoins);
    });


    el("exchange-search").addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();

        // Filtra la lista global de Top 100 exchanges
        const filteredExchanges = exchangesData.filter(exchange =>
            exchange.name.toLowerCase().includes(searchTerm)
        );
        
        renderExchangesTable(filteredExchanges); // Re-renderiza la tabla
    });
});