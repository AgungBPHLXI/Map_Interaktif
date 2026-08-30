// =====================================================
// CETAK PETA PDF
// Pengaturan kartografi: judul, legenda, skala, koordinat.
// Tidak mengubah sumber data maupun logika layer/filter.
// =====================================================

(function () {
    'use strict';

    const modal = document.getElementById('printMapModal');
    const titleInput = document.getElementById('printMapTitle');
    const subtitleInput = document.getElementById('printMapSubtitle');
    const noteInput = document.getElementById('printMapNote');
    const scaleMode = document.getElementById('printScaleMode');
    const showLegend = document.getElementById('printShowLegend');
    const showScale = document.getElementById('printShowScale');
    const showCoordinates = document.getElementById('printShowCoordinates');
    const showFilterNote = document.getElementById('printShowFilterNote');

    const printTitle = document.getElementById('printLayoutTitle');
    const printSubtitle = document.getElementById('printLayoutSubtitle');
    const printNote = document.getElementById('printLayoutNote');
    const printMeta = document.getElementById('printLayoutMeta');
    const printLegend = document.getElementById('printLegend');
    const printLegendItems = document.getElementById('printLegendItems');
    const coordinateGrid = document.getElementById('printCoordinateGrid');
    const printScaleBox = document.getElementById('printScaleBox');
    const printScaleText = document.getElementById('printScaleText');
    const printScaleGraphic = document.getElementById('printScaleGraphic');

    // Mengikuti simbologi SK 399/2024 yang digunakan aplikasi.
    const kawasanColors = {
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

    const kawasanLabels = {
        'KSA/KPA': 'KSA/KPA',
        'KSA': 'KSA',
        'KPA': 'KPA',
        'HK': 'HK',
        'HL': 'HL',
        'HPT': 'HPT',
        'HP': 'HP',
        'HPK': 'HPK',
        'APL': 'APL'
    };

    function selectedValues(selector) {
        if (typeof window.$ === 'function') {
            const value = $(selector).val();
            return Array.isArray(value) ? value.filter(Boolean) : [];
        }
        const select = document.querySelector(selector);
        return select ? Array.from(select.selectedOptions).map(o => o.value).filter(Boolean) : [];
    }

    function formatDate() {
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date());
    }

    function currentFilterText() {
        const parts = [];
        const kabupaten = selectedValues('#filterKabupaten');
        const kawasan = selectedValues('#filterF2025');
        const pbph = selectedValues('#filterNama');
        const industri = selectedValues('#filterIndustri');
        if (kabupaten.length) parts.push(`Kabupaten: ${kabupaten.join(', ')}`);
        if (kawasan.length) parts.push(`Kawasan: ${kawasan.join(', ')}`);
        if (pbph.length) parts.push(`PBPH: ${pbph.join(', ')}`);
        if (industri.length) parts.push(`Industri: ${industri.join(', ')}`);
        return parts.length ? parts.join(' • ') : 'Tampilan seluruh layer yang aktif';
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        })[char]);
    }

    function buildLegend() {
        const selectedKawasan = selectedValues('#filterF2025');
        const kawasan = selectedKawasan.length ? selectedKawasan : ['KSA/KPA', 'HL', 'HPT', 'HP', 'HPK'];
        const items = [];

        kawasan.forEach(name => {
            const key = String(name).trim().toUpperCase();
            if (!kawasanColors[key]) return;
            items.push(`<div class="print-legend-item"><span class="print-legend-swatch" style="background:${kawasanColors[key]}"></span><span>${escapeHtml(kawasanLabels[key] || key)}</span></div>`);
        });

        if (typeof window.pbphLayer !== 'undefined' && window.pbphLayer && map.hasLayer(window.pbphLayer)) {
            items.push('<div class="print-legend-item"><span class="print-legend-line print-legend-line--pbph"></span><span>PBPH</span></div>');
        }
        if (typeof window.paphLayer !== 'undefined' && window.paphLayer && map.hasLayer(window.paphLayer)) {
            items.push('<div class="print-legend-item"><span class="print-legend-line print-legend-line--paph"></span><span>PAPH</span></div>');
        }
        if (typeof window.kabupatenLayer !== 'undefined' && window.kabupatenLayer && map.hasLayer(window.kabupatenLayer)) {
            items.push('<div class="print-legend-item"><span class="print-legend-line print-legend-line--kabupaten"></span><span>Batas Kabupaten</span></div>');
        }
        printLegendItems.innerHTML = items.join('') || '<div class="print-legend-item">Tidak ada layer tematik aktif</div>';
    }

    function niceDistance(meters) {
        const options = [100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000, 200000];
        let chosen = options[0];
        options.forEach(v => { if (v <= meters) chosen = v; });
        return chosen;
    }

    function formatDistance(meters) {
        if (meters >= 1000) {
            const km = meters / 1000;
            return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
        }
        return `${Math.round(meters)} m`;
    }

    function updateScale() {
        const selected = scaleMode.value;
        let denominator;
        if (selected !== 'auto') denominator = Number(selected);
        else {
            // Estimasi denominator dari latitude, zoom dan ukuran Leaflet.
            const lat = map.getCenter().lat * Math.PI / 180;
            const resolution = 156543.03392 * Math.cos(lat) / Math.pow(2, map.getZoom());
            // 96 DPI browser ≈ 0,000264583 m per pixel.
            denominator = Math.max(1, Math.round(resolution / 0.000264583));
        }

        printScaleText.textContent = `1 : ${Math.round(denominator).toLocaleString('id-ID')}`;

        const mapSize = map.getSize();
        const bounds = map.getBounds();
        const mapWidthMeters = bounds.getNorthEast().distanceTo(L.latLng(bounds.getNorthEast().lat, bounds.getSouthWest().lng));
        const targetMeters = niceDistance(mapWidthMeters / 5);
        const segmentWidth = Math.max(45, Math.min(150, (targetMeters / Math.max(mapWidthMeters, 1)) * Math.max(mapSize.x, 1)));
        const half = Math.max(1, targetMeters / 2);

        printScaleGraphic.innerHTML = `
            <div class="print-scale-bar" style="width:${segmentWidth}px"><span></span><span></span><span></span><span></span></div>
            <div class="print-scale-labels" style="width:${segmentWidth}px"><span>0</span><span>${formatDistance(half)}</span><span>${formatDistance(targetMeters)}</span></div>`;
    }

    function formatCoordinate(value, isLat) {
        const abs = Math.abs(value);
        const deg = Math.floor(abs);
        const minFloat = (abs - deg) * 60;
        const min = Math.floor(minFloat);
        const sec = Math.round((minFloat - min) * 60);
        const direction = isLat ? (value >= 0 ? 'LU' : 'LS') : (value >= 0 ? 'BT' : 'BB');
        return `${deg}°${String(min).padStart(2,'0')}′${String(sec).padStart(2,'0')}″ ${direction}`;
    }

    function createCoordinateGrid() {
        coordinateGrid.innerHTML = '';
        if (!showCoordinates.checked || typeof map === 'undefined') return;

        const bounds = map.getBounds();
        const west = bounds.getWest(), east = bounds.getEast();
        const south = bounds.getSouth(), north = bounds.getNorth();
        const divisions = 5;

        for (let i = 0; i <= divisions; i++) {
            const x = (i / divisions) * 100;
            const lng = west + ((east - west) * i / divisions);
            const line = document.createElement('div');
            line.className = 'grid-v'; line.style.left = `${x}%`;
            coordinateGrid.appendChild(line);
            ['coord-top','coord-bottom'].forEach(pos => {
                const label = document.createElement('span');
                label.className = `coord-label ${pos}`;
                label.style.left = `${x}%`;
                label.textContent = formatCoordinate(lng, false);
                coordinateGrid.appendChild(label);
            });
        }

        for (let i = 0; i <= divisions; i++) {
            const y = (i / divisions) * 100;
            const lat = north - ((north - south) * i / divisions);
            const line = document.createElement('div');
            line.className = 'grid-h'; line.style.top = `${y}%`;
            coordinateGrid.appendChild(line);
            ['coord-left','coord-right'].forEach(pos => {
                const label = document.createElement('span');
                label.className = `coord-label ${pos}`;
                label.style.top = `${y}%`;
                label.textContent = formatCoordinate(lat, true);
                coordinateGrid.appendChild(label);
            });
        }
    }

    function updatePrintLayout() {
        const title = titleInput.value.trim() || 'PETA INFORMASI SPASIAL';
        const subtitle = subtitleInput.value.trim();
        const note = noteInput.value.trim();

        printTitle.textContent = title.toUpperCase();
        printSubtitle.textContent = subtitle || 'BALAI PENGELOLAAN HUTAN LESTARI WILAYAH XI BANJARBARU';
        printNote.textContent = note || currentFilterText();
        printMeta.textContent = `Dicetak: ${formatDate()}`;
        printLegend.hidden = !showLegend.checked;
        printScaleBox.hidden = !showScale.checked;
        coordinateGrid.hidden = !showCoordinates.checked;
        document.querySelector('.print-page-info').style.display = showFilterNote.checked ? '' : 'none';

        buildLegend();
        updateScale();
        createCoordinateGrid();
    }

    function openPrintModal() {
        updatePrintLayout();
        modal.hidden = false;
        titleInput.focus();
    }

    function closePrintModal() { modal.hidden = true; }

    function printMap() {
        updatePrintLayout();
        closePrintModal();
        requestAnimationFrame(() => {
            map.invalidateSize(false);
            setTimeout(() => window.print(), 400);
        });
    }

    window.openPrintMapModal = openPrintModal;
    window.closePrintMapModal = closePrintModal;
    window.printMapPdf = printMap;

    document.getElementById('btnOpenPrintMap').addEventListener('click', openPrintModal);
    document.getElementById('btnClosePrintMap').addEventListener('click', closePrintModal);
    document.getElementById('btnCancelPrintMap').addEventListener('click', closePrintModal);
    document.getElementById('btnPrintMap').addEventListener('click', printMap);
    modal.addEventListener('click', event => { if (event.target === modal) closePrintModal(); });

    [titleInput, subtitleInput, noteInput, scaleMode, showLegend, showScale, showCoordinates, showFilterNote]
        .forEach(input => input.addEventListener('input', updatePrintLayout));
    [scaleMode, showLegend, showScale, showCoordinates, showFilterNote]
        .forEach(input => input.addEventListener('change', updatePrintLayout));

    window.addEventListener('afterprint', () => setTimeout(() => map.invalidateSize(false), 250));
    map.on('moveend zoomend', () => { if (!modal.hidden) updatePrintLayout(); });

    if (typeof L !== 'undefined') {
        L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 180 }).addTo(map);
    }
})();
