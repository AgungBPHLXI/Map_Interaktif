// =====================================================
// PERBAIKAN MONITORING PRODUKSI PBPH
// Membaca sumber Google Sheet yang sama, dengan deteksi nama sheet
// dan header yang lebih toleran agar data tidak tampil 0 akibat
// perbedaan nama kolom.
// =====================================================
(function () {
    const SHEET_CANDIDATES = [
        'Produksi Kayu Bulat',
        'Produksi PBPH',
        'Produksi',
        'Data Produksi',
        'Sheet1',
        ''
    ];

    const normalize = value => String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[³3]/g, '3')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    const parseNumber = value => {
        if (value === null || value === undefined || value === '') return 0;
        let text = String(value).trim().replace(/\s/g, '');
        text = text.replace(/m3|m³|m&sup3;/gi, '');
        if (text.includes(',') && text.includes('.')) {
            // Format Indonesia: 1.234,56
            if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
                text = text.replace(/\./g, '').replace(',', '.');
            } else {
                text = text.replace(/,/g, '');
            }
        } else if (text.includes(',')) {
            text = text.replace(',', '.');
        } else {
            text = text.replace(/\.(?=\d{3}(?:\D|$))/g, '');
        }
        return Number.parseFloat(text) || 0;
    };

    const formatNumber = value => Number(value || 0).toLocaleString('id-ID', {
        maximumFractionDigits: 2
    });

    function parseVisualization(text) {
        const marker = 'google.visualization.Query.setResponse(';
        const start = text.indexOf(marker);
        if (start === -1) throw new Error('Respons Google Sheet tidak dikenali');

        const jsonStart = text.indexOf('{', start);
        const jsonEnd = text.lastIndexOf(')');
        const json = JSON.parse(text.substring(jsonStart, jsonEnd));
        if (json.status !== 'ok') {
            throw new Error(json.errors?.[0]?.detailed_message || 'Google Sheet tidak dapat dibaca');
        }

        const cols = json.table?.cols || [];
        return (json.table?.rows || []).map(row => {
            const item = {};
            cols.forEach((col, index) => {
                const key = String(col.label || col.id || `Kolom ${index + 1}`).trim();
                const cell = row.c?.[index];
                item[key] = cell && cell.v !== null && cell.v !== undefined
                    ? (cell.f ?? cell.v)
                    : '';
            });
            return item;
        }).filter(row => Object.values(row).some(value => String(value ?? '').trim() !== ''));
    }

    async function readSheet(sheetName) {
        const base = `https://docs.google.com/spreadsheets/d/${CONFIG.spreadsheetProduksi}/gviz/tq?tqx=out:json`;
        const url = sheetName ? `${base}&sheet=${encodeURIComponent(sheetName)}` : base;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Google Sheet HTTP ${response.status}`);
        return parseVisualization(await response.text());
    }

    function findColumn(columns, aliases) {
        const normalized = columns.map(column => ({ column, key: normalize(column) }));
        for (const alias of aliases) {
            const target = normalize(alias);
            const exact = normalized.find(item => item.key === target);
            if (exact) return exact.column;
        }
        for (const alias of aliases) {
            const target = normalize(alias);
            const partial = normalized.find(item => item.key.includes(target) || target.includes(item.key));
            if (partial) return partial.column;
        }
        return null;
    }

    function detectRows(data) {
        const columns = [...new Set(data.flatMap(row => Object.keys(row)))];
        const nameKey = findColumn(columns, [
            'Nama PBPH', 'Nama PBPH/Perusahaan', 'PBPH', 'Nama Perusahaan',
            'Nama IUPHHK', 'Perusahaan', 'Pemegang PBPH'
        ]);
        const rencanaKey = findColumn(columns, [
            'Rencana', 'Rencana Produksi', 'Target', 'Target Produksi',
            'RKTPH', 'Volume Rencana'
        ]);
        const realisasiKey = findColumn(columns, [
            'Realisasi', 'Realisasi Produksi', 'Produksi', 'Produksi Kayu Bulat',
            'Volume Realisasi', 'Realisasi Volume'
        ]);
        const periodeKey = findColumn(columns, [
            'Periode', 'Tahun', 'Tahun Periode', 'Periode Pelaporan'
        ]);

        const rows = data
            .filter(row => nameKey && String(row[nameKey] ?? '').trim() !== '')
            .filter(row => {
                const label = normalize(row[nameKey]);
                return !['total', 'jumlah', 'grand total'].includes(label);
            })
            .map(row => ({
                nama: String(row[nameKey] ?? '').trim(),
                rencana: rencanaKey ? parseNumber(row[rencanaKey]) : 0,
                realisasi: realisasiKey ? parseNumber(row[realisasiKey]) : 0,
                periode: periodeKey ? String(row[periodeKey] ?? '').trim() : ''
            }));

        return { rows, columns, nameKey, rencanaKey, realisasiKey, periodeKey };
    }

    function setKpi(cards) {
        const kpi = document.getElementById('dashboardKpi');
        kpi.innerHTML = cards.map(card => `
            <div class="monitoring-kpi-card">
                <span class="monitoring-kpi-card__label">${card.label}</span>
                <strong class="monitoring-kpi-card__value">${card.value}</strong>
                ${card.note ? `<span class="monitoring-kpi-card__note">${card.note}</span>` : ''}
            </div>
        `).join('');
    }

    function renderTable(rows) {
        const content = document.getElementById('dashboardContent');
        content.innerHTML = `
            <table>
                <thead><tr><th>Nama PBPH</th><th>Rencana (m³)</th><th>Realisasi (m³)</th></tr></thead>
                <tbody>${rows.map(row => `
                    <tr><td>${row.nama}</td><td>${formatNumber(row.rencana)}</td><td>${formatNumber(row.realisasi)}</td></tr>
                `).join('')}</tbody>
            </table>`;
    }

    function renderChart(rows) {
        const canvas = document.getElementById('chartKawasan');
        const allCanvas = document.getElementById('chartSemua');
        canvas.style.display = 'block';
        allCanvas.style.display = 'none';

        if (typeof chartInstance !== 'undefined' && chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        chartInstance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: rows.map(row => row.nama),
                datasets: [
                    { label: 'Rencana Volume (m³)', data: rows.map(row => row.rencana) },
                    { label: 'Realisasi Volume (m³)', data: rows.map(row => row.realisasi) }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatNumber(ctx.raw)} m³` } }
                },
                scales: {
                    x: { ticks: { maxRotation: 45, minRotation: 0, autoSkip: false, font: { size: 11 } } },
                    y: { beginAtZero: true, ticks: { callback: value => formatNumber(value) } }
                }
            }
        });
    }

    async function loadProduksiFixed() {
        const overlay = document.getElementById('chartOverlay');
        const status = document.getElementById('dashboardStatus');
        const chartPanel = document.getElementById('dashboardChartPanel');
        const tablePanel = document.getElementById('dashboardTablePanel');
        const chartButton = document.getElementById('btnDashboardChart');
        const tableButton = document.getElementById('btnDashboardTable');

        overlay.style.display = 'block';
        overlay.setAttribute('aria-hidden', 'false');
        document.getElementById('dashboardEyebrow').textContent = 'MONITORING BPHL XI';
        document.getElementById('dashboardTitle').textContent = 'Produksi PBPH';
        document.getElementById('dashboardSubtitle').textContent = 'Perbandingan rencana dan realisasi produksi kayu bulat PBPH.';
        document.getElementById('dashboardChartTitle').textContent = 'Rencana vs Realisasi Produksi Kayu Bulat';
        document.getElementById('dashboardChartHint').textContent = 'Capaian per PBPH';
        document.getElementById('dashboardLegendHint').textContent = 'Satuan: m³';
        document.getElementById('dashboardTableTitle').textContent = 'Data Detail Produksi PBPH';
        document.getElementById('dashboardTableHint').textContent = 'Data dari Google Sheet sumber monitoring.';
        status.textContent = 'Memuat data Produksi PBPH…';
        chartPanel.hidden = false;
        tablePanel.hidden = true;
        chartButton.classList.add('is-active');
        tableButton.classList.remove('is-active');

        try {
            let selected = null;
            let detected = null;
            let lastError = null;

            for (const sheetName of SHEET_CANDIDATES) {
                try {
                    const data = await readSheet(sheetName);
                    const result = detectRows(data);
                    if (result.rows.length && result.nameKey && (result.rencanaKey || result.realisasiKey)) {
                        selected = { data, sheetName };
                        detected = result;
                        break;
                    }
                    lastError = new Error(`Sheet ${sheetName || 'default'} tidak memiliki struktur Produksi PBPH yang dikenali`);
                } catch (error) {
                    lastError = error;
                }
            }

            if (!selected || !detected) throw lastError || new Error('Data Produksi PBPH tidak ditemukan');

            const rows = detected.rows;
            const periode = rows.find(row => row.periode)?.periode || '-';
            const totalRencana = rows.reduce((sum, row) => sum + row.rencana, 0);
            const totalRealisasi = rows.reduce((sum, row) => sum + row.realisasi, 0);
            const capaian = totalRencana > 0 ? (totalRealisasi / totalRencana) * 100 : 0;

            setKpi([
                { label: 'Periode', value: periode, note: 'Sumber Google Sheet' },
                { label: 'Total Rencana', value: `${formatNumber(totalRencana)} m³` },
                { label: 'Total Realisasi', value: `${formatNumber(totalRealisasi)} m³` },
                { label: 'Capaian', value: `${formatNumber(capaian)}%`, note: `${rows.length} PBPH` }
            ]);

            renderChart(rows);
            renderTable(rows);
            status.textContent = `Data berhasil dimuat • ${rows.length} PBPH${periode !== '-' ? ` • Periode ${periode}` : ''}`;
        } catch (error) {
            console.error('Produksi PBPH:', error);
            chartPanel.hidden = true;
            tablePanel.hidden = false;
            tableButton.classList.add('is-active');
            chartButton.classList.remove('is-active');
            document.getElementById('dashboardContent').innerHTML = `
                <div class="dashboard-error">
                    Data Produksi PBPH tidak dapat dibaca dari Google Sheet. Pastikan spreadsheet dibagikan untuk siapa saja yang memiliki link dan struktur kolom memuat nama PBPH serta nilai rencana atau realisasi.
                </div>`;
            status.textContent = 'Gagal memuat data Produksi PBPH.';
        }
    }

    // Menimpa loader lama tanpa mengubah sumber data maupun modul monitoring lain.
    window.loadProduksi = loadProduksiFixed;
})();
