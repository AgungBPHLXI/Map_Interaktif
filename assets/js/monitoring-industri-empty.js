// =====================================================
// PRODUKSI INDUSTRI 6000 UP - STATUS KOSONG
// Belum ada sumber data Google Sheet yang digunakan.
// Jangan membuat data contoh/dummy atau grafik sintetis.
// =====================================================
(function () {
    function removeEmptyState() {
        const state = document.getElementById('dashboardIndustriEmptyState');
        if (state) state.remove();
        const wrap = document.querySelector('.dashboard-chart-wrap');
        if (wrap) wrap.classList.remove('dashboard-chart-wrap--empty');
        const chart = document.getElementById('chartKawasan');
        const chartAll = document.getElementById('chartSemua');
        if (chart) chart.style.display = 'block';
        if (chartAll) chartAll.style.display = 'none';
    }

    // Bersihkan tampilan kosong ketika pengguna membuka dashboard monitoring lain.
    ['loadKawasan', 'loadPenanaman', 'loadProduksi'].forEach((name) => {
        const original = window[name];
        if (typeof original === 'function') {
            window[name] = function () {
                removeEmptyState();
                return original.apply(this, arguments);
            };
        }
    });

    window.loadProduksiIndustri = function () {
        removeEmptyState();

        const overlay = document.getElementById('chartOverlay');
        const chartPanel = document.getElementById('dashboardChartPanel');
        const tablePanel = document.getElementById('dashboardTablePanel');
        const chartButton = document.getElementById('btnDashboardChart');
        const tableButton = document.getElementById('btnDashboardTable');
        const status = document.getElementById('dashboardStatus');
        const kpi = document.getElementById('dashboardKpi');
        const chart = document.getElementById('chartKawasan');
        const chartAll = document.getElementById('chartSemua');
        const wrap = document.querySelector('.dashboard-chart-wrap');

        overlay.style.display = 'block';
        overlay.setAttribute('aria-hidden', 'false');
        overlay.style.left = '';
        overlay.style.top = '';
        overlay.style.transform = '';
        overlay.style.margin = '';

        if (typeof chartInstance !== 'undefined' && chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        if (typeof chartSemuaInstance !== 'undefined' && chartSemuaInstance) {
            chartSemuaInstance.destroy();
            chartSemuaInstance = null;
        }

        document.getElementById('dashboardEyebrow').textContent = 'MONITORING BPHL XI';
        document.getElementById('dashboardTitle').textContent = 'Produksi Industri 6000 UP';
        document.getElementById('dashboardSubtitle').textContent = 'Data produksi akan ditampilkan setelah sumber Google Sheet tersedia.';
        document.getElementById('dashboardChartTitle').textContent = 'Produksi Industri 6000 UP';
        document.getElementById('dashboardChartHint').textContent = 'Belum ada data sumber yang ditampilkan';
        document.getElementById('dashboardLegendHint').textContent = '';
        document.getElementById('dashboardTableTitle').textContent = 'Data Produksi Industri 6000 UP';
        document.getElementById('dashboardTableHint').textContent = 'Belum ada data Google Sheet yang digunakan.';

        kpi.innerHTML = `
            <div class="monitoring-kpi-card">
                <span class="monitoring-kpi-card__label">STATUS DATA</span>
                <strong class="monitoring-kpi-card__value">-</strong>
                <span class="monitoring-kpi-card__note">Belum tersedia</span>
            </div>
            <div class="monitoring-kpi-card">
                <span class="monitoring-kpi-card__label">JUMLAH DATA</span>
                <strong class="monitoring-kpi-card__value">0</strong>
                <span class="monitoring-kpi-card__note">Tidak ada data ditambahkan</span>
            </div>
            <div class="monitoring-kpi-card">
                <span class="monitoring-kpi-card__label">GRAFIK</span>
                <strong class="monitoring-kpi-card__value">-</strong>
                <span class="monitoring-kpi-card__note">Menunggu sumber data</span>
            </div>
            <div class="monitoring-kpi-card">
                <span class="monitoring-kpi-card__label">SUMBER</span>
                <strong class="monitoring-kpi-card__value">-</strong>
                <span class="monitoring-kpi-card__note">Google Sheet belum ditentukan</span>
            </div>`;

        status.textContent = 'Belum ada data Produksi Industri 6000 UP.';
        chartPanel.hidden = false;
        tablePanel.hidden = true;
        chartButton.classList.add('is-active');
        tableButton.classList.remove('is-active');

        chart.style.display = 'none';
        chartAll.style.display = 'none';
        wrap.classList.add('dashboard-chart-wrap--empty');

        const empty = document.createElement('div');
        empty.id = 'dashboardIndustriEmptyState';
        empty.className = 'dashboard-empty dashboard-empty--monitoring';
        empty.innerHTML = '<strong>Belum ada data produksi industri.</strong><span>Dashboard ini sengaja dikosongkan sampai sumber Google Sheet tersedia. Tidak ada data contoh atau data buatan yang ditampilkan.</span>';
        wrap.appendChild(empty);
    };
})();
