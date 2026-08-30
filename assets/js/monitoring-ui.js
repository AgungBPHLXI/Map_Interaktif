// =====================================================
// MONITORING UI
// Lapisan presentasi bersama untuk 4 dashboard Google Sheet.
// Sumber spreadsheet tetap sama. Akses dibuat fallback agar
// tidak bergantung pada layanan yang dapat menampilkan API key required.
// =====================================================

(function () {
    const overlay = document.getElementById('chartOverlay');
    const chartCanvas = document.getElementById('chartKawasan');
    const allCanvas = document.getElementById('chartSemua');
    const kpi = document.getElementById('dashboardKpi');
    const status = document.getElementById('dashboardStatus');
    const chartPanel = document.getElementById('dashboardChartPanel');
    const tablePanel = document.getElementById('dashboardTablePanel');
    const tableContent = document.getElementById('dashboardContent');
    const chartButton = document.getElementById('btnDashboardChart');
    const tableButton = document.getElementById('btnDashboardTable');
    const reloadButton = document.getElementById('btnDashboardReset');

    let activeLoader = null;
    let activeDashboard = null;
    let lastRows = [];

    const number = value => Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });
    const safe = value => String(value ?? '-').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

    function parseValue(value){
        if(value === null || value === undefined || value === '') return 0;
        return parseFloat(String(value).replace(/\./g, '').replace(',', '.')) || 0;
    }

    function resetDashboard(){
        overlay.style.display = 'block';
        overlay.setAttribute('aria-hidden', 'false');
        overlay.style.left = '';
        overlay.style.top = '';
        overlay.style.transform = '';
        overlay.style.margin = '';
        allCanvas.style.display = 'none';
        chartCanvas.style.display = 'block';
        kpi.innerHTML = '';
        tableContent.innerHTML = '';
        lastRows = [];
        status.textContent = 'Memuat data dari sumber monitoring…';
        chartPanel.hidden = false;
        tablePanel.hidden = true;
        chartButton.classList.add('is-active');
        tableButton.classList.remove('is-active');
        if(typeof chartInstance !== 'undefined' && chartInstance){ chartInstance.destroy(); chartInstance = null; }
        if(typeof chartSemuaInstance !== 'undefined' && chartSemuaInstance){ chartSemuaInstance.destroy(); chartSemuaInstance = null; }
    }

    function setHeader(config){
        document.getElementById('dashboardEyebrow').textContent = 'MONITORING BPHL XI';
        document.getElementById('dashboardTitle').textContent = config.title;
        document.getElementById('dashboardSubtitle').textContent = config.subtitle || 'Data dimuat langsung dari Google Sheet monitoring.';
        document.getElementById('dashboardChartTitle').textContent = config.chartTitle || 'Visualisasi Data';
        document.getElementById('dashboardChartHint').textContent = config.chartHint || 'Ringkasan visual data monitoring';
        document.getElementById('dashboardTableTitle').textContent = 'Data Detail';
        document.getElementById('dashboardTableHint').textContent = 'Tampilan tabel menggunakan data yang sama dengan grafik.';
        document.getElementById('dashboardLegendHint').textContent = config.unit ? `Satuan: ${config.unit}` : '';
    }

    function setKpi(cards){
        kpi.innerHTML = cards.map(card => `
            <div class="monitoring-kpi-card">
                <span class="monitoring-kpi-card__label">${safe(card.label)}</span>
                <strong class="monitoring-kpi-card__value">${safe(card.value)}</strong>
                ${card.note ? `<span class="monitoring-kpi-card__note">${safe(card.note)}</span>` : ''}
            </div>
        `).join('');
    }

    function renderTable(rows, columns){
        lastRows = rows;
        if(!rows.length){
            tableContent.innerHTML = '<div class="dashboard-empty">Tidak ada data yang dapat ditampilkan.</div>';
            return;
        }
        tableContent.innerHTML = `<table><thead><tr>${columns.map(c => `<th>${safe(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${columns.map(c => `<td>${safe(c.format ? c.format(row[c.key], row) : row[c.key])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }

    function showError(message){
        status.textContent = 'Gagal memuat data.';
        chartPanel.hidden = true;
        tablePanel.hidden = false;
        tableContent.innerHTML = `<div class="dashboard-error">${safe(message)}</div>`;
    }

    // =====================================================
    // PEMBACA GOOGLE SHEET TANPA API KEY
    // =====================================================
    function parseGoogleVisualization(text){
        const start = text.indexOf('google.visualization.Query.setResponse(');
        if(start === -1) throw new Error('Respons Google Sheet tidak dikenali');

        const jsonStart = text.indexOf('{', start);
        const jsonEnd = text.lastIndexOf(')');
        if(jsonStart === -1 || jsonEnd === -1) throw new Error('Format respons Google Sheet tidak valid');

        const json = JSON.parse(text.substring(jsonStart, jsonEnd));
        if(json.status !== 'ok') throw new Error(json.errors?.[0]?.detailed_message || 'Google Sheet tidak dapat dibaca');

        const cols = json.table?.cols || [];
        const rows = json.table?.rows || [];

        return rows.map(row => {
            const item = {};
            cols.forEach((col, index) => {
                const key = col.label || col.id || `Kolom ${index + 1}`;
                const cell = row.c ? row.c[index] : null;
                item[key] = cell && cell.v !== null && cell.v !== undefined
                    ? (cell.f !== null && cell.f !== undefined ? cell.f : cell.v)
                    : '';
            });
            return item;
        }).filter(row => Object.values(row).some(value => String(value ?? '').trim() !== ''));
    }

    async function fetchGoogleVisualization(spreadsheetId, sheetName){
        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
        const response = await fetch(url, { cache: 'no-store' });
        if(!response.ok) throw new Error(`Google Sheet HTTP ${response.status}`);
        return parseGoogleVisualization(await response.text());
    }

    async function fetchSheet(spreadsheetId, sheetName){
        // Jalur utama: Google Visualization langsung.
        // Tidak membutuhkan API key dan memakai spreadsheet yang sama.
        try{
            return await fetchGoogleVisualization(spreadsheetId, sheetName);
        }catch(googleError){
            console.warn('Akses langsung Google Sheet gagal, mencoba OpenSheet:', googleError);
        }

        // Fallback kompatibilitas untuk konfigurasi lama.
        const url = `${API_CONFIG.baseURL}/${spreadsheetId}/${encodeURIComponent(sheetName)}`;
        const response = await fetch(url, { cache: 'no-store' });
        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if(!Array.isArray(data)) throw new Error('Format data tidak sesuai');
        return data;
    }

    function renderBar(labels, datasets, options = {}){
        if(typeof chartInstance !== 'undefined' && chartInstance){ chartInstance.destroy(); }
        chartInstance = new Chart(chartCanvas, {
            type:'bar',
            data:{ labels, datasets },
            options:{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{
                    legend:{ position:'top' },
                    tooltip:{ callbacks:{ label(ctx){ return `${ctx.dataset.label}: ${number(ctx.raw)}${options.unit ? ` ${options.unit}` : ''}`; } } }
                },
                scales:{
                    x:{ stacked:!!options.stacked, ticks:{ maxRotation:45, minRotation:0, autoSkip:false, font:{ size:11 } } },
                    y:{ stacked:!!options.stacked, beginAtZero:true, ticks:{ callback:v => number(v) } }
                }
            }
        });
    }

    function openDashboard(config){
        resetDashboard();
        setHeader(config);
        activeDashboard = config;
    }

    async function loadKawasanDashboard(){
        openDashboard({ title:'Luas Kawasan Hutan', subtitle:'Distribusi luas kawasan hutan per kabupaten.', chartTitle:'Luas Kawasan Hutan per Kabupaten', chartHint:'Komposisi HL, HP, HPK, HPT, dan HK', unit:'Ha' });
        try{
            const data = await fetchSheet(CONFIG.spreadsheetKawasan, 'Kawasan');
            const rows = data.filter(r => r['Kabupaten'] && r['Kabupaten'] !== 'Total Luas');
            const keys = ['HL (Ha)','HP (Ha)','HPK (Ha)','HPT (Ha)','HK (Ha)'];
            const totals = keys.map(key => rows.reduce((sum,row) => sum + parseValue(row[key]), 0));
            setKpi([
                {label:'Total Kawasan', value:`${number(totals.reduce((a,b)=>a+b,0))} Ha`, note:`${rows.length} kabupaten`},
                {label:'HL', value:`${number(totals[0])} Ha`},
                {label:'HP', value:`${number(totals[1])} Ha`},
                {label:'HK', value:`${number(totals[4])} Ha`}
            ]);
            renderBar(rows.map(r=>r['Kabupaten']), keys.map(key => ({ label:key.replace(' (Ha)',''), data:rows.map(r=>parseValue(r[key])) })), { stacked:true, unit:'Ha' });
            renderTable(rows, [{key:'Kabupaten',label:'Kabupaten'}, ...keys.map(key=>({key,label:key,format:v=>number(parseValue(v))}))]);
            status.textContent = `Data berhasil dimuat • ${rows.length} kabupaten`;
        }catch(error){ console.error(error); showError('Data Luas Kawasan Hutan tidak dapat dimuat dari Google Sheet.'); }
    }

    async function loadPenanamanDashboard(){
        openDashboard({ title:'Penanaman PBPH', subtitle:'Perbandingan rencana dan realisasi penanaman PBPH.', chartTitle:'Rencana vs Realisasi Penanaman', chartHint:'Capaian per PBPH', unit:'Ha' });
        try{
            const data = await fetchSheet(CONFIG.spreadsheetPenanaman, 'Penanaman');
            const periode = (data[0] && data[0]['Periode']) || '-';
            const rows = data.filter(r => r['Nama PBPH']);
            const totalRencana = rows.reduce((s,r)=>s+parseValue(r['Rencana']),0);
            const totalRealisasi = rows.reduce((s,r)=>s+parseValue(r['Realisasi']),0);
            const capaian = totalRencana ? totalRealisasi / totalRencana * 100 : 0;
            setKpi([
                {label:'Periode',value:periode,note:'Sumber Google Sheet'},
                {label:'Total Rencana',value:`${number(totalRencana)} Ha`},
                {label:'Total Realisasi',value:`${number(totalRealisasi)} Ha`},
                {label:'Capaian',value:`${number(capaian)}%`,note:`${rows.length} PBPH`}
            ]);
            renderBar(rows.map(r=>r['Nama PBPH']), [{label:'Rencana (Ha)',data:rows.map(r=>parseValue(r['Rencana']))},{label:'Realisasi (Ha)',data:rows.map(r=>parseValue(r['Realisasi']))}], {unit:'Ha'});
            renderTable(rows,[{key:'Nama PBPH',label:'Nama PBPH'},{key:'Rencana',label:'Rencana (Ha)',format:v=>number(parseValue(v))},{key:'Realisasi',label:'Realisasi (Ha)',format:v=>number(parseValue(v))}]);
            status.textContent = `Data berhasil dimuat • Periode ${periode}`;
        }catch(error){ console.error(error); showError('Data Penanaman PBPH tidak dapat dimuat dari Google Sheet.'); }
    }

    async function loadProduksiDashboard(){
        openDashboard({ title:'Produksi PBPH', subtitle:'Perbandingan rencana dan realisasi produksi kayu bulat PBPH.', chartTitle:'Rencana vs Realisasi Produksi Kayu Bulat', chartHint:'Capaian per PBPH', unit:'m³' });
        try{
            const data = await fetchSheet(CONFIG.spreadsheetProduksi, 'Produksi Kayu Bulat');
            const rows = data.filter(r => r['Nama PBPH']);
            const periodeRow = data.find(r => r['Periode']);
            const periode = periodeRow ? periodeRow['Periode'] : '-';
            const totalRencana = rows.reduce((s,r)=>s+parseValue(r['Rencana']),0);
            const totalRealisasi = rows.reduce((s,r)=>s+parseValue(r['Realisasi']),0);
            const capaian = totalRencana ? totalRealisasi / totalRencana * 100 : 0;
            setKpi([
                {label:'Periode',value:periode,note:'Sumber Google Sheet'},
                {label:'Total Rencana',value:`${number(totalRencana)} m³`},
                {label:'Total Realisasi',value:`${number(totalRealisasi)} m³`},
                {label:'Capaian',value:`${number(capaian)}%`,note:`${rows.length} PBPH`}
            ]);
            renderBar(rows.map(r=>r['Nama PBPH']), [{label:'Rencana Volume (m³)',data:rows.map(r=>parseValue(r['Rencana']))},{label:'Realisasi Volume (m³)',data:rows.map(r=>parseValue(r['Realisasi']))}], {unit:'m³'});
            renderTable(rows,[{key:'Nama PBPH',label:'Nama PBPH'},{key:'Rencana',label:'Rencana (m³)',format:v=>number(parseValue(v))},{key:'Realisasi',label:'Realisasi (m³)',format:v=>number(parseValue(v))}]);
            status.textContent = `Data berhasil dimuat • Periode ${periode}`;
        }catch(error){ console.error(error); showError('Data Produksi PBPH tidak dapat dimuat dari Google Sheet.'); }
    }

    async function loadIndustriDashboard(){
        openDashboard({ title:'Produksi Industri 6000 UP', subtitle:'Tampilan data produksi industri dari sumber Google Sheet yang sama.', chartTitle:'Produksi Industri 6000 UP', chartHint:'Ringkasan data sumber monitoring', unit:'' });
        try{
            const candidates = ['Produksi Industri','Industri','Sheet1'];
            let data = null;
            let usedSheet = '';
            for(const sheet of candidates){
                try{ data = await fetchSheet(CONFIG.spreadsheetIndustri, sheet); usedSheet = sheet; break; }catch(e){}
            }
            if(!data) throw new Error('Sheet produksi industri tidak ditemukan');
            const rows = data.filter(row => Object.values(row).some(value => String(value ?? '').trim() !== ''));
            const columns = rows.length ? Object.keys(rows[0]) : [];
            const numericColumns = columns.filter(key => rows.some(row => parseValue(row[key]) !== 0));
            setKpi([
                {label:'Jumlah Baris',value:String(rows.length),note:`Sheet: ${usedSheet}`},
                {label:'Jumlah Kolom',value:String(columns.length)},
                {label:'Kolom Numerik',value:String(numericColumns.length)},
                {label:'Sumber',value:'Google Sheet',note:'Tanpa perubahan sumber data'}
            ]);
            if(numericColumns.length){
                const labelKey = columns.find(key => !numericColumns.includes(key)) || columns[0];
                renderBar(rows.map((r,i)=>r[labelKey] || `Data ${i+1}`), numericColumns.slice(0,4).map(key=>({label:key,data:rows.map(r=>parseValue(r[key]))})));
            }else{
                chartPanel.hidden = true;
                tablePanel.hidden = false;
                tableButton.classList.add('is-active');
                chartButton.classList.remove('is-active');
            }
            renderTable(rows, columns.map(key=>({key,label:key})));
            status.textContent = `Data berhasil dimuat • Sheet ${usedSheet}`;
        }catch(error){ console.error(error); showError('Data Produksi Industri 6000 UP tidak dapat dimuat dari Google Sheet.'); }
    }

    window.loadKawasan = function(){ activeLoader = loadKawasanDashboard; return activeLoader(); };
    window.loadPenanaman = function(){ activeLoader = loadPenanamanDashboard; return activeLoader(); };
    window.loadProduksi = function(){ activeLoader = loadProduksiDashboard; return activeLoader(); };
    window.loadProduksiIndustri = function(){ activeLoader = loadIndustriDashboard; return activeLoader(); };

    chartButton.addEventListener('click', () => {
        chartPanel.hidden = false; tablePanel.hidden = true;
        chartButton.classList.add('is-active'); tableButton.classList.remove('is-active');
    });

    tableButton.addEventListener('click', () => {
        chartPanel.hidden = true; tablePanel.hidden = false;
        tableButton.classList.add('is-active'); chartButton.classList.remove('is-active');
    });

    reloadButton.addEventListener('click', () => { if(activeLoader) activeLoader(); });

    document.getElementById('btnCloseChart').addEventListener('click', () => {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        if(typeof chartInstance !== 'undefined' && chartInstance){ chartInstance.destroy(); chartInstance = null; }
    });
})();
