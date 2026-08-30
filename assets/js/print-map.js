// =====================================================
// CETAK PETA PROFESIONAL
// Satu halaman, ukuran kertas dinamis, extent otomatis.
// Tidak mengubah sumber data maupun logika hotspot/filter.
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
    const printLegend = document.getElementById('printLegend');
    const printLegendItems = document.getElementById('printLegendItems');
    const coordinateGrid = document.getElementById('printCoordinateGrid');
    const printScaleBox = document.getElementById('printScaleBox');
    const printScaleText = document.getElementById('printScaleText');
    const printScaleGraphic = document.getElementById('printScaleGraphic');

    let originalView = null;
    let originalStyle = null;
    let printPrepared = false;
    let printPageStyle = null;

    // Ukuran landscape dalam milimeter. mapW/mapH adalah bidang peta bersih.
    const papers = {
        A4: { w: 297, h: 210, margin: 8, header: 30, footer: 15, mapW: 281, mapH: 157 },
        A3: { w: 420, h: 297, margin: 10, header: 35, footer: 18, mapW: 400, mapH: 234 },
        A0: { w: 1189, h: 841, margin: 12, header: 52, footer: 26, mapW: 1165, mapH: 751 }
    };

    const standardScales = {
        A4: [25000, 50000, 100000, 250000, 500000, 1000000, 2000000, 5000000],
        A3: [25000, 50000, 100000, 250000, 500000, 1000000, 2000000, 5000000],
        A0: [50000, 100000, 250000, 500000, 1000000, 2000000, 5000000, 10000000]
    };

    const kawasanColors = {
        'KSA/KPA': '#AD3FFF', 'KSA': '#AD3FFF', 'KPA': '#AD3FFF', 'HK': '#AD3FFF',
        'HL': '#02AD00', 'HPT': '#8AF200', 'HP': '#FFFF00', 'HPK': '#FF5EFF', 'APL': '#FFFFFF'
    };

    function addPaperSelector() {
        if (document.getElementById('printPaperSize')) return;
        const group = document.createElement('div');
        group.className = 'print-form-group';
        group.innerHTML = `
            <label for="printPaperSize">Ukuran Kertas</label>
            <select id="printPaperSize">
                <option value="A4">A4 Landscape</option>
                <option value="A3">A3 Landscape</option>
                <option value="A0">A0 Landscape</option>
            </select>
            <div class="print-scale-help">Peta, extent, skala dan ukuran elemen akan menyesuaikan otomatis.</div>`;
        scaleMode.closest('.print-form-group').parentNode.insertBefore(group, scaleMode.closest('.print-form-group'));
    }

    addPaperSelector();
    const paperSize = document.getElementById('printPaperSize');

    function selectedValues(selector) {
        if (typeof window.$ === 'function') {
            const value = $(selector).val();
            return Array.isArray(value) ? value.filter(Boolean) : [];
        }
        const select = document.querySelector(selector);
        return select ? Array.from(select.selectedOptions).map(o => o.value).filter(Boolean) : [];
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
        return String(value || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' })[c]);
    }

    function buildLegend() {
        const selected = selectedValues('#filterF2025');
        const kawasan = selected.length ? selected : ['KSA/KPA', 'HL', 'HPT', 'HP', 'HPK'];
        const items = [];
        kawasan.forEach(name => {
            const key = String(name).trim().toUpperCase();
            if (!kawasanColors[key]) return;
            items.push(`<div class="print-legend-item"><span class="print-legend-swatch" style="background:${kawasanColors[key]}"></span><span>${escapeHtml(key)}</span></div>`);
        });
        if (window.pbphLayer && map.hasLayer(window.pbphLayer)) items.push('<div class="print-legend-item"><span class="print-legend-line print-legend-line--pbph"></span><span>PBPH</span></div>');
        if (window.paphLayer && map.hasLayer(window.paphLayer)) items.push('<div class="print-legend-item"><span class="print-legend-line print-legend-line--paph"></span><span>PAPH</span></div>');
        if (window.kabupatenLayer && map.hasLayer(window.kabupatenLayer)) items.push('<div class="print-legend-item"><span class="print-legend-line print-legend-line--kabupaten"></span><span>Batas Kabupaten</span></div>');
        printLegendItems.innerHTML = items.join('') || '<div class="print-legend-item">Tidak ada layer tematik aktif</div>';
    }

    function getActiveDataBounds() {
        let combined = null;
        map.eachLayer(layer => {
            if (!layer || !layer.getBounds || layer instanceof L.TileLayer) return;
            // Jangan gunakan kontrol, marker, atau layer yang tidak terlihat.
            if (layer instanceof L.LayerGroup && !map.hasLayer(layer)) return;
            try {
                const b = layer.getBounds();
                if (b && b.isValid()) combined = combined ? combined.extend(b) : L.latLngBounds(b);
            } catch (e) {}
        });
        return combined && combined.isValid() ? combined : null;
    }

    function groundWidth(bounds) {
        const cLat = bounds.getCenter().lat;
        return L.latLng(cLat, bounds.getWest()).distanceTo(L.latLng(cLat, bounds.getEast()));
    }

    function chooseAutoScale(required, paper) {
        const list = standardScales[paper] || standardScales.A4;
        return list.find(v => v >= required) || list[list.length - 1];
    }

    function scaleFromCurrentView(config) {
        const width = groundWidth(map.getBounds());
        return width / (config.mapW / 1000);
    }

    function zoomForScale(denominator, lat) {
        const metersPerCssPixel = denominator * 0.000264583333;
        const zoom = Math.log2((156543.03392804097 * Math.cos(lat * Math.PI / 180)) / metersPerCssPixel);
        return Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), zoom));
    }

    function applyAutoScale(config, paper) {
        const required = scaleFromCurrentView(config) * 1.04; // ruang aman 4%
        const chosen = chooseAutoScale(required, paper);
        const zoom = zoomForScale(chosen, map.getCenter().lat);
        map.setView(map.getCenter(), zoom, { animate: false });
        return chosen;
    }

    function applyRequestedScale(config, paper) {
        if (scaleMode.value === 'auto') return applyAutoScale(config, paper);
        const requested = Number(scaleMode.value);
        map.setView(map.getCenter(), zoomForScale(requested, map.getCenter().lat), { animate: false });
        return requested;
    }

    function niceDistance(meters) {
        const values = [100,200,250,500,1000,2000,2500,5000,10000,20000,25000,50000,100000,200000,250000,500000];
        return values.reduce((best, v) => Math.abs(v - meters) < Math.abs(best - meters) ? v : best, values[0]);
    }

    function distanceLabel(meters) {
        return meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
    }

    function updateScaleGraphic(denominator, config) {
        printScaleText.textContent = `1 : ${Math.round(denominator).toLocaleString('id-ID')}`;
        const widthMeters = groundWidth(map.getBounds());
        const target = niceDistance(widthMeters / 5);
        const widthMm = Math.max(25, Math.min(70, (target / widthMeters) * config.mapW));
        printScaleGraphic.innerHTML = `<div class="print-scale-bar" style="width:${widthMm}mm"><span></span><span></span><span></span><span></span></div><div class="print-scale-labels" style="width:${widthMm}mm"><span>0</span><span>${distanceLabel(target / 2)}</span><span>${distanceLabel(target)}</span></div>`;
    }

    // Grid geografis tetap ada bila dipilih, tetapi label DMS di sudut dihapus agar tidak tampak seperti jam.
    function createCoordinateGrid() {
        coordinateGrid.innerHTML = '';
        if (!showCoordinates.checked) return;
        for (let i = 0; i <= 5; i++) {
            const v = document.createElement('div');
            v.className = 'grid-v'; v.style.left = `${i * 20}%`; coordinateGrid.appendChild(v);
            const h = document.createElement('div');
            h.className = 'grid-h'; h.style.top = `${i * 20}%`; coordinateGrid.appendChild(h);
        }
    }

    function applyPaperLayout(paper) {
        const c = papers[paper];
        const root = document.documentElement.style;
        root.setProperty('--print-page-w', `${c.w}mm`);
        root.setProperty('--print-page-h', `${c.h}mm`);
        root.setProperty('--print-margin', `${c.margin}mm`);
        root.setProperty('--print-header-h', `${c.header}mm`);
        root.setProperty('--print-footer-h', `${c.footer}mm`);
        root.setProperty('--print-map-w', `${c.mapW}mm`);
        root.setProperty('--print-map-h', `${c.mapH}mm`);
        root.setProperty('--print-map-top', `${c.margin + c.header}mm`);
        root.setProperty('--print-map-left', `${c.margin}mm`);
        root.setProperty('--print-map-bottom', `${c.h - c.margin - c.footer}mm`);

        if (printPageStyle) printPageStyle.remove();
        printPageStyle = document.createElement('style');
        printPageStyle.id = 'dynamicPrintPageSize';
        printPageStyle.textContent = `@page { size: ${paper} landscape; margin: 0; }`;
        document.head.appendChild(printPageStyle);
    }

    function setMapPrintViewport(config) {
        // 96 CSS pixel per inch agar rasio layar Leaflet sama dengan bidang cetak browser.
        const pxPerMm = 96 / 25.4;
        const mapEl = map.getContainer();
        mapEl.style.width = `${Math.round(config.mapW * pxPerMm)}px`;
        mapEl.style.height = `${Math.round(config.mapH * pxPerMm)}px`;
        map.invalidateSize({ pan: false });
    }

    function updatePrintLayout(scaleDenominator) {
        const paper = paperSize.value;
        const config = papers[paper];
        printTitle.textContent = (titleInput.value.trim() || 'PETA INFORMASI SPASIAL').toUpperCase();
        printSubtitle.textContent = subtitleInput.value.trim() || 'BALAI PENGELOLAAN HUTAN LESTARI WILAYAH XI BANJARBARU';
        printNote.textContent = noteInput.value.trim() || currentFilterText();
        printLegend.hidden = !showLegend.checked;
        printScaleBox.hidden = !showScale.checked;
        coordinateGrid.hidden = !showCoordinates.checked;
        document.querySelector('.print-page-info').style.display = showFilterNote.checked ? '' : 'none';
        buildLegend();
        createCoordinateGrid();
        updateScaleGraphic(scaleDenominator || scaleFromCurrentView(config), config);
    }

    function preparePrintMap() {
        if (printPrepared) return;
        printPrepared = true;
        originalView = { center: map.getCenter(), zoom: map.getZoom() };
        originalStyle = map.getContainer().getAttribute('style');

        const paper = paperSize.value;
        const config = papers[paper];
        applyPaperLayout(paper);
        setMapPrintViewport(config);

        const bounds = getActiveDataBounds();
        if (bounds) {
            // Fokuskan seluruh data aktif terlebih dahulu, kemudian ubah ke skala standar yang aman.
            map.fitBounds(bounds, { padding: [Math.round(map.getSize().x * 0.04), Math.round(map.getSize().y * 0.04)], animate: false, maxZoom: 14 });
        }

        setTimeout(() => {
            const chosenScale = applyRequestedScale(config, paper);
            map.invalidateSize({ pan: false });
            updatePrintLayout(chosenScale);
        }, 220);
    }

    function restoreMapAfterPrint() {
        if (!printPrepared) return;
        const mapEl = map.getContainer();
        if (originalStyle === null) mapEl.removeAttribute('style'); else mapEl.setAttribute('style', originalStyle);
        map.invalidateSize({ pan: false });
        if (originalView) map.setView(originalView.center, originalView.zoom, { animate: false });
        originalView = null; originalStyle = null; printPrepared = false;
    }

    function openPrintModal() {
        applyPaperLayout(paperSize.value);
        updatePrintLayout();
        modal.hidden = false;
        titleInput.focus();
    }

    function closePrintModal() { modal.hidden = true; }

    function printMap() {
        closePrintModal();
        preparePrintMap();
        setTimeout(() => window.print(), 900);
    }

    window.openPrintMapModal = openPrintModal;
    window.closePrintMapModal = closePrintModal;
    window.printMapPdf = printMap;

    document.getElementById('btnOpenPrintMap').addEventListener('click', openPrintModal);
    document.getElementById('btnClosePrintMap').addEventListener('click', closePrintModal);
    document.getElementById('btnCancelPrintMap').addEventListener('click', closePrintModal);
    document.getElementById('btnPrintMap').addEventListener('click', printMap);
    modal.addEventListener('click', e => { if (e.target === modal) closePrintModal(); });

    [titleInput, subtitleInput, noteInput, scaleMode, paperSize, showLegend, showScale, showCoordinates, showFilterNote]
        .forEach(el => el.addEventListener('input', () => updatePrintLayout()));
    [scaleMode, paperSize, showLegend, showScale, showCoordinates, showFilterNote]
        .forEach(el => el.addEventListener('change', () => { applyPaperLayout(paperSize.value); updatePrintLayout(); }));

    window.addEventListener('beforeprint', () => { if (!printPrepared) preparePrintMap(); });
    window.addEventListener('afterprint', () => setTimeout(restoreMapAfterPrint, 250));

    if (typeof L !== 'undefined') L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 180 }).addTo(map);
})();
