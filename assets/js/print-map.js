// =====================================================
// CETAK PETA PROFESIONAL
// Fit otomatis ke kertas, skala otomatis, legenda sesuai peta,
// koordinat geografis rapi, arah utara, dan informasi luas.
// =====================================================
(function () {
    'use strict';

    const modal = document.getElementById('printMapModal');
    const titleInput = document.getElementById('printMapTitle');
    const subtitleInput = document.getElementById('printMapSubtitle');
    const noteInput = document.getElementById('printMapNote');
    const paperSize = document.getElementById('printPaperSize');
    const orientation = document.getElementById('printOrientation');
    const showLegend = document.getElementById('printShowLegend');
    const showScale = document.getElementById('printShowScale');
    const showCoordinates = document.getElementById('printShowCoordinates');
    const showNorthArrow = document.getElementById('printShowNorthArrow');
    const showFilterNote = document.getElementById('printShowFilterNote');

    const printTitle = document.getElementById('printLayoutTitle');
    const printSubtitle = document.getElementById('printLayoutSubtitle');
    const printNote = document.getElementById('printLayoutNote');
    const printLegend = document.getElementById('printLegend');
    const printLegendItems = document.getElementById('printLegendItems');
    const coordinateGrid = document.getElementById('printCoordinateGrid');
    const printScaleBox = document.getElementById('printScaleBox');
    const printScaleText = document.getElementById('printScaleText');
    const printScaleGraphic = document.getElementById('printScaleGraphic');
    const printNorthArrow = document.getElementById('printNorthArrow');
    const printFilterSummary = document.getElementById('printFilterSummary');

    let originalView = null;
    let originalStyle = null;
    let printPrepared = false;
    let printPageStyle = null;

    const PAPER_MM = { A4: [210, 297], A3: [297, 420] };

    // Sama persis dengan warna simbologi SK 399/2024 pada peta.
    const COLORS = {
        'KSA/KPA': '#AD3FFF',
        'KSA': '#AD3FFF',
        'KPA': '#AD3FFF',
        'HK': '#AD3FFF',
        'HL': '#02AD00',
        'HPT': '#8AF200',
        'HP': '#FFFF00',
        'HPK': '#FF5EFF',
        'APL': '#FFFFFF'
    };

    function values(selector) {
        if (typeof window.$ === 'function') {
            const v = $(selector).val();
            return Array.isArray(v) ? v.filter(Boolean) : [];
        }
        const el = document.querySelector(selector);
        return el ? Array.from(el.selectedOptions).map(o => o.value).filter(Boolean) : [];
    }

    function esc(v) {
        return String(v || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' })[c]);
    }

    function filterText() {
        const p = [];
        const kab = values('#filterKabupaten');
        const kaw = values('#filterF2025');
        const pbph = values('#filterNama');
        const ind = values('#filterIndustri');
        if (kab.length) p.push(`Kabupaten: ${kab.join(', ')}`);
        if (kaw.length) p.push(`Kawasan: ${kaw.join(', ')}`);
        if (pbph.length) p.push(`PBPH: ${pbph.join(', ')}`);
        if (ind.length) p.push(`Industri: ${ind.join(', ')}`);
        return p.length ? p.join(' • ') : 'Tampilan seluruh data yang aktif';
    }

    function paperConfig() {
        let [shortSide, longSide] = PAPER_MM[paperSize.value] || PAPER_MM.A4;
        const w = orientation.value === 'portrait' ? shortSide : longSide;
        const h = orientation.value === 'portrait' ? longSide : shortSide;
        const margin = paperSize.value === 'A3' ? 10 : 8;
        const header = paperSize.value === 'A3' ? 36 : 30;
        const footer = paperSize.value === 'A3' ? 14 : 12;
        return {
            paper: paperSize.value,
            orientation: orientation.value,
            w, h, margin, header, footer,
            mapW: w - margin * 2,
            mapH: h - margin - header - footer
        };
    }

    function applyPaperLayout() {
        const c = paperConfig();
        const r = document.documentElement.style;
        r.setProperty('--print-page-w', `${c.w}mm`);
        r.setProperty('--print-page-h', `${c.h}mm`);
        r.setProperty('--print-margin', `${c.margin}mm`);
        r.setProperty('--print-header-h', `${c.header}mm`);
        r.setProperty('--print-footer-h', `${c.footer}mm`);
        r.setProperty('--print-map-w', `${c.mapW}mm`);
        r.setProperty('--print-map-h', `${c.mapH}mm`);
        r.setProperty('--print-map-left', `${c.margin}mm`);
        r.setProperty('--print-map-top', `${c.margin + c.header}mm`);
        if (printPageStyle) printPageStyle.remove();
        printPageStyle = document.createElement('style');
        printPageStyle.textContent = `@page { size: ${paperSize.value} ${orientation.value}; margin: 0; }`;
        document.head.appendChild(printPageStyle);
        return c;
    }

    function activeBounds() {
        let b = null;
        const knownGroups = ['kawasanLayer', 'pbphLayer', 'paphLayer', 'kabupatenLayer', 'uploadedLayer', 'hotspotSipongiLayer'];
        knownGroups.forEach(name => {
            const layer = window[name];
            if (!layer || !map.hasLayer(layer) || !layer.getBounds) return;
            try {
                const x = layer.getBounds();
                if (x && x.isValid()) b = b ? b.extend(x) : L.latLngBounds(x);
            } catch (_) {}
        });
        return b && b.isValid() ? b : map.getBounds();
    }

    function setPrintViewport(c) {
        const pxPerMm = 96 / 25.4;
        const el = map.getContainer();
        el.style.width = `${Math.round(c.mapW * pxPerMm)}px`;
        el.style.height = `${Math.round(c.mapH * pxPerMm)}px`;
        map.invalidateSize({ pan: false });
    }

    function getScale(c) {
        const b = map.getBounds();
        const lat = b.getCenter().lat;
        const widthM = L.latLng(lat, b.getWest()).distanceTo(L.latLng(lat, b.getEast()));
        return Math.max(1, Math.round(widthM / (c.mapW / 1000)));
    }

    function niceDistance(m) {
        const vals = [100,200,250,500,1000,2000,2500,5000,10000,20000,25000,50000,100000,200000,250000,500000];
        return vals.reduce((a,b) => Math.abs(b - m) < Math.abs(a - m) ? b : a, vals[0]);
    }

    function fmtDistance(m) {
        return m >= 1000 ? `${m / 1000} km` : `${m} m`;
    }

    function updateScale(c) {
        const scale = getScale(c);
        printScaleText.textContent = `1 : ${scale.toLocaleString('id-ID')}`;
        const b = map.getBounds();
        const lat = b.getCenter().lat;
        const widthM = L.latLng(lat, b.getWest()).distanceTo(L.latLng(lat, b.getEast()));
        const d = niceDistance(widthM / 5);
        const mm = Math.max(28, Math.min(72, (d / widthM) * c.mapW));
        printScaleGraphic.innerHTML = `<div class="print-scale-bar" style="width:${mm}mm"><span></span><span></span><span></span><span></span></div><div class="print-scale-labels" style="width:${mm}mm"><span>0</span><span>${fmtDistance(d/2)}</span><span>${fmtDistance(d)}</span></div>`;
    }

    function coord(v, lat) {
        const a = Math.abs(v);
        const d = Math.floor(a);
        const mf = (a - d) * 60;
        const m = Math.floor(mf);
        const s = Math.round((mf - m) * 60);
        return `${d}°${String(m).padStart(2,'0')}′${String(s).padStart(2,'0')}″ ${lat ? (v >= 0 ? 'LU' : 'LS') : (v >= 0 ? 'BT' : 'BB')}`;
    }

    // Label koordinat sengaja tidak ditempatkan pada 0% dan 100% agar
    // tidak saling bertemu/bersilangan di sudut peta.
    function createCoordinateGrid() {
        coordinateGrid.innerHTML = '';
        if (!showCoordinates.checked) return;

        const b = map.getBounds();
        const positions = [20, 40, 60, 80];

        positions.forEach(percent => {
            const lng = b.getWest() + (b.getEast() - b.getWest()) * percent / 100;
            const v = document.createElement('div');
            v.className = 'grid-v';
            v.style.left = `${percent}%`;
            coordinateGrid.appendChild(v);

            ['coord-top', 'coord-bottom'].forEach(pos => {
                const e = document.createElement('span');
                e.className = `coord-label ${pos}`;
                e.style.left = `${percent}%`;
                e.textContent = coord(lng, false);
                coordinateGrid.appendChild(e);
            });

            const lat = b.getNorth() - (b.getNorth() - b.getSouth()) * percent / 100;
            const h = document.createElement('div');
            h.className = 'grid-h';
            h.style.top = `${percent}%`;
            coordinateGrid.appendChild(h);

            ['coord-left', 'coord-right'].forEach(pos => {
                const e = document.createElement('span');
                e.className = `coord-label ${pos}`;
                e.style.top = `${percent}%`;
                e.textContent = coord(lat, true);
                coordinateGrid.appendChild(e);
            });
        });
    }

    function normalizeKawasan(k) {
        const key = String(k || '').trim().toUpperCase();
        if (key === 'KSA' || key === 'KPA' || key === 'HK') return 'HK';
        return key;
    }

    function selectedKawasan() {
        const selected = values('#filterF2025').map(normalizeKawasan).filter(Boolean);
        return selected.length ? [...new Set(selected)] : ['HL', 'HPT', 'HP', 'HPK', 'HK'];
    }

    function colorFor(k) {
        const key = normalizeKawasan(k);
        return COLORS[key] || COLORS[String(k || '').trim().toUpperCase()] || '#FFFFFF';
    }

    function buildLegend() {
        const items = selectedKawasan()
            .filter(k => colorFor(k))
            .map(k => `<div class="print-legend-item"><span class="print-legend-swatch legend-color-${esc(k)}" style="background:${colorFor(k)} !important;background-color:${colorFor(k)} !important"></span><span>${esc(k)}</span></div>`);

        if (window.pbphLayer && map.hasLayer(window.pbphLayer)) {
            items.push('<div class="print-legend-item"><span class="print-legend-line print-legend-line--pbph"></span><span>PBPH</span></div>');
        }
        if (window.kabupatenLayer && map.hasLayer(window.kabupatenLayer)) {
            items.push('<div class="print-legend-item"><span class="print-legend-line print-legend-line--kabupaten"></span><span>Batas Kabupaten</span></div>');
        }
        printLegendItems.innerHTML = items.join('');
    }

    function areaSummary() {
        const wanted = new Set(selectedKawasan());
        const totals = {};
        wanted.forEach(k => totals[k] = 0);
        const selectedKab = new Set(values('#filterKabupaten').map(x => String(x).trim()));

        if (window.dataLuasKab && typeof window.dataLuasKab === 'object') {
            Object.entries(window.dataLuasKab).forEach(([kab, row]) => {
                if (selectedKab.size && !selectedKab.has(kab)) return;
                wanted.forEach(k => { totals[k] += Number(row[k]) || 0; });
            });
        }

        const empty = Object.values(totals).every(v => v === 0);
        if (empty && window.kawasanLayer && map.hasLayer(window.kawasanLayer) && window.turf) {
            window.kawasanLayer.eachLayer(layer => {
                const f = layer.feature;
                if (!f || !f.properties) return;
                const k = normalizeKawasan(f.properties.F2025 || '');
                if (!wanted.has(k)) return;
                try { totals[k] += turf.area(f) / 10000; } catch (_) {}
            });
        }

        const filterInfo = filterText();
        const rows = Object.entries(totals)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `<div class="print-summary-row"><span><i style="background:${colorFor(k)} !important;background-color:${colorFor(k)} !important"></i>${esc(k)}</span><b>${v.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha</b></div>`);

        printFilterSummary.innerHTML = `<div class="print-summary-title">INFORMASI</div><div class="print-summary-filter">${esc(filterInfo)}</div>${rows.length ? rows.join('') : '<div class="print-summary-empty">Tidak ada data luas untuk filter aktif.</div>'}`;
    }

    function updateLayout() {
        const c = applyPaperLayout();
        printTitle.textContent = (titleInput.value.trim() || 'PETA INFORMASI SPASIAL').toUpperCase();
        printSubtitle.textContent = subtitleInput.value.trim() || 'BALAI PENGELOLAAN HUTAN LESTARI WILAYAH XI BANJARBARU';
        printNote.textContent = noteInput.value.trim() || filterText();
        printLegend.hidden = !showLegend.checked;
        printScaleBox.hidden = !showScale.checked;
        coordinateGrid.hidden = !showCoordinates.checked;
        printNorthArrow.hidden = !showNorthArrow.checked;
        printFilterSummary.hidden = !showFilterNote.checked;
        document.querySelector('.print-page-info').style.display = 'none';
        buildLegend();
        areaSummary();
        updateScale(c);
        createCoordinateGrid();
    }

    function preparePrint() {
        if (printPrepared) return;
        printPrepared = true;
        originalView = { center: map.getCenter(), zoom: map.getZoom() };
        originalStyle = map.getContainer().getAttribute('style');

        const c = applyPaperLayout();
        setPrintViewport(c);
        const b = activeBounds();
        map.fitBounds(b, {
            padding: [Math.round(map.getSize().x * 0.035), Math.round(map.getSize().y * 0.035)],
            animate: false,
            maxZoom: 14
        });

        setTimeout(() => {
            map.invalidateSize({ pan: false });
            updateLayout();
        }, 260);
    }

    function restore() {
        if (!printPrepared) return;
        const el = map.getContainer();
        if (originalStyle === null) el.removeAttribute('style'); else el.setAttribute('style', originalStyle);
        map.invalidateSize({ pan: false });
        if (originalView) map.setView(originalView.center, originalView.zoom, { animate: false });
        originalView = null;
        originalStyle = null;
        printPrepared = false;
    }

    function openModal() {
        updateLayout();
        modal.hidden = false;
        titleInput.focus();
    }

    function closeModal() { modal.hidden = true; }

    function printMap() {
        closeModal();
        preparePrint();
        setTimeout(() => window.print(), 900);
    }

    window.openPrintMapModal = openModal;
    window.closePrintMapModal = closeModal;
    window.printMapPdf = printMap;

    document.getElementById('btnOpenPrintMap').addEventListener('click', openModal);
    document.getElementById('btnClosePrintMap').addEventListener('click', closeModal);
    document.getElementById('btnCancelPrintMap').addEventListener('click', closeModal);
    document.getElementById('btnPrintMap').addEventListener('click', printMap);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    [titleInput, subtitleInput, noteInput, paperSize, orientation, showLegend, showScale, showCoordinates, showNorthArrow, showFilterNote]
        .forEach(el => el.addEventListener('change', updateLayout));

    window.addEventListener('beforeprint', () => { if (!printPrepared) preparePrint(); });
    window.addEventListener('afterprint', () => setTimeout(restore, 250));
})();
